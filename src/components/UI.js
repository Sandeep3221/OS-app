import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo, Animated, Pressable, ScrollView, StyleSheet,
  Text, TextInput, View, useWindowDimensions,
} from 'react-native';
import { colors, motion, shared, type } from '../utils/theme';

const MotionContext = createContext(true);
export function MotionProvider({ children }) {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (mounted) setReduced(value); });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => { mounted = false; subscription.remove(); };
  }, []);
  return <MotionContext.Provider value={reduced}>{children}</MotionContext.Provider>;
}
export const useReducedMotion = () => useContext(MotionContext);

// Resolution-independent native geometry; no icon font or new dependency.
export function Icon({ name, color = colors.muted, size = 24 }) {
  const stroke = { borderColor: color, borderWidth: 1.7 };
  const bar = { backgroundColor: color, borderRadius: 1 };
  const play = <View style={{ width: 0, height: 0, borderTopWidth: 7, borderBottomWidth: 7, borderLeftWidth: 11, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: color }} />;
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center', transform: [{ scale: size / 24 }] }}>
        {name === 'home' && <><View style={[stroke, { position: 'absolute', width: 13, height: 13, borderRightWidth: 0, borderBottomWidth: 0, transform: [{ translateY: -3 }, { rotate: '45deg' }] }]} /><View style={[stroke, { width: 15, height: 13, marginTop: 6, borderTopWidth: 0, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 }]} /></>}
        {name === 'processes' && <View style={{ gap: 5 }}>{[0, 1, 2].map((n) => <View key={n} style={{ flexDirection: 'row', gap: 4 }}><View style={[bar, { width: 2, height: 2 }]} /><View style={[bar, { width: 13, height: 2 }]} /></View>)}</View>}
        {(name === 'simulation' || name === 'play') && <View style={{ marginLeft: 3 }}>{play}</View>}
        {name === 'pause' && <View style={{ flexDirection: 'row', gap: 5 }}>{[0, 1].map((n) => <View key={n} style={[bar, { width: 4, height: 16 }]} />)}</View>}
        {(name === 'previous' || name === 'next') && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, transform: [{ rotate: name === 'previous' ? '180deg' : '0deg' }] }}>{play}<View style={[bar, { width: 2, height: 16 }]} /></View>}
        {name === 'results' && <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>{[8, 17, 12].map((height) => <View key={height} style={[stroke, { width: 4, height, borderRadius: 1 }]} />)}</View>}
        {name === 'learn' && <View style={{ flexDirection: 'row', gap: 2 }}>{[0, 1].map((n) => <View key={n} style={[stroke, { width: 9, height: 16, borderRadius: 2 }]} />)}</View>}
        {name === 'cpu' && <><View style={[stroke, { width: 16, height: 16, borderRadius: 3, padding: 3 }]}><View style={[stroke, { flex: 1, borderRadius: 1 }]} /></View>{[0, 90, 180, 270].map((angle) => <View key={angle} style={{ position: 'absolute', width: 24, height: 24, alignItems: 'center', transform: [{ rotate: `${angle}deg` }] }}><View style={{ flexDirection: 'row', gap: 4 }}><View style={[bar, { width: 2, height: 3 }]} /><View style={[bar, { width: 2, height: 3 }]} /></View></View>)}</>}
        {(name === 'chevron' || name === 'down') && <View style={[stroke, { width: 7, height: 7, borderLeftWidth: 0, borderBottomWidth: 0, transform: [{ rotate: name === 'down' ? '135deg' : '45deg' }] }]} />}
        {name === 'plus' && <><View style={[bar, { width: 16, height: 2 }]} /><View style={[bar, { position: 'absolute', width: 2, height: 16 }]} /></>}
        {name === 'edit' && <View style={[stroke, { width: 5, height: 17, borderRadius: 1, transform: [{ rotate: '40deg' }] }]} />}
        {name === 'delete' && <><View style={[bar, { width: 16, height: 2, marginBottom: 2 }]} /><View style={[stroke, { width: 12, height: 13, borderTopWidth: 0, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 }]} /><View style={[bar, { width: 6, height: 2, position: 'absolute', top: 2 }]} /></>}
        {name === 'reset' && <><View style={[stroke, { width: 16, height: 16, borderRadius: 8, borderLeftColor: 'transparent' }]} /><View style={{ position: 'absolute', top: 2, left: 2, borderRightWidth: 6, borderTopWidth: 4, borderBottomWidth: 4, borderRightColor: color, borderTopColor: 'transparent', borderBottomColor: 'transparent' }} /></>}
      </View>
    </View>
  );
}

export function Button({ title, onPress, secondary = false, disabled = false, danger = false, style, accessibilityLabel }) {
  const [focused, setFocused] = useState(false);
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={accessibilityLabel || title} accessibilityState={{ disabled }} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={({ pressed }) => [styles.button, secondary ? styles.secondary : styles.primary, danger && styles.danger, focused && styles.focused, focused && !secondary && !danger && { borderColor: colors.buttonText }, disabled && styles.disabled, pressed && !disabled && styles.pressed, style]}>
      <Text style={[styles.buttonText, { color: danger ? colors.danger : secondary ? colors.accent : colors.buttonText }]}>{title}</Text>
    </Pressable>
  );
}

export function IconButton({ icon, label, onPress, disabled = false, primary = false, danger = false, style }) {
  const [focused, setFocused] = useState(false);
  return <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    style={({ pressed }) => [styles.iconButton, primary && styles.playButton, focused && styles.focused, focused && primary && { borderColor: colors.buttonText }, disabled && styles.disabled, pressed && styles.pressed, style]}>
    <Icon name={icon} size={primary ? 28 : 22} color={primary ? colors.buttonText : danger ? colors.danger : colors.text} />
  </Pressable>;
}

export function Choice({ label, selected, onPress, color = colors.accent, style, compact = false, accessibilityLabel }) {
  return <Pressable onPress={onPress} accessibilityRole="radio" accessibilityLabel={accessibilityLabel || label} accessibilityState={{ checked: selected }}
    style={({ pressed }) => [styles.choice, compact && styles.compactChoice, { borderColor: selected ? color : colors.inputBorder, backgroundColor: selected ? (color === colors.backgroundQueue ? colors.backgroundTint : colors.foregroundTint) : colors.surface }, pressed && styles.pressed, style]}>
    {!compact && <View style={[styles.radio, { borderColor: selected ? color : colors.muted }]}>{selected && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />}</View>}
    <Text style={[shared.label, { color: selected ? color : colors.muted, fontWeight: selected ? '700' : '500', flexShrink: 1 }]}>{label}</Text>
  </Pressable>;
}

export function Field({ label, value, onChangeText, error, hint, style, ...props }) {
  const [focused, setFocused] = useState(false);
  return <View style={[{ gap: 8 }, style]}>
    <Text style={shared.label}>{label}</Text>
    <TextInput accessibilityLabel={label} accessibilityHint={error || hint} value={value} onChangeText={onChangeText} placeholderTextColor={colors.muted} keyboardType="number-pad" selectionColor={colors.accent}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={[styles.input, focused && styles.focused, error && { borderColor: colors.danger }]} {...props} />
    {!!error && <Text accessibilityLiveRegion="polite" style={shared.error}>{error}</Text>}
    {!!hint && !error && <Text style={shared.caption}>{hint}</Text>}
  </View>;
}

export function Page({ children, contentContainerStyle, ...props }) {
  const { width } = useWindowDimensions();
  return <ScrollView style={{ flex: 1 }} contentContainerStyle={[shared.page, { paddingHorizontal: width < 360 ? 16 : width >= 600 ? 32 : 24 }, contentContainerStyle]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} {...props}>{children}</ScrollView>;
}

export function Header({ title, subtitle }) {
  return <View style={{ gap: 8 }}><Text accessibilityRole="header" style={shared.title}>{title}</Text>{!!subtitle && <Text style={shared.subtitle}>{subtitle}</Text>}</View>;
}

export function Reveal({ children }) {
  const reduced = useReducedMotion();
  const opacity = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    const animation = Animated.timing(opacity, { toValue: 1, duration: reduced ? 0 : motion.reveal, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [opacity, reduced]);
  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}

export function Disclosure({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return <View style={styles.disclosure}>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={({ pressed }) => [styles.disclosureButton, pressed && styles.pressed]}>
      <Text style={[shared.label, { flex: 1 }]}>{title}</Text><Icon name={open ? 'down' : 'chevron'} size={20} />
    </Pressable>
    {open && <Reveal><View style={styles.disclosureBody}>{children}</View></Reveal>}
  </View>;
}

export function Progress({ value, max, label }) {
  const reduced = useReducedMotion();
  const scale = useRef(new Animated.Value(value / max || 0)).current;
  useEffect(() => {
    const animation = Animated.timing(scale, { toValue: value / max || 0, duration: reduced ? 0 : motion.reveal, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [value, max, reduced, scale]);
  return <View accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max, now: value }} style={styles.progressTrack}>
    <Animated.View style={[styles.progressFill, { transform: [{ scaleX: scale }], transformOrigin: 'left center' }]} />
  </View>;
}

export function EmptyState({ title, detail, onPress, action = 'Set up processes' }) {
  return <Page><Header title={title} /><View style={{ paddingVertical: 48, gap: 24 }}><Icon name="cpu" size={48} color={colors.accent} /><Text style={shared.body}>{detail}</Text><Button title={action} onPress={onPress} /></View></Page>;
}

const styles = StyleSheet.create({
  button: { minHeight: 52, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent' },
  primary: { backgroundColor: colors.accent },
  secondary: { backgroundColor: colors.raised },
  danger: { backgroundColor: 'transparent' },
  buttonText: { ...type.label, fontSize: 16, textAlign: 'center' },
  pressed: { opacity: 0.55 },
  disabled: { opacity: 0.38 },
  focused: { borderColor: colors.accent },
  iconButton: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: 'transparent' },
  playButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accent },
  choice: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderWidth: 1, borderRadius: 10 },
  compactChoice: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 8 },
  radio: { width: 18, height: 18, borderWidth: 1.5, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  input: { backgroundColor: colors.surface, color: colors.text, minHeight: 52, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 18, fontVariant: ['tabular-nums'] },
  disclosure: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  disclosureButton: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16 },
  disclosureBody: { gap: 16, paddingBottom: 20 },
  progressTrack: { height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: colors.accent, borderRadius: 2 },
});
