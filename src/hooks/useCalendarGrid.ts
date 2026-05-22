import { useMemo } from "react";

import {
  CalendarDay,
  DateRange,
  DateValue,
  DisabledDateRange,
  MarkedDate,
} from "../types";
import { buildCalendarGrid } from "../utils/date";

interface UseCalendarGridParams {
  year: number;
  month: number;
  selectedDate: DateValue;
  selectedDates?: Date[];
  range: DateRange;
  disabledDates?: Date[] | DisabledDateRange[] | ((date: Date) => boolean);
  markedDates?: MarkedDate[];
  disabledDatesKey?: string;
  minDate?: Date;
  maxDate?: Date;
  firstDayOfWeek?: 0 | 1;
  timeZone?: string;
}

export function useCalendarGrid({
  year,
  month,
  selectedDate,
  selectedDates,
  range,
  disabledDates,
  markedDates,
  disabledDatesKey,
  minDate,
  maxDate,
  firstDayOfWeek = 0,
  timeZone,
}: UseCalendarGridParams): CalendarDay[][] {
  return useMemo(
    () =>
      buildCalendarGrid(
        year,
        month,
        selectedDate,
        selectedDates,
        range,
        disabledDates,
        minDate,
        maxDate,
        firstDayOfWeek,
        timeZone,
        markedDates,
      ),
    [
      disabledDates,
      disabledDatesKey,
      firstDayOfWeek,
      markedDates,
      maxDate,
      minDate,
      month,
      range,
      selectedDate,
      selectedDates,
      timeZone,
      year,
    ],
  );
}
