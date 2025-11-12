import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Dimensions,
} from 'react-native';
import Modal from 'react-native-modal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../context/ThemeContext';

const DEFAULT_FILTERS = {
    workTime: 'Открыто сейчас',
    network: 'Просто',
    distance: 2,
    rating: null,
    cost: 'Платно',
};

const { width, height } = Dimensions.get('window');

export default function FilterModal({ isVisible, onClose }) {
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const { theme } = useContext(ThemeContext);
    const styles = getStyles(theme);

    useEffect(() => {
        const loadFilters = async () => {
            try {
                const saved = await AsyncStorage.getItem('@filters');
                if (saved) setFilters(JSON.parse(saved));
            } catch (e) {
                console.warn('Failed to load filters', e);
            }
        };
        if (isVisible) loadFilters();
    }, [isVisible]);

    const saveFilters = async (newFilters) => {
        setFilters(newFilters);
        try {
            await AsyncStorage.setItem('@filters', JSON.stringify(newFilters));
        } catch (e) {
            console.warn('Failed to save filters', e);
        }
    };

    // для радиокнопок
    const setSingleValue = (key, value) => {
        saveFilters({ ...filters, [key]: value });
    };

    return (
        <Modal
            isVisible={isVisible}
            style={styles.modal}
            backdropOpacity={0.3}
            useNativeDriver
            useNativeDriverForBackdrop
            swipeDirection="down"
            onSwipeComplete={onClose}
            propagateSwipe
            swipeThreshold={60}
        >
            <View style={styles.container}>
                <View style={styles.dragArea}>
                    <View style={styles.dragHandle} />
                </View>

                <Text style={styles.title}>Фильтры</Text>

                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingBottom: 120 }}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.section}>Время работы</Text>
                    <View style={styles.row}>
                        {['Открыто сейчас', 'Круглосуточно'].map((option) => (
                            <TouchableOpacity
                                key={option}
                                style={[
                                    styles.btn,
                                    filters.workTime === option && styles.btnActive,
                                ]}
                                onPress={() => setSingleValue('workTime', option)}
                            >
                                <Text
                                    style={[
                                        styles.btnText,
                                        filters.workTime === option && styles.btnTextActive,
                                    ]}
                                >
                                    {option}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.section}>Рейтинг</Text>
                    <View style={styles.row}>
                        {['4.7', '4.5', '4.0'].map((option) => (
                            <TouchableOpacity
                                key={option}
                                style={[
                                    styles.btn,
                                    filters.rating === option && styles.btnActive,
                                ]}
                                onPress={() =>
                                    setSingleValue('rating', filters.rating === option ? null : option)
                                }
                            >
                                <Text
                                    style={[
                                        styles.btnText,
                                        filters.rating === option && styles.btnTextActive,
                                    ]}
                                >
                                    Только выше {option}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.section}>Стоимость</Text>
                    <View style={styles.row}>
                        {['Платно', 'Бесплатно'].map((option) => (
                            <TouchableOpacity
                                key={option}
                                style={[
                                    styles.btn,
                                    filters.cost === option && styles.btnActive,
                                ]}
                                onPress={() => setSingleValue('cost', option)}
                            >
                                <Text
                                    style={[
                                        styles.btnText,
                                        filters.cost === option && styles.btnTextActive,
                                    ]}
                                >
                                    {option}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>

                <View style={styles.bottom}>
                    <TouchableOpacity
                        style={styles.clearBtn}
                        onPress={() => saveFilters(DEFAULT_FILTERS)}
                    >
                        <Text style={styles.clearText}>Сбросить всё</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.applyBtn}
                        onPress={async () => {
                            try {
                                await AsyncStorage.setItem('@filters', JSON.stringify(filters));
                            } catch (e) {
                                console.warn('Failed to save filters', e);
                            }
                            onClose();
                        }}
                    >
                        <Text style={styles.applyText}>Применить</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const getStyles = (theme) =>
    StyleSheet.create({
        modal: { justifyContent: 'flex-end', margin: 0 },
        container: {
            backgroundColor: theme.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            height: height * 0.9,
            overflow: 'hidden',
        },
        dragArea: { alignItems: 'center', paddingVertical: 12 },
        dragHandle: { width: 60, height: 5, borderRadius: 3, backgroundColor: '#ccc', marginBottom: 6 },
        title: { fontSize: 18, fontWeight: '600', color: theme.textPrimary, textAlign: 'center', marginBottom: 10 },
        section: { color: theme.textSecondary, marginTop: 15, marginBottom: 10, fontSize: 14, paddingHorizontal: 20 },
        row: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20 },
        btn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: theme.inputBackground, marginRight: 10, marginBottom: 10 },
        btnActive: { backgroundColor: '#7F3FFF' },
        btnText: { color: theme.textPrimary, fontSize: 14 },
        btnTextActive: { color: '#fff' },
        bottom: { position: 'absolute', bottom: 0, width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 30, paddingTop: 10, paddingBottom: 60, backgroundColor: theme.background },
        clearBtn: { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: theme.inputBackground, borderRadius: 20 },
        clearText: { color: theme.textPrimary },
        applyBtn: { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#7F3FFF', borderRadius: 20 },
        applyText: { color: '#fff' },
    });
