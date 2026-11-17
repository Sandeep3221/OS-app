import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import GanttChart from '../components/GanttChart';
import MetricCard from '../components/MetricCard';
import { Button, Disclosure, EmptyState, Header, Page } from '../components/UI';
import { colors, format, queueColor, queueName, shared } from '../utils/theme';

const columns = [
  ['arrival', 'Arrival'], ['burst', 'Burst'], ['completion', 'Completion'],
  ['turnaround', 'Turnaround'], ['waiting', 'Waiting'], ['response', 'Response'],
];
const comparisons = [
  ['averageWaiting', 'Average waiting'],
  ['averageTurnaround', 'Average turnaround'],
  ['averageResponse', 'Average response'],
];

export default function ResultsScreen({ result, navigate }) {
  const { fontScale } = useWindowDimensions();
  if (!result)
    return <EmptyState title="No results yet" detail="Run a workload to see the execution timeline and process statistics. Results clear when inputs change." onPress={() => navigate('processes')} />;
  const { metrics, queueMetrics } = result;
  return (
    <Page>
      <Header title="Results" subtitle={`${result.processes.length} processes completed · Quantum ${result.timeQuantum}u`} />
      <View style={shared.card}>
        <Text accessibilityRole="header" style={shared.label}>Average time <Text style={shared.caption}>· logical units</Text></Text>
        <View style={[shared.wrap, { gap: 12, paddingVertical: 8 }]}>
          <MetricCard label="Waiting" value={format(metrics.averageWaiting)} />
          <MetricCard label="Turnaround" value={format(metrics.averageTurnaround)} />
          <MetricCard label="Response" value={format(metrics.averageResponse)} />
        </View>
        <View style={shared.divider} />
        <View style={styles.summaryRow}><View style={{ flex: 1, gap: 4 }}><Text style={shared.label}>CPU utilization</Text><Text style={shared.caption}>{metrics.busyTime} busy time units</Text></View><Text style={[styles.summaryValue, { color: colors.accent }]}>{format(metrics.cpuUtilization, 1)}%</Text></View>
        <View style={styles.summaryRow}><View style={{ flex: 1, gap: 4 }}><Text style={shared.label}>Throughput</Text><Text style={shared.caption}>Processes per time unit</Text></View><Text style={styles.summaryValue}>{format(metrics.throughput, 3)}</Text></View>
        <View style={styles.summaryRow}><View style={{ flex: 1, gap: 4 }}><Text style={shared.label}>Total makespan</Text><Text style={shared.caption}>From time 0, including idle</Text></View><Text style={styles.summaryValue}>{metrics.makespan}<Text style={shared.caption}> u</Text></Text></View>
      </View>
      <View style={shared.section}>
        <Text accessibilityRole="header" style={shared.heading}>Execution timeline</Text>
        <GanttChart timeline={result.timeline} />
      </View>
      <View style={shared.section}>
        <View style={[shared.row, { justifyContent: 'space-between', flexWrap: 'wrap' }]}><Text accessibilityRole="header" style={shared.heading}>Process statistics</Text><Text style={shared.caption}>Time units</Text></View>
        <View style={shared.group}>
          {result.processes.map((p) => <View key={p.id} style={styles.process}>
            <View style={[shared.row, { justifyContent: 'space-between', flexWrap: 'wrap' }]}>
              <Text style={shared.heading}>{p.id}</Text><Text style={[shared.caption, { color: queueColor(p.queue) }]}>{queueName(p.queue)}</Text>
            </View>
            <View style={styles.statistics}>
              {columns.map(([key, label]) => <View key={key} accessible accessibilityLabel={`${p.id} ${label}: ${p[key]} time units`} style={[styles.stat, fontScale > 1.4 && { flexBasis: '45%' }]}>
                <Text style={shared.caption}>{label}</Text><Text style={[shared.label, shared.number]}>{p[key]}</Text>
              </View>)}
            </View>
          </View>)}
        </View>
      </View>
      <View style={shared.section}>
        <Text accessibilityRole="header" style={shared.heading}>Queue comparison</Text>
        <View style={shared.wrap}>
          {['foreground', 'background'].map((queue) => <Text key={queue} style={[shared.caption, { color: queueColor(queue) }]}>{queueName(queue)} · {queueMetrics[queue].count} processes</Text>)}
        </View>
        <View style={shared.group}>
          {comparisons.map(([key, label]) => {
            const max = Math.max(queueMetrics.foreground[key] || 0, queueMetrics.background[key] || 0, 1);
            return <View key={key} style={styles.comparison}>
              <Text style={shared.label}>{label}</Text>
              {['foreground', 'background'].map((queue) => {
                const value = queueMetrics[queue][key];
                const color = queueColor(queue);
                return <View key={queue} style={{ gap: 8 }}>
                  <View style={[shared.row, { justifyContent: 'space-between', flexWrap: 'wrap' }]}>
                    <Text style={[shared.caption, { color }]}>{queueName(queue)}</Text>
                    <Text style={[shared.caption, shared.number]}>{value === null ? 'No processes in this queue' : `${format(value)}u`}</Text>
                  </View>
                  {value !== null && <View accessible accessibilityLabel={`${queueName(queue)} ${label.toLowerCase()}: ${format(value)} time units`} style={styles.track}><View style={{ backgroundColor: color, width: `${(value / max) * 100}%`, height: 6, borderRadius: 3 }} /></View>}
                </View>;
              })}
            </View>;
          })}
        </View>
      </View>
      <Disclosure title="How the numbers work">
        <Text style={shared.body}>TAT = CT − AT{'\n'}WT = TAT − BT{'\n'}RT = First CPU start − AT{'\n'}Utilization = Busy time ÷ Makespan × 100{'\n'}Throughput = Completed processes ÷ Makespan</Text>
        <Text style={shared.caption}>AT arrival · BT burst · CT completion · TAT turnaround · WT waiting · RT response</Text>
        <Text style={shared.body}>Makespan runs from time zero to the last completion, including initial idle time. This model assumes zero context-switch cost.</Text>
        <Text style={shared.body}>These values describe this workload only. Arrival times, burst lengths, and the quantum affect the outcome; one queue is not universally better. Each metric uses its own shared comparison scale.</Text>
      </Disclosure>
      <View style={{ gap: 12 }}>
        <Button title="Replay simulation" onPress={() => navigate('simulation')} />
        <Button title="Edit workload" secondary onPress={() => navigate('processes')} />
      </View>
    </Page>
  );
}
const styles = StyleSheet.create({
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingVertical: 4 },
  summaryValue: { color: colors.text, fontSize: 22, fontWeight: '600', fontVariant: ['tabular-nums'], flexShrink: 1 },
  process: { padding: 16, gap: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  statistics: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 16 },
  stat: { flexBasis: '28%', flexGrow: 1, minWidth: 80, gap: 4 },
  comparison: { padding: 16, gap: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  track: { backgroundColor: colors.raised, borderRadius: 3, height: 6, overflow: 'hidden' },
});
