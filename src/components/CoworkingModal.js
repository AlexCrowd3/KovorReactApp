import React, { useState, useEffect, useRef, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    FlatList,
    Dimensions,
    TouchableOpacity,
    Linking,
    PanResponder,
} from 'react-native';
import Modal from 'react-native-modal';
import { ThemeContext } from '../context/ThemeContext';
import Svg, { Path } from 'react-native-svg';
import Typography from '../styles/Typography';

const { width, height } = Dimensions.get('window');

const AUTO_SCROLL_INTERVAL = 3000;

export default function CoworkingModal({ isVisible, onClose, coworking }) {
    const { theme } = useContext(ThemeContext);
    const styles = getStyles(theme);

    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef(null);
    const timerRef = useRef(null);
    const panResponderRef = useRef(null);

    useEffect(() => {
        panResponderRef.current = PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (evt, gestureState) => {
                if (gestureState.dy > 50) {
                    onClose();
                }
            },
        });
    }, [onClose]);

    useEffect(() => {
        if (!coworking?.photos || coworking.photos.length === 0) return;

        timerRef.current = setInterval(() => {
            let nextIndex = (currentIndex + 1) % coworking.photos.length;
            setCurrentIndex(nextIndex);
            flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        }, AUTO_SCROLL_INTERVAL);

        return () => clearInterval(timerRef.current);
    }, [currentIndex, coworking]);

    const openLink = (url) => {
        if (!url) return;
        Linking.openURL(url);
    };

    if (!coworking) return null;

    return (
        <Modal
            isVisible={isVisible}
            onBackdropPress={onClose}
            onBackButtonPress={onClose}
            style={styles.modal}
            swipeDirection="down"
            onSwipeComplete={onClose}

        >
            {/* Images */}
            <View style={styles.imageContainer}>
                <FlatList
                    ref={flatListRef}
                    data={coworking.photos}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                        <Image source={{ uri: item }} style={styles.image} />
                    )}
                    onScroll={(e) => {
                        const index = Math.round(e.nativeEvent.contentOffset.x / width);
                        setCurrentIndex(index);
                    }}
                />
                <View style={styles.dotsContainer}>
                    {coworking.photos.map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.dot,
                                { opacity: i === currentIndex ? 1 : 0.3 },
                            ]}
                        />
                    ))}
                </View>
                <Image source={{ uri: coworking.logo_url }} style={styles.logo} />
            </View>
            <View style={styles.container} {...panResponderRef.current?.panHandlers}>
                <View style={styles.swipeIndicator} />
                <View style={styles.infoContainer}>
                    <Text style={styles.name}>{coworking.name}</Text>

                    <View style={styles.ratingContainer}>
                        <View style={styles.ratingRow}>
                            <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <Path
                                    d="M1.55664 6.89118C1.34781 6.69806 1.46125 6.34893 1.74371 6.31544L5.74609 5.84071C5.86122 5.82706 5.96121 5.75477 6.00977 5.6495L7.69792 1.98964C7.81705 1.73135 8.18425 1.7313 8.30339 1.98959L9.99154 5.64942C10.0401 5.75469 10.1394 5.82718 10.2546 5.84083L14.2572 6.31544C14.5396 6.34893 14.6527 6.69816 14.4439 6.89128L11.4852 9.62794C11.4001 9.70665 11.3622 9.8238 11.3848 9.93751L12.17 13.8906C12.2254 14.1696 11.9285 14.3858 11.6803 14.2469L8.16343 12.2777C8.06227 12.2211 7.93938 12.2214 7.83822 12.278L4.32096 14.2464C4.07275 14.3853 3.77529 14.1696 3.83073 13.8906L4.6161 9.93776C4.63869 9.82405 4.60089 9.70662 4.51578 9.62792L1.55664 6.89118Z"
                                    fill="#FFC600"
                                />
                            </Svg>
                            <Text style={styles.ratingText}>{coworking.rating}</Text>
                            <Text style={styles.ratingCount}>{coworking.ratings_count} оценок</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Стоимость</Text>
                        <Text style={styles.value}>{coworking.cost}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Часы работы</Text>
                        <Text style={styles.value}>Ежедневно {coworking.open_time}–{coworking.close_time}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Адрес</Text>
                        <Text style={styles.addressValue}>{coworking.address}</Text>
                    </View>

                    <View style={styles.contactsSection}>
                        <Text style={styles.contactsTitle}>Контакты</Text>

                        <View style={styles.contactItems}>
                            <TouchableOpacity
                                style={styles.contactItem}
                                onPress={() => openLink('tel:+79587736520')}
                            >
                                <Text style={styles.contactText}>{coworking.telephone_number}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.socialButtonsContainer}>
                        <TouchableOpacity
                            style={[styles.socialButton, { backgroundColor: theme.backgroundOpacity }]}
                            onPress={() => openLink(coworking.telegram_url)}
                        >
                            <Text style={styles.socialButtonText}>Telegram</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.socialButton, { backgroundColor: theme.backgroundOpacity }]}
                            onPress={() => openLink(coworking.whatsapp_url)}
                        >
                            <Text style={styles.socialButtonText}>WhatsApp</Text>
                        </TouchableOpacity>
                    </View>
                </View>

            </View>
        </Modal>
    );
}

const getStyles = (theme) =>
    StyleSheet.create({
        modal: {
            justifyContent: 'flex-end',
            margin: 0,
            height: height,
        },
        container: {
            backgroundColor: theme.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            height: height - 200,
        },
        swipeIndicator: {
            width: 40,
            height: 4,
            backgroundColor: '#E5E5E5',
            borderRadius: 2,
            alignSelf: 'center',
            marginTop: 8,
            marginBottom: 16,
        },
        imageContainer: {
            width,
            height: 220,
            position: 'relative',
            position: 'absolute',
            top: 0,
            height: 220,
        },
        logo: {
            position: 'absolute',
            zIndex: 20,
            bottom: 44,
            left: 16,
            width: 60,
            height: 60,
        },
        image: {
            width,
            height: 220,
            resizeMode: 'cover',
        },
        dotsContainer: {
            position: 'absolute',
            bottom: 35,
            left: 0,
            right: 0,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
        },
        dot: {
            width: '28%',
            height: 3,
            borderRadius: 3,
            backgroundColor: '#fff',
            marginHorizontal: 4,
        },
        infoContainer: {
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 24,
            height: height - 220,
        },
        name: {
            fontSize: 22,
            fontWeight: '700',
            color: theme.textPrimary,
            marginBottom: 12,
        },
        ratingContainer: {
            marginBottom: 16,
        },
        ratingRow: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        ratingText: {
            marginLeft: 6,
            fontSize: 14,
            fontWeight: '600',
            color: theme.textPrimary,
        },
        ratingCount: {
            marginLeft: 6,
            fontSize: 14,
            color: theme.textSecondary,
        },
        infoRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 12,
            paddingBottom: 12,
        },
        label: {
            fontSize: 14,
            fontWeight: '500',
            color: theme.textSecondary,
            flex: 1,
        },
        value: {
            fontSize: 14,
            fontWeight: '400',
            color: theme.textPrimary,
            flex: 2,
            textAlign: 'right',
        },
        addressValue: {
            fontSize: 14,
            fontWeight: '400',
            color: theme.textPrimary,
            flex: 2,
            textAlign: 'right',
            lineHeight: 18,
        },
        contactsSection: {
            marginTop: 8,
        },
        contactsTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.textPrimary,
            marginBottom: 12,
        },
        contactItems: {
            borderRadius: 12,
            overflow: 'hidden',
        },
        contactItem: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 12,
        },
        contactText: {
            fontSize: 14,
            fontWeight: '400',
            color: theme.textPrimary,
            flex: 1,
        },
        socialButtonsContainer: {
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'stretch',
            marginTop: 20,
            marginBottom: 40,
            paddingHorizontal: 16,
            gap: 12,
        },
        socialButton: {
            paddingVertical: 10,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
        },
        socialButtonText: {
            ...Typography.subheadline_regular,
            color: theme.textPrimary,
        },
    });