import React, { useContext, useEffect, useMemo, useRef } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import {
  TIME_WHEEL_ITEM_HEIGHT,
  TIME_WHEEL_VISIBLE_ITEMS,
} from "../hooks/useTimeWheel";
import { ThemeContext } from "../utils/constants";
import { toInternalHour } from "../utils/time";

type WheelItem = {
  value: number;
  label: string;
  disabled?: boolean;
};

interface TimeWheelProps {
  hour: number;
  minute: number;
  second: number;
  amPm: "AM" | "PM";
  is24Hour: boolean;
  showSeconds?: boolean;
  minuteInterval: 1 | 5 | 10 | 15 | 30;
  accentColor: string;
  onHourChange: (value: number) => void;
  onMinuteChange: (value: number) => void;
  onSecondChange: (value: number) => void;
  onAmPmChange: (value: "AM" | "PM") => void;
  minTimeSeconds?: number | null;
  maxTimeSeconds?: number | null;
}

interface WheelColumnProps {
  data: WheelItem[];
  selectedIndex: number;
  scrollY: SharedValue<number>;
  onSnap: (offsetY: number) => void;
}

const PADDING_ITEMS = Math.floor(TIME_WHEEL_VISIBLE_ITEMS / 2);

function timeToSeconds(
  hour: number,
  minute: number,
  second: number,
  amPm: "AM" | "PM",
  is24Hour: boolean,
) {
  const internalHour = is24Hour ? hour : toInternalHour(hour, amPm);
  return internalHour * 60 * 60 + minute * 60 + second;
}

function isWithinBounds(
  value: number,
  minTimeSeconds?: number | null,
  maxTimeSeconds?: number | null,
) {
  if (typeof minTimeSeconds === "number" && value < minTimeSeconds) {
    return false;
  }

  if (typeof maxTimeSeconds === "number" && value > maxTimeSeconds) {
    return false;
  }

  return true;
}

function buildHourItems(
  is24Hour: boolean,
  minute: number,
  second: number,
  amPm: "AM" | "PM",
  minTimeSeconds?: number | null,
  maxTimeSeconds?: number | null,
): WheelItem[] {
  const values = is24Hour
    ? Array.from({ length: 24 }, (_, index) => index)
    : Array.from({ length: 12 }, (_, index) => index + 1);

  return values.map((value) => ({
    value,
    label: value.toString().padStart(2, "0"),
    disabled: !isWithinBounds(
      timeToSeconds(value, minute, second, amPm, is24Hour),
      minTimeSeconds,
      maxTimeSeconds,
    ),
  }));
}

function buildMinuteItems(
  interval: TimeWheelProps["minuteInterval"],
  hour: number,
  second: number,
  is24Hour: boolean,
  amPm: "AM" | "PM",
  minTimeSeconds?: number | null,
  maxTimeSeconds?: number | null,
): WheelItem[] {
  return Array.from({ length: 60 / interval }, (_, index) => {
    const value = index * interval;
    const totalSeconds = timeToSeconds(hour, value, second, amPm, is24Hour);

    return {
      value,
      label: value.toString().padStart(2, "0"),
      disabled: !isWithinBounds(totalSeconds, minTimeSeconds, maxTimeSeconds),
    };
  });
}

function buildSecondItems(
  hour: number,
  minute: number,
  is24Hour: boolean,
  amPm: "AM" | "PM",
  minTimeSeconds?: number | null,
  maxTimeSeconds?: number | null,
): WheelItem[] {
  return Array.from({ length: 60 }, (_, index) => {
    const totalSeconds = timeToSeconds(hour, minute, index, amPm, is24Hour);

    return {
      value: index,
      label: index.toString().padStart(2, "0"),
      disabled: !isWithinBounds(totalSeconds, minTimeSeconds, maxTimeSeconds),
    };
  });
}

function buildAmPmItems(
  hour: number,
  minute: number,
  second: number,
  minTimeSeconds?: number | null,
  maxTimeSeconds?: number | null,
): WheelItem[] {
  const meridiems: Array<"AM" | "PM"> = ["AM", "PM"];

  return meridiems.map((value, index) => ({
    value: index,
    label: value,
    disabled: !Array.from(
      { length: 12 },
      (_, candidateIndex) => candidateIndex + 1,
    ).some((candidateHour) =>
      isWithinBounds(
        timeToSeconds(candidateHour, minute, second, value, false),
        minTimeSeconds,
        maxTimeSeconds,
      ),
    ),
  }));
}

function WheelRow({
  item,
  index,
  scrollY,
}: {
  item: WheelItem;
  index: number;
  scrollY: SharedValue<number>;
}) {
  const theme = useContext(ThemeContext);

  const animatedStyle = useAnimatedStyle(() => {
    const centeredIndex = scrollY.value / TIME_WHEEL_ITEM_HEIGHT;
    const distance = Math.abs(index - centeredIndex);
    const clamped = Math.min(distance, PADDING_ITEMS);

    return {
      opacity: interpolate(
        clamped,
        [0, 1, PADDING_ITEMS],
        [1, 0.5, 0.2],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          scale: interpolate(
            clamped,
            [0, 1, PADDING_ITEMS],
            [1, 0.82, 0.58],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  return (
    <Animated.View
      style={[styles.row, item.disabled && styles.rowDisabled, animatedStyle]}
    >
      <Text style={[styles.rowText, { color: theme.text }]}>{item.label}</Text>
    </Animated.View>
  );
}

function WheelColumn({
  data,
  selectedIndex,
  scrollY,
  onSnap,
}: WheelColumnProps) {
  const theme = useContext(ThemeContext);
  const listRef = useRef<ScrollView>(null);
  const isProgrammaticScroll = useRef(false);
  const momentumStarted = useRef(false);

  useEffect(() => {
    const targetOffset = selectedIndex * TIME_WHEEL_ITEM_HEIGHT;

    isProgrammaticScroll.current = true;
    listRef.current?.scrollTo({ animated: false, y: targetOffset });

    const timeout = setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 80);

    return () => clearTimeout(timeout);
  }, [selectedIndex]);

  useEffect(() => {
    scrollY.value = selectedIndex * TIME_WHEEL_ITEM_HEIGHT;
  }, [scrollY, selectedIndex]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.value = event.nativeEvent.contentOffset.y;
  };

  const snapToNearest = (offsetY: number, animated: boolean) => {
    const snappedOffset =
      Math.round(offsetY / TIME_WHEEL_ITEM_HEIGHT) * TIME_WHEEL_ITEM_HEIGHT;
    const snappedIndex = Math.round(offsetY / TIME_WHEEL_ITEM_HEIGHT);
    const item = data[Math.min(Math.max(snappedIndex, 0), data.length - 1)];

    if (item?.disabled) {
      return;
    }

    isProgrammaticScroll.current = true;
    listRef.current?.scrollTo({ animated, y: snappedOffset });

    const timeout = setTimeout(
      () => {
        isProgrammaticScroll.current = false;
      },
      animated ? 220 : 80,
    );

    onSnap(snappedOffset);
    return () => clearTimeout(timeout);
  };

  useEffect(() => {
    if (Platform.OS !== "web") {
      return;
    }

    const scrollNode = listRef.current?.getScrollableNode() as HTMLDivElement | null;
    if (!scrollNode) {
      return;
    }

    let isDown = false;
    let startY = 0;
    let startScrollTop = 0;

    scrollNode.style.cursor = "grab";
    scrollNode.style.userSelect = "none";
    scrollNode.style.webkitUserSelect = "none";

    const handleMouseDown = (e: MouseEvent) => {
      isDown = true;
      scrollNode.style.cursor = "grabbing";
      startY = e.pageY - scrollNode.offsetTop;
      startScrollTop = scrollNode.scrollTop;
    };

    const handleMouseLeave = () => {
      if (!isDown) return;
      isDown = false;
      scrollNode.style.cursor = "grab";
      snapToNearest(scrollNode.scrollTop, true);
    };

    const handleMouseUp = () => {
      if (!isDown) return;
      isDown = false;
      scrollNode.style.cursor = "grab";
      snapToNearest(scrollNode.scrollTop, true);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const y = e.pageY - scrollNode.offsetTop;
      const walk = (y - startY) * 1.5;
      scrollNode.scrollTop = startScrollTop - walk;
    };

    scrollNode.addEventListener("mousedown", handleMouseDown);
    scrollNode.addEventListener("mouseleave", handleMouseLeave);
    scrollNode.addEventListener("mouseup", handleMouseUp);
    scrollNode.addEventListener("mousemove", handleMouseMove);

    return () => {
      scrollNode.removeEventListener("mousedown", handleMouseDown);
      scrollNode.removeEventListener("mouseleave", handleMouseLeave);
      scrollNode.removeEventListener("mouseup", handleMouseUp);
      scrollNode.removeEventListener("mousemove", handleMouseMove);
    };
  }, [data]);


  const handleScrollEndDrag = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    if (isProgrammaticScroll.current) {
      return;
    }

    const velocity = Math.abs(event.nativeEvent.velocity?.y ?? 0);
    if (velocity > 0.35) {
      momentumStarted.current = true;
      return;
    }

    momentumStarted.current = false;
    snapToNearest(event.nativeEvent.contentOffset.y, true);
  };

  const handleMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    if (isProgrammaticScroll.current) {
      return;
    }

    if (!momentumStarted.current) {
      return;
    }

    momentumStarted.current = false;
    const snappedOffset =
      Math.round(event.nativeEvent.contentOffset.y / TIME_WHEEL_ITEM_HEIGHT) *
      TIME_WHEEL_ITEM_HEIGHT;
    const snappedIndex = Math.round(
      event.nativeEvent.contentOffset.y / TIME_WHEEL_ITEM_HEIGHT,
    );
    const item = data[Math.min(Math.max(snappedIndex, 0), data.length - 1)];

    if (item?.disabled) {
      return;
    }

    isProgrammaticScroll.current = true;
    listRef.current?.scrollTo({ animated: false, y: snappedOffset });

    const timeout = setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 80);

    onSnap(snappedOffset);
    return () => clearTimeout(timeout);
  };

  return (
    <View style={styles.wheelContainer}>
      <ScrollView
        bounces={false}
        decelerationRate="normal"
        nestedScrollEnabled
        onMomentumScrollBegin={() => {
          momentumStarted.current = true;
        }}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScroll={handleScroll}
        onScrollEndDrag={handleScrollEndDrag}
        overScrollMode="never"
        ref={listRef}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        snapToInterval={TIME_WHEEL_ITEM_HEIGHT}
        contentContainerStyle={styles.contentContainer}
      >
        {data.map((item, index) => (
          <WheelRow
            index={index}
            item={item}
            key={`time-wheel-${item.label}-${index}`}
            scrollY={scrollY}
          />
        ))}
      </ScrollView>

      <View
        pointerEvents="none"
        style={[
          styles.highlightBand,
          {
            backgroundColor: theme.wheelHighlight,
            borderColor: theme.accent,
          },
        ]}
      />
    </View>
  );
}

export function TimeWheel({
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
}: TimeWheelProps) {
  const hourItems = useMemo(
    () =>
      buildHourItems(
        is24Hour,
        minute,
        second,
        amPm,
        minTimeSeconds,
        maxTimeSeconds,
      ),
    [amPm, is24Hour, maxTimeSeconds, minTimeSeconds, minute, second],
  );
  const minuteItems = useMemo(
    () =>
      buildMinuteItems(
        minuteInterval,
        hour,
        second,
        is24Hour,
        amPm,
        minTimeSeconds,
        maxTimeSeconds,
      ),
    [
      amPm,
      hour,
      is24Hour,
      maxTimeSeconds,
      minTimeSeconds,
      minuteInterval,
      second,
    ],
  );
  const secondItems = useMemo(
    () =>
      buildSecondItems(
        hour,
        minute,
        is24Hour,
        amPm,
        minTimeSeconds,
        maxTimeSeconds,
      ),
    [amPm, hour, is24Hour, maxTimeSeconds, minTimeSeconds, minute],
  );
  const amPmItems = useMemo(
    () => buildAmPmItems(hour, minute, second, minTimeSeconds, maxTimeSeconds),
    [hour, minute, second, minTimeSeconds, maxTimeSeconds],
  );

  const selectedHourIndex = useMemo(
    () =>
      Math.max(
        hourItems.findIndex((item) => item.value === hour),
        0,
      ),
    [hour, hourItems],
  );
  const selectedMinuteIndex = useMemo(
    () =>
      Math.max(
        minuteItems.findIndex((item) => item.value === minute),
        0,
      ),
    [minute, minuteItems],
  );
  const selectedSecondIndex = useMemo(
    () =>
      Math.max(
        secondItems.findIndex((item) => item.value === second),
        0,
      ),
    [second, secondItems],
  );
  const selectedAmPmIndex = amPm === "AM" ? 0 : 1;

  const hourScrollY = useSharedValue(
    selectedHourIndex * TIME_WHEEL_ITEM_HEIGHT,
  );
  const minuteScrollY = useSharedValue(
    selectedMinuteIndex * TIME_WHEEL_ITEM_HEIGHT,
  );
  const secondScrollY = useSharedValue(
    selectedSecondIndex * TIME_WHEEL_ITEM_HEIGHT,
  );
  const amPmScrollY = useSharedValue(
    selectedAmPmIndex * TIME_WHEEL_ITEM_HEIGHT,
  );

  return (
    <View style={styles.container}>
      <View style={styles.timeColumns}>
        <WheelColumn
          data={hourItems}
          selectedIndex={selectedHourIndex}
          scrollY={hourScrollY}
          onSnap={(offsetY) => {
            const index = Math.round(offsetY / TIME_WHEEL_ITEM_HEIGHT);
            const item =
              hourItems[Math.max(0, Math.min(index, hourItems.length - 1))];
            if (item && !item.disabled) {
              onHourChange(item.value);
            }
          }}
        />

        <View style={styles.colon}>
          <Text style={styles.colonText}>:</Text>
        </View>

        <WheelColumn
          data={minuteItems}
          selectedIndex={selectedMinuteIndex}
          scrollY={minuteScrollY}
          onSnap={(offsetY) => {
            const index = Math.round(offsetY / TIME_WHEEL_ITEM_HEIGHT);
            const item =
              minuteItems[Math.max(0, Math.min(index, minuteItems.length - 1))];
            if (item && !item.disabled) {
              onMinuteChange(item.value);
            }
          }}
        />

        {showSeconds && (
          <WheelColumn
            data={secondItems}
            selectedIndex={selectedSecondIndex}
            scrollY={secondScrollY}
            onSnap={(offsetY) => {
              const index = Math.round(offsetY / TIME_WHEEL_ITEM_HEIGHT);
              const item =
                secondItems[
                  Math.max(0, Math.min(index, secondItems.length - 1))
                ];
              if (item && !item.disabled) {
                onSecondChange(item.value);
              }
            }}
          />
        )}
      </View>

      {!is24Hour && (
        <View style={styles.meridiemColumn}>
          <WheelColumn
            data={amPmItems}
            selectedIndex={selectedAmPmIndex}
            scrollY={amPmScrollY}
            onSnap={(offsetY) => {
              const index = Math.round(offsetY / TIME_WHEEL_ITEM_HEIGHT);
              const item =
                amPmItems[Math.max(0, Math.min(index, amPmItems.length - 1))];
              if (item && !item.disabled) {
                onAmPmChange(item.value === 0 ? "AM" : "PM");
              }
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: TIME_WHEEL_ITEM_HEIGHT * TIME_WHEEL_VISIBLE_ITEMS,
  },
  timeColumns: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  meridiemColumn: {
    width: 82,
    marginLeft: 2,
  },
  wheelContainer: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 16,
    height: TIME_WHEEL_ITEM_HEIGHT * TIME_WHEEL_VISIBLE_ITEMS,
  },
  contentContainer: {
    paddingTop: TIME_WHEEL_ITEM_HEIGHT * PADDING_ITEMS,
    paddingBottom: TIME_WHEEL_ITEM_HEIGHT * PADDING_ITEMS,
  },
  row: {
    height: TIME_WHEEL_ITEM_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  rowDisabled: {
    opacity: 0.35,
  },
  rowText: {
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  highlightBand: {
    position: "absolute",
    top: TIME_WHEEL_ITEM_HEIGHT * PADDING_ITEMS,
    left: 0,
    right: 0,
    height: TIME_WHEEL_ITEM_HEIGHT,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  colon: {
    width: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  colonText: {
    fontSize: 22,
    fontWeight: "700",
    opacity: 0.6,
  },
});
