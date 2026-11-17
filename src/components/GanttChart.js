import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { colors, queueColor, shared } from '../utils/theme';
import { Disclosure } from './UI';

export default function GanttChart({ timeline, time = Infinity }) {
  const { fontScale } = useWindowDimensions();
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
        <Text style={[shared.caption, { color: colors.foreground }]}>
          FG · Round Robin
        </Text>
        <Text style={[shared.caption, { color: colors.backgroundQueue }]}>
          BG · FCFS
        </Text>
        <Text style={shared.caption}>Idle</Text>
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
            const color = item.processId ? queueColor(item.queue) : colors.idle;
            return (
              <View
                accessible
                accessibilityLabel={`${item.processId || 'CPU idle'}, ${item.queue}, time ${item.start} to ${item.end}, ${item.end - item.start} units`}
                style={{
                  width: Math.max(
                    88 * fontScale,
                    Math.min(220 * fontScale, (item.end - item.start) * 24),
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
                    {item.processId || 'Idle'}
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
          Take a step to begin the timeline.
        </Text>
      )}
      <Disclosure title="How to read this timeline">
        <Text style={shared.body}>Swipe across to follow execution. Labels show exact logical times and durations; block widths are adjusted for readability. Each Round Robin quantum stays separate.</Text>
      </Disclosure>
    </View>
  );
}
const styles = StyleSheet.create({
  segment: {
    borderTopWidth: 3,
    borderRadius: 4,
    padding: 12,
    minHeight: 68,
    justifyContent: 'center',
    gap: 4,
  },
  markers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 7,
    paddingHorizontal: 2,
  },
});
