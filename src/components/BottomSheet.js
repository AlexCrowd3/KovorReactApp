import React, { useRef, useEffect, useContext, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    PanResponder,
    FlatList,
    Dimensions,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Keyboard,
    Image
} from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import Typography from '../styles/Typography';
import Svg, { Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const COLLAPSED_HEIGHT = 120;
const MID_SHEET_HEIGHT = SCREEN_HEIGHT * 0.6;
const FULL_SHEET_HEIGHT = SCREEN_HEIGHT * 0.9;

const USER_LAT = 59.932568;
const USER_LON = 30.423143;

const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const isOpenNow = (open_time, close_time) => {
    if (!open_time || !close_time) return false;
    const now = new Date();
    const [oh, om] = open_time.split(':').map(Number);
    const [ch, cm] = close_time.split(':').map(Number);
    const open = new Date(now);
    open.setHours(oh, om, 0, 0);
    const close = new Date(now);
    close.setHours(ch, cm, 0, 0);
    return now >= open && now <= close;
};

const isOpen24h = (open_time, close_time) => {
    return open_time === '00:00' && close_time === '23:59';
};

const BottomSheet = ({ openFilter, openCoworkingModal }) => {
    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT - COLLAPSED_HEIGHT)).current;
    const { theme } = useContext(ThemeContext);
    const styles = getStyles(theme);

    const POS = {
        collapsed: SCREEN_HEIGHT - COLLAPSED_HEIGHT,
        mid: SCREEN_HEIGHT - MID_SHEET_HEIGHT,
        full: SCREEN_HEIGHT - FULL_SHEET_HEIGHT,
    };

    const filterTranslateY = translateY.interpolate({
        inputRange: [POS.mid, POS.collapsed],
        outputRange: [0, -130],
        extrapolate: 'clamp',
    });

    const startYRef = useRef(POS.collapsed);
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    const animateTo = (toValue) => {
        Animated.spring(translateY, {
            toValue,
            useNativeDriver: true,
            stiffness: 200,
            damping: 25,
            mass: 0.8,
        }).start();
    };

    const [coworkings, setCoworkings] = useState([]);
    const [filters, setFilters] = useState({});
    const [searchText, setSearchText] = useState('');
    const loadFilters = useCallback(async () => {
        try {
            const saved = await AsyncStorage.getItem('@filters');
            if (saved) {
                setFilters(JSON.parse(saved));
            } else {
                setFilters({});
            }
        } catch (e) {
            console.warn('Failed to load filters', e);
            setFilters({});
        }
    }, []);

    const toggleQuickFilter = async (key, value) => {
        let newFilters = { ...filters };

        if (key === 'rating' || key === 'cost' || key === 'workTime') {
            newFilters[key] = newFilters[key] === value ? null : value;
        } else {
            const arr = newFilters[key] || [];
            newFilters[key] = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
        }

        setFilters(newFilters);
        try {
            await AsyncStorage.setItem('@filters', JSON.stringify(newFilters));
        } catch (e) {
            console.warn('Failed to save filters', e);
        }
    };

    const loadCoworkings = useCallback(async () => {
        try {
            let query = supabase.from('coworkings').select('*');

            const { data, error } = await query;

            if (error) {
                console.warn(error);
                setCoworkings([]);
                return;
            }

            if (!data) {
                setCoworkings([]);
                return;
            }

            let processed = data.map(cw => {
                const open = isOpenNow(cw.open_time, cw.close_time);
                const distance = getDistance(USER_LAT, USER_LON, cw.latitude, cw.longitude);
                const is24h = isOpen24h(cw.open_time, cw.close_time);
                return {
                    ...cw,
                    isOpenNow: open,
                    is24h: is24h,
                    distance: distance.toFixed(1)
                };
            });

            // Применяем фильтры
            if (filters.workTime === 'Открыто сейчас') {
                processed = processed.filter(c => c.isOpenNow);
            } else if (filters.workTime === 'Круглосуточно') {
                processed = processed.filter(c => c.is24h);
            }

            // Фильтр по рейтингу
            if (filters.rating) {
                const minRating = parseFloat(filters.rating);
                processed = processed.filter(c => c.rating >= minRating);
            }

            // Фильтр по стоимости
            if (filters.cost === 'Бесплатно') {
                processed = processed.filter(c => c.price === 0 || c.price === null);
            } else if (filters.cost === 'Платно') {
                processed = processed.filter(c => c.price > 0);
            }

            // Поиск по названию
            if (searchText) {
                processed = processed.filter(c =>
                    c.name.toLowerCase().includes(searchText.toLowerCase())
                );
            }

            setCoworkings(processed);
        } catch (err) {
            console.warn(err);
            setCoworkings([]);
        }
    }, [filters, searchText]);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6,
            onPanResponderGrant: () => {
                startYRef.current = translateY.__getValue();
                translateY.stopAnimation();
            },
            onPanResponderMove: (_, g) => {
                const next = startYRef.current + g.dy;
                const clamped = clamp(next, POS.full, POS.collapsed);
                translateY.setValue(clamped);
            },
            onPanResponderRelease: (_, g) => {
                const current = translateY.__getValue();
                const vy = g.vy;

                const dist = [
                    { key: 'full', value: POS.full, d: Math.abs(current - POS.full) },
                    { key: 'mid', value: POS.mid, d: Math.abs(current - POS.mid) },
                    { key: 'collapsed', value: POS.collapsed, d: Math.abs(current - POS.collapsed) },
                ];
                if (vy < -0.7) {
                    animateTo(POS.full);
                    return;
                } else if (vy > 0.7) {
                    animateTo(POS.collapsed);
                    return;
                }

                dist.sort((a, b) => a.d - b.d);
                animateTo(dist[0].value);
            },
        })
    ).current;

    useEffect(() => {
        const show = Keyboard.addListener('keyboardDidShow', () => animateTo(POS.full));
        const hide = Keyboard.addListener('keyboardDidHide', () => animateTo(POS.mid));
        return () => {
            show.remove();
            hide.remove();
        };
    }, []);

    useEffect(() => {
        loadFilters();
    }, []);

    useEffect(() => {
        loadCoworkings();
    }, [filters, searchText]);

    useEffect(() => {
        const checkFiltersUpdate = async () => {
            try {
                const saved = await AsyncStorage.getItem('@filters');
                if (saved) {
                    const newFilters = JSON.parse(saved);
                    if (JSON.stringify(newFilters) !== JSON.stringify(filters)) {
                        setFilters(newFilters);
                    }
                }
            } catch (e) {
                console.warn('Failed to check filters update', e);
            }
        };

        const interval = setInterval(checkFiltersUpdate, 2000);
        return () => clearInterval(interval);
    }, [filters]);

    return (
        <Animated.View
            style={[
                styles.sheet,
                {
                    transform: [{ translateY: translateY.interpolate({ inputRange: [POS.full, POS.collapsed], outputRange: [POS.full, POS.collapsed] }) }],
                },
            ]}
        >
            <View style={styles.handleWrap} {...panResponder.panHandlers}>
                <View style={styles.handle} />
            </View>

            <View style={styles.searchRow}>
                <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <Path d="M6.3833 12.7666C7.76953 12.7666 9.04785 12.3184 10.0938 11.5713L14.0283 15.5059C14.2109 15.6885 14.4517 15.7798 14.709 15.7798C15.2485 15.7798 15.6304 15.3647 15.6304 14.8335C15.6304 14.5845 15.5474 14.3438 15.3647 14.1694L11.4551 10.2515C12.2769 9.17236 12.7666 7.83594 12.7666 6.3833C12.7666 2.87207 9.89453 0 6.3833 0C2.88037 0 0 2.86377 0 6.3833C0 9.89453 2.87207 12.7666 6.3833 12.7666ZM6.3833 11.3887C3.64404 11.3887 1.37793 9.12256 1.37793 6.3833C1.37793 3.64404 3.64404 1.37793 6.3833 1.37793C9.12256 1.37793 11.3887 3.64404 11.3887 6.3833C11.3887 9.12256 9.12256 11.3887 6.3833 11.3887Z" fill={theme.textPrimary} fillOpacity="0.6" />
                </Svg>
                <TextInput
                    placeholder="Поиск и выбор коворкинга"
                    placeholderTextColor="#9AA0A6"
                    style={styles.input}
                    value={searchText}
                    onChangeText={setSearchText}
                    onFocus={() => animateTo(POS.full)}
                />
            </View>

            <Animated.View
                style={{
                    transform: [{ translateY: filterTranslateY }],
                    marginTop: 12,
                    height: 45,
                }}
            >
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterRow}
                    bounces={false}
                    directionalLockEnabled={true}
                >
                    <TouchableOpacity style={styles.filterBtn} onPress={openFilter}>
                        <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <Path d="M10.1819 10.9091H15.2728M2.18188 10.9091H3.63643M3.63643 10.9091C3.63643 11.9133 4.45046 12.7273 5.45461 12.7273C6.45877 12.7273 7.27279 11.9133 7.27279 10.9091C7.27279 9.90496 6.45877 9.09093 5.45461 9.09093C4.45046 9.09093 3.63643 9.90496 3.63643 10.9091ZM14.5455 6.54548H15.2728M2.18188 6.54548H7.27279M12.0001 8.36366C10.9959 8.36366 10.1819 7.54963 10.1819 6.54548C10.1819 5.54132 10.9959 4.72729 12.0001 4.72729C13.0042 4.72729 13.8182 5.54132 13.8182 6.54548C13.8182 7.54963 13.0042 8.36366 12.0001 8.36366Z" stroke={theme.textPrimary} strokeWidth="1.45455" strokeLinecap="round" strokeLinejoin="round" />
                        </Svg>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.filterBtn, filters.rating === '4.7' && styles.filterBtnActive]}
                        onPress={() => toggleQuickFilter('rating', '4.7')}
                    >
                        <Text style={[styles.filterText, filters.rating === '4.7' && styles.filterTextActive]}>Выше 4.7</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.filterBtn, filters.cost === 'Бесплатно' && styles.filterBtnActive]}
                        onPress={() => toggleQuickFilter('cost', 'Бесплатно')}
                    >
                        <Text style={[styles.filterText, filters.cost === 'Бесплатно' && styles.filterTextActive]}>Бесплатно</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.filterBtn, filters.workTime === 'Открыто сейчас' && styles.filterBtnActive]}
                        onPress={() => toggleQuickFilter('workTime', 'Открыто сейчас')}
                    >
                        <Text style={[styles.filterText, filters.workTime === 'Открыто сейчас' && styles.filterTextActive]}>Открыто</Text>
                    </TouchableOpacity>
                </ScrollView>
            </Animated.View>

            <FlatList
                style={styles.list}
                data={coworkings}
                keyExtractor={(it) => it.id.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.card} onPress={() => openCoworkingModal(item)}>
                        <Image style={styles.logo} source={{ uri: item.logo_url }} />
                        <View style={styles.cardBody}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>{item.name}</Text>
                                <Text style={styles.distance}>{item.distance} км</Text>
                            </View>
                            <View style={styles.rateCont}>
                                <View style={styles.rating}>
                                    <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <Path d="M1.55664 6.89118C1.34781 6.69806 1.46125 6.34893 1.74371 6.31544L5.74609 5.84071C5.86122 5.82706 5.96121 5.75477 6.00977 5.6495L7.69792 1.98964C7.81705 1.73135 8.18425 1.7313 8.30339 1.98959L9.99154 5.64942C10.0401 5.75469 10.1394 5.82718 10.2546 5.84083L14.2572 6.31544C14.5396 6.34893 14.6527 6.69816 14.4439 6.89128L11.4852 9.62794C11.4001 9.70665 11.3622 9.8238 11.3848 9.93751L12.17 13.8906C12.2254 14.1696 11.9285 14.3858 11.6803 14.2469L8.16343 12.2777C8.06227 12.2211 7.93938 12.2214 7.83822 12.278L4.32096 14.2464C4.07275 14.3853 3.77529 14.1696 3.83073 13.8906L4.6161 9.93776C4.63869 9.82405 4.60089 9.70662 4.51578 9.62792L1.55664 6.89118Z" fill="#FFC600" />
                                    </Svg>
                                    <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                                </View>
                                <Text style={styles.rateCount}>{item.ratings_count} оценок</Text>
                            </View>
                            <Text style={styles.address}>{item.address}</Text>
                            <Text style={[styles.open, { color: item.isOpenNow ? 'green' : 'red' }]}>
                                {item.isOpenNow ? 'Открыто сейчас' : 'Закрыто'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
                onScrollBeginDrag={() => animateTo(POS.full)}
                contentContainerStyle={{ paddingBottom: 80 }}
            />
        </Animated.View>
    );
};

const getStyles = (theme) => StyleSheet.create({
    sheet: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: SCREEN_HEIGHT + 50,
        backgroundColor: theme.background,
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        paddingTop: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 20,
        zIndex: 20,
    },
    handleWrap: { alignItems: 'center', paddingVertical: 6 },
    handle: { width: 44, height: 6, borderRadius: 6, backgroundColor: theme.inputBackground },

    searchRow: {
        alignSelf: 'center',
        width: '92%',
        backgroundColor: theme.inputBackground,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 36,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    input: { flex: 1, color: theme.textPrimary, marginLeft: 8 },
    filterScroll: { marginTop: 12, height: 45, zIndex: 400 },
    filterRow: { paddingHorizontal: 20, alignItems: 'center', height: 42 },
    filterBtn: {
        height: 32,
        paddingHorizontal: 14,
        borderRadius: 20,
        backgroundColor: theme.backgroundOpacity,
        justifyContent: 'center',
        marginRight: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    filterBtnActive: {
        backgroundColor: '#C8F000',
    },
    filterText: { color: theme.textPrimary, fontSize: 14 },
    filterTextActive: { color: '#000', fontWeight: '700' },

    list: { marginTop: 12, marginBottom: 100 },
    card: {
        flexDirection: 'row',
        marginHorizontal: 16,
        borderRadius: 12,
        marginVertical: 10,
    },
    logo: { width: 60, height: 60, borderRadius: 100, marginRight: 12 },
    cardBody: { flex: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardTitle: { color: theme.textPrimary, fontWeight: '500', fontSize: 16 },
    rateCont: { flexDirection: 'row', marginTop: 4 },
    rateCount: { ...Typography.caption_primary, color: theme.textSecondary, marginLeft: 5 },
    rating: { backgroundColor: theme.backgroundOpacity, width: 60, alignItems: 'center', paddingVertical: 4, borderRadius: 12, flexDirection: 'row', justifyContent: 'center' },
    distance: { ...Typography.caption_primary, color: theme.textSecondary },
    ratingText: { color: theme.textPrimary, marginLeft: 3, lineHeight: 20 },
    address: { color: theme.textPrimary, marginTop: 4 },
    open: { color: theme.textSecondary, marginTop: 4 },
});

export default BottomSheet;