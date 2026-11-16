import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import GanttChart from '../components/GanttChart';
import MetricCard from '../components/MetricCard';
import { Badge, Button, EmptyState, Header, Page } from '../components/UI';
import {
  colors,
  format,
  processColor,
  queueColor,
  queueName,
  shared,
} from '../utils/theme';

const columns = [
  ['id', 'ID', 62],
  ['queue', 'Queue', 120],
  ['arrival', 'AT', 62],
  ['burst', 'BT', 62],
  ['completion', 'CT', 62],
  ['turnaround', 'TAT', 66],
  ['waiting', 'WT', 62],
  ['response', 'RT', 62],
];
const comparisons = [
  ['averageWaiting', 'Average waiting'],
  ['averageTurnaround', 'Average turnaround'],
  ['averageResponse', 'Average response'],
];

export default function ResultsScreen({ result, navigate }) {
  if (!result)
    return (
      <EmptyState
        title="No results yet"
        detail="Run a workload to see its Gantt chart, process statistics, and queue comparison. Results are cleared whenever inputs change."
        onPress={() => navigate('processes')}
      />
    );
  const { metrics, queueMetrics } = result;
  return (
    <Page>
      <Header
        eyebrow="03 / MEASURE THE OUTCOME"
        title="Results & analysis"
        subtitle={`Complete execution · ${result.processes.length} processes · Quantum ${result.timeQuantum}u`}
      />
      <View style={shared.wrap}>
        <Badge label="ALL PROCESSES COMPLETE" color={colors.green} />
        <Badge label="Time starts at 0" color={colors.muted} />
      </View>
      <View style={[shared.wrap, { gap: 12 }]}>
        <MetricCard
          label="Average waiting"
          value={format(metrics.averageWaiting)}
          unit="time units"
        />
        <MetricCard
          label="Average turnaround"
          value={format(metrics.averageTurnaround)}
          unit="time units"
          color={colors.purple}
        />
        <MetricCard
          label="Average response"
          value={format(metrics.averageResponse)}
          unit="time units"
          color={colors.amber}
        />
        <MetricCard
          label="CPU utilization"
          value={`${format(metrics.cpuUtilization, 1)}%`}
          unit={`${metrics.busyTime} busy time units`}
          color={colors.green}
        />
        <MetricCard
          label="Throughput"
          value={format(metrics.throughput, 3)}
          unit="processes per time unit"
        />
        <MetricCard
          label="Total makespan"
          value={metrics.makespan}
          unit="time units, including idle"
          color={colors.text}
        />
      </View>
      <View style={shared.section}>
        <Text accessibilityRole="header" style={shared.heading}>
          Execution timeline
        </Text>
        <GanttChart timeline={result.timeline} />
      </View>
      <View style={shared.section}>
        <Text accessibilityRole="header" style={shared.heading}>
          Process statistics
        </Text>
        <Text style={shared.caption}>
          Swipe across for all metrics. All values are in logical time units.
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          contentContainerStyle={{ paddingBottom: 12 }}
        >
          <View style={styles.table}>
            <View style={[styles.tableRow, { backgroundColor: colors.raised }]}>
              {columns.map(([key, label, width]) => (
                <Text key={key} style={[styles.cell, shared.label, { width }]}>
                  {label}
                </Text>
              ))}
            </View>
            {result.processes.map((p) => (
              <View key={p.id} style={styles.tableRow}>
                {columns.map(([key, , width]) => (
                  <Text
                    key={key}
                    style={[
                      styles.cell,
                      {
                        width,
                        color:
                          key === 'id'
                            ? processColor(p.id)
                            : key === 'queue'
                              ? queueColor(p.queue)
                              : colors.text,
                      },
                    ]}
                  >
                    {key === 'queue' ? queueName(p.queue) : p[key]}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
        <Text style={shared.caption}>
          AT arrival · BT burst · CT completion{'\n'}TAT turnaround · WT waiting
          · RT response
        </Text>
      </View>
      <View style={shared.section}>
        <Text accessibilityRole="header" style={shared.heading}>
          Queue comparison
        </Text>
        <View style={shared.wrap}>
          {['foreground', 'background'].map((queue) => (
            <Badge
              key={queue}
              label={`${queueName(queue)}: ${queueMetrics[queue].count}`}
              color={queueColor(queue)}
            />
          ))}
        </View>
        {comparisons.map(([key, label]) => {
          const max = Math.max(
            queueMetrics.foreground[key] || 0,
            queueMetrics.background[key] || 0,
            1,
          );
          return (
            <View key={key} style={shared.card}>
              <Text style={shared.label}>{label}</Text>
              {['foreground', 'background'].map((queue) => {
                const value = queueMetrics[queue][key];
                const color = queueColor(queue);
                return (
                  <View key={queue} style={{ gap: 8 }}>
                    <View
                      style={[
                        shared.row,
                        { justifyContent: 'space-between', flexWrap: 'wrap' },
                      ]}
                    >
                      <Text style={[shared.caption, { color }]}>
                        {queueName(queue)}
                      </Text>
                      <Text style={shared.caption}>
                        {value === null
                          ? 'No processes in this queue'
                          : `${format(value)}u`}
                      </Text>
                    </View>
                    {value !== null && (
                      <View
                        accessible
                        accessibilityLabel={`${queueName(queue)} ${label.toLowerCase()}: ${format(value)} time units`}
                        style={styles.track}
                      >
                        <View
                          style={{
                            backgroundColor: color,
                            width: `${(value / max) * 100}%`,
                            height: 8,
                            borderRadius: 4,
                          }}
                        />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}
        <Text style={shared.body}>
          These values describe this workload only. Arrival times, burst
          lengths, and the quantum affect the outcome; one queue is not
          universally better. Each metric uses its own shared comparison scale.
        </Text>
      </View>
      <View style={shared.card}>
        <Text style={shared.heading}>How the numbers work</Text>
        <Text style={shared.body}>
          TAT = CT − AT{'\n'}WT = TAT − BT{'\n'}RT = First CPU start − AT{'\n'}
          Utilization = Busy time ÷ Makespan × 100{'\n'}Throughput = Completed
          processes ÷ Makespan
        </Text>
        <Text style={shared.caption}>
          Makespan runs from time zero to the last completion, including initial
          idle time. This model assumes zero context-switch cost.
        </Text>
      </View>
      <Button
        title="Replay Simulation"
        onPress={() => navigate('simulation')}
      />
      <Button
        title="Edit Workload"
        secondary
        onPress={() => navigate('processes')}
      />
    </Page>
  );
}
const styles = StyleSheet.create({
  table: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  cell: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  track: {
    backgroundColor: colors.raised,
    borderRadius: 4,
    height: 8,
    overflow: 'hidden',
  },
});
