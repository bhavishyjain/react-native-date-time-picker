import React, { useContext, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ThemeContext } from '../utils/constants';
import { formatMonthYear } from '../utils/i18n';
import { createDateInTimeZone } from '../utils/timezone';

interface MonthHeaderProps {
  year: number;
  month: number;
  locale: string;
  timeZone?: string;
  onPrev: () => void;
  onNext: () => void;
  onOpenYearPicker: () => void;
  reducedMotion?: boolean;
}

export function MonthHeader({
  year,
  month,
  locale,
  timeZone,
  onPrev,
  onNext,
  onOpenYearPicker,
  reducedMotion = false,
}: MonthHeaderProps) {
  const theme = useContext(ThemeContext);
  const opacity = useSharedValue(1);
  const [label, setLabel] = useState(
    formatMonthYear(
      createDateInTimeZone({ year, month, day: 1, hour: 12 }, timeZone),
      locale,
      timeZone,
    ),
  );

  useEffect(() => {
    const nextLabel = formatMonthYear(
      createDateInTimeZone({ year, month, day: 1, hour: 12 }, timeZone),
      locale,
      timeZone,
    );

    if (reducedMotion) {
      setLabel(nextLabel);
      return;
    }

    opacity.value = withTiming(0.2, { duration: 120 }, (finished) => {
      if (finished) {
        opacity.value = withTiming(1, { duration: 200 });
      }
    });
    setLabel(nextLabel);
  }, [locale, month, opacity, reducedMotion, timeZone, year]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        onPress={onPrev}
        style={styles.iconButton}
      >
        <Text style={[styles.icon, { color: theme.textMuted }]}>{'‹'}</Text>
      </Pressable>

      {/* Absolutely centered title — unaffected by arrow button widths */}
      <Pressable
        accessibilityRole="button"
        onPress={onOpenYearPicker}
        style={styles.titleButton}
      >
        <Animated.Text style={[styles.title, { color: theme.text }, animatedStyle]}>
          {label}
        </Animated.Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={onNext}
        style={styles.iconButton}
      >
        <Text style={[styles.icon, { color: theme.textMuted }]}>{'›'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    paddingBottom: 12,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 15,
    fontWeight: '600',
  },
  titleButton: {
    flex: 1,
    minHeight: 36,
    paddingVertical: 2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
    textAlign: 'center',
  },
});
