import React, { useContext, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ThemeContext } from '../utils/constants';
import { createDateInTimeZone, getDateParts } from '../utils/timezone';

interface MonthPickerProps {
  visible: boolean;
  selectedMonth: number;
  viewYear: number;
  locale: string;
  timeZone?: string;
  minDate?: Date;
  maxDate?: Date;
  onSelectMonth: (month: number) => void;
  onClose: () => void;
  accentColor: string;
  reducedMotion?: boolean;
}

export function MonthPicker({
  visible,
  selectedMonth,
  viewYear,
  locale,
  timeZone,
  minDate,
  maxDate,
  onSelectMonth,
  onClose,
  accentColor,
  reducedMotion = false,
}: MonthPickerProps) {
  const theme = useContext(ThemeContext);
  const scale = useSharedValue(visible ? 1 : 0.9);
  const opacity = useSharedValue(visible ? 1 : 0);
  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => ({
        value: index,
        label: new Intl.DateTimeFormat(locale, {
          month: 'short',
          timeZone,
        }).format(createDateInTimeZone({ year: 2000, month: index, day: 1, hour: 12 }, timeZone)),
      })),
    [locale, timeZone],
  );
  const minParts = useMemo(() => (minDate ? getDateParts(minDate, timeZone) : null), [minDate, timeZone]);
  const maxParts = useMemo(() => (maxDate ? getDateParts(maxDate, timeZone) : null), [maxDate, timeZone]);

  const isMonthDisabled = (month: number) => {
    if (minParts && viewYear < minParts.year) {
      return true;
    }

    if (maxParts && viewYear > maxParts.year) {
      return true;
    }

    if (minParts && viewYear === minParts.year && month < minParts.month) {
      return true;
    }

    if (maxParts && viewYear === maxParts.year && month > maxParts.month) {
      return true;
    }

    return false;
  };

  React.useEffect(() => {
    if (!visible) {
      return;
    }

    opacity.value = reducedMotion ? 1 : withTiming(1, { duration: 180 });
    scale.value = reducedMotion ? 1 : withSpring(1, { damping: 18, stiffness: 180 });
  }, [opacity, reducedMotion, scale, visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: theme.background,
            borderColor: theme.border,
          },
          animatedStyle,
        ]}
      >
        <Text style={[styles.title, { color: theme.text }]}>Select month</Text>
        <View style={styles.grid}>
          {months.map((month) => {
            const disabled = isMonthDisabled(month.value);

            return (
              <Pressable
                key={month.value}
                accessibilityRole="button"
                accessibilityState={{ disabled }}
                disabled={disabled}
                onPress={() => onSelectMonth(month.value)}
                style={[
                  styles.monthButton,
                  disabled && styles.monthButtonDisabled,
                  month.value === selectedMonth && !disabled && { backgroundColor: accentColor },
                ]}
              >
                <Text
                  style={[
                    styles.monthText,
                    {
                      color: disabled
                        ? theme.textMuted
                        : month.value === selectedMonth
                          ? theme.selectedText
                          : theme.text,
                    },
                  ]}
                >
                  {month.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'center',
    padding: 16,
    zIndex: 21,
    elevation: 21,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  monthButton: {
    width: '31%',
    minHeight: 46,
    marginBottom: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthButtonDisabled: {
    opacity: 0.42,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
