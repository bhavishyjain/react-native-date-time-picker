import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  CalendarDay,
  DateRange,
  DateTimePickerProps,
  DateValue,
  PickerValue,
} from "../types";
import { DEFAULT_MINUTE_INTERVAL } from "../utils/constants";
import { addMonths } from "../utils/date";
import {
  parseTimeString,
  roundMinute,
  timePartsToSeconds,
  toDisplayHour,
  toInternalHour,
} from "../utils/time";
import {
  addDaysInTimeZone,
  createDateInTimeZone,
  getDateParts,
  getDateTimeParts,
} from "../utils/timezone";
import { useCalendarGrid } from "./useCalendarGrid";

function isDateRangeValue(value: unknown): value is DateRange {
  return (
    value !== null &&
    value !== undefined &&
    typeof value === "object" &&
    "start" in value &&
    "end" in value
  );
}

function isMonthValue(
  value: unknown,
): value is { year: number; month: number } {
  return (
    value !== null &&
    value !== undefined &&
    typeof value === "object" &&
    "year" in value &&
    "month" in value
  );
}

function isDateArrayValue(value: unknown): value is Date[] {
  return Array.isArray(value) && value.every((item) => item instanceof Date);
}

function coerceDateValue(
  value: DateTimePickerProps["value"],
  mode: DateTimePickerProps["mode"],
): DateValue {
  if (mode === "range") {
    return null;
  }

  return value instanceof Date ? new Date(value) : null;
}

function coerceRangeValue(value: DateTimePickerProps["value"]): DateRange {
  if (isDateRangeValue(value)) {
    return {
      start: value.start ? new Date(value.start) : null,
      end: value.end ? new Date(value.end) : null,
    };
  }

  return { start: null, end: null };
}

function getDayStamp(date: Date, timeZone?: string) {
  const parts = getDateParts(date, timeZone);
  return Date.UTC(parts.year, parts.month, parts.day);
}

function clampYearToBounds(year: number, minDate?: Date, maxDate?: Date) {
  const minYear = minDate?.getFullYear();
  const maxYear = maxDate?.getFullYear();

  if (minYear !== undefined && year < minYear) {
    return minYear;
  }

  if (maxYear !== undefined && year > maxYear) {
    return maxYear;
  }

  return year;
}

export function useDatePicker(props: DateTimePickerProps) {
  const {
    mode,
    value,
    onChange,
    minDate,
    maxDate,
    disabledDates,
    markedDates,
    onMonthChange,
    onChangeImmediate,
    maxMultiSelect,
    onMaxReached,
    is24Hour = false,
    minuteInterval = DEFAULT_MINUTE_INTERVAL,
    firstDayOfWeek = 0,
    showSeconds = false,
    minTime,
    maxTime,
    timezone,
  } = props;

  const minTimeSeconds = useMemo(() => (minTime ? parseTimeString(minTime) : null), [minTime]);
  const maxTimeSeconds = useMemo(() => (maxTime ? parseTimeString(maxTime) : null), [maxTime]);
  const minDateTime = minDate ? minDate.getTime() : null;
  const maxDateTime = maxDate ? maxDate.getTime() : null;

  const disabledDatesKey = useMemo(() => {
    if (!Array.isArray(disabledDates)) {
      return undefined;
    }

    return disabledDates
      .map((entry) => {
        if (entry instanceof Date) {
          const parts = getDateParts(entry, timezone);
          return `${Date.UTC(parts.year, parts.month, parts.day)}`;
        }

        const fromParts = getDateParts(entry.from, timezone);
        const toParts = getDateParts(entry.to, timezone);
        return `${Date.UTC(fromParts.year, fromParts.month, fromParts.day)}-${Date.UTC(toParts.year, toParts.month, toParts.day)}`;
      })
      .sort()
      .join(",");
  }, [disabledDates, timezone]);

  const initialBaseDate = useRef(
    value instanceof Date
      ? new Date(value)
      : isDateRangeValue(value) && value.start
        ? new Date(value.start)
        : new Date(),
  );

  const [selectedDate, setSelectedDate] = useState<DateValue>(
    coerceDateValue(value, mode),
  );
  const [selectedRange, setSelectedRange] = useState<DateRange>(
    coerceRangeValue(value),
  );
  const [selectedMultiDates, setSelectedMultiDates] = useState<Date[]>(
    isDateArrayValue(value) ? value.map((item) => new Date(item)) : [],
  );
  const [selectedMonthValue, setSelectedMonthValue] = useState<{
    year: number;
    month: number;
  }>(
    isMonthValue(value)
      ? { year: value.year, month: value.month }
      : {
          year: initialBaseDate.current.getFullYear(),
          month: initialBaseDate.current.getMonth(),
        },
  );
  const [selectedYearValue, setSelectedYearValue] = useState<number>(
    clampYearToBounds(
      typeof value === "number" ? value : initialBaseDate.current.getFullYear(),
      minDate,
      maxDate,
    ),
  );
  const [viewDate, setViewDate] = useState(initialBaseDate.current);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const initialDateTimeParts = getDateTimeParts(
    initialBaseDate.current,
    timezone,
  );
  const [selectedHour, setSelectedHour] = useState(initialDateTimeParts.hour);
  const [selectedMinute, setSelectedMinute] = useState(
    roundMinute(initialDateTimeParts.minute, minuteInterval),
  );
  const [selectedSecond, setSelectedSecond] = useState(
    showSeconds ? initialDateTimeParts.second : 0,
  );
  const [selectedAmPm, setSelectedAmPm] = useState<"AM" | "PM">(
    initialDateTimeParts.hour >= 12 ? "PM" : "AM",
  );
  const previousValue = useRef<DateTimePickerProps["value"]>(value);
  const previousMode = useRef<DateTimePickerProps["mode"]>(mode);

  useEffect(() => {
    const shouldSyncValue =
      previousValue.current !== value || previousMode.current !== mode;

    if (!shouldSyncValue) {
      return;
    }

    const nextBase =
      value instanceof Date
        ? new Date(value)
        : isDateRangeValue(value) && value.start
          ? new Date(value.start)
          : new Date();

    setViewDate(nextBase);

    if (mode !== "time") {
      setSelectedDate(coerceDateValue(value, mode));
      setSelectedRange(coerceRangeValue(value));
      setSelectedMultiDates(
        isDateArrayValue(value) ? value.map((item) => new Date(item)) : [],
      );
      const nextBaseParts = getDateParts(nextBase, timezone);
      setSelectedMonthValue(
        isMonthValue(value)
          ? { year: value.year, month: value.month }
          : {
              year: nextBaseParts.year,
              month: nextBaseParts.month,
            },
      );
      setSelectedYearValue(
        clampYearToBounds(
          typeof value === "number" ? value : nextBaseParts.year,
          minDate,
          maxDate,
        ),
      );
      setShowYearPicker(false);
      setShowMonthPicker(false);
    }

    previousValue.current = value;
    previousMode.current = mode;
  }, [maxDateTime, minDateTime, mode, timezone, value]);

  useEffect(() => {
    if (mode === "time" || mode === "datetime") {
      // Only sync time from the external value prop — never from internal selectedDate/viewDate,
      // otherwise tapping a day in datetime mode would silently reset any time the user picked.
      const baseDate = value instanceof Date ? new Date(value) : new Date();
      const nextBaseParts = getDateTimeParts(baseDate, timezone);
      setSelectedHour(nextBaseParts.hour);
      setSelectedMinute(roundMinute(nextBaseParts.minute, minuteInterval));
      setSelectedSecond(showSeconds ? nextBaseParts.second : 0);
      setSelectedAmPm(nextBaseParts.hour >= 12 ? "PM" : "AM");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minuteInterval, mode, showSeconds, timezone, value]);

  const viewDateParts = getDateParts(viewDate, timezone);
  const calendarGrid = useCalendarGrid({
    year: viewDateParts.year,
    month: viewDateParts.month,
    selectedDate,
    selectedDates: mode === "multi" ? selectedMultiDates : undefined,
    range: selectedRange,
    disabledDates,
    disabledDatesKey,
    markedDates,
    minDate,
    maxDate,
    firstDayOfWeek,
    timeZone: timezone,
  });

  const goToMonth = useCallback(
    (delta: number) => {
      setViewDate((current) => {
        const next = addMonths(current, delta, timezone);
        const nextParts = getDateParts(next, timezone);
        onMonthChange?.(nextParts.year, nextParts.month);
        return next;
      });
    },
    [onMonthChange, timezone],
  );

  const goToPrevMonth = useCallback(() => {
    goToMonth(-1);
  }, [goToMonth]);

  const goToNextMonth = useCallback(() => {
    goToMonth(1);
  }, [goToMonth]);

  const goToYear = useCallback(
    (year: number) => {
      setViewDate((current) => {
        const currentParts = getDateTimeParts(current, timezone);
        const next = createDateInTimeZone(
          {
            year,
            month: currentParts.month - 1,
            day: 1,
            hour: currentParts.hour,
            minute: currentParts.minute,
            second: currentParts.second,
            millisecond: current.getMilliseconds(),
          },
          timezone,
        );
        onMonthChange?.(year, currentParts.month - 1);
        return next;
      });
      setShowYearPicker(false);
      setShowMonthPicker(true);
    },
    [onMonthChange, timezone],
  );

  const goToMonthValue = useCallback(
    (month: number) => {
      setViewDate((current) => {
        const currentParts = getDateTimeParts(current, timezone);
        const next = createDateInTimeZone(
          {
            year: currentParts.year,
            month,
            day: 1,
            hour: currentParts.hour,
            minute: currentParts.minute,
            second: currentParts.second,
            millisecond: current.getMilliseconds(),
          },
          timezone,
        );
        onMonthChange?.(currentParts.year, month);
        return next;
      });
      setShowMonthPicker(false);
    },
    [onMonthChange, timezone],
  );

  const buildNextDateTime = useCallback(
    (date: Date): Date => {
      const dateParts = getDateTimeParts(date, timezone);
      const hour = is24Hour
        ? selectedHour
        : selectedAmPm === "PM"
          ? (selectedHour % 12) + 12
          : selectedHour % 12;

      return createDateInTimeZone(
        {
          year: dateParts.year,
          month: dateParts.month - 1,
          day: dateParts.day,
          hour,
          minute: selectedMinute,
          second: showSeconds ? selectedSecond : 0,
          millisecond: 0,
        },
        timezone,
      );
    },
    [is24Hour, selectedAmPm, selectedHour, selectedMinute, selectedSecond, showSeconds, timezone],
  );

  const buildDateTimeWithValues = useCallback(
    (
      date: Date,
      nextHour: number,
      nextMinute: number,
      nextSecond: number,
      nextAmPm: "AM" | "PM",
    ) => {
      const dateParts = getDateTimeParts(date, timezone);
      const hour = is24Hour
        ? nextHour
        : nextAmPm === "PM"
          ? (nextHour % 12) + 12
          : nextHour % 12;

      return createDateInTimeZone(
        {
          year: dateParts.year,
          month: dateParts.month - 1,
          day: dateParts.day,
          hour,
          minute: nextMinute,
          second: showSeconds ? nextSecond : 0,
          millisecond: 0,
        },
        timezone,
      );
    },
    [is24Hour, showSeconds, timezone],
  );

  const handleDayPress = useCallback(
    (day: CalendarDay) => {
      if (day.isDisabled) {
        return;
      }

      if (mode === "multi") {
        setSelectedMultiDates((currentDates) => {
          const exists = currentDates.some(
            (item) => item.getTime() === day.date.getTime(),
          );

          if (exists) {
            const nextDates = currentDates.filter(
              (item) => item.getTime() !== day.date.getTime(),
            );

            onChangeImmediate?.(nextDates);
            return nextDates;
          }

          if (maxMultiSelect && currentDates.length >= maxMultiSelect) {
            onMaxReached?.();
            return currentDates;
          }

          const nextDates = [...currentDates, day.date].sort(
            (left, right) => left.getTime() - right.getTime(),
          );

          onChangeImmediate?.(nextDates);
          return nextDates;
        });
        return;
      }

      if (mode === "range") {
        setSelectedRange((currentRange) => {
          if (!currentRange.start || (currentRange.start && currentRange.end)) {
            const nextRange = { start: day.date, end: null };
            onChangeImmediate?.(nextRange);
            return nextRange;
          }

          if (
            getDayStamp(day.date, timezone) <
            getDayStamp(currentRange.start, timezone)
          ) {
            const nextRange = { start: day.date, end: currentRange.start };
            onChangeImmediate?.(nextRange);
            return nextRange;
          }

          const nextRange = { start: currentRange.start, end: day.date };
          onChangeImmediate?.(nextRange);
          return nextRange;
        });
        return;
      }

      const nextDate = buildNextDateTime(day.date);
      setSelectedDate(nextDate);
      onChangeImmediate?.(nextDate);
    },
    [
      buildNextDateTime,
      maxMultiSelect,
      mode,
      onChangeImmediate,
      onMaxReached,
      timezone,
    ],
  );

  const handleDateChange = useCallback(
    (date: Date) => {
      if (mode === "range") {
        return;
      }

      if (mode === "month") {
        const dateParts = getDateParts(date, timezone);
        setSelectedMonthValue({
          year: dateParts.year,
          month: dateParts.month,
        });
        setViewDate(date);
        onChangeImmediate?.({ year: dateParts.year, month: dateParts.month });
        return;
      }

      const nextDate = buildNextDateTime(date);
      setSelectedDate(nextDate);
      setViewDate(nextDate);
      onChangeImmediate?.(nextDate);
    },
    [buildNextDateTime, mode, onChangeImmediate, timezone],
  );

  const getDraftValue = useCallback((): PickerValue => {
    if (mode === "multi") {
      return selectedMultiDates;
    }

    if (mode === "month") {
      return selectedMonthValue;
    }

    if (mode === "year") {
      return clampYearToBounds(selectedYearValue, minDate, maxDate);
    }

    if (mode === "range") {
      return selectedRange;
    }

    if (selectedDate === null && mode === "date") {
      return null;
    }

    const baseDate = selectedDate ?? new Date(viewDate);
    return buildNextDateTime(baseDate);
  }, [
    buildNextDateTime,
    mode,
    selectedDate,
    selectedMonthValue,
    selectedMultiDates,
    selectedRange,
    selectedYearValue,
    minDate,
    maxDate,
    viewDate,
  ]);

  const setHour = useCallback(
    (hour: number) => {
      const nextHour = is24Hour ? hour : toInternalHour(hour, selectedAmPm);
      setSelectedHour(() => {
        if (is24Hour) {
          return hour;
        }

        return toInternalHour(hour, selectedAmPm);
      });

      if ((mode === "time" || mode === "datetime") && onChangeImmediate) {
        const baseDate = selectedDate ?? new Date(viewDate);
        const preview = buildDateTimeWithValues(
          baseDate,
          nextHour,
          selectedMinute,
          selectedSecond,
          selectedAmPm,
        );
        onChangeImmediate(preview);
      }
    },
    [
      buildDateTimeWithValues,
      is24Hour,
      mode,
      onChangeImmediate,
      selectedAmPm,
      selectedDate,
      selectedMinute,
      selectedSecond,
      viewDate,
    ],
  );

  const setMinute = useCallback((minute: number) => {
    setSelectedMinute(minute);

    if ((mode === "time" || mode === "datetime") && onChangeImmediate) {
      const baseDate = selectedDate ?? new Date(viewDate);
      const preview = buildDateTimeWithValues(
        baseDate,
        selectedHour,
        minute,
        selectedSecond,
        selectedAmPm,
      );
      onChangeImmediate(preview);
    }
  }, [
    buildDateTimeWithValues,
    mode,
    onChangeImmediate,
    selectedAmPm,
    selectedDate,
    selectedHour,
    selectedSecond,
    viewDate,
  ]);

  const setSecond = useCallback((second: number) => {
    setSelectedSecond(second);

    if ((mode === "time" || mode === "datetime") && onChangeImmediate) {
      const baseDate = selectedDate ?? new Date(viewDate);
      const preview = buildDateTimeWithValues(
        baseDate,
        selectedHour,
        selectedMinute,
        second,
        selectedAmPm,
      );
      onChangeImmediate(preview);
    }
  }, [
    buildDateTimeWithValues,
    mode,
    onChangeImmediate,
    selectedAmPm,
    selectedDate,
    selectedHour,
    selectedMinute,
    viewDate,
  ]);

  const setAmPm = useCallback((value: "AM" | "PM") => {
    setSelectedAmPm(value);

    if ((mode === "time" || mode === "datetime") && onChangeImmediate) {
      const baseDate = selectedDate ?? new Date(viewDate);
      const preview = buildDateTimeWithValues(
        baseDate,
        selectedHour,
        selectedMinute,
        selectedSecond,
        value,
      );
      onChangeImmediate(preview);
    }
  }, [
    buildDateTimeWithValues,
    mode,
    onChangeImmediate,
    selectedDate,
    selectedHour,
    selectedMinute,
    selectedSecond,
    viewDate,
  ]);

  const handleConfirm = useCallback(() => {
    const nextValue = getDraftValue();

    if (mode === "range" || mode === "multi" || mode === "month" || mode === "year") {
      onChange(nextValue);
      return;
    }

    setSelectedDate(nextValue as DateValue);
    onChange(nextValue);
  }, [getDraftValue, mode, onChange]);

  const handleClear = useCallback(() => {
    if (mode === "range") {
      const clearedRange = { start: null, end: null };
      setSelectedRange(clearedRange);
      onChange(clearedRange);
      return;
    }

    if (mode === "multi") {
      setSelectedMultiDates([]);
      onChange([]);
      return;
    }

    if (mode === "month") {
      const nextViewDateParts = getDateParts(viewDate, timezone);
      setSelectedMonthValue({
        year: nextViewDateParts.year,
        month: nextViewDateParts.month,
      });
      onChange(null);
      return;
    }

    if (mode === "year") {
      setSelectedYearValue(
        clampYearToBounds(getDateParts(viewDate, timezone).year, minDate, maxDate),
      );
      onChange(null);
      return;
    }

    setSelectedDate(null);
    onChange(null);
  }, [maxDate, minDate, mode, onChange, timezone, viewDate]);

  return {
    viewYear: getDateParts(viewDate, timezone).year,
    viewMonth: getDateParts(viewDate, timezone).month,
    goToPrevMonth,
    goToNextMonth,
    goToYear,
    calendarGrid,
    selectedDate,
    selectedRange,
    selectedMultiDates,
    selectedMonthValue,
    selectedYearValue,
    handleDayPress,
    handleDateChange,
    selectedHour: is24Hour ? selectedHour : toDisplayHour(selectedHour),
    selectedMinute,
    selectedSecond,
    selectedAmPm,
    setHour,
    setMinute,
    setSecond,
    setAmPm,
    setSelectedMonthValue,
    setSelectedYearValue,
    showSeconds,
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
  };
}
