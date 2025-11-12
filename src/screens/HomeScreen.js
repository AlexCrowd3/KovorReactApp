import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Platform, ActivityIndicator, Text } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import Svg, { Path } from 'react-native-svg';
import BottomSheet from '../components/BottomSheet';
import { ThemeContext } from '../context/ThemeContext';
import FilterModal from '../components/FilterModal';
import CoworkingModal from '../components/CoworkingModal';
import { fetchCoworkings } from '../lib/supabase';

const { width, height } = Dimensions.get('window');

const OFFLINE_REGION = {
    latitude: 59.9311,
    longitude: 30.3609,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
};

const INITIAL_REGION = {
    latitude: 59.9311,
    longitude: 30.3609,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
};

const darkMapStyle = [
    { elementType: 'geometry', stylers: [{ color: '#071224' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#7f98a6' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#18324a' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#041628' }] },
    { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#081824' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
];

export default function HomeScreen() {
    const mapRef = useRef(null);
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [coworkings, setCoworkings] = useState([]);
    const { theme, toggleTheme } = useContext(ThemeContext);
    const [isFilterVisible, setFilterVisible] = useState(false);
    const [selectedCoworking, setSelectedCoworking] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [isDark, setIsDark] = useState(theme.mode === 'dark');
    const [mapReady, setMapReady] = useState(false);

    useEffect(() => setIsDark(theme.mode === 'dark'), [theme]);

    const openFilter = () => setFilterVisible(true);
    const closeFilter = () => setFilterVisible(false);

    const openCoworkingModal = (cw) => {
        if (!cw) return;
        setSelectedCoworking(cw);
        setModalVisible(true);
    };

    const styles = getStyles(theme);

    // Получаем координаты пользователя
    useEffect(() => {
        let isMounted = true;

        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    console.warn('Permission denied');
                    if (isMounted) setLoading(false);
                    return;
                }

                const loc = await Promise.race([
                    Location.getCurrentPositionAsync({}),
                    new Promise((_, rej) => setTimeout(() => rej(new Error('location timeout')), 7000)),
                ]);

                const coords = loc?.coords;
                if (isMounted && coords?.latitude && coords?.longitude) {
                    setLocation({ latitude: coords.latitude, longitude: coords.longitude });

                    const isInOfflineRegion =
                        Math.abs(coords.latitude - OFFLINE_REGION.latitude) <= OFFLINE_REGION.latitudeDelta &&
                        Math.abs(coords.longitude - OFFLINE_REGION.longitude) <= OFFLINE_REGION.longitudeDelta;

                    const newRegion = {
                        latitude: coords.latitude,
                        longitude: coords.longitude,
                        latitudeDelta: 0.02,
                        longitudeDelta: 0.02,
                    };

                    if (isInOfflineRegion) {
                        mapRef.current?.animateToRegion(newRegion, 500);
                    } else {
                        mapRef.current?.animateToRegion(INITIAL_REGION, 500);
                    }
                }
            } catch (err) {
                console.warn('Location error or timeout:', err);
            }
        })();

        return () => { isMounted = false; };
    }, []);

    // Загрузка коворкингов
    useEffect(() => {
        let isMounted = true;

        const loadCoworkings = async () => {
            try {
                const data = await fetchCoworkings();
                const validData = Array.isArray(data)
                    ? data.filter(cw => {
                        const lat = Number(cw.latitude);
                        const lng = Number(cw.longitude);

                        return !isNaN(lat) && !isNaN(lng) && cw?.id &&
                            Math.abs(lat - OFFLINE_REGION.latitude) <= OFFLINE_REGION.latitudeDelta &&
                            Math.abs(lng - OFFLINE_REGION.longitude) <= OFFLINE_REGION.longitudeDelta;
                    })
                    : [];

                if (isMounted) {
                    setCoworkings(validData);
                }
            } catch (err) {
                console.error('Ошибка при загрузке коворкингов:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadCoworkings();

        return () => { isMounted = false; };
    }, []);

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.green} />
                <Text style={{ marginTop: 10, color: theme.textPrimary }}>Загрузка карты...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : null}
                style={styles.map}
                initialRegion={INITIAL_REGION}
                customMapStyle={Platform.OS === 'android' && isDark ? darkMapStyle : []}
                showsUserLocation={true}
                showsMyLocationButton={false}
                onMapReady={() => setMapReady(true)}
                minZoomLevel={10}
                maxZoomLevel={18}
                scrollEnabled={true}
                zoomEnabled={true}
                cachedEnabled={true}
                loadingEnabled={true}
            >
                {mapReady && coworkings.map(cw => (
                    <Marker
                        key={cw.id.toString()}
                        coordinate={{
                            latitude: Number(cw.latitude),
                            longitude: Number(cw.longitude)
                        }}
                        onPress={() => openCoworkingModal(cw)}
                        pinColor={theme.green}
                        tracksViewChanges={false}
                    />
                ))}
            </MapView>

            {/* Индикатор оффлайн зоны */}
            <View style={styles.offlineIndicator}>
                <Text style={[styles.offlineText, { color: theme.textPrimary }]}>
                    Оффлайн карта: Санкт-Петербург и область
                </Text>
                <Text style={[styles.offlineText, { color: theme.textPrimary, fontSize: 10 }]}>
                    Коворкингов: {coworkings.length}
                </Text>
            </View>

            <TouchableOpacity
                style={styles.themeToggleBtn}
                onPress={() => {
                    toggleTheme();
                    setIsDark(prev => !prev);
                }}
            >
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <Path d="M20.742 13.045C20.0643 13.225 19.3662 13.3161 18.665 13.316C16.53 13.316 14.525 12.486 13.019 10.98C12.0301 9.98536 11.3191 8.74887 10.9569 7.39381C10.5948 6.03874 10.5941 4.61242 10.955 3.25701C11.0001 3.08755 10.9998 2.90921 10.9542 2.73988C10.9086 2.57056 10.8192 2.41621 10.6951 2.29232C10.571 2.16842 10.4165 2.07934 10.2471 2.034C10.0777 1.98866 9.8994 1.98867 9.73001 2.03401C8.03316 2.4862 6.48507 3.37664 5.24101 4.61601C1.343 8.51401 1.343 14.859 5.24101 18.759C6.16753 19.6907 7.26964 20.4294 8.48355 20.9323C9.69745 21.4353 10.999 21.6924 12.313 21.689C13.6266 21.6927 14.9279 21.4357 16.1415 20.9329C17.3551 20.4302 18.4569 19.6916 19.383 18.76C20.6233 17.5157 21.5142 15.9668 21.966 14.269C22.0109 14.0996 22.0105 13.9214 21.9649 13.7522C21.9193 13.583 21.8301 13.4287 21.7062 13.3048C21.5823 13.1809 21.428 13.0917 21.2588 13.0461C21.0896 13.0005 20.9114 13.0001 20.742 13.045ZM17.97 17.346C17.229 18.0911 16.3475 18.6818 15.3767 19.084C14.4058 19.4862 13.3649 19.6918 12.314 19.689C11.2628 19.6916 10.2215 19.4858 9.25033 19.0835C8.27916 18.6811 7.39739 18.0903 6.65601 17.345C3.538 14.226 3.538 9.15001 6.65601 6.03101C7.25851 5.42918 7.9541 4.92843 8.71601 4.54801C8.60448 5.98707 8.80496 7.43325 9.30373 8.7877C9.80251 10.1422 10.5878 11.373 11.606 12.396C12.6268 13.4174 13.8573 14.2049 15.2123 14.704C16.5673 15.2032 18.0146 15.4021 19.454 15.287C19.0715 16.0476 18.5706 16.7426 17.97 17.346Z" fill={theme.textPrimary} />
                </Svg>
            </TouchableOpacity>

            <View style={styles.controls}>
                <TouchableOpacity
                    style={styles.controlBtn}
                    onPress={() => {
                        if (!mapRef.current) return;
                        const region = {
                            latitude: INITIAL_REGION.latitude,
                            longitude: INITIAL_REGION.longitude,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                        };
                        mapRef.current.animateToRegion(region);
                    }}
                >
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                        <Path d="M12 5v14M5 12h14" stroke={theme.textPrimary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.controlBtn}
                    onPress={() => {
                        if (!mapRef.current) return;
                        const region = {
                            latitude: INITIAL_REGION.latitude,
                            longitude: INITIAL_REGION.longitude,
                            latitudeDelta: 0.1,
                            longitudeDelta: 0.1,
                        };
                        mapRef.current.animateToRegion(region);
                    }}
                >
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                        <Path d="M5 12h14" stroke={theme.textPrimary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.controlBtn}
                    onPress={() => {
                        if (!mapRef.current || !location) return;
                        mapRef.current.animateToRegion(
                            {
                                latitude: location.latitude,
                                longitude: location.longitude,
                                latitudeDelta: 0.01,
                                longitudeDelta: 0.01,
                            },
                            300
                        );
                    }}
                >
                    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <Path d="M10.3078 13.6923L15.1539 8.84619M20.1113 5.88867L16.0207 19.1833C15.6541 20.3747 15.4706 20.9707 15.1544 21.1683C14.8802 21.3396 14.5406 21.3683 14.2419 21.2443C13.8975 21.1014 13.618 20.5433 13.0603 19.428L10.4694 14.2461C10.3809 14.0691 10.3366 13.981 10.2775 13.9043C10.225 13.8363 10.1645 13.7749 10.0965 13.7225C10.0215 13.6647 9.93486 13.6214 9.76577 13.5369L4.57192 10.9399C3.45662 10.3823 2.89892 10.1032 2.75601 9.75879C2.63207 9.4601 2.66033 9.12023 2.83169 8.84597C3.02928 8.52974 3.62523 8.34603 4.81704 7.97932L18.1116 3.88867C19.0486 3.60038 19.5173 3.45635 19.8337 3.57253C20.1094 3.67373 20.3267 3.89084 20.4279 4.16651C20.544 4.48283 20.3999 4.95126 20.1119 5.88729L20.1113 5.88867Z" stroke={theme.textPrimary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                </TouchableOpacity>
            </View>

            <FilterModal isVisible={isFilterVisible} onClose={closeFilter} />
            <CoworkingModal isVisible={modalVisible} onClose={() => setModalVisible(false)} coworking={selectedCoworking} />
            <BottomSheet openFilter={openFilter} openCoworkingModal={openCoworkingModal} />
        </View>
    );
}

const getStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background, justifyContent: 'center', },
    map: { width, height },
    controls: {
        position: 'absolute',
        right: 18,
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 130,
    },
    controlBtn: {
        backgroundColor: theme.backgroundOpacity,
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 6,
    },
    themeToggleBtn: {
        position: 'absolute',
        top: 70,
        right: 18,
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: theme.backgroundOpacity,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    offlineIndicator: {
        position: 'absolute',
        top: 70,
        left: 18,
        backgroundColor: theme.backgroundOpacity,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        zIndex: 10,
    },
    offlineText: {
        fontSize: 12,
        fontWeight: '500',
    },
});