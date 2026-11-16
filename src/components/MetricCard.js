import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, shared } from '../utils/theme';

export default function MetricCard({
  label,
  value,
  unit,
  color = colors.cyan,
}) {
  return (
    <View style={styles.card}>
      <Text style={shared.caption}>{label}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
      {!!unit && <Text style={shared.caption}>{unit}</Text>}
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  value: { fontSize: 29, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
