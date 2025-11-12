import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme } from '../styles/themes';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [isDark, setIsDark] = useState(true);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem('@theme_mode');
                if (savedTheme !== null) {
                    setIsDark(savedTheme === 'dark');
                }
            } catch (e) {
                console.warn('Failed to load theme from storage', e);
            } finally {
                setLoading(false);
            }
        };
        loadTheme();
    }, []);

    const toggleTheme = async () => {
        try {
            const newIsDark = !isDark;
            setIsDark(newIsDark);
            await AsyncStorage.setItem('@theme_mode', newIsDark ? 'dark' : 'light');
        } catch (e) {
            console.warn('Failed to save theme to storage', e);
        }
    };

    const theme = isDark ? darkTheme : lightTheme;

    if (loading) return null;

    return (
        <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
