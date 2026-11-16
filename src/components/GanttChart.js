import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { colors, processColor, shared } from '../utils/theme';

export default function GanttChart({ timeline, time = Infinity }) {
  const data = useMemo(
    () =>
      timeline
        .filter((s) => s.start < time)
        .map((s) => ({ ...s, end: Math.min(s.end, time) })),
    [timeline, time],
  );
  return (
    <View style={shared.section}>
      <View style={shared.wrap}>
        <Text style={[shared.caption, { color: colors.cyan }]}>
          FG · Round Robin
        </Text>
        <Text style={[shared.caption, { color: colors.purple }]}>
          BG · FCFS
        </Text>
        <Text style={shared.caption}>IDLE · No ready work</Text>
      </View>
      {data.length ? (
        <FlatList
          horizontal
          data={data}
          keyExtractor={(item) => `${item.start}-${item.processId}`}
          showsHorizontalScrollIndicator
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={3}
          contentContainerStyle={{ paddingBottom: 10 }}
          renderItem={({ item }) => {
            const color = processColor(item.processId);
            return (
              <View
                accessible
                accessibilityLabel={`${item.processId || 'CPU idle'}, ${item.queue}, time ${item.start} to ${item.end}, ${item.end - item.start} units`}
                style={{
                  width: Math.max(
                    88,
                    Math.min(220, (item.end - item.start) * 24),
                  ),
                  marginRight: 4,
                }}
              >
                <View
                  style={[
                    styles.segment,
                    {
                      borderTopColor: color,
                      backgroundColor:
                        item.queue === 'foreground'
                          ? colors.foregroundTint
                          : item.queue === 'background'
                            ? colors.backgroundTint
                            : colors.raised,
                    },
                  ]}
                >
                  <Text style={[shared.label, { color }]}>
                    {item.processId || 'IDLE'}
                  </Text>
                  <Text style={shared.caption}>
                    {item.queue === 'foreground'
                      ? 'FG'
                      : item.queue === 'background'
                        ? 'BG'
                        : '—'}{' '}
                    · {item.end - item.start}u
                  </Text>
                </View>
                <View style={styles.markers}>
                  <Text style={shared.caption}>{item.start}</Text>
                  <Text style={shared.caption}>{item.end}</Text>
                </View>
              </View>
            );
          }}
        />
      ) : (
        <Text style={shared.body}>
          Execution will appear here after the first step.
        </Text>
      )}
      <Text style={shared.caption}>
        Time in logical units · Swipe horizontally. Widths are adjusted for
        readability; labels give exact durations. Each RR quantum stays
        separate.
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  segment: {
    borderTopWidth: 3,
    borderRadius: 8,
    padding: 12,
    minHeight: 74,
    justifyContent: 'center',
    gap: 5,
  },
  markers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 7,
    paddingHorizontal: 2,
  },
});
