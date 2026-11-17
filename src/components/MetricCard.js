import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { colors, shared } from '../utils/theme';

export default function MetricCard({ label, value, unit }) {
  const { fontScale } = useWindowDimensions();
  return (
    <View style={[styles.metric, fontScale > 1.3 && { flexBasis: '100%' }]}>
      <Text style={shared.caption}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {!!unit && <Text style={shared.caption}>{unit}</Text>}
    </View>
  );
}
const styles = StyleSheet.create({
  metric: { flexGrow: 1, flexBasis: '28%', minWidth: 88, gap: 4 },
  value: { color: colors.text, fontSize: 26, lineHeight: 34, fontWeight: '600', fontVariant: ['tabular-nums'] },
});
