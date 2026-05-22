<a name="top"></a>

<div align="center">

<br />

# react-native-date-time-picker

### A smooth, fully-animated date & time picker for React Native — zero native modules, zero date libraries.

<br />

[![npm](https://img.shields.io/npm/v/%40bhavishyjain/react-native-date-time-picker?style=flat-square&color=6366f1&labelColor=1a1b26)](https://www.npmjs.com/package/@bhavishyjain/react-native-date-time-picker)
[![MIT License](https://img.shields.io/badge/license-MIT-6366f1?style=flat-square&labelColor=1a1b26)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-6366f1?style=flat-square&labelColor=1a1b26)](https://www.typescriptlang.org/)
[![Expo Compatible](https://img.shields.io/badge/Expo-compatible-6366f1?style=flat-square&labelColor=1a1b26)](https://expo.dev)
[![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-6366f1?style=flat-square&labelColor=1a1b26)](https://reactnative.dev)

</div>

---

## Demo

A minimal demo page can be found in the `example` directory.

🌐 Live demo is also available:  
👉 https://react-native-date-time-picker.vercel.app/

---

## Features

- **7 picker modes** — `date`, `time`, `datetime`, `range`, `multi`, `month`, `year`
- **2 date UI variants** — interactive calendar or scroll wheel
- **2 time UI variants** — scroll wheel or analog clock (with 24h support)
- **Inline or modal** — embed directly, or open as a bottom / center / top sheet
- **Full timezone support** via IANA identifiers
- **Internationalization** — any BCP-47 locale, RTL-aware formatting
- **Accessibility** — ARIA roles, keyboard navigation, reduced-motion support
- **Fully typed** — complete TypeScript definitions exported
- **No native linking** — pure JS + Reanimated + Gesture Handler
- **Cross-platform** — iOS, Android, and Web (React Native Web / Expo Web)

---

## Platform Support

| Platform              | Supported |
| --------------------- | --------- |
| iOS                   | ✅        |
| Android               | ✅        |
| Expo (managed & bare) | ✅        |
| React Native Web      | ✅        |
| Expo Web              | ✅        |

> **No Expo dependency required.** The library only depends on `react-native`, `react-native-reanimated`, `react-native-gesture-handler`, and `react-native-safe-area-context` — all of which work in bare React Native, Expo managed workflow, and on the web.

---

## Installation

```bash
npm install @bhavishyjain/react-native-date-time-picker\
            react-native-reanimated \
            react-native-gesture-handler \
            react-native-safe-area-context
```

### Babel plugin (Expo / Metro)

Add the Reanimated plugin to your `babel.config.js`:

```js
module.exports = {
  presets: ["babel-preset-expo"],
  plugins: ["react-native-reanimated/plugin"],
};
```

### Entry-point import

Add this to the **very top** of your app entry file (before any other imports):

```ts
import "react-native-gesture-handler";
```

### Wrap your app

```tsx
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>{/* your app */}</SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

---

## Quick Start

```tsx
import React, { useState } from "react";
import { DateTimePicker } from "react-native-date-time-picker";

export function BasicExample() {
  const [date, setDate] = useState<Date | null>(new Date());

  return <DateTimePicker inline mode="date" value={date} onChange={setDate} />;
}
```

---

## Usage Examples

### Date picker

```tsx
<DateTimePicker inline mode="date" value={date} onChange={setDate} />
```

### Time picker (12-hour, 5-minute steps)

```tsx
<DateTimePicker
  inline
  mode="time"
  is24Hour={false}
  minuteInterval={5}
  value={date}
  onChange={setDate}
/>
```

### Date + Time (combined)

```tsx
<DateTimePicker
  inline
  mode="datetime"
  datePickerVariant="calendar"
  timePickerVariant="wheel"
  value={date}
  onChange={setDate}
/>
```

### Date range

```tsx
import { DateRange } from "react-native-date-time-picker";

const [range, setRange] = useState<DateRange>({ start: null, end: null });

<DateTimePicker
  inline
  mode="range"
  value={range}
  onChange={(v) => setRange(v as DateRange)}
  onRangeIncomplete={() => Alert.alert("Please select an end date")}
/>;
```

### Multi-date selection

```tsx
<DateTimePicker
  inline
  mode="multi"
  maxMultiSelect={5}
  value={dates}
  onChange={(v) => setDates(v as Date[])}
  onMaxReached={() => Alert.alert("Maximum 5 dates")}
/>
```

### Month picker

```tsx
import { MonthValue } from "react-native-date-time-picker";

const [month, setMonth] = useState<MonthValue>({
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
});

<DateTimePicker
  inline
  mode="month"
  value={month}
  onChange={(v) => setMonth(v as MonthValue)}
/>;
```

### Year picker

```tsx
<DateTimePicker
  inline
  mode="year"
  value={new Date().getFullYear()}
  onChange={(v) => setYear(v as number)}
/>
```

### Modal with placeholder trigger

```tsx
<DateTimePicker
  mode="datetime"
  inline={false}
  placeholder="Select a date & time"
  value={date ?? undefined}
  onChange={setDate}
  modalPosition="bottom"
  onOpen={() => console.log("opened")}
  onClose={() => console.log("closed")}
/>
```

### Live preview (onChangeImmediate)

```tsx
const [committed, setCommitted] = useState<Date | null>(null);
const [preview, setPreview] = useState<Date | null>(null);

<DateTimePicker
  inline
  mode="datetime"
  value={committed}
  onChange={setCommitted}
  onChangeImmediate={(v) => setPreview(v as Date)}
/>;
```

### Disabled dates

```tsx
// Array of specific dates
<DateTimePicker
  inline
  mode="date"
  disabledDates={[new Date('2025-12-25'), new Date('2025-12-26')]}
  value={date}
  onChange={setDate}
/>

// Date range
<DateTimePicker
  inline
  mode="date"
  disabledDates={[{ from: new Date('2025-06-01'), to: new Date('2025-06-15') }]}
  value={date}
  onChange={setDate}
/>

// Custom function
<DateTimePicker
  inline
  mode="date"
  disabledDates={(d) => d.getDay() === 0 || d.getDay() === 6} // disable weekends
  value={date}
  onChange={setDate}
/>
```

### Marked dates

```tsx
import { MarkedDate } from "react-native-date-time-picker";

const marked: MarkedDate[] = [
  { date: new Date(), dot: "#f43f5e" },
  { date: new Date("2025-12-25"), label: "🎄" },
];

<DateTimePicker
  inline
  mode="date"
  markedDates={marked}
  value={date}
  onChange={setDate}
/>;
```

### Custom theme

```tsx
<DateTimePicker
  inline
  mode="date"
  accentColor="#f97316"
  darkMode={false}
  customTheme={{
    background: "#FFF8F0",
    surface: "#FEF3E2",
    accent: "#F97316",
    text: "#1C0A00",
    border: "#FDE8C8",
    rangeBackground: "#FDBA7420",
    radius: 20,
  }}
  value={date}
  onChange={setDate}
/>
```

### Min / Max time

```tsx
<DateTimePicker
  inline
  mode="time"
  minTime="09:00"
  maxTime="18:00"
  value={date}
  onChange={setDate}
/>
```

### Timezone & locale

```tsx
<DateTimePicker
  inline
  mode="datetime"
  locale="ja-JP"
  timezone="Asia/Tokyo"
  value={date}
  onChange={setDate}
/>
```

---

## Modes

| Mode       | `value` type                             | Description                            |
| ---------- | ---------------------------------------- | -------------------------------------- |
| `date`     | `Date \| null`                           | Single date picker                     |
| `time`     | `Date \| null`                           | Time-only picker                       |
| `datetime` | `Date \| null`                           | Combined date + time                   |
| `range`    | `{ start: Date\|null; end: Date\|null }` | Start / end date range                 |
| `multi`    | `Date[]`                                 | Multiple date selection                |
| `month`    | `{ year: number; month: number }`        | Month-only picker (month is 0-indexed) |
| `year`     | `number`                                 | Year-only picker                       |

---

## Props

### Core

| Prop                | Type                                                                        | Default      | Description                                                  |
| ------------------- | --------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------ |
| `mode`              | `'date' \| 'time' \| 'datetime' \| 'range' \| 'multi' \| 'month' \| 'year'` | **required** | Picker presentation mode                                     |
| `value`             | `Date \| DateRange \| Date[] \| MonthValue \| number \| null`               | `undefined`  | Controlled selected value                                    |
| `onChange`          | `(value: PickerValue) => void`                                              | **required** | Called when the value is **committed** (Confirm pressed)     |
| `onChangeImmediate` | `(value: PickerValue) => void`                                              | `undefined`  | Called on every intermediate selection change (live preview) |

### Date options

| Prop                | Type                                                         | Default      | Description                                             |
| ------------------- | ------------------------------------------------------------ | ------------ | ------------------------------------------------------- |
| `datePickerVariant` | `'calendar' \| 'wheel'`                                      | `'calendar'` | Date UI for `date`, `datetime`, and `month` modes       |
| `firstDayOfWeek`    | `0 \| 1`                                                     | `0`          | `0` = Sunday, `1` = Monday                              |
| `highlightToday`    | `boolean`                                                    | `true`       | Show a border ring on today's date                      |
| `showWeekNumbers`   | `boolean`                                                    | `false`      | Show ISO week number column                             |
| `minDate`           | `Date`                                                       | `undefined`  | Disable dates before this date                          |
| `maxDate`           | `Date`                                                       | `undefined`  | Disable dates after this date                           |
| `disabledDates`     | `Date[] \| DisabledDateRange[] \| ((date: Date) => boolean)` | `undefined`  | Disable specific dates, ranges, or via custom predicate |
| `markedDates`       | `MarkedDate[]`                                               | `undefined`  | Add dot or label markers to specific calendar dates     |

### Time options

| Prop                | Type                       | Default     | Description                                     |
| ------------------- | -------------------------- | ----------- | ----------------------------------------------- |
| `timePickerVariant` | `'wheel' \| 'clock'`       | `'wheel'`   | Time UI for `time` and `datetime` modes         |
| `is24Hour`          | `boolean`                  | `false`     | 24-hour vs 12-hour (AM/PM) display              |
| `showSeconds`       | `boolean`                  | `false`     | Enable second selection                         |
| `minuteInterval`    | `1 \| 5 \| 10 \| 15 \| 30` | `1`         | Minute scroll step                              |
| `minTime`           | `string`                   | `undefined` | Minimum selectable time (`HH:mm` or `HH:mm:ss`) |
| `maxTime`           | `string`                   | `undefined` | Maximum selectable time (`HH:mm` or `HH:mm:ss`) |

### Multi-select options

| Prop             | Type         | Default     | Description                               |
| ---------------- | ------------ | ----------- | ----------------------------------------- |
| `maxMultiSelect` | `number`     | `undefined` | Maximum dates selectable in `multi` mode  |
| `onMaxReached`   | `() => void` | `undefined` | Called when user exceeds `maxMultiSelect` |

### Range options

| Prop                | Type         | Default     | Description                                                   |
| ------------------- | ------------ | ----------- | ------------------------------------------------------------- |
| `onRangeIncomplete` | `() => void` | `undefined` | Called on Confirm when range has a start date but no end date |

### Theming

| Prop          | Type                         | Default        | Description                          |
| ------------- | ---------------------------- | -------------- | ------------------------------------ |
| `accentColor` | `string`                     | `'#3B82F6'`    | Primary selection / highlight colour |
| `darkMode`    | `boolean`                    | follows system | Force dark or light palette          |
| `customTheme` | `Partial<PickerThemeValues>` | `undefined`    | Override individual palette tokens   |

`customTheme` keys: `accent`, `background`, `surface`, `text`, `textMuted`, `border`, `rangeBackground`, `selectedText`, `todayBorder`, `radius`, `wheelHighlight`

### Modal / Display

| Prop               | Type                            | Default     | Description                                                 |
| ------------------ | ------------------------------- | ----------- | ----------------------------------------------------------- |
| `inline`           | `boolean`                       | `true`      | Embed inline or show as a modal sheet                       |
| `visible`          | `boolean`                       | `false`     | Controls modal visibility (ignored when `inline`)           |
| `modalPosition`    | `'top' \| 'center' \| 'bottom'` | `'center'`  | Anchor position for modal presentation                      |
| `placeholder`      | `string`                        | `undefined` | Renders a trigger button and manages modal state internally |
| `placeholderStyle` | `TextStyle`                     | `undefined` | Override trigger button text style                          |
| `confirmLabel`     | `string`                        | `'Confirm'` | Footer confirm button text                                  |
| `clearLabel`       | `string`                        | `'Clear'`   | Footer clear/reset button text                              |
| `disabled`         | `boolean`                       | `false`     | Dim and block all interaction                               |

### Callbacks

| Prop            | Type                                    | Description                                    |
| --------------- | --------------------------------------- | ---------------------------------------------- |
| `onOpen`        | `() => void`                            | Called when modal becomes visible              |
| `onClose`       | `() => void`                            | Called when backdrop tapped or modal dismissed |
| `onDismiss`     | `() => void`                            | Called after modal animation completes         |
| `onMonthChange` | `(year: number, month: number) => void` | Called when visible calendar month changes     |

### Locale

| Prop       | Type     | Default          | Description                                   |
| ---------- | -------- | ---------------- | --------------------------------------------- |
| `locale`   | `string` | system / `en-US` | BCP-47 locale for labels and formatting       |
| `timezone` | `string` | device timezone  | IANA time zone (`'UTC'`, `'Asia/Kolkata'`, …) |

---

## Peer Dependencies

| Package                          | Version   |
| -------------------------------- | --------- |
| `react`                          | `>= 17`   |
| `react-native`                   | `>= 0.71` |
| `react-native-reanimated`        | `>= 3.0`  |
| `react-native-gesture-handler`   | `>= 2.0`  |
| `react-native-safe-area-context` | `>= 4.0`  |

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Bug reports and pull requests are welcome.

---

## License

[MIT](./LICENSE) © Bhavishy Jain
