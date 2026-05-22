import React from "react";
import { StyleSheet, View } from "react-native";

import { CalendarDay } from "../types";
import { CalendarGrid } from "./CalendarGrid";
import { MonthHeader } from "./MonthHeader";
import { WeekdayRow } from "./WeekdayRow";

interface RangeCalendarSectionProps {
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
  nextYear: number;
  nextMonth: number;
  nextGrid: CalendarDay[][];
  nextMonthKey: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onOpenYearPicker: () => void;
  onDayPress: (day: CalendarDay) => void;
  onEscape?: () => void;
}

export function RangeCalendarSection({
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
  nextYear,
  nextMonth,
  nextGrid,
  nextMonthKey,
  onPrevMonth,
  onNextMonth,
  onOpenYearPicker,
  onDayPress,
  onEscape,
}: RangeCalendarSectionProps) {
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
      <View style={styles.twoMonthShell}>
        <View style={styles.monthColumn}>
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
        <View style={styles.monthColumn}>
          <CalendarGrid
            accentColor={accentColor}
            grid={nextGrid}
            highlightToday={highlightToday}
            locale={locale}
            monthKey={nextMonthKey}
            onDayPress={onDayPress}
            onNextMonth={onNextMonth}
            onPrevMonth={onPrevMonth}
            reducedMotion={reducedMotion}
            onEscape={onEscape}
            showWeekNumbers={showWeekNumbers}
            timeZone={timeZone}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  twoMonthShell: {
    flexDirection: "row",
    gap: 12,
  },
  monthColumn: {
    flex: 1,
    position: "relative",
  },
});
