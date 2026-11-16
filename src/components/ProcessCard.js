import React from 'react';
import { Text, View } from 'react-native';
import {
  colors,
  processColor,
  queueColor,
  queueName,
  shared,
} from '../utils/theme';
import { Badge, Button } from './UI';

export default function ProcessCard({ process, onEdit, onDelete }) {
  return (
    <View
      style={[
        shared.card,
        { borderLeftWidth: 3, borderLeftColor: processColor(process.id) },
      ]}
    >
      <View
        style={[
          shared.row,
          { justifyContent: 'space-between', flexWrap: 'wrap' },
        ]}
      >
        <Text style={[shared.heading, { color: processColor(process.id) }]}>
          {process.id}
        </Text>
        <Badge
          label={queueName(process.queue)}
          color={queueColor(process.queue)}
        />
      </View>
      <Text style={shared.body}>
        Arrival <Text style={{ color: colors.text }}>{process.arrival}</Text> /
        Burst <Text style={{ color: colors.text }}>{process.burst}</Text> time
        units
      </Text>
      <View style={shared.row}>
        <Button
          title="Edit"
          accessibilityLabel={`Edit ${process.id}`}
          secondary
          onPress={onEdit}
          style={{ flex: 1 }}
        />
        <Button
          title="Delete"
          accessibilityLabel={`Delete ${process.id}`}
          danger
          onPress={onDelete}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}
