import React, { useContext, useEffect, useMemo, useRef } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { getMaxYear, getMinYear, ThemeContext } from '../utils/constants';

interface YearPickerProps {
  visible: boolean;
  selectedYear: number;
  onSelectYear: (year: number) => void;
  onClose?: () => void;
  accentColor: string;
  minYear?: number;
  maxYear?: number;
  reducedMotion?: boolean;
  inline?: boolean;
}

const ITEM_HEIGHT = 50; // Approximated height of one row (button + margin)

export function YearPicker({
  visible,
  selectedYear,
  onSelectYear,
  onClose,
  accentColor,
  minYear,
  maxYear,
  reducedMotion = false,
  inline = false,
}: YearPickerProps) {
  const theme = useContext(ThemeContext);
  const scale = useSharedValue(visible ? 1 : 0.9);
  const opacity = useSharedValue(visible ? 1 : 0);
  const listRef = useRef<ScrollView>(null);
  const resolvedMinYear = minYear ?? getMinYear();
  const resolvedMaxYear = maxYear ?? getMaxYear();
  const lowerYear = Math.min(resolvedMinYear, resolvedMaxYear);
  const upperYear = Math.max(resolvedMinYear, resolvedMaxYear);
  const years = useMemo(
    () => Array.from({ length: upperYear - lowerYear + 1 }, (_, index) => lowerYear + index),
    [lowerYear, upperYear],
  );

  useEffect(() => {
    if (!visible) {
      return;
    }

    opacity.value = reducedMotion ? 1 : withTiming(1, { duration: 180 });
    scale.value = reducedMotion ? 1 : withSpring(1, { damping: 18, stiffness: 180 });

    const selectedIndex = years.findIndex((year) => year === selectedYear);
    if (selectedIndex >= 0) {
      const targetRow = Math.max(Math.floor(selectedIndex / 3) - 2, 0);
      setTimeout(() => {
        listRef.current?.scrollTo({
          y: targetRow * ITEM_HEIGHT,
          animated: false,
        });
      }, 0);
    }
  }, [opacity, reducedMotion, scale, selectedYear, visible, years]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!visible) {
    return null;
  }

  if (inline) {
    return (
      <View style={[styles.inlineContainer, { backgroundColor: theme.background }]}>
        <ScrollView
          ref={listRef}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          {years.map((item) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              onPress={() => onSelectYear(item)}
              style={[
                styles.yearButton,
                item === selectedYear && { backgroundColor: accentColor },
              ]}
            >
              <Text
                style={[
                  styles.yearText,
                  { color: item === selectedYear ? theme.selectedText : theme.text },
                ]}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: theme.background,
            borderColor: theme.border,
          },
          animatedStyle,
        ]}
      >
        <ScrollView
          ref={listRef}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          {years.map((item) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              onPress={() => onSelectYear(item)}
              style={[
                styles.yearButton,
                item === selectedYear && { backgroundColor: accentColor },
              ]}
            >
              <Text
                style={[
                  styles.yearText,
                  { color: item === selectedYear ? theme.selectedText : theme.text },
                ]}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    padding: 16,
    zIndex: 20,
    elevation: 20,
  },
  card: {
    maxHeight: '75%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
  },
  inlineContainer: {
    height: 240,
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  listContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingBottom: 8,
  },
  yearButton: {
    width: '31%',
    minHeight: 44,
    height: 44,
    margin: '1.16%',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
