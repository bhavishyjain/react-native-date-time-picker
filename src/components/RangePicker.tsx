import React, { useContext } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { DateRange } from '../types';
import { ThemeContext } from '../utils/constants';
import { formatDate } from '../utils/date';

interface RangePickerProps {
  locale: string;
  range: DateRange;
  timeZone?: string;
}

export function RangePicker({ locale, range, timeZone }: RangePickerProps) {
  const theme = useContext(ThemeContext);

  const label = range.start && range.end
    ? `${formatDate(range.start, locale, 'date', timeZone)} → ${formatDate(range.end, locale, 'date', timeZone)}`
    : range.start
      ? `${formatDate(range.start, locale, 'date', timeZone)} →`
      : 'Select a start and end date';

  return (
    <View style={[styles.container, { borderColor: theme.border, backgroundColor: theme.surface }]}>
      <Text style={[styles.text, { color: theme.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
});
