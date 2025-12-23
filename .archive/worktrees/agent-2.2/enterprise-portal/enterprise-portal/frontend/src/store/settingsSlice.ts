/**
 * Settings Redux Slice
 *
 * Manages application settings including:
 * - Theme (dark/light mode, colors, font size)
 * - Notifications (enabled, sound, position, duration)
 * - Performance (update intervals, animations)
 * - External feeds (Alpaca, Weather, X)
 * - API configuration (base URL, WebSocket URL)
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  SettingsState,
  ThemeConfig,
  NotificationConfig,
  PerformanceConfig,
  ExternalFeedConfig,
} from '../types/state';
import { DEFAULT_SETTINGS_STATE } from '../types/state';

const initialState: SettingsState = DEFAULT_SETTINGS_STATE;

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    // ========================================================================
    // Theme Actions
    // ========================================================================

    /**
     * Set theme mode (light or dark)
     */
    setThemeMode: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme.mode = action.payload;
    },

    /**
     * Toggle theme mode
     */
    toggleThemeMode: (state) => {
      state.theme.mode = state.theme.mode === 'light' ? 'dark' : 'light';
    },

    /**
     * Set primary color
     */
    setPrimaryColor: (state, action: PayloadAction<string>) => {
      state.theme.primaryColor = action.payload;
    },

    /**
     * Set font size
     */
    setFontSize: (state, action: PayloadAction<'small' | 'medium' | 'large'>) => {
      state.theme.fontSize = action.payload;
    },

    /**
     * Update entire theme configuration
     */
    updateTheme: (state, action: PayloadAction<Partial<ThemeConfig>>) => {
      state.theme = { ...state.theme, ...action.payload };
    },

    // ========================================================================
    // Notification Actions
    // ========================================================================

    /**
     * Toggle notifications enabled/disabled
     */
    toggleNotifications: (state) => {
      state.notifications.enabled = !state.notifications.enabled;
    },

    /**
     * Set notifications enabled
     */
    setNotificationsEnabled: (state, action: PayloadAction<boolean>) => {
      state.notifications.enabled = action.payload;
    },

    /**
     * Toggle notification sound
     */
    toggleNotificationSound: (state) => {
      state.notifications.sound = !state.notifications.sound;
    },

    /**
     * Set notification position
     */
    setNotificationPosition: (
      state,
      action: PayloadAction<'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'>
    ) => {
      state.notifications.position = action.payload;
    },

    /**
     * Set notification duration
     */
    setNotificationDuration: (state, action: PayloadAction<number>) => {
      state.notifications.duration = action.payload;
    },

    /**
     * Update entire notification configuration
     */
    updateNotifications: (state, action: PayloadAction<Partial<NotificationConfig>>) => {
      state.notifications = { ...state.notifications, ...action.payload };
    },

    // ========================================================================
    // Performance Actions
    // ========================================================================

    /**
     * Set chart update interval
     */
    setChartUpdateInterval: (state, action: PayloadAction<number>) => {
      state.performance.chartUpdateInterval = action.payload;
    },

    /**
     * Set metrics update interval
     */
    setMetricsUpdateInterval: (state, action: PayloadAction<number>) => {
      state.performance.metricsUpdateInterval = action.payload;
    },

    /**
     * Set max chart data points
     */
    setMaxChartDataPoints: (state, action: PayloadAction<number>) => {
      state.performance.maxChartDataPoints = action.payload;
    },

    /**
     * Toggle animations
     */
    toggleAnimations: (state) => {
      state.performance.enableAnimations = !state.performance.enableAnimations;
    },

    /**
     * Toggle particle effects
     */
    toggleParticleEffects: (state) => {
      state.performance.enableParticleEffects = !state.performance.enableParticleEffects;
    },

    /**
     * Update entire performance configuration
     */
    updatePerformance: (state, action: PayloadAction<Partial<PerformanceConfig>>) => {
      state.performance = { ...state.performance, ...action.payload };
    },

    // ========================================================================
    // External Feeds Actions
    // ========================================================================

    /**
     * Toggle Alpaca feed
     */
    toggleAlpacaFeed: (state) => {
      state.externalFeeds.alpaca.enabled = !state.externalFeeds.alpaca.enabled;
    },

    /**
     * Set Alpaca symbols
     */
    setAlpacaSymbols: (state, action: PayloadAction<string[]>) => {
      state.externalFeeds.alpaca.symbols = action.payload;
    },

    /**
     * Set Alpaca update interval
     */
    setAlpacaUpdateInterval: (state, action: PayloadAction<number>) => {
      state.externalFeeds.alpaca.updateInterval = action.payload;
    },

    /**
     * Toggle Weather feed
     */
    toggleWeatherFeed: (state) => {
      state.externalFeeds.weather.enabled = !state.externalFeeds.weather.enabled;
    },

    /**
     * Set Weather locations
     */
    setWeatherLocations: (state, action: PayloadAction<string[]>) => {
      state.externalFeeds.weather.locations = action.payload;
    },

    /**
     * Set Weather update interval
     */
    setWeatherUpdateInterval: (state, action: PayloadAction<number>) => {
      state.externalFeeds.weather.updateInterval = action.payload;
    },

    /**
     * Toggle Twitter feed
     */
    toggleTwitterFeed: (state) => {
      state.externalFeeds.twitter.enabled = !state.externalFeeds.twitter.enabled;
    },

    /**
     * Set Twitter keywords
     */
    setTwitterKeywords: (state, action: PayloadAction<string[]>) => {
      state.externalFeeds.twitter.keywords = action.payload;
    },

    /**
     * Set Twitter update interval
     */
    setTwitterUpdateInterval: (state, action: PayloadAction<number>) => {
      state.externalFeeds.twitter.updateInterval = action.payload;
    },

    /**
     * Update entire external feeds configuration
     */
    updateExternalFeeds: (state, action: PayloadAction<Partial<ExternalFeedConfig>>) => {
      state.externalFeeds = { ...state.externalFeeds, ...action.payload };
    },

    // ========================================================================
    // API Configuration Actions
    // ========================================================================

    /**
     * Set API base URL
     */
    setApiBaseUrl: (state, action: PayloadAction<string>) => {
      state.apiBaseUrl = action.payload;
    },

    /**
     * Set WebSocket URL
     */
    setWsUrl: (state, action: PayloadAction<string>) => {
      state.wsUrl = action.payload;
    },

    // ========================================================================
    // Demo Mode Actions
    // ========================================================================

    /**
     * Toggle demo mode
     */
    toggleDemoMode: (state) => {
      state.demoMode = !state.demoMode;
    },

    /**
     * Set demo mode
     */
    setDemoMode: (state, action: PayloadAction<boolean>) => {
      state.demoMode = action.payload;
    },

    // ========================================================================
    // Reset Actions
    // ========================================================================

    /**
     * Reset settings to default
     */
    resetSettings: () => initialState,

    /**
     * Reset theme to default
     */
    resetTheme: (state) => {
      state.theme = DEFAULT_SETTINGS_STATE.theme;
    },

    /**
     * Reset notifications to default
     */
    resetNotifications: (state) => {
      state.notifications = DEFAULT_SETTINGS_STATE.notifications;
    },

    /**
     * Reset performance to default
     */
    resetPerformance: (state) => {
      state.performance = DEFAULT_SETTINGS_STATE.performance;
    },

    /**
     * Reset external feeds to default
     */
    resetExternalFeeds: (state) => {
      state.externalFeeds = DEFAULT_SETTINGS_STATE.externalFeeds;
    },
  },
});

// Export actions
export const {
  // Theme
  setThemeMode,
  toggleThemeMode,
  setPrimaryColor,
  setFontSize,
  updateTheme,

  // Notifications
  toggleNotifications,
  setNotificationsEnabled,
  toggleNotificationSound,
  setNotificationPosition,
  setNotificationDuration,
  updateNotifications,

  // Performance
  setChartUpdateInterval,
  setMetricsUpdateInterval,
  setMaxChartDataPoints,
  toggleAnimations,
  toggleParticleEffects,
  updatePerformance,

  // External feeds
  toggleAlpacaFeed,
  setAlpacaSymbols,
  setAlpacaUpdateInterval,
  toggleWeatherFeed,
  setWeatherLocations,
  setWeatherUpdateInterval,
  toggleTwitterFeed,
  setTwitterKeywords,
  setTwitterUpdateInterval,
  updateExternalFeeds,

  // API configuration
  setApiBaseUrl,
  setWsUrl,

  // Demo mode
  toggleDemoMode,
  setDemoMode,

  // Reset
  resetSettings,
  resetTheme,
  resetNotifications,
  resetPerformance,
  resetExternalFeeds,
} = settingsSlice.actions;

// Export reducer
export default settingsSlice.reducer;
