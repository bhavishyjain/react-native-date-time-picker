import React, { useCallback, useContext, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { ThemeContext } from '../utils/constants';
import { toInternalHour } from '../utils/time';

interface ClockTimePickerProps {
  hour: number;
  minute: number;
  second: number;
  amPm: 'AM' | 'PM';
  is24Hour: boolean;
  showSeconds?: boolean;
  minuteInterval: 1 | 5 | 10 | 15 | 30;
  accentColor: string;
  onHourChange: (value: number) => void;
  onMinuteChange: (value: number) => void;
  onSecondChange: (value: number) => void;
  onAmPmChange: (value: 'AM' | 'PM') => void;
  minTimeSeconds?: number | null;
  maxTimeSeconds?: number | null;
}

type ClockSelectionMode = 'hour' | 'minute' | 'second';

type ClockMarker = {
  value: number;
  label: string;
  angle: number;
  radius: number;
  touchSize: number;
  disabled?: boolean;
};

const CLOCK_SIZE = 260;
const OUTER_RADIUS = 98;
const INNER_RADIUS = 68;

function polarToCartesian(angle: number, radius: number) {
  const radians = angle - Math.PI / 2;

  return {
    x: Math.cos(radians) * radius,
    y: Math.sin(radians) * radius,
  };
}

function buildHourMarkers(is24Hour: boolean, outerRadius: number, innerRadius: number): ClockMarker[] {
  if (!is24Hour) {
    return Array.from({ length: 12 }, (_, index) => {
      const value = index + 1;
      return {
        value,
        label: `${value}`,
        angle: (value / 12) * Math.PI * 2,
        radius: outerRadius,
        touchSize: 42,
      };
    });
  }

  // Outer ring: hours 1-12 (clock positions 1 through 12)
  const outer = Array.from({ length: 12 }, (_, index) => {
    const value = index + 1; // 1..12
    return {
      value,
      label: `${value}`,
      angle: (value / 12) * Math.PI * 2,
      radius: outerRadius,
      touchSize: 40,
    };
  });

  // Inner ring: hours 13-23 and 0 ("00"), each occupying the same angular
  // position as the outer-ring hour that is 12 less (e.g. 13 sits where 1 is).
  const inner = Array.from({ length: 12 }, (_, index) => {
    // index 0 → 13, index 1 → 14, …, index 10 → 23, index 11 → 0
    const value = index < 11 ? index + 13 : 0;
    const clockPos = index + 1; // 1..12 – the corresponding outer-ring position
    return {
      value,
      label: value === 0 ? '00' : `${value}`,
      angle: (clockPos / 12) * Math.PI * 2,
      radius: innerRadius,
      touchSize: 34,
    };
  });

  return [...outer, ...inner];
}

function buildMinuteMarkers(interval: ClockTimePickerProps['minuteInterval'], outerRadius: number): ClockMarker[] {
  return Array.from({ length: 60 / interval }, (_, index) => {
    const value = index * interval;
    return {
      value,
      label: value % 5 === 0 ? value.toString().padStart(2, '0') : '',
      angle: (value / 60) * Math.PI * 2,
      radius: outerRadius,
      touchSize: interval === 1 ? 22 : 34,
    };
  });
}

function buildSecondMarkers(outerRadius: number): ClockMarker[] {
  return Array.from({ length: 60 }, (_, index) => ({
    value: index,
    label: index % 5 === 0 ? index.toString().padStart(2, '0') : '',
    angle: (index / 60) * Math.PI * 2,
    radius: outerRadius,
    touchSize: 22,
  }));
}

function timeToSeconds(hour: number, minute: number, second: number, amPm: 'AM' | 'PM', is24Hour: boolean) {
  const internalHour = is24Hour ? hour : toInternalHour(hour, amPm);
  return (internalHour * 60 * 60) + (minute * 60) + second;
}

function isWithinBounds(value: number, minTimeSeconds?: number | null, maxTimeSeconds?: number | null) {
  if (typeof minTimeSeconds === 'number' && value < minTimeSeconds) {
    return false;
  }

  if (typeof maxTimeSeconds === 'number' && value > maxTimeSeconds) {
    return false;
  }

  return true;
}

function getSelectedHourMeta(hour: number, is24Hour: boolean, outerRadius: number, innerRadius: number) {
  if (!is24Hour) {
    // `hour` is already an internal 24-h value (0-23) stored in state.
    const displayHour = ((hour + 11) % 12) + 1; // 0→12, 1→1, …, 23→11
    return {
      angle: (displayHour / 12) * Math.PI * 2,
      length: outerRadius,
      displayHour,
    };
  }

  // 24-hour mode
  // Outer ring: 1-12. Inner ring: 13-23 and 0.
  if (hour >= 1 && hour <= 12) {
    // Outer ring position matches the hour value directly.
    return {
      angle: (hour / 12) * Math.PI * 2,
      length: outerRadius,
      displayHour: hour,
    };
  }

  // Inner ring: hours 13-23 sit at the same angle as (hour - 12);
  // hour 0 sits at the same angle as 12 (top).
  const clockPos = hour === 0 ? 12 : hour - 12; // 13→1, …, 23→11, 0→12
  return {
    angle: (clockPos / 12) * Math.PI * 2,
    length: innerRadius,
    displayHour: hour,
  };
}

function getMarkerPosition(marker: ClockMarker, center: number) {
  const point = polarToCartesian(marker.angle, marker.radius);

  return {
    x: center + point.x,
    y: center + point.y,
  };
}

function getClosestMarkerValue(markers: ClockMarker[], x: number, y: number, center: number) {
  return markers.reduce(
    (closest, marker) => {
      const position = getMarkerPosition(marker, center);
      const distance = Math.hypot(x - position.x, y - position.y);

      if (distance < closest.distance) {
        return { value: marker.value, distance };
      }

      return closest;
    },
    { value: markers[0]?.value ?? 0, distance: Number.POSITIVE_INFINITY },
  ).value;
}

function getSelectedMinuteMeta(minute: number) {
  return {
    angle: (minute / 60) * Math.PI * 2,
    length: OUTER_RADIUS,
  };
}

function getSelectedSecondMeta(second: number) {
  return {
    angle: (second / 60) * Math.PI * 2,
    length: OUTER_RADIUS,
  };
}

export function ClockTimePicker({
  hour,
  minute,
  second,
  amPm,
  is24Hour,
  showSeconds = false,
  minuteInterval,
  accentColor,
  onHourChange,
  onMinuteChange,
  onSecondChange,
  onAmPmChange,
  minTimeSeconds,
  maxTimeSeconds,
}: ClockTimePickerProps) {
  const theme = useContext(ThemeContext);
  const [selectionMode, setSelectionMode] = useState<ClockSelectionMode>('hour');
  const [clockSize, setClockSize] = useState(CLOCK_SIZE);
  const clockCenter = clockSize / 2;
  const scale = clockSize / CLOCK_SIZE;
  const outerRadius = OUTER_RADIUS * scale;
  const innerRadius = INNER_RADIUS * scale;
  const hourMarkers = useMemo(
    () => buildHourMarkers(is24Hour, outerRadius, innerRadius).map((marker) => ({
      ...marker,
      disabled: !isWithinBounds(
        timeToSeconds(marker.value, minute, second, amPm, is24Hour),
        minTimeSeconds,
        maxTimeSeconds,
      ),
    })),
    [amPm, innerRadius, is24Hour, maxTimeSeconds, minTimeSeconds, minute, outerRadius, second],
  );
  const minuteMarkers = useMemo(
    () => buildMinuteMarkers(minuteInterval, outerRadius).map((marker) => ({
      ...marker,
      disabled: !isWithinBounds(
        timeToSeconds(hour, marker.value, second, amPm, is24Hour),
        minTimeSeconds,
        maxTimeSeconds,
      ),
    })),
    [amPm, hour, is24Hour, maxTimeSeconds, minTimeSeconds, minuteInterval, outerRadius, second],
  );
  const secondMarkers = useMemo(
    () => buildSecondMarkers(outerRadius).map((marker) => ({
      ...marker,
      disabled: !isWithinBounds(
        timeToSeconds(hour, minute, marker.value, amPm, is24Hour),
        minTimeSeconds,
        maxTimeSeconds,
      ),
    })),
    [amPm, hour, is24Hour, maxTimeSeconds, minTimeSeconds, minute, outerRadius],
  );
  const amPmMarkers = useMemo(() => {
    return [
      {
        value: 0,
        label: 'AM',
        angle: 0,
        radius: outerRadius,
        touchSize: 28,
        disabled: !Array.from({ length: 12 }, (_, index) => index + 1).some((candidate) =>
          isWithinBounds(
            timeToSeconds(candidate, minute, second, 'AM', false),
            minTimeSeconds,
            maxTimeSeconds,
          ),
        ),
      },
      {
        value: 1,
        label: 'PM',
        angle: 0,
        radius: outerRadius,
        touchSize: 28,
        disabled: !Array.from({ length: 12 }, (_, index) => index + 1).some((candidate) =>
          isWithinBounds(
            timeToSeconds(candidate, minute, second, 'PM', false),
            minTimeSeconds,
            maxTimeSeconds,
          ),
        ),
      },
    ] satisfies ClockMarker[];
  }, [maxTimeSeconds, minute, minTimeSeconds, outerRadius, second]);
  const selectedHourMeta = getSelectedHourMeta(hour, is24Hour, outerRadius, innerRadius);
  const selectedMinuteMeta = getSelectedMinuteMeta(minute);
  const selectedSecondMeta = getSelectedSecondMeta(second);
  const activeAngle = selectionMode === 'hour'
    ? selectedHourMeta.angle
    : selectionMode === 'minute'
      ? selectedMinuteMeta.angle
      : selectedSecondMeta.angle;
  const activeLength = selectionMode === 'hour'
    ? selectedHourMeta.length
    : selectionMode === 'minute'
      ? selectedMinuteMeta.length
      : selectedSecondMeta.length;
  const handDegrees = activeAngle * (180 / Math.PI) - 90;
  const displayHour = is24Hour ? selectedHourMeta.displayHour : (((hour + 11) % 12) + 1);

  const markers = selectionMode === 'hour' ? hourMarkers : selectionMode === 'minute' ? minuteMarkers : secondMarkers;
  const commitSelectionFromPoint = useCallback((x: number, y: number) => {
    const nextValue = getClosestMarkerValue(markers, x, y, clockCenter);

    const selectedMarker = markers.find((marker) => marker.value === nextValue);
    if (selectedMarker?.disabled) {
      return;
    }

    if (selectionMode === 'hour') {
      onHourChange(nextValue);
      return;
    }

    if (selectionMode === 'minute') {
      onMinuteChange(nextValue);
      return;
    }

    onSecondChange(nextValue);
  }, [clockCenter, markers, onHourChange, onMinuteChange, onSecondChange, selectionMode]);
  const handleClockLayout = useCallback((event: { nativeEvent: { layout: { width: number; height: number } } }) => {
    const { width, height } = event.nativeEvent.layout;
    setClockSize(Math.min(width, height));
  }, []);
  const dragGesture = Gesture.Pan()
    .runOnJS(true)
    .onBegin((event) => {
      commitSelectionFromPoint(event.x, event.y);
    })
    .onUpdate((event) => {
      commitSelectionFromPoint(event.x, event.y);
    })
    .onEnd(() => {
      if (selectionMode === 'hour') {
        setSelectionMode('minute');
      } else if (selectionMode === 'minute' && showSeconds) {
        setSelectionMode('second');
      }
    });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => setSelectionMode('hour')}
          style={[
            styles.timeSegment,
            selectionMode === 'hour' && {
              backgroundColor: theme.wheelHighlight,
              borderColor: accentColor,
            },
          ]}
        >
          <Text style={[styles.timeValue, { color: theme.text }]}>
            {displayHour.toString().padStart(2, '0')}
          </Text>
        </Pressable>
        <Text style={[styles.separator, { color: theme.textMuted }]}>:</Text>
        <Pressable
          onPress={() => setSelectionMode('minute')}
          style={[
            styles.timeSegment,
            selectionMode === 'minute' && {
              backgroundColor: theme.wheelHighlight,
              borderColor: accentColor,
            },
          ]}
        >
          <Text style={[styles.timeValue, { color: theme.text }]}>
            {minute.toString().padStart(2, '0')}
          </Text>
        </Pressable>

        {showSeconds && (
          <>
            <Text style={[styles.separator, { color: theme.textMuted }]}>:</Text>
            <Pressable
              onPress={() => setSelectionMode('second')}
              style={[
                styles.timeSegment,
                selectionMode === 'second' && {
                  backgroundColor: theme.wheelHighlight,
                  borderColor: accentColor,
                },
              ]}
            >
              <Text style={[styles.timeValue, { color: theme.text }]}>
                {second.toString().padStart(2, '0')}
              </Text>
            </Pressable>
          </>
        )}

        {!is24Hour && (
          <View style={styles.meridiemColumn}>
            {(['AM', 'PM'] as const).map((value) => {
              const marker = amPmMarkers.find((item) => item.label === value);
              const selected = value === amPm;
              return (
                <Pressable
                  key={value}
                  onPress={() => onAmPmChange(value)}
                  disabled={marker?.disabled}
                  style={[
                    styles.meridiemPill,
                    {
                      backgroundColor: selected ? accentColor : 'transparent',
                      opacity: marker?.disabled ? 0.35 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.meridiemPillText,
                      { color: selected ? theme.selectedText : theme.textMuted },
                    ]}
                  >
                    {value}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      <GestureDetector gesture={dragGesture}>
        <View onLayout={handleClockLayout} style={[styles.clockFace, { backgroundColor: theme.surface }]}> 
          <View
            pointerEvents="none"
            style={[
              styles.handRotor,
              {
                left: clockCenter,
                top: clockCenter,
                transform: [{ rotate: `${handDegrees}deg` }],
              },
            ]}
          >
            <View style={[styles.handLine, { width: activeLength, backgroundColor: accentColor }]} />
            <View
              style={[
                styles.handThumb,
                {
                  left: activeLength - 14,
                  backgroundColor: accentColor,
                },
              ]}
            />
          </View>

          {markers.map((marker) => {
            const point = polarToCartesian(marker.angle, marker.radius);
            const selected = selectionMode === 'hour'
              ? marker.value === hour
              : selectionMode === 'minute'
                ? marker.value === minute
                : marker.value === second;

            return (
              <Pressable
                key={`${selectionMode}-${marker.radius}-${marker.value}`}
                onPress={() => {
                  if (marker.disabled) {
                    return;
                  }

                  if (selectionMode === 'hour') {
                    onHourChange(marker.value);
                    setSelectionMode('minute');
                  } else if (selectionMode === 'minute') {
                    onMinuteChange(marker.value);
                    if (showSeconds) {
                      setSelectionMode('second');
                    }
                  } else {
                    onSecondChange(marker.value);
                  }
                }}
                style={[
                  styles.clockMarker,
                  {
                    width: marker.touchSize,
                    height: marker.touchSize,
                    borderRadius: marker.touchSize / 2,
                    left: clockCenter + point.x - marker.touchSize / 2,
                    top: clockCenter + point.y - marker.touchSize / 2,
                    backgroundColor: selected ? accentColor : 'transparent',
                    opacity: marker.disabled ? 0.3 : 1,
                  },
                ]}
              >
                {marker.label ? (
                  <Text
                    style={[
                      styles.clockLabel,
                      { color: selected ? theme.selectedText : theme.text },
                      marker.radius === innerRadius && styles.clockLabelInner,
                    ]}
                  >
                    {marker.label}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}

          <View style={[styles.clockCenter, { backgroundColor: accentColor, left: clockCenter - 6, top: clockCenter - 6 }]} />
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 18,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  timeSegment: {
    minWidth: 82,
    minHeight: 64,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  timeValue: {
    fontSize: 34,
    fontWeight: '800',
  },
  separator: {
    fontSize: 30,
    fontWeight: '700',
    marginTop: -2,
  },
  meridiemColumn: {
    marginLeft: 8,
    gap: 4,
  },
  meridiemPill: {
    minWidth: 48,
    minHeight: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  meridiemPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  clockFace: {
    width: CLOCK_SIZE,
    height: CLOCK_SIZE,
    borderRadius: CLOCK_SIZE / 2,
    position: 'relative',
  },
  handRotor: {
    position: 'absolute',
    width: 0,
    height: 0,
  },
  handLine: {
    position: 'absolute',
    left: 0,
    top: -1.5,
    height: 3,
    borderRadius: 999,
  },
  handThumb: {
    position: 'absolute',
    top: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  clockMarker: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  clockLabelInner: {
    fontSize: 12,
  },
  clockCenter: {
    position: 'absolute',
    left: (CLOCK_SIZE / 2) - 6, // approximate; overridden inline for dynamic sizes
    top: (CLOCK_SIZE / 2) - 6,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
