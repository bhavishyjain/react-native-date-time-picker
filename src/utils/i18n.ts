export function resolveLocale(locale?: string): string {
  return locale || Intl.DateTimeFormat().resolvedOptions().locale || 'en-US';
}

export function formatMonthYear(date: Date, locale: string, timeZone?: string): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    month: 'long',
    year: 'numeric',
  }).format(date);
}
