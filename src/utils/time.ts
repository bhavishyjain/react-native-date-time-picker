export function roundMinute(minute: number, interval: number): number {
  return Math.round(minute / interval) * interval % 60;
}

export function toDisplayHour(hour: number): number {
  return ((hour + 11) % 12) + 1;
}

export function toInternalHour(hour: number, amPm: 'AM' | 'PM'): number {
  if (amPm === 'AM') {
    return hour % 12;
  }

  return hour % 12 + 12;
}

export function parseTimeString(time: string): number | null {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);

  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const second = Number(match[3] ?? '0');

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    Number.isNaN(second) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59 ||
    second < 0 ||
    second > 59
  ) {
    return null;
  }

  return (hour * 60 * 60) + (minute * 60) + second;
}

export function timePartsToSeconds(hour: number, minute: number, second: number) {
  return (hour * 60 * 60) + (minute * 60) + second;
}
