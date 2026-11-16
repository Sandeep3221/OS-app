import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, shared } from '../utils/theme';

// Small native line icons avoid an icon font download and extra native packages.
export function Icon({ name, color = colors.muted, size = 22 }) {
  const line = { backgroundColor: color, borderRadius: 2 };
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {name === 'home' && (
        <View
          style={{
            width: 18,
            height: 18,
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 4,
          }}
        >
          {[0, 1, 2, 3].map((n) => (
            <View
              key={n}
              style={{
                width: 7,
                height: 7,
                borderWidth: 1.5,
                borderColor: color,
                borderRadius: 2,
              }}
            />
          ))}
        </View>
      )}
      {name === 'processes' && (
        <View style={{ gap: 4 }}>
          {[0, 1, 2].map((n) => (
            <View key={n} style={{ flexDirection: 'row', gap: 4 }}>
              <View style={[line, { width: 3, height: 3 }]} />
              <View style={[line, { width: 13, height: 3 }]} />
            </View>
          ))}
        </View>
      )}
      {name === 'simulation' && (
        <View
          style={{
            width: 0,
            height: 0,
            borderTopWidth: 8,
            borderBottomWidth: 8,
            borderLeftWidth: 13,
            borderTopColor: 'transparent',
            borderBottomColor: 'transparent',
            borderLeftColor: color,
            marginLeft: 3,
          }}
        />
      )}
      {name === 'results' && (
        <View
          style={{
            height: 20,
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 3,
          }}
        >
          {[9, 18, 13].map((height) => (
            <View key={height} style={[line, { width: 4, height }]} />
          ))}
        </View>
      )}
      {name === 'learn' && (
        <View style={{ flexDirection: 'row', gap: 2 }}>
          {[0, 1].map((n) => (
            <View
              key={n}
              style={{
                width: 9,
                height: 16,
                borderColor: color,
                borderWidth: 1.5,
                borderRadius: 2,
              }}
            />
          ))}
        </View>
      )}
      {name === 'cpu' && (
        <View
          style={{
            width: size - 5,
            height: size - 5,
            borderWidth: 2,
            borderColor: color,
            borderRadius: 5,
            padding: 4,
          }}
        >
          <View
            style={{
              flex: 1,
              borderWidth: 1.5,
              borderColor: color,
              borderRadius: 2,
            }}
          />
        </View>
      )}
    </View>
  );
}

export function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
  danger = false,
  style,
  accessibilityLabel,
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        secondary ? styles.secondary : styles.primary,
        danger && styles.danger,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          {
            color: danger
              ? colors.red
              : secondary
                ? colors.text
                : colors.buttonText,
          },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export function Choice({
  label,
  selected,
  onPress,
  color = colors.cyan,
  style,
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => [
        styles.choice,
        {
          borderColor: selected ? color : colors.border,
          backgroundColor: selected ? colors.raised : colors.surface,
        },
        pressed && styles.pressed,
        style,
      ]}
    >
      <View
        style={[styles.radio, { borderColor: selected ? color : colors.muted }]}
      >
        {selected && (
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 4,
              backgroundColor: color,
            }}
          />
        )}
      </View>
      <Text
        style={[
          shared.label,
          { color: selected ? color : colors.muted, flexShrink: 1 },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Field({ label, value, onChangeText, error, hint, ...props }) {
  return (
    <View style={{ gap: 7 }}>
      <Text style={shared.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={hint}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={colors.muted}
        keyboardType="number-pad"
        selectionColor={colors.cyan}
        style={[styles.input, error && { borderColor: colors.red }]}
        {...props}
      />
      {!!error && (
        <Text accessibilityLiveRegion="polite" style={shared.error}>
          {error}
        </Text>
      )}
      {!!hint && !error && <Text style={shared.caption}>{hint}</Text>}
    </View>
  );
}

export function Page({ children, ...props }) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={shared.page}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      {...props}
    >
      {children}
    </ScrollView>
  );
}

export function Header({ eyebrow, title, subtitle }) {
  return (
    <View style={{ gap: 8 }}>
      {!!eyebrow && <Text style={shared.eyebrow}>{eyebrow}</Text>}
      <Text accessibilityRole="header" style={shared.title}>
        {title}
      </Text>
      {!!subtitle && <Text style={shared.subtitle}>{subtitle}</Text>}
    </View>
  );
}

export function Badge({ label, color = colors.cyan }) {
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text style={{ color, fontSize: 12, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

export function EmptyState({
  title,
  detail,
  onPress,
  action = 'Set up processes',
}) {
  return (
    <Page>
      <Header eyebrow="MLQ SCHEDULER" title={title} />
      <View style={shared.card}>
        <Icon name="cpu" size={44} color={colors.cyan} />
        <Text style={shared.body}>{detail}</Text>
        <Button title={action} onPress={onPress} />
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  primary: { backgroundColor: colors.cyan, borderColor: colors.cyan },
  secondary: { backgroundColor: colors.raised, borderColor: colors.border },
  danger: { backgroundColor: colors.surface, borderColor: colors.red },
  buttonText: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
  choice: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  radio: {
    width: 17,
    height: 17,
    borderWidth: 1.5,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: colors.background,
    color: colors.text,
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 17,
    fontVariant: ['tabular-nums'],
  },
  badge: {
    borderWidth: 1,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
});
