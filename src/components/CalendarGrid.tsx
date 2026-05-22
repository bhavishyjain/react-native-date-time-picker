import React, { useContext, useEffect, useMemo, useRef } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { CalendarDay } from '../types';
import { ThemeContext } from '../utils/constants';
import { getISOWeekNumber } from '../utils/date';
import { DayCell } from './DayCell';

interface CalendarGridProps {
  grid: CalendarDay[][];
  accentColor: string;
  locale: string;
  timeZone?: string;
  onDayPress: (day: CalendarDay) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  monthKey: string;
  reducedMotion?: boolean;
  highlightToday?: boolean;
  showWeekNumbers?: boolean;
  onEscape?: () => void;
}

const SWIPE_THRESHOLD = 36;

export function CalendarGrid({
  grid,
  accentColor,
  locale,
  timeZone,
  onDayPress,
  onPrevMonth,
  onNextMonth,
  monthKey,
  reducedMotion = false,
  highlightToday = true,
  showWeekNumbers = false,
  onEscape,
}: CalendarGridProps) {
  const theme = useContext(ThemeContext);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const previousMonthKey = useRef(monthKey);
  const cellRefs = useRef(new Map<string, React.RefObject<any>>());

  const flatDays = useMemo(() => grid.flat(), [grid]);

  function getCellRef(key: string) {
    const existing = cellRefs.current.get(key);

    if (existing) {
      return existing;
    }

    const ref = React.createRef<any>();
    cellRefs.current.set(key, ref);
    return ref;
  }

  function focusDayByKey(key: string) {
    requestAnimationFrame(() => {
      cellRefs.current.get(key)?.current?.focus?.();
    });
  }

  useEffect(() => {
    const width = Dimensions.get('window').width;
    const previousDate = previousMonthKey.current;
    const direction = previousDate.localeCompare(monthKey) < 0 ? 1 : -1;

    if (reducedMotion || previousDate === monthKey) {
      translateX.value = 0;
      opacity.value = 1;
      previousMonthKey.current = monthKey;
      return;
    }

    translateX.value = direction * width;
    opacity.value = 0.4;
    translateX.value = withSpring(0, {
      damping: 18,
      stiffness: 180,
    });
    opacity.value = withTiming(1, { duration: 180 });
    previousMonthKey.current = monthKey;
  }, [monthKey, opacity, reducedMotion, translateX]);

  const swipeGesture = Gesture.Pan()
    .runOnJS(true)
    .onEnd((event) => {
      if (event.translationX <= -SWIPE_THRESHOLD) {
        onNextMonth();
      } else if (event.translationX >= SWIPE_THRESHOLD) {
        onPrevMonth();
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  function handleKeyDown(event: { nativeEvent: { key?: string } }, day: CalendarDay) {
    const key = event.nativeEvent.key;

    if (!key) {
      return;
    }

    if (key === 'Enter' || key === ' ') {
      event.nativeEvent.key = key;
      onDayPress(day);
      return;
    }

    if (key === 'Escape') {
      onEscape?.();
      return;
    }

    if (key === 'PageUp') {
      onPrevMonth();
      return;
    }

    if (key === 'PageDown') {
      onNextMonth();
      return;
    }

    const offsetByKey: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };

    const delta = offsetByKey[key];
    if (delta === undefined) {
      return;
    }

    const currentIndex = flatDays.findIndex((item) => item.date.toISOString() === day.date.toISOString());
    const nextIndex = currentIndex + delta;
    const nextDay = flatDays[nextIndex];

    if (nextDay) {
      onDayPress(nextDay);
      focusDayByKey(nextDay.date.toISOString());
      return;
    }

    if (delta < 0) {
      onPrevMonth();
      requestAnimationFrame(() => {
        const lastDay = grid.flat()[grid.flat().length - 1];
        focusDayByKey(lastDay ? lastDay.date.toISOString() : day.date.toISOString());
      });
      return;
    }

    onNextMonth();
    requestAnimationFrame(() => {
      focusDayByKey(grid.flat()[0]?.date.toISOString() ?? day.date.toISOString());
    });
  }

  return (
    <GestureDetector gesture={swipeGesture}>
      <Animated.View style={[styles.container, { borderColor: theme.border }, animatedStyle]}>
        {grid.map((row, rowIndex) => (
          <View key={`${monthKey}-${rowIndex}`} style={styles.row}>
            {showWeekNumbers && (
              <View style={styles.weekNumberCell}>
                <Text style={[styles.weekNumberLabel, { color: theme.textMuted }]}>W{getISOWeekNumber(row[0].date, timeZone)}</Text>
              </View>
            )}
            {row.map((day) => (
              <DayCell
                key={day.date.toISOString()}
                accentColor={accentColor}
                buttonRef={getCellRef(day.date.toISOString())}
                day={day}
                highlightToday={highlightToday}
                locale={locale}
                onKeyDown={handleKeyDown}
                timeZone={timeZone}
                onPress={onDayPress}
              />
            ))}
          </View>
        ))}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekNumberCell: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekNumberLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
