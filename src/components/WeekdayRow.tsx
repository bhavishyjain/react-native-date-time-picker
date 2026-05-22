import React, { useContext, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ThemeContext } from '../utils/constants';
import { getWeekdayLabels } from '../utils/date';

interface WeekdayRowProps {
  locale: string;
  firstDayOfWeek: 0 | 1;
  showWeekNumbers?: boolean;
  timeZone?: string;
}

export function WeekdayRow({
  locale,
  firstDayOfWeek,
  showWeekNumbers = false,
  timeZone,
}: WeekdayRowProps) {
  const theme = useContext(ThemeContext);
  const labels = useMemo(
    () => getWeekdayLabels(locale, firstDayOfWeek, timeZone),
    [firstDayOfWeek, locale, timeZone],
  );

  return (
    <View style={styles.row}>
      {showWeekNumbers && <View style={styles.weekNumberSpacer} />}
      {labels.map((label, index) => (
        <View key={`${label}-${index}`} style={styles.item}>
          <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingBottom: 6,
    paddingTop: 2,
  },
  weekNumberSpacer: {
    width: 28,
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
