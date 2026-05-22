import React, { useContext } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { CalendarDay } from '../types';
import { ThemeContext } from '../utils/constants';
import { getDateParts } from '../utils/timezone';

interface DayCellProps {
  day: CalendarDay;
  accentColor: string;
  highlightToday?: boolean;
  locale: string;
  timeZone?: string;
  onPress: (day: CalendarDay) => void;
  onKeyDown?: (event: { nativeEvent: { key?: string } }, day: CalendarDay) => void;
  onFocus?: () => void;
  buttonRef?: React.RefObject<any>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const KeyboardAwarePressable = AnimatedPressable as unknown as React.ComponentType<any>;

export function DayCell({ day, accentColor, highlightToday = true, locale, timeZone, onPress, onKeyDown, onFocus, buttonRef }: DayCellProps) {
  const theme = useContext(ThemeContext);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const showRangeFill = day.isInRange && !day.isRangeStart && !day.isRangeEnd;
  const showLeftFill = day.isInRange && day.isRangeEnd && !day.isRangeStart;
  const showRightFill = day.isInRange && day.isRangeStart && !day.isRangeEnd;
  const showSelectedCircle = day.isSelected || day.isRangeStart || day.isRangeEnd;
  const markerColor = day.marker?.dot ?? accentColor;
  const dayParts = getDateParts(day.date, timeZone);
  const accessibilityDate = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone,
  }).format(day.date);
  const accessibilityLabel = `${accessibilityDate}${day.isSelected ? ', selected' : ''}${day.isDisabled ? ', unavailable' : ''}`;

  return (
    <View style={styles.wrapper}>
      {(showRangeFill || showLeftFill || showRightFill) && (
        <View
          pointerEvents="none"
          style={[
            styles.rangeFill,
            showRangeFill && { left: 0, right: 0, backgroundColor: theme.rangeBackground },
            showLeftFill && {
              left: 0,
              right: '50%',
              backgroundColor: theme.rangeBackground,
            },
            showRightFill && {
              left: '50%',
              right: 0,
              backgroundColor: theme.rangeBackground,
            },
          ]}
        />
      )}
      <KeyboardAwarePressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: day.isDisabled, selected: day.isSelected }}
        disabled={day.isDisabled}
        focusable
        ref={buttonRef}
        onPress={() => onPress(day)}
        onFocus={onFocus}
        onKeyDown={(event: { nativeEvent: { key?: string } }) => onKeyDown?.(event, day)}
        onPressIn={() => {
          scale.value = withSpring(0.9);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        style={[styles.pressable, animatedStyle]}
      >
        {day.marker && (
          <View pointerEvents="none" style={styles.markerContainer}>
            {day.marker.label ? (
              <Text style={[styles.markerLabel, { color: markerColor }]}>{day.marker.label}</Text>
            ) : (
              <View style={[styles.markerDot, { backgroundColor: markerColor }]} />
            )}
          </View>
        )}
        {showSelectedCircle && (
          <View
            pointerEvents="none"
            style={[
              styles.selectedBubble,
              { backgroundColor: accentColor },
            ]}
          />
        )}
        <View
          style={[
            styles.circle,
            highlightToday &&
              day.isToday &&
              !showSelectedCircle && {
                backgroundColor: theme.surface,
                borderColor: theme.todayBorder,
                borderWidth: 1.5,
              },
          ]}
        >
          <Text
            style={[
              styles.label,
              { color: theme.text },
              !day.isCurrentMonth && { opacity: 0.22 },
              day.isDisabled && { color: theme.textMuted, opacity: 0.4 },
              showSelectedCircle && { color: theme.selectedText, opacity: 1 },
            ]}
          >
            {dayParts.day}
          </Text>
        </View>
      </KeyboardAwarePressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    position: 'relative',
  },
  pressable: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  rangeFill: {
    position: 'absolute',
    top: 3,
    bottom: 3,
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  selectedBubble: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignSelf: 'center',
  },
  markerContainer: {
    position: 'absolute',
    bottom: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  markerLabel: {
    fontSize: 9,
    fontWeight: '700',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
});
