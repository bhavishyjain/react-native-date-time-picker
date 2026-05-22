# Changelog

All notable changes to this project will be documented in this file.
This project follows [Semantic Versioning](https://semver.org/).

## [0.1.0] — 2026-05-20 · Initial Release

### Added

**Picker modes**
- `date` — single calendar or wheel date picker
- `time` — scroll-wheel or analog-clock time picker
- `datetime` — combined date + time in one picker
- `range` — start / end date range with visual highlight
- `multi` — multi-date selection with optional cap (`maxMultiSelect`)
- `month` — month-year only picker
- `year` — year-only scroll picker

**Date UI**
- Calendar grid with month navigation, year jump, and animated transitions
- Wheel date picker (month / day / year scroll wheels)
- `firstDayOfWeek` — Sunday or Monday start
- `highlightToday` — ring on today's date cell
- `showWeekNumbers` — ISO week number gutter column
- `minDate` / `maxDate` — boundary constraints with disabled cell rendering
- `disabledDates` — specific dates, date ranges, or a custom `(date) => boolean` predicate
- `markedDates` — dot and/or label decorators on specific calendar cells

**Time UI**
- Scroll-wheel time picker with snap physics (Reanimated)
- Analog clock picker with gesture drag and tap support
- 24-hour and 12-hour (AM/PM) modes
- `showSeconds` — optional seconds wheel / clock hand
- `minuteInterval` — step sizes 1 / 5 / 10 / 15 / 30
- `minTime` / `maxTime` — boundary constraints with disabled item rendering

**Theming**
- `accentColor` — single colour that cascades to all selected states
- `darkMode` — explicit dark / light override (defaults to system preference)
- `customTheme` — fine-grained palette token overrides

**Modal / display**
- `inline` — embed directly in layout or open as a bottom / center / top modal sheet
- `modalPosition` — top / center / bottom sheet anchor
- `placeholder` — built-in trigger button with internal visibility management
- `visible` — external modal visibility for when you supply your own open/close logic
- `confirmLabel` / `clearLabel` — localise or brand the footer button text
- `disabled` — dims and blocks all interaction

**Locale & timezone**
- `locale` — any BCP-47 language tag; affects month names, weekday labels, and number formatting
- `timezone` — any IANA identifier for timezone-aware calendar and time calculations

**TypeScript**
- Full type definitions for all props, values, and utility functions
- Dual ESM + CJS build output
- `babel.config.cjs` shim for Expo / Metro compatibility
