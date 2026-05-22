import React from "react";
import { View, StyleSheet } from "react-native";

import { CalendarDay } from "../types";
import { CalendarGrid } from "./CalendarGrid";
import { MonthHeader } from "./MonthHeader";
import { WeekdayRow } from "./WeekdayRow";

interface CalendarSectionProps {
  locale: string;
  timeZone?: string;
  firstDayOfWeek: 0 | 1;
  accentColor: string;
  reducedMotion?: boolean;
  highlightToday?: boolean;
  showWeekNumbers?: boolean;
  year: number;
  month: number;
  grid: CalendarDay[][];
  monthKey: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onOpenYearPicker: () => void;
  onDayPress: (day: CalendarDay) => void;
  onEscape?: () => void;
}

export function CalendarSection({
  locale,
  timeZone,
  firstDayOfWeek,
  accentColor,
  reducedMotion = false,
  highlightToday = true,
  showWeekNumbers = false,
  year,
  month,
  grid,
  monthKey,
  onPrevMonth,
  onNextMonth,
  onOpenYearPicker,
  onDayPress,
  onEscape,
}: CalendarSectionProps) {
  return (
    <>
      <MonthHeader
        locale={locale}
        month={month}
        onNext={onNextMonth}
        onOpenYearPicker={onOpenYearPicker}
        onPrev={onPrevMonth}
        reducedMotion={reducedMotion}
        timeZone={timeZone}
        year={year}
      />
      <WeekdayRow
        firstDayOfWeek={firstDayOfWeek}
        locale={locale}
        showWeekNumbers={showWeekNumbers}
        timeZone={timeZone}
      />
      <View style={styles.calendarShell}>
        <CalendarGrid
          accentColor={accentColor}
          grid={grid}
          highlightToday={highlightToday}
          locale={locale}
          monthKey={monthKey}
          onDayPress={onDayPress}
          onNextMonth={onNextMonth}
          onPrevMonth={onPrevMonth}
          reducedMotion={reducedMotion}
          onEscape={onEscape}
          showWeekNumbers={showWeekNumbers}
          timeZone={timeZone}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  calendarShell: {
    position: "relative",
  },
});
