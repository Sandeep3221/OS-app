import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { colors, queueColor, queueName, shared } from '../utils/theme';
import { IconButton } from './UI';

export default function ProcessCard({ process, onEdit, onDelete }) {
  const { fontScale, width } = useWindowDimensions();
  const stacked = fontScale > 1.1 || width < 375;
  return (
    <View style={styles.row}>
      <View style={[styles.identity, { borderLeftColor: queueColor(process.queue) }]}>
        <Text style={shared.heading}>{process.id}</Text>
        <Text style={[shared.caption, { color: queueColor(process.queue) }]}>{queueName(process.queue)}</Text>
      </View>
      <View style={[styles.details, stacked && { flexBasis: '100%' }]}>
        <View style={styles.value}><Text style={shared.caption}>Arrival</Text><Text style={[shared.label, shared.number]}>{process.arrival}</Text></View>
        <View style={styles.value}><Text style={shared.caption}>Burst</Text><Text style={[shared.label, shared.number]}>{process.burst}</Text></View>
        <View style={styles.actions}>
          <IconButton icon="edit" label={`Edit ${process.id}`} onPress={onEdit} />
          <IconButton icon="delete" label={`Delete ${process.id}`} danger onPress={onDelete} />
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  row: { paddingVertical: 16, paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  identity: { gap: 4, borderLeftWidth: 3, paddingLeft: 12, flexGrow: 1 },
  details: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  value: { gap: 4, alignItems: 'flex-end', minWidth: 38 },
  actions: { flexDirection: 'row', gap: 8 },
});
