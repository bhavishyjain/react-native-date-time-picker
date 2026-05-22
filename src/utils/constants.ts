import React from 'react';

export const DEFAULT_ACCENT_COLOR = '#3B82F6';
export const DEFAULT_LOCALE = 'en-US';
export const DEFAULT_MINUTE_INTERVAL = 1;

export function getMinYear(baseYear = new Date().getFullYear()): number {
  return baseYear - 100;
}

export function getMaxYear(baseYear = new Date().getFullYear()): number {
  return baseYear + 10;
}

export interface PickerThemeValues {
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  rangeBackground: string;
  selectedText: string;
  todayBorder: string;
  radius: number;
  wheelHighlight: string;
}

export type PickerThemeValuesPatch = Partial<PickerThemeValues>;

export function mergeThemeValues(
  baseTheme: PickerThemeValues,
  customTheme?: PickerThemeValuesPatch,
): PickerThemeValues {
  if (!customTheme) {
    return baseTheme;
  }

  return {
    ...baseTheme,
    ...customTheme,
  };
}

export function buildTheme(
  accentColor: string,
  darkMode: boolean,
  customTheme?: PickerThemeValuesPatch,
): PickerThemeValues {
  return mergeThemeValues({
    accent: accentColor,
    background: darkMode ? '#09090B' : '#FFFFFF',
    surface: darkMode ? '#18181B' : '#F9F9F9',
    text: darkMode ? '#F4F4F5' : '#1C1C1E',
    textMuted: darkMode ? '#71717A' : '#6B7280',
    border: darkMode ? '#27272A' : '#E5E7EB',
    rangeBackground: `${accentColor}20`,
    selectedText: '#FFFFFF',
    todayBorder: accentColor,
    radius: 16,
    wheelHighlight: `${accentColor}18`,
  }, customTheme);
}

export const ThemeContext = React.createContext<PickerThemeValues>(
  buildTheme(DEFAULT_ACCENT_COLOR, false),
);
