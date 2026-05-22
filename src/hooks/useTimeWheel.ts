import { useEffect, useMemo, useState } from 'react';

import { TimeWheelItem } from '../types';

export const TIME_WHEEL_ITEM_HEIGHT = 48;
export const TIME_WHEEL_VISIBLE_ITEMS = 5;
export const TIME_WHEEL_PADDING_ITEMS = 2;

export function useTimeWheel(values: TimeWheelItem[], initialValue: number) {
  const [selectedValue, setSelectedValue] = useState(initialValue);

  useEffect(() => {
    setSelectedValue(initialValue);
  }, [initialValue]);

  const selectedValueIndex = useMemo(() => {
    return Math.max(
      values.findIndex((item) => item.value === selectedValue),
      0,
    );
  }, [selectedValue, values]);

  const selectedIndex = useMemo(
    () => selectedValueIndex + TIME_WHEEL_PADDING_ITEMS,
    [selectedValueIndex],
  );

  function getSnapOffset(offsetY: number): number {
    return Math.round(offsetY / TIME_WHEEL_ITEM_HEIGHT) * TIME_WHEEL_ITEM_HEIGHT;
  }

  function getValueFromOffset(offsetY: number): number {
    const snappedIndex = Math.round(offsetY / TIME_WHEEL_ITEM_HEIGHT);
    const valueIndex = Math.min(Math.max(snappedIndex, 0), values.length - 1);

    return values[valueIndex]?.value ?? values[0].value;
  }

  return {
    selectedIndex,
    selectedValueIndex,
    selectedValue,
    setSelectedValue,
    getSnapOffset,
    getValueFromOffset,
  };
}
