import React, { useContext, useEffect, useMemo, useRef } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import {
  useTimeWheel,
  TIME_WHEEL_ITEM_HEIGHT,
  TIME_WHEEL_VISIBLE_ITEMS,
} from "../hooks/useTimeWheel";
import { DateValue, TimeWheelItem } from "../types";
import { ThemeContext } from "../utils/constants";
import { getDaysInMonth } from "../utils/date";
import {
  createDateInTimeZone,
  getDateParts,
  getDateTimeParts,
} from "../utils/timezone";

type WheelItem = TimeWheelItem & {
  disabled?: boolean;
};

interface DateWheelPickerProps {
  value: DateValue;
  locale: string;
  timeZone?: string;
  accentColor: string;
  minDate?: Date;
  maxDate?: Date;
  onChange: (value: Date) => void;
  showDayWheel?: boolean;
}

function clampDate(date: Date, minDate?: Date, maxDate?: Date) {
  if (minDate && date.getTime() < minDate.getTime()) {
    return new Date(minDate);
  }

  if (maxDate && date.getTime() > maxDate.getTime()) {
    return new Date(maxDate);
  }

  return date;
}

function buildMonthItems(
  locale: string,
  timeZone?: string,
  year?: number,
  minDate?: Date,
  maxDate?: Date,
) {
  const minParts = minDate ? getDateParts(minDate, timeZone) : null;
  const maxParts = maxDate ? getDateParts(maxDate, timeZone) : null;

  return Array.from({ length: 12 }, (_, index) => {
    const disabled =
      Boolean(
        minParts &&
        year !== undefined &&
        year === minParts.year &&
        index < minParts.month,
      ) ||
      Boolean(
        maxParts &&
        year !== undefined &&
        year === maxParts.year &&
        index > maxParts.month,
      );

    return {
      value: index,
      label: new Intl.DateTimeFormat(locale, {
        month: "short",
        timeZone,
      }).format(
        createDateInTimeZone(
          { year: 2000, month: index, day: 1, hour: 12 },
          timeZone,
        ),
      ),
      disabled,
    };
  }).filter((item) => !item.disabled);
}

function buildDayItems(year: number, month: number) {
  return Array.from({ length: getDaysInMonth(year, month) }, (_, index) => ({
    value: index + 1,
    label: `${index + 1}`,
  }));
}

function buildYearItems(minDate?: Date, maxDate?: Date, timeZone?: string) {
  const currentYear = getDateParts(new Date(), timeZone).year;
  const start = minDate
    ? getDateParts(minDate, timeZone).year
    : currentYear - 100;
  const end = maxDate ? getDateParts(maxDate, timeZone).year : currentYear + 20;

  return Array.from({ length: end - start + 1 }, (_, index) => ({
    value: start + index,
    label: `${start + index}`,
  }));
}

interface WheelColumnProps {
  data: WheelItem[];
  selectedIndex: number;
  scrollY: SharedValue<number>;
  onSnap: (offsetY: number) => void;
}

function WheelColumn({
  data,
  selectedIndex,
  scrollY,
  onSnap,
}: WheelColumnProps) {
  const listRef = useRef<ScrollView>(null);
  const theme = useContext(ThemeContext);
  const isProgrammaticScroll = useRef(false);
  const momentumStarted = useRef(false);

  useEffect(() => {
    const targetOffset = selectedIndex * TIME_WHEEL_ITEM_HEIGHT;

    isProgrammaticScroll.current = true;
    listRef.current?.scrollTo({
      animated: false,
      y: targetOffset,
    });
    const timeout = setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 80);

    return () => clearTimeout(timeout);
  }, [selectedIndex]);

  useEffect(() => {
    scrollY.value = selectedIndex * TIME_WHEEL_ITEM_HEIGHT;
  }, [scrollY, selectedIndex]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.value = event.nativeEvent.contentOffset.y;
  };

  const snapToNearest = (offsetY: number, animated: boolean) => {
    const snappedOffset =
      Math.round(offsetY / TIME_WHEEL_ITEM_HEIGHT) * TIME_WHEEL_ITEM_HEIGHT;
    const snappedIndex = Math.round(offsetY / TIME_WHEEL_ITEM_HEIGHT);
    const item = data[Math.min(Math.max(snappedIndex, 0), data.length - 1)];

    if (item?.disabled) {
      return;
    }

    isProgrammaticScroll.current = true;
    listRef.current?.scrollTo({
      animated,
      y: snappedOffset,
    });
    const timeout = setTimeout(
      () => {
        isProgrammaticScroll.current = false;
      },
      animated ? 220 : 80,
    );
    onSnap(snappedOffset);
    return () => clearTimeout(timeout);
  };

  const handleScrollEndDrag = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    if (isProgrammaticScroll.current) {
      return;
    }

    const velocity = Math.abs(event.nativeEvent.velocity?.y ?? 0);
    if (velocity > 0.35) {
      momentumStarted.current = true;
      return;
    }

    momentumStarted.current = false;
    snapToNearest(event.nativeEvent.contentOffset.y, true);
  };

  const handleMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    if (isProgrammaticScroll.current) {
      return;
    }

    if (!momentumStarted.current) {
      return;
    }

    momentumStarted.current = false;
    const snappedOffset =
      Math.round(event.nativeEvent.contentOffset.y / TIME_WHEEL_ITEM_HEIGHT) *
      TIME_WHEEL_ITEM_HEIGHT;
    const snappedIndex = Math.round(
      event.nativeEvent.contentOffset.y / TIME_WHEEL_ITEM_HEIGHT,
    );
    const item = data[Math.min(Math.max(snappedIndex, 0), data.length - 1)];

    if (item?.disabled) {
      return;
    }

    isProgrammaticScroll.current = true;
    listRef.current?.scrollTo({
      animated: false,
      y: snappedOffset,
    });
    const timeout = setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 80);
    onSnap(snappedOffset);
    return () => clearTimeout(timeout);
  };

  useEffect(() => {
    if (Platform.OS !== "web") {
      return;
    }

    const scrollNode = listRef.current?.getScrollableNode() as HTMLDivElement | null;
    if (!scrollNode) {
      return;
    }

    let isDown = false;
    let startY = 0;
    let startScrollTop = 0;

    scrollNode.style.cursor = "grab";
    scrollNode.style.userSelect = "none";
    scrollNode.style.webkitUserSelect = "none";

    const handleMouseDown = (e: MouseEvent) => {
      isDown = true;
      scrollNode.style.cursor = "grabbing";
      startY = e.pageY - scrollNode.offsetTop;
      startScrollTop = scrollNode.scrollTop;
    };

    const handleMouseLeave = () => {
      if (!isDown) return;
      isDown = false;
      scrollNode.style.cursor = "grab";
      snapToNearest(scrollNode.scrollTop, true);
    };

    const handleMouseUp = () => {
      if (!isDown) return;
      isDown = false;
      scrollNode.style.cursor = "grab";
      snapToNearest(scrollNode.scrollTop, true);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const y = e.pageY - scrollNode.offsetTop;
      const walk = (y - startY) * 1.5;
      scrollNode.scrollTop = startScrollTop - walk;
    };

    scrollNode.addEventListener("mousedown", handleMouseDown);
    scrollNode.addEventListener("mouseleave", handleMouseLeave);
    scrollNode.addEventListener("mouseup", handleMouseUp);
    scrollNode.addEventListener("mousemove", handleMouseMove);

    return () => {
      scrollNode.removeEventListener("mousedown", handleMouseDown);
      scrollNode.removeEventListener("mouseleave", handleMouseLeave);
      scrollNode.removeEventListener("mouseup", handleMouseUp);
      scrollNode.removeEventListener("mousemove", handleMouseMove);
    };
  }, [data]);


  return (
    <View style={styles.wheelContainer}>
      <ScrollView
        bounces={false}
        decelerationRate="normal"
        nestedScrollEnabled
        onMomentumScrollBegin={() => {
          momentumStarted.current = true;
        }}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScroll={handleScroll}
        onScrollEndDrag={handleScrollEndDrag}
        overScrollMode="never"
        ref={listRef}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        snapToInterval={TIME_WHEEL_ITEM_HEIGHT}
        contentContainerStyle={styles.contentContainer}
      >
        {data.map((item, index) => (
          <WheelRow
            index={index}
            item={item}
            key={`date-wheel-${index}`}
            scrollY={scrollY}
          />
        ))}
      </ScrollView>
      <View
        pointerEvents="none"
        style={[
          styles.highlightBand,
          {
            backgroundColor: theme.wheelHighlight,
            borderColor: theme.accent,
          },
        ]}
      />
    </View>
  );
}

function WheelRow({
  item,
  index,
  scrollY,
}: {
  item: WheelItem;
  index: number;
  scrollY: SharedValue<number>;
}) {
  const theme = useContext(ThemeContext);
  const animatedStyle = useAnimatedStyle(() => {
    const centeredIndex = scrollY.value / TIME_WHEEL_ITEM_HEIGHT;
    const distance = Math.abs(index - centeredIndex);
    const clamped = Math.min(distance, 2);

    return {
      opacity: interpolate(
        clamped,
        [0, 1, 2],
        [1, 0.5, 0.2],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          scale: interpolate(
            clamped,
            [0, 1, 2],
            [1, 0.82, 0.58],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  return (
    <Animated.View
      style={[styles.row, item.disabled && styles.rowDisabled, animatedStyle]}
    >
      <Text style={[styles.rowText, { color: theme.text }]}>{item.label}</Text>
    </Animated.View>
  );
}

export function DateWheelPicker({
  value,
  locale,
  timeZone,
  accentColor,
  minDate,
  maxDate,
  onChange,
  showDayWheel = true,
}: DateWheelPickerProps) {
  const baseDate = clampDate(value ?? new Date(), minDate, maxDate);
  const baseParts = getDateTimeParts(baseDate, timeZone);
  const monthItems = useMemo(
    () => buildMonthItems(locale, timeZone, baseParts.year, minDate, maxDate),
    [baseParts.year, locale, maxDate, minDate, timeZone],
  );
  const yearItems = useMemo(
    () => buildYearItems(minDate, maxDate, timeZone),
    [maxDate, minDate, timeZone],
  );
  const dayItems = useMemo(
    () => buildDayItems(baseParts.year, baseParts.month - 1),
    [baseParts.month, baseParts.year],
  );

  const months = useTimeWheel(monthItems, baseParts.month - 1);
  const days = useTimeWheel(dayItems, baseParts.day);
  const years = useTimeWheel(yearItems, baseParts.year);

  const monthScrollY = useSharedValue(
    months.selectedValueIndex * TIME_WHEEL_ITEM_HEIGHT,
  );
  const dayScrollY = useSharedValue(
    days.selectedValueIndex * TIME_WHEEL_ITEM_HEIGHT,
  );
  const yearScrollY = useSharedValue(
    years.selectedValueIndex * TIME_WHEEL_ITEM_HEIGHT,
  );

  function buildNextDate(nextYear: number, nextMonth: number, nextDay: number) {
    // Wheel month values are 0-based; getDateTimeParts() returns 1-based months.
    const safeDay = Math.min(nextDay, getDaysInMonth(nextYear, nextMonth));
    return clampDate(
      createDateInTimeZone(
        {
          year: nextYear,
          month: nextMonth,
          day: safeDay,
          hour: baseParts.hour,
          minute: baseParts.minute,
          second: baseParts.second,
          millisecond: baseDate.getMilliseconds(),
        },
        timeZone,
      ),
      minDate,
      maxDate,
    );
  }

  return (
    <View style={styles.container}>
      <WheelColumn
        data={monthItems}
        onSnap={(offsetY) => {
          const nextMonth = months.getValueFromOffset(
            months.getSnapOffset(offsetY),
          );
          const nextDate = buildNextDate(
            baseParts.year,
            nextMonth,
            baseParts.day,
          );
          months.setSelectedValue(getDateParts(nextDate, timeZone).month);
          onChange(nextDate);
        }}
        scrollY={monthScrollY}
        selectedIndex={months.selectedValueIndex}
      />
      {showDayWheel && (
        <WheelColumn
          data={dayItems}
          onSnap={(offsetY) => {
            const nextDay = days.getValueFromOffset(
              days.getSnapOffset(offsetY),
            );
            const nextDate = buildNextDate(
              baseParts.year,
              baseParts.month - 1,
              nextDay,
            );
            days.setSelectedValue(getDateParts(nextDate, timeZone).day);
            onChange(nextDate);
          }}
          scrollY={dayScrollY}
          selectedIndex={days.selectedValueIndex}
        />
      )}
      <WheelColumn
        data={yearItems}
        onSnap={(offsetY) => {
          const nextYear = years.getValueFromOffset(
            years.getSnapOffset(offsetY),
          );
          const nextDate = buildNextDate(
            nextYear,
            baseParts.month - 1,
            baseParts.day,
          );
          years.setSelectedValue(getDateParts(nextDate, timeZone).year);
          onChange(nextDate);
        }}
        scrollY={yearScrollY}
        selectedIndex={years.selectedValueIndex}
      />
      <View
        pointerEvents="none"
        style={[
          styles.centerOverlay,
          {
            borderColor: accentColor,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 12,
    height: TIME_WHEEL_ITEM_HEIGHT * TIME_WHEEL_VISIBLE_ITEMS,
    position: "relative",
  },
  wheelContainer: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 16,
  },
  row: {
    height: TIME_WHEEL_ITEM_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  rowDisabled: {
    opacity: 0.4,
  },
  contentContainer: {
    paddingTop: TIME_WHEEL_ITEM_HEIGHT * 2,
    paddingBottom: TIME_WHEEL_ITEM_HEIGHT * 2,
  },
  rowText: {
    fontSize: 20,
    fontWeight: "700",
  },
  highlightBand: {
    position: "absolute",
    top: TIME_WHEEL_ITEM_HEIGHT * 2,
    left: 0,
    right: 0,
    height: TIME_WHEEL_ITEM_HEIGHT,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  centerOverlay: {
    position: "absolute",
    top: TIME_WHEEL_ITEM_HEIGHT * 2,
    left: 0,
    right: 0,
    height: TIME_WHEEL_ITEM_HEIGHT,
    borderRadius: 12,
  },
});
