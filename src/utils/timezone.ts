const WEEKDAY_INDEX_BY_LABEL: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

type ZonedDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number;
};

const zonedDateTimeFormatterCache = new Map<string, Intl.DateTimeFormat>();
const weekdayFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getZonedDateTimeFormatter(timeZone: string) {
  const cacheKey = `datetime:${timeZone}`;
  const existing = zonedDateTimeFormatterCache.get(cacheKey);

  if (existing) {
    return existing;
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
  });
  zonedDateTimeFormatterCache.set(cacheKey, formatter);
  return formatter;
}

function getWeekdayFormatter(timeZone: string) {
  const cacheKey = `weekday:${timeZone}`;
  const existing = weekdayFormatterCache.get(cacheKey);

  if (existing) {
    return existing;
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
  });
  weekdayFormatterCache.set(cacheKey, formatter);
  return formatter;
}

function getLocalWeekday(date: Date) {
  return date.getDay();
}

function getZonedWeekday(date: Date, timeZone: string) {
  const label = getWeekdayFormatter(timeZone).format(date);
  return WEEKDAY_INDEX_BY_LABEL[label] ?? 0;
}

export function getDateTimeParts(
  date: Date,
  timeZone?: string,
): ZonedDateTimeParts {
  if (!timeZone) {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
      second: date.getSeconds(),
      weekday: getLocalWeekday(date),
    };
  }

  const parts = getZonedDateTimeFormatter(timeZone).formatToParts(date);
  const year = Number(parts.find((part) => part.type === 'year')?.value ?? '0');
  const month = Number(parts.find((part) => part.type === 'month')?.value ?? '1');
  const day = Number(parts.find((part) => part.type === 'day')?.value ?? '1');
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0');
  const second = Number(parts.find((part) => part.type === 'second')?.value ?? '0');
  const weekdayLabel = parts.find((part) => part.type === 'weekday')?.value ?? 'Sun';

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    weekday: WEEKDAY_INDEX_BY_LABEL[weekdayLabel] ?? 0,
  };
}

export function getDateParts(
  date: Date,
  timeZone?: string,
) {
  const parts = getDateTimeParts(date, timeZone);

  return {
    year: parts.year,
    month: parts.month - 1,
    day: parts.day,
    weekday: parts.weekday,
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = getDateTimeParts(date, timeZone);
  const zonedAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  const actualUtc = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
  );

  return zonedAsUtc - actualUtc;
}

export function createDateInTimeZone(
  parts: {
    year: number;
    month: number;
    day: number;
    hour?: number;
    minute?: number;
    second?: number;
    millisecond?: number;
  },
  timeZone?: string,
): Date {
  const {
    year,
    month,
    day,
    hour = 0,
    minute = 0,
    second = 0,
    millisecond = 0,
  } = parts;

  if (!timeZone) {
    return new Date(year, month, day, hour, minute, second, millisecond);
  }

  const utcGuess = Date.UTC(year, month, day, hour, minute, second, millisecond);
  let result = new Date(utcGuess - getTimeZoneOffsetMs(new Date(utcGuess), timeZone));
  const refinedOffset = getTimeZoneOffsetMs(result, timeZone);
  result = new Date(utcGuess - refinedOffset);

  return result;
}

export function addDaysInTimeZone(
  date: Date,
  delta: number,
  timeZone?: string,
): Date {
  const parts = getDateTimeParts(date, timeZone);

  return createDateInTimeZone({
    year: parts.year,
    month: parts.month - 1,
    day: parts.day + delta,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
    millisecond: date.getMilliseconds(),
  }, timeZone);
}
