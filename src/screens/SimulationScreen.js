import React, { useEffect, useState } from 'react';
import { AppState, ScrollView, StyleSheet, Text, View } from 'react-native';
import GanttChart from '../components/GanttChart';
import {
  Badge,
  Button,
  Choice,
  EmptyState,
  Header,
  Icon,
  Page,
} from '../components/UI';
import {
  colors,
  processColor,
  queueColor,
  queueName,
  shared,
} from '../utils/theme';

function ReadyQueue({ title, queue, items }) {
  const color = queueColor(queue);
  return (
    <View style={shared.card}>
      <View
        style={[
          shared.row,
          { flexWrap: 'wrap', justifyContent: 'space-between' },
        ]}
      >
        <Text style={[shared.label, { color }]}>{title}</Text>
        <Badge color={color} label={`${items.length} waiting`} />
      </View>
      {!!items.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          contentContainerStyle={{ gap: 8, paddingBottom: 6 }}
        >
          {items.map((p, i) => (
            <View
              key={p.id}
              accessible
              accessibilityLabel={`${p.id}, ${p.remaining} units remaining${i === 0 ? ', next in this queue' : ''}`}
              style={[
                styles.queueChip,
                { borderColor: i === 0 ? color : colors.border },
              ]}
            >
              <Text style={[shared.label, { color: processColor(p.id) }]}>
                {p.id}
              </Text>
              <Text style={shared.caption}>{p.remaining}u left</Text>
              <Text
                style={[
                  shared.caption,
                  { color: i === 0 ? color : colors.muted },
                ]}
              >
                {i === 0 ? 'NEXT IN QUEUE' : `POSITION ${i + 1}`}
              </Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <Text style={shared.body}>No waiting processes.</Text>
      )}
      <Text style={shared.caption}>
        {queue === 'foreground'
          ? 'Higher priority · FIFO Round Robin order'
          : 'Lower priority · runs only when foreground is empty'}
      </Text>
    </View>
  );
}

export default function SimulationScreen({ result, navigate }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const lastIndex = (result?.steps.length || 1) - 1;
  useEffect(() => {
    setIndex(0);
    setPlaying(false);
  }, [result]);
  useEffect(() => {
    if (!playing || !result) return undefined;
    if (index >= lastIndex) {
      setPlaying(false);
      return undefined;
    }
    const timer = setTimeout(
      () => setIndex((current) => Math.min(current + 1, lastIndex)),
      1100 / speed,
    );
    return () => clearTimeout(timer);
  }, [playing, index, speed, result, lastIndex]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') setPlaying(false);
    });
    return () => subscription.remove();
  }, []);
  if (!result)
    return (
      <EmptyState
        title="Ready to simulate?"
        detail="Create a workload and run it to watch the CPU, queues, and execution timeline. Editing inputs clears the old trace."
        onPress={() => navigate('processes')}
      />
    );
  const step = result.steps[Math.min(index, lastIndex)];
  const finished = index === lastIndex;
  const current = step.running;
  const progress = step.time / result.metrics.makespan;
  const move = (amount) => {
    setPlaying(false);
    setIndex((i) => Math.max(0, Math.min(lastIndex, i + amount)));
  };
  return (
    <Page>
      <Header
        eyebrow="02 / FOLLOW THE EXECUTION"
        title="Live simulation"
        subtitle={`Strict preemptive priority · Quantum ${result.timeQuantum}u`}
      />
      <View
        style={[
          shared.card,
          {
            borderColor: finished
              ? colors.green
              : current
                ? queueColor(current.queue)
                : colors.border,
          },
        ]}
      >
        <View
          style={[
            shared.row,
            { justifyContent: 'space-between', flexWrap: 'wrap' },
          ]}
        >
          <View style={shared.row}>
            <Icon name="cpu" color={colors.cyan} />
            <Text style={shared.label}>CPU execution</Text>
          </View>
          <Badge
            label={finished ? 'COMPLETE' : playing ? 'PLAYING' : 'PAUSED'}
            color={finished ? colors.green : colors.amber}
          />
        </View>
        <View
          style={[
            shared.row,
            {
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
            },
          ]}
        >
          <View style={{ gap: 6 }}>
            <Text
              style={[
                styles.cpuProcess,
                { color: finished ? colors.green : processColor(current?.id) },
              ]}
            >
              {current?.id || (finished ? 'Done' : 'IDLE')}
            </Text>
            <Text style={shared.body}>
              {current
                ? queueName(current.queue)
                : finished
                  ? 'All processes completed'
                  : 'Waiting for an arrival'}
            </Text>
            <Text style={shared.caption}>
              Status: {current ? 'Running' : finished ? 'Completed' : 'Idle'}
            </Text>
          </View>
          <View style={{ gap: 6 }}>
            <Text style={shared.caption}>LOGICAL TIME</Text>
            <Text style={styles.clock}>
              {step.time}
              <Text style={{ fontSize: 15, color: colors.muted }}> u</Text>
            </Text>
            <Text style={shared.caption}>
              {current ? `${current.remaining}u remaining` : 'CPU available'}
            </Text>
          </View>
        </View>
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 0,
            max: result.metrics.makespan,
            now: step.time,
          }}
          accessibilityLabel="Simulation time"
          style={styles.progressTrack}
        >
          <View
            style={[styles.progressFill, { width: `${progress * 100}%` }]}
          />
        </View>
        <Text style={shared.caption}>
          Step {index + 1} of {result.steps.length} · {step.completed.length} /{' '}
          {result.processes.length} completed
        </Text>
      </View>
      <View style={shared.section}>
        <View style={shared.row}>
          <Button
            title="Previous"
            secondary
            disabled={index === 0}
            onPress={() => move(-1)}
            style={{ flex: 1 }}
          />
          <Button
            title={playing ? 'Pause' : 'Play'}
            disabled={finished}
            onPress={() => setPlaying((value) => !value)}
            style={{ flex: 1 }}
          />
          <Button
            title="Next"
            secondary
            disabled={finished}
            onPress={() => move(1)}
            style={{ flex: 1 }}
          />
        </View>
        <View style={shared.wrap}>
          <Button
            title="Reset"
            secondary
            onPress={() => {
              setPlaying(false);
              setIndex(0);
            }}
          />
          {[0.5, 1, 2].map((value) => (
            <Choice
              key={value}
              label={`${value}×`}
              selected={speed === value}
              onPress={() => setSpeed(value)}
            />
          ))}
        </View>
        <Text style={shared.caption}>
          Speed controls playback only. Each step moves to the next scheduling
          event, not a fixed amount of CPU time.
        </Text>
      </View>
      <View
        style={[
          shared.card,
          { borderLeftWidth: 3, borderLeftColor: colors.amber },
        ]}
      >
        <Text style={[shared.eyebrow, { color: colors.amber }]}>
          AT TIME {step.time}
        </Text>
        <Text
          accessibilityLiveRegion={playing ? 'none' : 'polite'}
          style={[shared.body, { color: colors.text }]}
        >
          {step.event}
        </Text>
      </View>
      <ReadyQueue
        title="Foreground ready queue"
        queue="foreground"
        items={step.foreground}
      />
      <ReadyQueue
        title="Background ready queue"
        queue="background"
        items={step.background}
      />
      <Text style={shared.caption}>
        Ready queues exclude the process on the CPU. Each view shows the state
        after arrivals, completion, preemption or requeueing, and dispatch at
        the displayed time.
      </Text>
      <View style={shared.section}>
        <Text style={shared.heading}>Execution so far</Text>
        <GanttChart timeline={result.timeline} time={step.time} />
      </View>
      <View style={shared.section}>
        <Text style={shared.heading}>Process states</Text>
        {result.processes.map((p) => {
          const status = step.completed.includes(p.id)
            ? 'Completed'
            : current?.id === p.id
              ? 'Running'
              : p.arrival > step.time
                ? `Arrives at ${p.arrival}`
                : 'Ready';
          const color =
            status === 'Completed'
              ? colors.green
              : status === 'Running'
                ? colors.cyan
                : status === 'Ready'
                  ? colors.amber
                  : colors.muted;
          return (
            <View key={p.id} style={styles.stateRow}>
              <Text style={[shared.label, { color: processColor(p.id) }]}>
                {p.id}
              </Text>
              <Text style={[shared.caption, { color, flex: 1 }]}>{status}</Text>
              <Text style={shared.caption}>
                {step.remaining[p.id]} / {p.burst}u left
              </Text>
            </View>
          );
        })}
      </View>
      <Button
        title="View Results & Analysis →"
        onPress={() => navigate('results')}
      />
      <Button
        title="Edit Processes"
        secondary
        onPress={() => navigate('processes')}
      />
    </Page>
  );
}
const styles = StyleSheet.create({
  cpuProcess: { fontSize: 48, fontWeight: '700', letterSpacing: -1 },
  clock: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    height: 5,
    borderRadius: 4,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: { height: 5, borderRadius: 4, backgroundColor: colors.cyan },
  queueChip: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 6,
    minWidth: 100,
    backgroundColor: colors.background,
  },
  stateRow: {
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 14,
  },
});
