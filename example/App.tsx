/**
 * DateTimePicker — Interactive Showcase
 *
 * A fully interactive, premium playground demonstrating every prop
 * supported by react-native-date-time-picker.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  Pressable,
  Platform,
  StatusBar,
  Modal,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  DateTimePicker,
  PickerMode,
  DatePickerVariant,
  TimePickerVariant,
  PickerValue,
  PickerModalPosition,
  DateRange,
  MarkedDate,
} from '../src';

// ─────────────────────────────────────────────────────────────────────────────
//  Design tokens
// ─────────────────────────────────────────────────────────────────────────────

const RADIUS = {
  sm: 10,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

const ACCENT_PRESETS = [
  { label: 'Blue',    hex: '#3b82f6' },
  { label: 'Indigo',  hex: '#6366f1' },
  { label: 'Violet',  hex: '#8b5cf6' },
  { label: 'Rose',    hex: '#f43f5e' },
  { label: 'Amber',   hex: '#f59e0b' },
  { label: 'Emerald', hex: '#10b981' },
  { label: 'Sky',     hex: '#0ea5e9' },
  { label: 'Pink',    hex: '#ec4899' },
];

type DS = {
  bg: string;
  surface: string;
  card: string;
  border: string;
  borderSubtle: string;
  text: string;
  textSub: string;
  textMuted: string;
  accent: string;
  accentFaint: string;
  danger: string;
  isDark: boolean;
};

function ds(dark: boolean, accent: string): DS {
  const accentFaint = accent + (dark ? '20' : '12');
  if (dark) {
    return {
      bg:           '#050507',
      surface:      '#0d0d10',
      card:         '#131316',
      border:       '#1e1e24',
      borderSubtle: '#18181c',
      text:         '#f2f2f4',
      textSub:      '#9898a6',
      textMuted:    '#4a4a5a',
      accent,
      accentFaint,
      danger:       '#f43f5e',
      isDark: true,
    };
  }
  return {
    bg:           '#f5f5f7',
    surface:      '#ebebee',
    card:         '#ffffff',
    border:       '#d8d8de',
    borderSubtle: '#e8e8ed',
    text:         '#0a0a0d',
    textSub:      '#3a3a48',
    textMuted:    '#6e6e80',
    accent,
    accentFaint,
    danger:       '#ef4444',
    isDark: false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatValue(val: PickerValue): string {
  if (val === null || val === undefined) return '—';
  if (val instanceof Date) {
    return val.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  }
  if (typeof val === 'number') return String(val);
  if (Array.isArray(val)) {
    if (val.length === 0) return 'None selected';
    return val.map((d) => d.toLocaleDateString()).join(' · ');
  }
  const obj = val as Record<string, unknown>;
  if ('start' in obj) {
    const r = val as DateRange;
    const s = r.start ? r.start.toLocaleDateString() : '—';
    const e = r.end   ? r.end.toLocaleDateString()   : '…';
    return `${s}  →  ${e}`;
  }
  if ('year' in obj) {
    const m = val as { year: number; month: number };
    const name = new Date(m.year, m.month, 1).toLocaleString(undefined, { month: 'long' });
    return `${name} ${m.year}`;
  }
  return JSON.stringify(val);
}

function initValue(mode: PickerMode): PickerValue {
  const now = new Date();
  if (mode === 'range') return { start: null, end: null };
  if (mode === 'multi') return [];
  if (mode === 'month') return { year: now.getFullYear(), month: now.getMonth() };
  if (mode === 'year')  return now.getFullYear();
  return now;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Primitive controls
// ─────────────────────────────────────────────────────────────────────────────

function Chip<T extends string>({
  label, value, current, onPress, t,
}: { label: string; value: T; current: T; onPress: (v: T) => void; t: DS }) {
  const active = value === current;
  return (
    <Pressable
      onPress={() => onPress(value)}
      style={[
        chipSt.base,
        { borderColor: active ? t.accent : t.border, backgroundColor: active ? t.accent : 'transparent' },
      ]}
    >
      <Text style={[chipSt.label, { color: active ? '#fff' : t.textSub }]}>{label}</Text>
    </Pressable>
  );
}
const chipSt = StyleSheet.create({
  base:  { paddingHorizontal: 13, paddingVertical: 7, borderRadius: RADIUS.full, borderWidth: 1.5, marginRight: 6, marginBottom: 6 },
  label: { fontSize: 12.5, fontWeight: '600', letterSpacing: 0.1 },
});

function ChipGroup<T extends string>({
  options, value, onChange, t,
}: { options: { label: string; value: T }[]; value: T; onChange: (v: T) => void; t: DS }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 }}>
      {options.map((o) => (
        <Chip key={o.value} label={o.label} value={o.value} current={value} onPress={onChange} t={t} />
      ))}
    </View>
  );
}

function Toggle({ value, onChange, t }: { value: boolean; onChange: (v: boolean) => void; t: DS }) {
  return (
    <Switch
      value={value}
      onValueChange={onChange}
      thumbColor={value ? t.accent : t.isDark ? '#555' : '#bbb'}
      trackColor={{ false: t.isDark ? '#2a2a30' : '#ddd', true: t.accent + '88' }}
      ios_backgroundColor={t.isDark ? '#2a2a30' : '#ddd'}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  PropRow — labelled control row
// ─────────────────────────────────────────────────────────────────────────────

function PropRow({
  prop, desc, children, t, vertical = false,
}: { prop: string; desc?: string; children: React.ReactNode; t: DS; vertical?: boolean }) {
  return (
    <View style={[prSt.row, { borderBottomColor: t.borderSubtle }, vertical && prSt.rowV]}>
      <View style={vertical ? prSt.labelV : prSt.label}>
        <Text style={[prSt.prop, { color: t.accent }]}>{prop}</Text>
        {desc ? <Text style={[prSt.desc, { color: t.textMuted }]}>{desc}</Text> : null}
      </View>
      <View style={vertical ? prSt.controlV : prSt.control}>{children}</View>
    </View>
  );
}
const prSt = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, flexWrap: 'wrap', gap: 6 },
  rowV:     { flexDirection: 'column', alignItems: 'flex-start' },
  label:    { width: 148, flexShrink: 0 },
  labelV:   { marginBottom: 8 },
  prop:     { fontSize: 12.5, fontWeight: '700', fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) },
  desc:     { fontSize: 11, fontWeight: '400', marginTop: 2, lineHeight: 15 },
  control:  { flex: 1, alignItems: 'flex-end' },
  controlV: { width: '100%' },
});

// ─────────────────────────────────────────────────────────────────────────────
//  Card
// ─────────────────────────────────────────────────────────────────────────────

function Card({ children, t, style }: { children: React.ReactNode; t: DS; style?: object }) {
  return (
    <View
      style={[
        cardSt.card,
        {
          backgroundColor: t.card,
          borderColor: t.border,
          ...Platform.select({
            ios: {
              shadowColor: t.isDark ? '#000' : '#00008820',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: t.isDark ? 0.5 : 1,
              shadowRadius: 12,
            },
            android: { elevation: 2 },
          }),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
const cardSt = StyleSheet.create({
  card: { borderRadius: RADIUS.xl, borderWidth: 1, overflow: 'hidden', marginBottom: 12 },
});

// ─────────────────────────────────────────────────────────────────────────────
//  Color swatch picker
// ─────────────────────────────────────────────────────────────────────────────

function SwatchPicker({
  presets, value, onChange,
}: { presets: { label: string; hex: string }[]; value: string; onChange: (hex: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {presets.map((p) => {
        const active = value === p.hex;
        return (
          <Pressable
            key={p.hex}
            onPress={() => onChange(p.hex)}
            accessibilityLabel={p.label}
            style={[
              swSt.dot,
              { backgroundColor: p.hex },
              active && [swSt.dotActive, { shadowColor: p.hex }],
            ]}
          >
            {active && <Text style={swSt.check}>✓</Text>}
          </Pressable>
        );
      })}
    </View>
  );
}
const swSt = StyleSheet.create({
  dot:       { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dotActive: { transform: [{ scale: 1.2 }], borderWidth: 2.5, borderColor: '#fff', ...Platform.select({ ios: { shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8 }, android: { elevation: 8 } }) },
  check:     { color: '#fff', fontSize: 14, fontWeight: '900' },
});

// ─────────────────────────────────────────────────────────────────────────────
//  Live output panel
// ─────────────────────────────────────────────────────────────────────────────

function OutputPanel({ value, immediateValue, t, accent }: {
  value: PickerValue; immediateValue: PickerValue; t: DS; accent: string;
}) {
  return (
    <Card t={t} style={{ marginBottom: 14 }}>
      <View style={[opSt.accentBar, { backgroundColor: accent }]} />
      <View style={opSt.body}>
        <View style={opSt.block}>
          <Text style={[opSt.key, { color: t.textMuted }]}>onChange</Text>
          <Text style={[opSt.val, { color: accent }]} numberOfLines={2}>
            {formatValue(value)}
          </Text>
        </View>
        {immediateValue !== null && (
          <>
            <View style={[opSt.divider, { backgroundColor: t.borderSubtle }]} />
            <View style={opSt.block}>
              <Text style={[opSt.key, { color: t.textMuted }]}>onChangeImmediate</Text>
              <Text style={[opSt.val, { color: accent, opacity: 0.6 }]} numberOfLines={2}>
                {formatValue(immediateValue)}
              </Text>
            </View>
          </>
        )}
      </View>
    </Card>
  );
}
const opSt = StyleSheet.create({
  accentBar: { height: 3 },
  body:      { padding: 16 },
  block:     { gap: 4 },
  key:       { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },
  val:       { fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  divider:   { height: 1, marginVertical: 12 },
});

// ─────────────────────────────────────────────────────────────────────────────
//  Tab bar
// ─────────────────────────────────────────────────────────────────────────────

type Tab = 'picker' | 'date' | 'time' | 'display' | 'locale';

const TABS: { id: Tab; label: string }[] = [
  { id: 'picker',  label: 'Mode'   },
  { id: 'date',    label: 'Date'   },
  { id: 'time',    label: 'Time'   },
  { id: 'display', label: 'Style'  },
  { id: 'locale',  label: 'Locale' },
];

/** Minimal vector icons for each tab */
function TabIcon({ id, color }: { id: Tab; color: string }) {
  if (id === 'picker') {
    return (
      <View style={[tiSt.box, { borderColor: color }]}>
        <View style={[tiSt.headerBar, { backgroundColor: color }]} />
        <View style={tiSt.gridRow}>
          <View style={[tiSt.dot, { backgroundColor: color }]} />
          <View style={[tiSt.dot, { backgroundColor: color }]} />
        </View>
        <View style={tiSt.gridRow}>
          <View style={[tiSt.dot, { backgroundColor: color }]} />
          <View style={[tiSt.dot, { backgroundColor: color }]} />
        </View>
      </View>
    );
  }
  if (id === 'date') {
    return (
      <View style={[tiSt.box, { borderColor: color }]}>
        <View style={[tiSt.headerBar, { backgroundColor: color }]} />
        <View style={tiSt.numberBody}>
          <View style={[tiSt.line, { backgroundColor: color, width: 8 }]} />
        </View>
      </View>
    );
  }
  if (id === 'time') {
    return (
      <View style={[tiSt.circle, { borderColor: color }]}>
        <View style={[tiSt.handV, { backgroundColor: color }]} />
        <View style={[tiSt.handH, { backgroundColor: color }]} />
      </View>
    );
  }
  if (id === 'display') {
    return (
      <View style={{ width: 14, height: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
        <View style={[tiSt.paletteDot, { backgroundColor: '#ef4444' }]} />
        <View style={[tiSt.paletteDot, { backgroundColor: '#10b981' }]} />
        <View style={[tiSt.paletteDot, { backgroundColor: '#3b82f6' }]} />
        <View style={[tiSt.paletteDot, { backgroundColor: '#f59e0b' }]} />
      </View>
    );
  }
  if (id === 'locale') {
    return (
      <View style={[tiSt.circle, { borderColor: color, justifyContent: 'center', alignItems: 'center' }]}>
        <View style={[tiSt.globeLineV, { borderColor: color }]} />
        <View style={[tiSt.globeLineH, { borderColor: color }]} />
      </View>
    );
  }
  return null;
}

const tiSt = StyleSheet.create({
  box:        { width: 14, height: 14, borderWidth: 1.5, borderRadius: 3, overflow: 'hidden' },
  headerBar:  { height: 3, width: '100%' },
  gridRow:    { flexDirection: 'row', justifyContent: 'space-around', marginTop: 1 },
  dot:        { width: 2, height: 2, borderRadius: 1 },
  numberBody: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  line:       { height: 1.5, borderRadius: 1 },
  circle:     { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, position: 'relative' },
  handV:      { position: 'absolute', top: 2, left: 5, width: 1.5, height: 5, borderRadius: 1 },
  handH:      { position: 'absolute', top: 5, left: 5, width: 4, height: 1.5, borderRadius: 1 },
  paletteDot: { width: 5, height: 5, borderRadius: 2.5 },
  globeLineV: { position: 'absolute', width: 6, height: 12, borderRadius: 3, borderWidth: 1, borderTopWidth: 0, borderBottomWidth: 0 },
  globeLineH: { position: 'absolute', width: 12, height: 6, borderRadius: 3, borderWidth: 1, borderLeftWidth: 0, borderRightWidth: 0 },
});

function TabBar({ active, onChange, t }: { active: Tab; onChange: (t: Tab) => void; t: DS }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={tbSt.wrap}
      style={[tbSt.bar, { backgroundColor: t.surface, borderBottomColor: t.border }]}
    >
      {TABS.map((tab) => {
        const on = active === tab.id;
        const color = on ? t.accent : t.textMuted;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            style={[tbSt.tab, on && [tbSt.tabActive, { borderBottomColor: t.accent }]]}
          >
            <TabIcon id={tab.id} color={color} />
            <Text style={[tbSt.label, { color, fontWeight: on ? '700' : '500' }]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
const tbSt = StyleSheet.create({
  bar:       { borderBottomWidth: 1, flexShrink: 0 },
  wrap:      { flexDirection: 'row', paddingHorizontal: 6 },
  tab:       { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  tabActive: {},
  label:     { fontSize: 13, letterSpacing: -0.1 },
});

// ─────────────────────────────────────────────────────────────────────────────
//  Dropdown (uses Modal to avoid zIndex / overflow clipping issues)
// ─────────────────────────────────────────────────────────────────────────────

function Dropdown({ options, value, onChange, t }: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
  t: DS;
}) {
  const [open, setOpen] = useState(false);
  const label = options.find((o) => o.value === value)?.label ?? value;

  return (
    <View>
      <Pressable
        style={[ddSt.trigger, { backgroundColor: t.surface, borderColor: open ? t.accent : t.border }]}
        onPress={() => setOpen(true)}
      >
        <Text style={[ddSt.triggerText, { color: t.text }]}>{label}</Text>
        <Text style={[ddSt.arrow, { color: t.accent }]}>▾</Text>
      </Pressable>

      <Modal animationType="fade" transparent visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable
          style={[ddSt.backdrop, { backgroundColor: 'rgba(0,0,0,0.55)' }]}
          onPress={() => setOpen(false)}
        >
          <Pressable
            style={[ddSt.sheet, { backgroundColor: t.card, borderColor: t.border }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[ddSt.sheetHeader, { borderBottomColor: t.border }]}>
              <Text style={[ddSt.sheetTitle, { color: t.text }]}>Select</Text>
              <Pressable onPress={() => setOpen(false)}>
                <Text style={{ color: t.accent, fontWeight: '600', fontSize: 14 }}>Done</Text>
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator nestedScrollEnabled>
              {options.map((o) => {
                const active = o.value === value;
                return (
                  <Pressable
                    key={o.value}
                    style={[ddSt.item, active && { backgroundColor: t.accentFaint }]}
                    onPress={() => { onChange(o.value); setOpen(false); }}
                  >
                    <Text style={[ddSt.itemCheck, { color: t.accent, opacity: active ? 1 : 0 }]}>✓</Text>
                    <Text style={[ddSt.itemText, { color: active ? t.accent : t.text, fontWeight: active ? '600' : '400' }]}>
                      {o.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
const ddSt = StyleSheet.create({
  trigger:     { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 9, minWidth: 180, gap: 8 },
  triggerText: { flex: 1, fontSize: 13, fontWeight: '500' },
  arrow:       { fontSize: 12, fontWeight: '700' },
  backdrop:    { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  sheet:       { width: '100%', maxWidth: 360, borderRadius: RADIUS.lg, borderWidth: 1, overflow: 'hidden' },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  sheetTitle:  { fontSize: 15, fontWeight: '700' },
  item:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 10 },
  itemCheck:   { fontSize: 12, fontWeight: '900', width: 16 },
  itemText:    { fontSize: 14 },
});

// ─────────────────────────────────────────────────────────────────────────────
//  Theme toggle icon (moon / sun)
// ─────────────────────────────────────────────────────────────────────────────

function ThemeIcon({ dark, color }: { dark: boolean; color: string }) {
  if (dark) {
    // Moon silhouette
    return (
      <View style={{ width: 14, height: 14, position: 'relative', overflow: 'hidden', marginRight: 6 }}>
        <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: color }} />
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#050507', position: 'absolute', top: -1, right: -1 }} />
      </View>
    );
  }
  // Sun
  return (
    <View style={{ width: 14, height: 14, justifyContent: 'center', alignItems: 'center', marginRight: 6 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: color }} />
      <View style={{ position: 'absolute', top: 0, width: 1.5, height: 2.5, backgroundColor: color }} />
      <View style={{ position: 'absolute', bottom: 0, width: 1.5, height: 2.5, backgroundColor: color }} />
      <View style={{ position: 'absolute', left: 0, width: 2.5, height: 1.5, backgroundColor: color }} />
      <View style={{ position: 'absolute', right: 0, width: 2.5, height: 1.5, backgroundColor: color }} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  App shell
// ─────────────────────────────────────────────────────────────────────────────

// useSafeAreaInsets must be called from *inside* <SafeAreaProvider>
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main content
// ─────────────────────────────────────────────────────────────────────────────

function AppContent() {
  const insets = useSafeAreaInsets();
  let isEmbedded = false;
  try {
    isEmbedded = Platform.OS === 'web' && typeof window !== 'undefined' && window.self !== window.top;
  } catch (e) {
    isEmbedded = true;
  }

  // ── mode & variants ───────────────────────────────────────────────────────
  const [mode, setMode]         = useState<PickerMode>('date');
  const [dateVariant, setDateV] = useState<DatePickerVariant>('calendar');
  const [timeVariant, setTimeV] = useState<TimePickerVariant>('wheel');

  // ── controlled value ──────────────────────────────────────────────────────
  const [value, setValue]         = useState<PickerValue>(initValue('date'));
  const [immediate, setImmediate] = useState<PickerValue>(null);

  const onModeChange = useCallback((next: PickerMode) => {
    setMode(next);
    setValue(initValue(next));
    setImmediate(null);
  }, []);

  // ── theming ───────────────────────────────────────────────────────────────
  const [accent, setAccent] = useState('#3b82f6'); // blue — matches library default
  const [dark, setDark]     = useState(false);
  const t = ds(dark, accent);

  // ── display / modal ───────────────────────────────────────────────────────
  const [inline, setInline]       = useState(true);
  const [visible, setVisible]     = useState(false);
  const [modalPos, setModalPos]   = useState<PickerModalPosition>('center');
  const [highlightToday, setHighlightToday] = useState(true);
  const [showWeekNums, setShowWeekNums]     = useState(false);
  const [disabled, setDisabled]             = useState(false);
  const [placeholder, setPlaceholder]       = useState('Select date');

  // ── calendar ──────────────────────────────────────────────────────────────
  const [firstDay, setFirstDay]     = useState<0 | 1>(0);
  const [minEnabled, setMinEnabled] = useState(false);
  const [maxEnabled, setMaxEnabled] = useState(false);

  // markedDates — show 3 coloured dots by default
  const [showMarked, setShowMarked] = useState(true);
  const markedDates: MarkedDate[] | undefined = showMarked
    ? [
        { date: new Date(),                      dot: accent   },
        { date: new Date(Date.now() + 864e5),    dot: '#10b981' },
        { date: new Date(Date.now() - 864e5 * 2), dot: '#f43f5e' },
      ]
    : undefined;

  const minDate = minEnabled ? new Date(Date.now() - 14 * 864e5) : undefined;
  const maxDate = maxEnabled ? new Date(Date.now() + 14 * 864e5) : undefined;

  // ── multi-select ──────────────────────────────────────────────────────────
  const [maxMulti, setMaxMulti]         = useState(0);
  const [maxReachedTs, setMaxReachedTs] = useState(0);
  const showMaxToast = Date.now() - maxReachedTs < 2000;

  // ── range ─────────────────────────────────────────────────────────────────
  const [rangeIncompleteTs, setRangeIncompleteTs] = useState(0);
  const showRangeToast = Date.now() - rangeIncompleteTs < 2000;

  // ── time ──────────────────────────────────────────────────────────────────
  const [is24, setIs24]               = useState(false);
  const [showSec, setShowSec]         = useState(false);
  const [minInterval, setMinInterval] = useState<1|5|10|15|30>(1);
  const [minTimeOn, setMinTimeOn]     = useState(false);
  const [maxTimeOn, setMaxTimeOn]     = useState(false);

  // ── labels ────────────────────────────────────────────────────────────────
  const [confirmLabel, setConfirmLabel] = useState('Confirm');
  const [clearLabel, setClearLabel]     = useState('Clear');

  // ── locale / timezone ─────────────────────────────────────────────────────
  const [locale, setLocale]     = useState('en-US');
  const [timezone, setTimezone] = useState('');

  // ── tab ───────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<Tab>('picker');

  // Synchronize state with URL Query Params or postMessage on Web
  React.useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleUrlParams = () => {
        const params = new URLSearchParams(window.location.search);
        
        const qMode = params.get('mode') as PickerMode | null;
        if (qMode) {
          setMode(qMode);
          setValue(initValue(qMode));
        }
        
        const qAccent = params.get('accentColor');
        if (qAccent) setAccent(qAccent);
        
        const qDark = params.get('darkMode');
        if (qDark !== null) setDark(qDark === 'true');
        
        const qWeekNums = params.get('showWeekNumbers');
        if (qWeekNums !== null) setShowWeekNums(qWeekNums === 'true');
        
        const qToday = params.get('highlightToday');
        if (qToday !== null) setHighlightToday(qToday === 'true');

        const qInline = params.get('inline');
        if (qInline !== null) setInline(qInline === 'true');
      };

      handleUrlParams();

      const messageListener = (e: MessageEvent) => {
        if (e.data && e.data.type === 'UPDATE_SETTINGS') {
          const s = e.data.settings;
          if (s.mode !== undefined) {
            setMode(s.mode);
            setValue(initValue(s.mode));
          }
          if (s.accentColor !== undefined) setAccent(s.accentColor);
          if (s.darkMode !== undefined) setDark(s.darkMode === true);
          if (s.showWeekNumbers !== undefined) setShowWeekNums(s.showWeekNumbers === true);
          if (s.highlightToday !== undefined) setHighlightToday(s.highlightToday === true);
          if (s.inline !== undefined) setInline(s.inline === true);
          if (s.firstDayOfWeek !== undefined) setFirstDay(s.firstDayOfWeek === 1 ? 1 : 0);
          if (s.minuteInterval !== undefined) setMinInterval(s.minuteInterval);
          if (s.datePickerVariant !== undefined) setDateV(s.datePickerVariant);
          if (s.timePickerVariant !== undefined) setTimeV(s.timePickerVariant);
          if (s.is24Hour !== undefined) setIs24(s.is24Hour === true);
          if (s.showSeconds !== undefined) setShowSec(s.showSeconds === true);
          if (s.disabled !== undefined) setDisabled(s.disabled === true);
          if (s.locale !== undefined) setLocale(s.locale);
          if (s.timezone !== undefined) setTimezone(s.timezone);
          
          // Additional settings
          if (s.minDateEnabled !== undefined) setMinEnabled(s.minDateEnabled === true);
          if (s.maxDateEnabled !== undefined) setMaxEnabled(s.maxDateEnabled === true);
          if (s.showMarked !== undefined) setShowMarked(s.showMarked === true);
          if (s.minTimeEnabled !== undefined) setMinTimeOn(s.minTimeEnabled === true);
          if (s.maxTimeEnabled !== undefined) setMaxTimeOn(s.maxTimeEnabled === true);
          if (s.modalPosition !== undefined) setModalPos(s.modalPosition);
          if (s.placeholder !== undefined) setPlaceholder(s.placeholder);
          if (s.visible !== undefined) setVisible(s.visible === true);
          if (s.maxMultiSelect !== undefined) setMaxMulti(s.maxMultiSelect);
          if (s.confirmLabel !== undefined) setConfirmLabel(s.confirmLabel);
          if (s.clearLabel !== undefined) setClearLabel(s.clearLabel);
        }
      };

      window.addEventListener('message', messageListener);
      return () => {
        window.removeEventListener('message', messageListener);
      };
    }
  }, []);

  // derived flags
  const showCal  = ['date', 'datetime', 'range', 'multi', 'month'].includes(mode);
  const showTime = ['time', 'datetime'].includes(mode);

  return (
    <>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} backgroundColor={t.bg} />
      <SafeAreaView style={[appSt.root, { backgroundColor: t.bg }]} edges={['top', 'left', 'right']}>

        {/* ── App header ──────────────────────────────────────────────── */}
        {!isEmbedded && (
          <View style={[appSt.header, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
            <View>
              <Text style={[appSt.title, { color: t.text }]}>DateTimePicker</Text>
              <Text style={[appSt.subtitle, { color: t.textMuted }]}>Interactive prop playground</Text>
            </View>
            <View style={appSt.headerRight}>
              <ThemeIcon dark={dark} color={t.textSub} />
              <Toggle value={dark} onChange={setDark} t={t} />
            </View>
          </View>
        )}

        {isEmbedded ? (
          <View style={[appSt.scroll, { flex: 1, justifyContent: 'center', paddingTop: 0 }]}>
            {/* ── Picker card ─────────────────────────────────────────────── */}
            <Card t={t} style={{ marginBottom: 0 }}>
              {/* Toasts */}
              {showMaxToast && (
                <View style={[toastSt.wrap, { backgroundColor: accent }]}>
                  <View style={toastSt.inner}>
                    <View style={toastSt.dot}><Text style={toastSt.dotText}>!</Text></View>
                    <Text style={toastSt.text}>Maximum selection reached</Text>
                  </View>
                </View>
              )}
              {showRangeToast && (
                <View style={[toastSt.wrap, { backgroundColor: t.danger }]}>
                  <View style={toastSt.inner}>
                    <View style={toastSt.dot}><Text style={toastSt.dotText}>!</Text></View>
                    <Text style={toastSt.text}>Please select an end date</Text>
                  </View>
                </View>
              )}

              <DateTimePicker
                // Core
                mode={mode}
                value={value}
                onChange={setValue}
                onChangeImmediate={setImmediate}
                // Theming
                accentColor={accent}
                darkMode={dark}
                // Date options
                datePickerVariant={dateVariant}
                firstDayOfWeek={firstDay}
                highlightToday={highlightToday}
                markedDates={markedDates}
                maxDate={maxDate}
                minDate={minDate}
                showWeekNumbers={showWeekNums}
                // Time options
                is24Hour={is24}
                maxTime={maxTimeOn ? '20:00:00' : undefined}
                minTime={minTimeOn ? '08:00:00' : undefined}
                minuteInterval={minInterval}
                showSeconds={showSec}
                timePickerVariant={timeVariant}
                // Multi-select
                maxMultiSelect={maxMulti > 0 ? maxMulti : undefined}
                onMaxReached={() => setMaxReachedTs(Date.now())}
                // Range
                onRangeIncomplete={() => setRangeIncompleteTs(Date.now())}
                // Modal / display
                confirmLabel={confirmLabel}
                clearLabel={clearLabel}
                disabled={disabled}
                inline={inline}
                modalPosition={modalPos}
                placeholder={placeholder || undefined}
                visible={visible}
                onOpen={() => setVisible(true)}
                onClose={() => setVisible(false)}
                onDismiss={() => setVisible(false)}
                onMonthChange={() => {}}
                // Locale
                locale={locale || undefined}
                timezone={timezone || undefined}
              />
            </Card>
          </View>
        ) : (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[appSt.scroll, { paddingBottom: insets.bottom + 32 }]}
          >
            {/* ── Picker card ─────────────────────────────────────────────── */}
            <Card t={t} style={{ marginBottom: 14 }}>
              {/* Toasts */}
              {showMaxToast && (
                <View style={[toastSt.wrap, { backgroundColor: accent }]}>
                  <View style={toastSt.inner}>
                    <View style={toastSt.dot}><Text style={toastSt.dotText}>!</Text></View>
                    <Text style={toastSt.text}>Maximum selection reached</Text>
                  </View>
                </View>
              )}
              {showRangeToast && (
                <View style={[toastSt.wrap, { backgroundColor: t.danger }]}>
                  <View style={toastSt.inner}>
                    <View style={toastSt.dot}><Text style={toastSt.dotText}>!</Text></View>
                    <Text style={toastSt.text}>Please select an end date</Text>
                  </View>
                </View>
              )}

              <DateTimePicker
                // Core
                mode={mode}
                value={value}
                onChange={setValue}
                onChangeImmediate={setImmediate}
                // Theming
                accentColor={accent}
                darkMode={dark}
                // Date options
                datePickerVariant={dateVariant}
                firstDayOfWeek={firstDay}
                highlightToday={highlightToday}
                markedDates={markedDates}
                maxDate={maxDate}
                minDate={minDate}
                showWeekNumbers={showWeekNums}
                // Time options
                is24Hour={is24}
                maxTime={maxTimeOn ? '20:00:00' : undefined}
                minTime={minTimeOn ? '08:00:00' : undefined}
                minuteInterval={minInterval}
                showSeconds={showSec}
                timePickerVariant={timeVariant}
                // Multi-select
                maxMultiSelect={maxMulti > 0 ? maxMulti : undefined}
                onMaxReached={() => setMaxReachedTs(Date.now())}
                // Range
                onRangeIncomplete={() => setRangeIncompleteTs(Date.now())}
                // Modal / display
                confirmLabel={confirmLabel}
                clearLabel={clearLabel}
                disabled={disabled}
                inline={inline}
                modalPosition={modalPos}
                placeholder={placeholder || undefined}
                visible={visible}
                onOpen={() => setVisible(true)}
                onClose={() => setVisible(false)}
                onDismiss={() => setVisible(false)}
                onMonthChange={() => {}}
                // Locale
                locale={locale || undefined}
                timezone={timezone || undefined}
              />
            </Card>

          {/* ── Controls card ───────────────────────────────────────────── */}
          {!isEmbedded && (
            <Card t={t} style={{ marginBottom: 14, overflow: 'visible' }}>
              <TabBar active={tab} onChange={setTab} t={t} />

            {/* MODE tab */}
            {tab === 'picker' && (
              <>
                <PropRow prop="mode" desc="What the picker selects" t={t} vertical>
                  <ChipGroup<PickerMode>
                    options={[
                      { label: 'Date',     value: 'date'     },
                      { label: 'Time',     value: 'time'     },
                      { label: 'DateTime', value: 'datetime' },
                      { label: 'Range',    value: 'range'    },
                      { label: 'Multi',    value: 'multi'    },
                      { label: 'Month',    value: 'month'    },
                      { label: 'Year',     value: 'year'     },
                    ]}
                    value={mode}
                    onChange={onModeChange}
                    t={t}
                  />
                </PropRow>

                {showCal && (
                  <PropRow prop="datePickerVariant" desc="Calendar or wheel style" t={t}>
                    <ChipGroup<DatePickerVariant>
                      options={[
                        { label: 'Calendar', value: 'calendar' },
                        { label: 'Wheel',    value: 'wheel'    },
                      ]}
                      value={dateVariant}
                      onChange={setDateV}
                      t={t}
                    />
                  </PropRow>
                )}

                {showTime && (
                  <PropRow prop="timePickerVariant" desc="Scroll wheel or analog clock" t={t}>
                    <ChipGroup<TimePickerVariant>
                      options={[
                        { label: 'Wheel', value: 'wheel' },
                        { label: 'Clock', value: 'clock' },
                      ]}
                      value={timeVariant}
                      onChange={setTimeV}
                      t={t}
                    />
                  </PropRow>
                )}

                {mode === 'multi' && (
                  <PropRow prop="maxMultiSelect" desc="Max selections (0 = unlimited)" t={t}>
                    <ChipGroup<string>
                      options={[
                        { label: '∞', value: '0' },
                        { label: '3', value: '3' },
                        { label: '5', value: '5' },
                        { label: '7', value: '7' },
                      ]}
                      value={String(maxMulti)}
                      onChange={(v) => setMaxMulti(Number(v))}
                      t={t}
                    />
                  </PropRow>
                )}

                <PropRow prop="confirmLabel" t={t}>
                  <ChipGroup<string>
                    options={[
                      { label: 'Confirm', value: 'Confirm' },
                      { label: 'Done',    value: 'Done'    },
                      { label: 'OK',      value: 'OK'      },
                      { label: 'Apply',   value: 'Apply'   },
                      { label: 'Save',    value: 'Save'    },
                    ]}
                    value={confirmLabel}
                    onChange={setConfirmLabel}
                    t={t}
                  />
                </PropRow>

                <PropRow prop="clearLabel" t={t}>
                  <ChipGroup<string>
                    options={[
                      { label: 'Clear',  value: 'Clear'  },
                      { label: 'Reset',  value: 'Reset'  },
                      { label: 'Remove', value: 'Remove' },
                    ]}
                    value={clearLabel}
                    onChange={setClearLabel}
                    t={t}
                  />
                </PropRow>
              </>
            )}

            {/* DATE tab */}
            {tab === 'date' && (
              <>
                <PropRow prop="firstDayOfWeek" desc="Week start day" t={t}>
                  <ChipGroup<'0'|'1'>
                    options={[
                      { label: 'Sunday (0)',  value: '0' },
                      { label: 'Monday (1)', value: '1' },
                    ]}
                    value={String(firstDay) as '0'|'1'}
                    onChange={(v) => setFirstDay(Number(v) as 0|1)}
                    t={t}
                  />
                </PropRow>

                <PropRow prop="highlightToday" desc="Ring on today's date" t={t}>
                  <Toggle value={highlightToday} onChange={setHighlightToday} t={t} />
                </PropRow>

                <PropRow prop="showWeekNumbers" desc="ISO week number column" t={t}>
                  <Toggle value={showWeekNums} onChange={setShowWeekNums} t={t} />
                </PropRow>

                <PropRow prop="minDate" desc="Disable before −14 days" t={t}>
                  <Toggle value={minEnabled} onChange={setMinEnabled} t={t} />
                </PropRow>

                <PropRow prop="maxDate" desc="Disable after +14 days" t={t}>
                  <Toggle value={maxEnabled} onChange={setMaxEnabled} t={t} />
                </PropRow>

                <PropRow prop="markedDates" desc="Coloured dots on specific dates" t={t}>
                  <Toggle value={showMarked} onChange={setShowMarked} t={t} />
                </PropRow>
              </>
            )}

            {/* TIME tab */}
            {tab === 'time' && (
              <>
                <PropRow prop="is24Hour" desc="24 h vs 12 h (AM/PM)" t={t}>
                  <Toggle value={is24} onChange={setIs24} t={t} />
                </PropRow>

                <PropRow prop="showSeconds" desc="Include seconds wheel" t={t}>
                  <Toggle value={showSec} onChange={setShowSec} t={t} />
                </PropRow>

                <PropRow prop="minuteInterval" desc="Minute step size" t={t}>
                  <ChipGroup<string>
                    options={[
                      { label: '1',  value: '1'  },
                      { label: '5',  value: '5'  },
                      { label: '10', value: '10' },
                      { label: '15', value: '15' },
                      { label: '30', value: '30' },
                    ]}
                    value={String(minInterval)}
                    onChange={(v) => setMinInterval(Number(v) as typeof minInterval)}
                    t={t}
                  />
                </PropRow>

                <PropRow prop="minTime" desc="Disable before 08:00" t={t}>
                  <Toggle value={minTimeOn} onChange={setMinTimeOn} t={t} />
                </PropRow>

                <PropRow prop="maxTime" desc="Disable after 20:00" t={t}>
                  <Toggle value={maxTimeOn} onChange={setMaxTimeOn} t={t} />
                </PropRow>
              </>
            )}

            {/* STYLE tab */}
            {tab === 'display' && (
              <>
                <PropRow prop="accentColor" desc="Primary selection colour" t={t} vertical>
                  <SwatchPicker presets={ACCENT_PRESETS} value={accent} onChange={setAccent} />
                </PropRow>

                <PropRow prop="darkMode" desc="Force dark colour palette" t={t}>
                  <Toggle value={dark} onChange={setDark} t={t} />
                </PropRow>

                <PropRow prop="inline" desc="Embed vs. modal sheet" t={t}>
                  <Toggle value={inline} onChange={setInline} t={t} />
                </PropRow>

                <PropRow prop="visible" desc="Show / hide the modal (when inline={false})" t={t}>
                  <Toggle value={visible} onChange={setVisible} t={t} />
                </PropRow>

                <PropRow prop="modalPosition" desc="Sheet anchor point (when inline={false})" t={t}>
                  <ChipGroup<PickerModalPosition>
                    options={[
                      { label: 'Top',    value: 'top'    },
                      { label: 'Center', value: 'center' },
                      { label: 'Bottom', value: 'bottom' },
                    ]}
                    value={modalPos}
                    onChange={setModalPos}
                    t={t}
                  />
                </PropRow>

                <PropRow prop="placeholder" desc="Trigger button (when inline={false})" t={t}>
                  <Toggle
                    value={Boolean(placeholder)}
                    onChange={(on) => setPlaceholder(on ? 'Select date' : '')}
                    t={t}
                  />
                </PropRow>

                <PropRow prop="disabled" desc="Dim and block all interaction" t={t}>
                  <Toggle value={disabled} onChange={setDisabled} t={t} />
                </PropRow>
              </>
            )}

            {/* LOCALE tab */}
            {tab === 'locale' && (
              <>
                <PropRow prop="locale" desc="BCP-47 language tag" t={t} vertical>
                  <Dropdown
                    options={[
                      { label: 'en-US — English (US)',   value: 'en-US' },
                      { label: 'en-GB — English (UK)',   value: 'en-GB' },
                      { label: 'fr-FR — Français',       value: 'fr-FR' },
                      { label: 'de-DE — Deutsch',        value: 'de-DE' },
                      { label: 'es-ES — Español',        value: 'es-ES' },
                      { label: 'ja-JP — 日本語',          value: 'ja-JP' },
                      { label: 'zh-CN — 中文 (简体)',      value: 'zh-CN' },
                      { label: 'ar-SA — العربية',         value: 'ar-SA' },
                      { label: 'hi-IN — हिन्दी',          value: 'hi-IN' },
                      { label: 'pt-BR — Português (BR)', value: 'pt-BR' },
                      { label: 'ko-KR — 한국어',           value: 'ko-KR' },
                      { label: 'ru-RU — Русский',        value: 'ru-RU' },
                      { label: 'it-IT — Italiano',       value: 'it-IT' },
                      { label: 'nl-NL — Nederlands',     value: 'nl-NL' },
                      { label: 'pl-PL — Polski',         value: 'pl-PL' },
                      { label: 'sv-SE — Svenska',        value: 'sv-SE' },
                      { label: 'tr-TR — Türkçe',         value: 'tr-TR' },
                      { label: 'he-IL — עברית',          value: 'he-IL' },
                    ]}
                    value={locale}
                    onChange={setLocale}
                    t={t}
                  />
                </PropRow>

                <PropRow prop="timezone" desc="IANA time-zone identifier" t={t} vertical>
                  <Dropdown
                    options={[
                      { label: '(Device default)',     value: ''                    },
                      { label: 'UTC',                  value: 'UTC'                 },
                      { label: 'America/New_York',     value: 'America/New_York'    },
                      { label: 'America/Chicago',      value: 'America/Chicago'     },
                      { label: 'America/Denver',       value: 'America/Denver'      },
                      { label: 'America/Los_Angeles',  value: 'America/Los_Angeles' },
                      { label: 'America/Sao_Paulo',    value: 'America/Sao_Paulo'   },
                      { label: 'Europe/London',        value: 'Europe/London'       },
                      { label: 'Europe/Paris',         value: 'Europe/Paris'        },
                      { label: 'Europe/Berlin',        value: 'Europe/Berlin'       },
                      { label: 'Europe/Moscow',        value: 'Europe/Moscow'       },
                      { label: 'Africa/Cairo',         value: 'Africa/Cairo'        },
                      { label: 'Asia/Dubai',           value: 'Asia/Dubai'          },
                      { label: 'Asia/Kolkata',         value: 'Asia/Kolkata'        },
                      { label: 'Asia/Bangkok',         value: 'Asia/Bangkok'        },
                      { label: 'Asia/Singapore',       value: 'Asia/Singapore'      },
                      { label: 'Asia/Shanghai',        value: 'Asia/Shanghai'       },
                      { label: 'Asia/Tokyo',           value: 'Asia/Tokyo'          },
                      { label: 'Asia/Seoul',           value: 'Asia/Seoul'          },
                      { label: 'Australia/Sydney',     value: 'Australia/Sydney'    },
                      { label: 'Pacific/Auckland',     value: 'Pacific/Auckland'    },
                    ]}
                    value={timezone}
                    onChange={setTimezone}
                    t={t}
                  />
                </PropRow>
              </>
            )}
          </Card>
          )}
        </ScrollView>
        )}
      </SafeAreaView>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Global styles
// ─────────────────────────────────────────────────────────────────────────────

const toastSt = StyleSheet.create({
  wrap:    { paddingHorizontal: 16, paddingVertical: 10 },
  inner:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  dot:     { width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.22)', justifyContent: 'center', alignItems: 'center' },
  dotText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  text:    { color: '#fff', fontWeight: '600', fontSize: 13 },
});

const appSt = StyleSheet.create({
  root:        { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  title:       { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  subtitle:    { fontSize: 11, fontWeight: '400', marginTop: 2, letterSpacing: 0.1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  scroll:      { paddingHorizontal: 14, paddingTop: 14 },
});
