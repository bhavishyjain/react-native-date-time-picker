import {
  CalendarDay,
  DateRange,
  DateValue,
  DisabledDateRange,
  MarkedDate,
} from "../types";
import {
  addDaysInTimeZone,
  createDateInTimeZone,
  getDateParts,
  getDateTimeParts,
} from "./timezone";

const CALENDAR_WEEKS = 6;
const DAYS_IN_WEEK = 7;

function startOfDay(date: Date, timeZone?: string): Date {
  const parts = getDateParts(date, timeZone);

  return createDateInTimeZone(
    {
      year: parts.year,
      month: parts.month,
      day: parts.day,
    },
    timeZone,
  );
}

function compareDay(a: Date, b: Date, timeZone?: string): number {
  const aParts = getDateParts(a, timeZone);
  const bParts = getDateParts(b, timeZone);

  return (
    Date.UTC(aParts.year, aParts.month, aParts.day) -
    Date.UTC(bParts.year, bParts.month, bParts.day)
  );
}

function isDisabledRange(
  entry: Date | DisabledDateRange,
): entry is DisabledDateRange {
  return "from" in entry && "to" in entry;
}

function isInDisabledRange(
  date: Date,
  range: DisabledDateRange,
  timeZone?: string,
) {
  const time = startOfDay(date, timeZone).getTime();
  const from = startOfDay(range.from, timeZone).getTime();
  const to = startOfDay(range.to, timeZone).getTime();
  const [min, max] = from <= to ? [from, to] : [to, from];

  return time >= min && time <= max;
}

function findMarkedDate(
  date: Date,
  markedDates?: MarkedDate[],
  timeZone?: string,
) {
  if (!markedDates) {
    return null;
  }

  return (
    markedDates.find((item) => isSameDay(date, item.date, timeZone)) ?? null
  );
}

export function isSameDay(a: Date, b: Date, timeZone?: string): boolean {
  const aParts = getDateParts(a, timeZone);
  const bParts = getDateParts(b, timeZone);

  return (
    aParts.year === bParts.year &&
    aParts.month === bParts.month &&
    aParts.day === bParts.day
  );
}

export function isInRange(
  date: Date,
  range: DateRange,
  timeZone?: string,
): boolean {
  if (!range.start || !range.end) {
    return false;
  }

  const time = startOfDay(date, timeZone).getTime();
  const start = startOfDay(range.start, timeZone).getTime();
  const end = startOfDay(range.end, timeZone).getTime();
  const [min, max] = start <= end ? [start, end] : [end, start];

  return time >= min && time <= max;
}

export function isDisabled(
  date: Date,
  minDate?: Date,
  maxDate?: Date,
  disabledDates?: Date[] | DisabledDateRange[] | ((d: Date) => boolean),
  timeZone?: string,
): boolean {
  const day = startOfDay(date, timeZone);

  if (minDate && compareDay(day, minDate, timeZone) < 0) {
    return true;
  }

  if (maxDate && compareDay(day, maxDate, timeZone) > 0) {
    return true;
  }

  if (typeof disabledDates === "function") {
    return disabledDates(day);
  }

  if (Array.isArray(disabledDates)) {
    return disabledDates.some((disabledDate) => {
      if (disabledDate instanceof Date) {
        return isSameDay(day, disabledDate, timeZone);
      }

      return isInDisabledRange(day, disabledDate, timeZone);
    });
  }

  return false;
}

export function addMonths(date: Date, delta: number, timeZone?: string): Date {
  const parts = getDateTimeParts(date, timeZone);
  const year = parts.year;
  const month = parts.month - 1;
  const day = parts.day;
  const targetMonth = month + delta;
  const nextMonthAnchor = new Date(Date.UTC(year, targetMonth, 1));
  const daysInTargetMonth = getDaysInMonth(
    nextMonthAnchor.getUTCFullYear(),
    nextMonthAnchor.getUTCMonth(),
  );

  return createDateInTimeZone(
    {
      year: nextMonthAnchor.getUTCFullYear(),
      month: nextMonthAnchor.getUTCMonth(),
      day: Math.min(day, daysInTargetMonth),
      hour: parts.hour,
      minute: parts.minute,
      second: parts.second,
      millisecond: date.getMilliseconds(),
    },
    timeZone,
  );
}

export function getWeekdayLabels(
  locale: string,
  firstDayOfWeek: 0 | 1,
  timeZone?: string,
): string[] {
  const formatter = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    timeZone,
  });
  const sunday = createDateInTimeZone(
    { year: 2021, month: 7, day: 1, hour: 12 },
    timeZone,
  );

  return Array.from({ length: DAYS_IN_WEEK }, (_, index) => {
    const shiftedIndex = (index + firstDayOfWeek) % DAYS_IN_WEEK;
    const date = addDaysInTimeZone(sunday, shiftedIndex, timeZone);
    const label = formatter.format(date);

    return label.slice(0, 2);
  });
}

export function getISOWeekNumber(date: Date, timeZone?: string): number {
  const parts = getDateParts(date, timeZone);
  const target = createDateInTimeZone(
    { year: parts.year, month: parts.month, day: parts.day, hour: 12 },
    timeZone,
  );
  const weekday = getDateParts(target, timeZone).weekday;
  const isoWeekday = weekday === 0 ? 7 : weekday;
  const thursday = addDaysInTimeZone(target, 4 - isoWeekday, timeZone);
  const thursdayParts = getDateParts(thursday, timeZone);
  const yearStart = createDateInTimeZone(
    { year: thursdayParts.year, month: 0, day: 1, hour: 12 },
    timeZone,
  );
  const diffDays = Math.floor(
    (thursday.getTime() - yearStart.getTime()) / (24 * 60 * 60 * 1000),
  );

  return Math.floor(diffDays / 7) + 1;
}

export function formatDate(
  date: Date,
  locale: string,
  format: "date" | "time" | "datetime",
  timeZone?: string,
): string {
  if (format === "date") {
    return new Intl.DateTimeFormat(locale, {
      timeZone,
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }

  if (format === "time") {
    return new Intl.DateTimeFormat(locale, {
      timeZone,
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat(locale, {
    timeZone,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function isToday(date: Date, timeZone?: string): boolean {
  return isSameDay(date, new Date(), timeZone);
}

export function buildCalendarGrid(
  year: number,
  month: number,
  selectedDate: DateValue,
  selectedDates: Date[] | undefined,
  range: DateRange,
  disabledDates:
    | Date[]
    | DisabledDateRange[]
    | ((d: Date) => boolean)
    | undefined,
  minDate: Date | undefined,
  maxDate: Date | undefined,
  firstDayOfWeek: 0 | 1 = 0,
  timeZone?: string,
  markedDates?: MarkedDate[],
): CalendarDay[][] {
  const firstOfMonth = createDateInTimeZone(
    { year, month, day: 1, hour: 12 },
    timeZone,
  );
  const dayOfWeek = getDateParts(firstOfMonth, timeZone).weekday;
  const monthStartOffset =
    (dayOfWeek - firstDayOfWeek + DAYS_IN_WEEK) % DAYS_IN_WEEK;
  const gridStart = createDateInTimeZone(
    { year, month, day: 1 - monthStartOffset, hour: 12 },
    timeZone,
  );
  const totalDays = CALENDAR_WEEKS * DAYS_IN_WEEK;
  const days: CalendarDay[] = Array.from({ length: totalDays }, (_, index) => {
    const date = addDaysInTimeZone(gridStart, index, timeZone);
    const dateParts = getDateParts(date, timeZone);

    const rangeStart = range.start
      ? isSameDay(date, range.start, timeZone)
      : false;
    const rangeEnd = range.end ? isSameDay(date, range.end, timeZone) : false;

    return {
      date,
      isCurrentMonth: dateParts.month === month,
      isToday: isToday(date, timeZone),
      isSelected: selectedDate
        ? isSameDay(date, selectedDate, timeZone)
        : selectedDates
          ? selectedDates.some((selected) => isSameDay(date, selected, timeZone))
          : false,
      isDisabled: isDisabled(date, minDate, maxDate, disabledDates, timeZone),
      isRangeStart: rangeStart,
      isRangeEnd: rangeEnd,
      isInRange: isInRange(date, range, timeZone),
      marker: findMarkedDate(date, markedDates, timeZone),
    };
  });

  return Array.from({ length: CALENDAR_WEEKS }, (_, index) =>
    days.slice(index * DAYS_IN_WEEK, (index + 1) * DAYS_IN_WEEK),
  );
}
