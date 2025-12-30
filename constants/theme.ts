/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const primary = '#135bec'; // Requested Blue
const secondary = '#f59e0b'; // Amber-like for pending
const darkBg = '#101622';
const lightBg = '#f6f6f8';
const darkSurface = '#1e293b';
const lightSurface = '#FFFFFF';

export const Colors = {
  light: {
    text: '#0f172a', // Slate 900
    background: lightBg,
    surface: lightSurface,
    primary: primary,
    secondary: secondary,
    tint: primary,
    icon: '#64748b', // Slate 500
    tabIconDefault: '#94a3b8',
    tabIconSelected: primary,
    border: '#e2e8f0',
    error: '#ef4444',
    card: lightSurface,
  },
  dark: {
    text: '#e2e8f0', // Slate 200
    background: '#0f172a', // Slate 900
    surface: '#1e293b', // Slate 800
    primary: '#4f85f6', // Brighter blue for dark mode
    secondary: secondary,
    tint: '#4f85f6',
    icon: '#94a3b8',
    tabIconDefault: '#64748b',
    tabIconSelected: '#4f85f6',
    border: '#334155',
    error: '#ef4444',
    card: '#1e293b', // Slate 800
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
