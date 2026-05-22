import type { TextStyle } from "react-native";

export type DateValue = Date | null;

export type DateRange = {
  start: DateValue;
  end: DateValue;
};

export type MonthValue = {
  year: number;
  month: number;
};

export type DisabledDateRange = {
  from: Date;
  to: Date;
};

export type MarkedDate = {
  date: Date;
  dot?: string;
  label?: string;
};

export type PickerMode = 'date' | 'time' | 'datetime' | 'range' | 'multi' | 'month' | 'year';

export type PickerModalPosition = 'top' | 'center' | 'bottom';

export type DatePickerVariant = 'calendar' | 'wheel';

export type TimePickerVariant = 'wheel' | 'clock';

export type PickerValue =
  | DateValue
  | DateRange
  | Date[]
  | MonthValue
  | number
  | null;

export interface DateTimePickerProps {
  mode: PickerMode;
  value?: PickerValue;
  onChange: (value: PickerValue) => void;
  onChangeImmediate?: (value: PickerValue) => void;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[] | DisabledDateRange[] | ((date: Date) => boolean);
  markedDates?: MarkedDate[];
  locale?: string;
  timezone?: string;
  customTheme?: Partial<import('./utils/constants').PickerThemeValues>;
  accentColor?: string;
  darkMode?: boolean;
  firstDayOfWeek?: 0 | 1;
  is24Hour?: boolean;
  minuteInterval?: 1 | 5 | 10 | 15 | 30;
  showSeconds?: boolean;
  minTime?: string;
  maxTime?: string;
  datePickerVariant?: DatePickerVariant;
  timePickerVariant?: TimePickerVariant;
  inline?: boolean;
  visible?: boolean;
  placeholder?: string;
  placeholderStyle?: TextStyle;
  onOpen?: () => void;
  onDismiss?: () => void;
  modalPosition?: PickerModalPosition;
  onClose?: () => void;
  onMonthChange?: (year: number, month: number) => void;
  onRangeIncomplete?: () => void;
  onMaxReached?: () => void;
  maxMultiSelect?: number;
  highlightToday?: boolean;
  showWeekNumbers?: boolean;
  confirmLabel?: string;
  clearLabel?: string;
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isInRange: boolean;
  marker?: MarkedDate | null;
}

export interface TimeWheelItem {
  value: number;
  label: string;
}
