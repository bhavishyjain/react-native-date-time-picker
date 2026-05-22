import React, { useEffect, useMemo, useState } from "react";
import {
  AccessibilityInfo,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { ClockTimePicker } from "./components/ClockTimePicker";
import { DateWheelPicker } from "./components/DateWheelPicker";
import { CalendarSection } from "./components/CalendarSection";
import { MonthPicker } from "./components/MonthPicker";
import { RangePicker } from "./components/RangePicker";
import { TimeWheel } from "./components/TimeWheel";
import { YearPicker } from "./components/YearPicker";
import { useDatePicker } from "./hooks/useDatePicker";
import {
  buildTheme,
  DEFAULT_ACCENT_COLOR,
  ThemeContext,
} from "./utils/constants";
import { formatDate } from "./utils/date";
import { resolveLocale } from "./utils/i18n";

import type { DateTimePickerProps } from "./types";

const SWIPE_CLOSE_THRESHOLD = 80;

function areDatesEqual(
  left: Date | null | undefined,
  right: Date | null | undefined,
) {
  if (
    left === null ||
    left === undefined ||
    right === null ||
    right === undefined
  ) {
    return left === right;
  }

  return left.getTime() === right.getTime();
}

function areRangesEqual(
  left: { start: Date | null; end: Date | null },
  right: { start: Date | null; end: Date | null },
) {
  return (
    areDatesEqual(left.start, right.start) && areDatesEqual(left.end, right.end)
  );
}

function areDateArraysEqual(
  left: Date[] | undefined,
  right: Date[] | undefined,
) {
  if (!left || !right || left.length !== right.length) {
    return false;
  }

  return left.every((item, index) => areDatesEqual(item, right[index]));
}

function areMonthsEqual(
  left: { year: number; month: number } | null | undefined,
  right: { year: number; month: number } | null | undefined,
) {
  if (!left || !right) {
    return left === right;
  }

  return left.year === right.year && left.month === right.month;
}

function useReducedMotionEnabled() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReducedMotion,
    );
    return () => {
      if (subscription && typeof subscription.remove === "function") {
        subscription.remove();
      }
    };
  }, []);

  return reducedMotion;
}

export function DateTimePicker(props: DateTimePickerProps) {
  const {
    mode,
    locale,
    timezone,
    accentColor = DEFAULT_ACCENT_COLOR,
    darkMode,
    disabled = false,
    firstDayOfWeek = 0,
    is24Hour = false,
    minuteInterval = 1,
    showSeconds = false,
    minTime,
    maxTime,
    datePickerVariant = "calendar",
    timePickerVariant = "wheel",
    inline = true,
    visible = true,
    placeholder,
    placeholderStyle,
    modalPosition = "bottom",
    highlightToday = true,
    showWeekNumbers = false,
    customTheme,
    confirmLabel = "Confirm",
    clearLabel = "Clear",
    onRangeIncomplete,
    onOpen,
    onDismiss,
    onClose,
  } = props;

  const resolvedLocale = resolveLocale(locale);
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const reducedMotion = useReducedMotionEnabled();
  const [internalVisible, setInternalVisible] = useState(false);
  const isPlaceholderTrigger = !inline && Boolean(placeholder);
  const isControlled = props.visible !== undefined;
  const resolvedVisible = isPlaceholderTrigger
    ? (isControlled ? props.visible : internalVisible)
    : visible;
  const resolvedDarkMode = darkMode ?? colorScheme === "dark";
  const resolvedTheme = useMemo(
    () => buildTheme(accentColor, resolvedDarkMode, customTheme),
    [accentColor, customTheme, resolvedDarkMode],
  );
  const {
    viewYear,
    viewMonth,
    goToPrevMonth,
    goToNextMonth,
    goToYear,
    calendarGrid,
    selectedDate,
    selectedRange,
    handleDayPress,
    handleDateChange,
    selectedMultiDates,
    selectedMonthValue,
    selectedYearValue,
    setSelectedYearValue,
    selectedHour,
    selectedMinute,
    selectedSecond,
    selectedAmPm,
    setHour,
    setMinute,
    setSecond,
    setAmPm,
    minTimeSeconds,
    maxTimeSeconds,
    showYearPicker,
    setShowYearPicker,
    showMonthPicker,
    setShowMonthPicker,
    getDraftValue,
    handleConfirm,
    handleClear,
    goToMonthValue,
  } = useDatePicker(props);

  useEffect(() => {
    if (!inline && resolvedVisible) {
      onOpen?.();
    }
  }, [inline, onOpen, resolvedVisible]);

  const translateY = useSharedValue(inline ? 0 : 32);
  const dragY = useSharedValue(0);
  useEffect(() => {
    translateY.value =
      inline || reducedMotion
        ? 0
        : withSpring(0, { damping: 18, stiffness: 180 });
  }, [inline, reducedMotion, translateY]);

  const sheetAnimatedStyle = useAnimatedStyle(() => {
    const nextTranslate =
      translateY.value + (dragY.value > 0 ? dragY.value : 0);
    return {
      transform: [{ translateY: nextTranslate }],
    };
  });

  const modalRootStyle = [
    styles.modalRoot,
    modalPosition === "top" && styles.modalTop,
    modalPosition === "center" && styles.modalCenter,
    modalPosition === "bottom" && styles.modalBottom,
  ];

  const sheetWrapStyle = [
    styles.sheetWrap,
    modalPosition === "top" && styles.sheetTop,
    modalPosition === "center" && styles.sheetCenter,
    modalPosition === "bottom" && [
      styles.sheetBottom,
      {
        backgroundColor: resolvedTheme.background,
        paddingBottom: insets.bottom,
      },
    ],
  ];

  const monthKey = `${viewYear}-${viewMonth}`;
  const committedValue = props.value;
  const draftValue = getDraftValue();
  const showFooter =
    !inline ||
    (() => {
      if (mode === "range") {
        return (
          areRangesEqual(
            draftValue as { start: Date | null; end: Date | null },
            (committedValue as
              | { start: Date | null; end: Date | null }
              | undefined) ?? { start: null, end: null },
          ) === false
        );
      }

      if (mode === "multi") {
        return (
          areDateArraysEqual(
            draftValue as Date[],
            (committedValue as Date[] | undefined) ?? [],
          ) === false
        );
      }

      if (mode === "month") {
        return (
          areMonthsEqual(
            draftValue as { year: number; month: number } | null,
            (committedValue as { year: number; month: number } | undefined) ??
              null,
          ) === false
        );
      }

      if (mode === "year") {
        return (
          (draftValue as number) !== (committedValue as number | undefined)
        );
      }

      return (
        areDatesEqual(
          draftValue as Date | null,
          (committedValue as Date | null | undefined) ?? null,
        ) === false
      );
    })();

  const handleBackdropPress = () => {
    if (isPlaceholderTrigger) {
      setInternalVisible(false);
    }
    onClose?.();
  };

  const handleModalDismiss = () => {
    onDismiss?.();
  };

  const handleConfirmPress = () => {
    if (mode === "range" && selectedRange.start && !selectedRange.end) {
      onRangeIncomplete?.();
      return;
    }

    handleConfirm();

    if (!inline) {
      handleBackdropPress();
    }
  };

  const swipeDownGesture = Gesture.Pan()
    .runOnJS(true)
    .onUpdate((event) => {
      if (event.translationY > 0) {
        dragY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > SWIPE_CLOSE_THRESHOLD) {
        dragY.value = withTiming(0, { duration: 140 });
        runOnJS(handleBackdropPress)();
        return;
      }

      dragY.value = withTiming(0, { duration: 160 });
    });

  const content = (
    <ThemeContext.Provider value={resolvedTheme}>
      <>
        <Animated.View
          style={[
            styles.panel,
            disabled && styles.panelDisabled,
            modalPosition === "bottom" && !inline
              ? {
                  backgroundColor: resolvedTheme.background,
                  borderTopLeftRadius: resolvedTheme.radius * 1.5,
                  borderTopRightRadius: resolvedTheme.radius * 1.5,
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                }
              : {
                  backgroundColor: resolvedTheme.background,
                  borderRadius: resolvedTheme.radius * 1.5,
                },
            !inline && sheetAnimatedStyle,
          ]}
          pointerEvents={disabled ? "none" : "auto"}
        >
          {(mode === "date" || mode === "datetime") &&
            datePickerVariant === "calendar" && (
              <CalendarSection
                accentColor={accentColor}
                firstDayOfWeek={firstDayOfWeek}
                grid={calendarGrid}
                highlightToday={highlightToday}
                locale={resolvedLocale}
                month={viewMonth}
                monthKey={monthKey}
                onDayPress={handleDayPress}
                onEscape={handleBackdropPress}
                onNextMonth={goToNextMonth}
                onOpenYearPicker={() => setShowYearPicker(true)}
                onPrevMonth={goToPrevMonth}
                reducedMotion={reducedMotion}
                showWeekNumbers={showWeekNumbers}
                timeZone={timezone}
                year={viewYear}
              />
            )}

          {mode === "month" && (
            <View style={styles.wheelDateSection}>
              <DateWheelPicker
                accentColor={accentColor}
                locale={resolvedLocale}
                showDayWheel={false}
                timeZone={timezone}
                maxDate={props.maxDate}
                minDate={props.minDate}
                onChange={handleDateChange}
                value={
                  new Date(selectedMonthValue.year, selectedMonthValue.month, 1)
                }
              />
            </View>
          )}

          {mode === "year" && (
            <YearPicker
              accentColor={accentColor}
              maxYear={props.maxDate?.getFullYear()}
              minYear={props.minDate?.getFullYear()}
              onSelectYear={(year) => setSelectedYearValue(year)}
              reducedMotion={reducedMotion}
              selectedYear={selectedYearValue}
              visible
              inline
            />
          )}

          {(mode === "date" || mode === "datetime") &&
            datePickerVariant === "wheel" && (
              <View style={styles.wheelDateSection}>
                <DateWheelPicker
                  accentColor={accentColor}
                  locale={resolvedLocale}
                  timeZone={timezone}
                  maxDate={props.maxDate}
                  minDate={props.minDate}
                  onChange={handleDateChange}
                  value={selectedDate}
                />
              </View>
            )}

          {mode === "multi" && (
            <CalendarSection
              accentColor={accentColor}
              firstDayOfWeek={firstDayOfWeek}
              grid={calendarGrid}
              highlightToday={highlightToday}
              locale={resolvedLocale}
              month={viewMonth}
              monthKey={monthKey}
              onDayPress={handleDayPress}
              onEscape={handleBackdropPress}
              onNextMonth={goToNextMonth}
              onOpenYearPicker={() => setShowYearPicker(true)}
              onPrevMonth={goToPrevMonth}
              reducedMotion={reducedMotion}
              showWeekNumbers={showWeekNumbers}
              timeZone={timezone}
              year={viewYear}
            />
          )}

          {mode === "range" && (
            <CalendarSection
              accentColor={accentColor}
              firstDayOfWeek={firstDayOfWeek}
              grid={calendarGrid}
              highlightToday={highlightToday}
              locale={resolvedLocale}
              month={viewMonth}
              monthKey={monthKey}
              onDayPress={handleDayPress}
              onNextMonth={goToNextMonth}
              onOpenYearPicker={() => setShowYearPicker(true)}
              onPrevMonth={goToPrevMonth}
              reducedMotion={reducedMotion}
              showWeekNumbers={showWeekNumbers}
              timeZone={timezone}
              year={viewYear}
            />
          )}

          {mode === "range" && (
            <RangePicker
              locale={resolvedLocale}
              range={selectedRange}
              timeZone={timezone}
            />
          )}

          {(mode === "time" || mode === "datetime") && (
            <View style={styles.timeSection}>
              {mode === "datetime" && (
                <View
                  style={[
                    styles.divider,
                    { backgroundColor: resolvedTheme.border },
                  ]}
                />
              )}
              {timePickerVariant === "wheel" ? (
                <TimeWheel
                  accentColor={accentColor}
                  amPm={selectedAmPm}
                  hour={selectedHour}
                  is24Hour={is24Hour}
                  minute={selectedMinute}
                  second={selectedSecond}
                  showSeconds={showSeconds}
                  minuteInterval={minuteInterval}
                  minTimeSeconds={minTimeSeconds}
                  maxTimeSeconds={maxTimeSeconds}
                  onAmPmChange={setAmPm}
                  onHourChange={setHour}
                  onMinuteChange={setMinute}
                  onSecondChange={setSecond}
                />
              ) : (
                <ClockTimePicker
                  accentColor={accentColor}
                  amPm={selectedAmPm}
                  hour={selectedHour}
                  is24Hour={is24Hour}
                  minute={selectedMinute}
                  second={selectedSecond}
                  showSeconds={showSeconds}
                  minuteInterval={minuteInterval}
                  minTimeSeconds={minTimeSeconds}
                  maxTimeSeconds={maxTimeSeconds}
                  onAmPmChange={setAmPm}
                  onHourChange={setHour}
                  onMinuteChange={setMinute}
                  onSecondChange={setSecond}
                />
              )}
            </View>
          )}

          {showFooter &&
            (mode === "date" ||
              mode === "datetime" ||
              mode === "range" ||
              mode === "time" ||
              mode === "multi" ||
              mode === "month" ||
              mode === "year") && (
              <View style={styles.footer}>
                <Pressable
                  accessibilityRole="button"
                  disabled={disabled}
                  onPress={handleClear}
                  style={[
                    styles.secondaryButton,
                    { borderColor: resolvedTheme.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.secondaryText,
                      { color: resolvedTheme.text },
                    ]}
                  >
                    {clearLabel}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={disabled}
                  onPress={handleConfirmPress}
                  style={[
                    styles.primaryButton,
                    { backgroundColor: resolvedTheme.accent },
                  ]}
                >
                  <Text
                    style={[
                      styles.primaryText,
                      { color: resolvedTheme.selectedText },
                    ]}
                  >
                    {confirmLabel}
                  </Text>
                </Pressable>
              </View>
            )}
        </Animated.View>

        {(mode === "date" ||
          mode === "datetime" ||
          mode === "range" ||
          mode === "multi") && (
          <>
            <YearPicker
              accentColor={accentColor}
              maxYear={props.maxDate?.getFullYear()}
              minYear={props.minDate?.getFullYear()}
              onClose={() => setShowYearPicker(false)}
              onSelectYear={goToYear}
              reducedMotion={reducedMotion}
              selectedYear={viewYear}
              visible={showYearPicker}
            />
            <MonthPicker
              accentColor={accentColor}
              maxDate={props.maxDate}
              locale={resolvedLocale}
              onClose={() => setShowMonthPicker(false)}
              onSelectMonth={goToMonthValue}
              minDate={props.minDate}
              reducedMotion={reducedMotion}
              selectedMonth={viewMonth}
              viewYear={viewYear}
              timeZone={timezone}
              visible={showMonthPicker}
            />
          </>
        )}
      </>
    </ThemeContext.Provider>
  );

  if (inline) {
    return content;
  }

  const sheetContent =
    !inline && modalPosition === "bottom" ? (
      <GestureDetector gesture={swipeDownGesture}>{content}</GestureDetector>
    ) : (
      content
    );

  const getTriggerLabel = () => {
    if (!props.value) {
      return placeholder;
    }

    if (mode === "date") {
      return props.value instanceof Date
        ? formatDate(props.value, resolvedLocale, "date", timezone)
        : placeholder;
    }

    if (mode === "datetime") {
      return props.value instanceof Date
        ? formatDate(props.value, resolvedLocale, "datetime", timezone)
        : placeholder;
    }

    if (mode === "time") {
      if (typeof props.value === "string") {
        return props.value;
      }
      return props.value instanceof Date
        ? formatDate(props.value, resolvedLocale, "time", timezone)
        : placeholder;
    }

    if (mode === "month") {
      const val = props.value as { month: number; year: number };
      if (val && typeof val === "object" && typeof val.month === "number") {
        const dummyDate = new Date(val.year, val.month, 1);
        return new Intl.DateTimeFormat(resolvedLocale, {
          month: "long",
          year: "numeric",
        }).format(dummyDate);
      }
      return placeholder;
    }

    if (mode === "year") {
      if (typeof props.value === "number") {
        return String(props.value);
      }
      if (props.value instanceof Date) {
        return String(props.value.getFullYear());
      }
      return placeholder;
    }

    if (mode === "range") {
      const range = props.value as { start: Date | null; end: Date | null } | null | undefined;
      if (range && (range.start || range.end)) {
        const startStr = range.start
          ? formatDate(range.start, resolvedLocale, "date", timezone)
          : "...";
        const endStr = range.end
          ? formatDate(range.end, resolvedLocale, "date", timezone)
          : "...";
        return `${startStr} – ${endStr}`;
      }
      return placeholder;
    }

    if (mode === "multi") {
      const dates = props.value as unknown as Date[];
      if (Array.isArray(dates) && dates.length > 0) {
        if (dates.length === 1) {
          return formatDate(dates[0]!, resolvedLocale, "date", timezone);
        }
        return `${dates.length} dates selected`;
      }
      return placeholder;
    }

    return placeholder;
  };

  const renderTriggerIcon = () => {
    const iconColor = resolvedTheme.textMuted;
    if (mode === "time") {
      return (
        <View style={{ width: 14, height: 14, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: iconColor }} />
          <View style={{ position: 'absolute', top: 3, width: 1.5, height: 4, backgroundColor: iconColor }} />
          <View style={{ position: 'absolute', top: 7, left: 7, width: 3, height: 1.5, backgroundColor: iconColor }} />
        </View>
      );
    }
    return (
      <View style={{ width: 14, height: 14, borderWidth: 1.5, borderColor: iconColor, borderRadius: 3, paddingTop: 3, paddingHorizontal: 2 }}>
        <View style={{ position: 'absolute', top: -2, left: 3, width: 1.5, height: 3, backgroundColor: iconColor }} />
        <View style={{ position: 'absolute', top: -2, right: 3, width: 1.5, height: 3, backgroundColor: iconColor }} />
        <View style={{ height: 1.5, backgroundColor: iconColor, marginBottom: 2 }} />
        <View style={{ flexDirection: 'row', gap: 1 }}>
          <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: iconColor }} />
          <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: iconColor }} />
          <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: iconColor }} />
        </View>
      </View>
    );
  };

  const triggerLabel = getTriggerLabel();

  if (isPlaceholderTrigger) {
    return (
      <>
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          onPress={() => {
            setInternalVisible(true);
            if (isControlled) {
              onOpen?.();
            }
          }}
          style={[
            styles.placeholderButton,
            {
              borderColor: resolvedTheme.border,
              backgroundColor: resolvedTheme.surface,
            },
          ]}
        >
          <Text
            style={[
              styles.placeholderText,
              {
                color: props.value
                  ? resolvedTheme.text
                  : resolvedTheme.textMuted,
              },
              placeholderStyle,
            ]}
          >
            {triggerLabel || "Select"}
          </Text>
          {renderTriggerIcon()}
        </Pressable>

        <Modal
          animationType="none"
          onRequestClose={handleBackdropPress}
          onDismiss={handleModalDismiss}
          transparent
          visible={resolvedVisible}
        >
          <SafeAreaView edges={["top"]} style={modalRootStyle}>
            <Pressable
              disabled={disabled}
              style={styles.backdrop}
              onPress={handleBackdropPress}
            />
            <View style={sheetWrapStyle}>{sheetContent}</View>
          </SafeAreaView>
        </Modal>
      </>
    );
  }

  return (
    <Modal
      animationType="none"
      onRequestClose={handleBackdropPress}
      onDismiss={handleModalDismiss}
      transparent
      visible={resolvedVisible}
    >
      <SafeAreaView edges={["top"]} style={modalRootStyle}>
        <Pressable
          disabled={disabled}
          style={styles.backdrop}
          onPress={handleBackdropPress}
        />
        <View style={sheetWrapStyle}>{sheetContent}</View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  panel: {
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  panelDisabled: {
    opacity: 0.55,
  },
  calendarShell: {
    position: "relative",
  },
  wheelDateSection: {
    paddingBottom: 12,
  },
  placeholderButton: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "left",
    flex: 1,
  },
  timeSection: {
    paddingTop: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 16,
    paddingBottom: 12,
  },
  secondaryButton: {
    flex: 1,
    height: 48,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.1,
  },
  primaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  modalRoot: {
    flex: 1,
  },
  modalTop: {
    justifyContent: "flex-start",
  },
  modalCenter: {
    justifyContent: "center",
    alignItems: "center",
  },
  modalBottom: {
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  sheetWrap: {
    padding: 12,
    width: "100%",
  },
  sheetTop: {
    paddingTop: 16,
    paddingHorizontal: 12,
  },
  sheetCenter: {
    justifyContent: "center",
    paddingHorizontal: 12,
    maxWidth: 400,
    width: "100%",
  },
  sheetBottom: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 12,
    paddingRight: 12,
  },
});
