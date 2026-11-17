import React, { useEffect, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import GanttChart from '../components/GanttChart';
import { Button, Choice, Disclosure, EmptyState, Header, Icon, IconButton, Page, Progress } from '../components/UI';
import { colors, queueColor, queueName, shared } from '../utils/theme';

function ReadyQueue({ title, queue, items }) {
  const color = queueColor(queue);
  return (
    <View style={styles.queue}>
      <View style={[shared.row, { justifyContent: 'space-between', flexWrap: 'wrap' }]}>
        <View style={shared.row}><View style={[styles.queueMark, { backgroundColor: color }]} /><Text style={shared.label}>{title}</Text></View>
        <Text style={shared.caption}>{items.length} waiting</Text>
      </View>
      {items.length ? <View style={shared.wrap}>
        {items.map((p, i) => <View key={p.id} accessible accessibilityLabel={`${p.id}, ${p.remaining} units remaining${i === 0 ? ', next in this queue' : `, position ${i + 1}`}`} style={[styles.queueItem, { backgroundColor: queue === 'foreground' ? colors.foregroundTint : colors.backgroundTint }]}>
          <View style={[shared.row, { justifyContent: 'space-between' }]}><Text style={[shared.label, { color }]}>{p.id}</Text><Text style={shared.caption}>{p.remaining}u</Text></View>
          <Text style={[shared.caption, { color }]}>{i === 0 ? 'Next' : `Position ${i + 1}`}</Text>
        </View>)}
      </View> : <Text style={shared.caption}>No waiting processes</Text>}
      <Text style={shared.caption}>{queue === 'foreground' ? 'Round Robin · Higher priority' : 'FCFS · Runs when foreground is empty'}</Text>
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
        detail="Create a workload to follow the CPU, ready queues, and execution timeline."
        onPress={() => navigate('processes')}
      />
    );
  const step = result.steps[Math.min(index, lastIndex)];
  const finished = index === lastIndex;
  const current = step.running;
  const move = (amount) => {
    setPlaying(false);
    setIndex((i) => Math.max(0, Math.min(lastIndex, i + amount)));
  };
  return (
    <Page>
      <Header title="Simulation" subtitle={`Quantum ${result.timeQuantum}u · Strict queue priority`} />
      <View style={styles.stage}>
        <View style={[shared.row, { justifyContent: 'space-between', flexWrap: 'wrap' }]}>
          <View style={shared.row}><Icon name="cpu" color={colors.accent} size={22} /><Text style={shared.label}>CPU</Text></View>
          <Text style={[shared.caption, { color: finished ? colors.success : colors.muted }]}>{finished ? 'Complete' : playing ? 'Playing' : 'Paused'}</Text>
        </View>
        <View style={styles.execution}>
          <View style={[styles.cpuTile, { backgroundColor: current?.queue === 'background' ? colors.backgroundTint : colors.foregroundTint }]}>
            <Text style={[styles.cpuProcess, { color: current ? queueColor(current.queue) : colors.text }]}>{current?.id || (finished ? 'Done' : 'Idle')}</Text>
            <Text style={[shared.caption, { color: current ? queueColor(current.queue) : colors.muted }]}>{current ? 'Running' : finished ? 'Completed' : 'CPU available'}</Text>
          </View>
          <View style={styles.executionDetail}>
            <Text style={shared.label}>{current ? queueName(current.queue) : finished ? 'All work complete' : 'Waiting for an arrival'}</Text>
            <Text style={shared.body}>{current ? `${current.remaining}u remaining` : finished ? `${result.processes.length} processes completed` : 'No ready work'}</Text>
          </View>
        </View>
        <View style={[shared.row, { justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }]}>
          <Text style={styles.clock}>{step.time}<Text style={shared.body}> / {result.metrics.makespan}u</Text></Text>
          <Text style={shared.caption}>Logical time</Text>
        </View>
        <Progress value={step.time} max={result.metrics.makespan} label="Simulation time" />
        <View style={[shared.row, { justifyContent: 'space-between', flexWrap: 'wrap' }]}>
          <Text style={shared.caption}>Step {index + 1} of {result.steps.length}</Text>
          <Text style={shared.caption}>{step.completed.length} / {result.processes.length} completed</Text>
        </View>
        <View style={styles.transport}>
          <IconButton icon="previous" label="Previous scheduling event" disabled={index === 0} onPress={() => move(-1)} />
          <IconButton icon={playing ? 'pause' : 'play'} label={playing ? 'Pause simulation' : 'Play simulation'} primary disabled={finished} onPress={() => setPlaying((value) => !value)} />
          <IconButton icon="next" label="Next scheduling event" disabled={finished} onPress={() => move(1)} />
        </View>
        <View style={styles.speedRow}>
          <IconButton icon="reset" label="Reset simulation" onPress={() => { setPlaying(false); setIndex(0); }} />
          <View style={shared.wrap}>{[0.5, 1, 2].map((value) => <Choice compact key={value} label={`${value}×`} accessibilityLabel={`Playback speed ${value} times`} selected={speed === value} onPress={() => setSpeed(value)} />)}</View>
        </View>
      </View>
      <View style={styles.event}>
        <Text style={shared.caption}>At time {step.time}</Text>
        <Text accessibilityLiveRegion={playing ? 'none' : 'polite'} style={[shared.body, { color: colors.text }]}>{step.event}</Text>
      </View>
      <View style={shared.section}>
        <Text accessibilityRole="header" style={shared.heading}>Ready queues</Text>
        <View style={shared.group}>
          <ReadyQueue title="Foreground" queue="foreground" items={step.foreground} />
          <View style={[shared.divider, { marginHorizontal: 16 }]} />
          <ReadyQueue title="Background" queue="background" items={step.background} />
        </View>
      </View>
      <View style={shared.section}>
        <Text accessibilityRole="header" style={shared.heading}>Execution timeline</Text>
        <GanttChart timeline={result.timeline} time={step.time} />
      </View>
      <View>
        <Disclosure title="Process states">
          {result.processes.map((p) => {
            const status = step.completed.includes(p.id)
              ? 'Completed'
              : current?.id === p.id
                ? 'Running'
                : p.arrival > step.time
                  ? `Arrives at ${p.arrival}`
                  : 'Ready';
            return <View key={p.id} style={styles.stateRow}>
              <Text style={shared.label}>{p.id}</Text>
              <Text style={[shared.caption, { flex: 1, color: status === 'Running' ? colors.accent : colors.muted }]}>{status}</Text>
              <Text style={[shared.caption, shared.number]}>{step.remaining[p.id]} / {p.burst}u left</Text>
            </View>;
          })}
        </Disclosure>
        <Disclosure title="Reading the simulation">
          <Text style={shared.body}>Speed controls playback only. Each step moves to the next scheduling event, not a fixed amount of CPU time.</Text>
          <Text style={shared.body}>Ready queues exclude the process on the CPU. Each view shows the state after arrivals, completion, preemption or requeueing, and dispatch at the displayed time.</Text>
        </Disclosure>
      </View>
      <View style={{ gap: 12 }}>
        <Button title="View results" onPress={() => navigate('results')} />
        <Button title="Edit processes" secondary onPress={() => navigate('processes')} />
      </View>
    </Page>
  );
}
const styles = StyleSheet.create({
  stage: { backgroundColor: colors.surface, padding: 20, borderRadius: 20, gap: 16 },
  execution: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 20, paddingVertical: 12 },
  cpuTile: { minWidth: 112, minHeight: 112, borderRadius: 18, alignItems: 'center', justifyContent: 'center', padding: 16, gap: 4 },
  cpuProcess: { fontSize: 36, lineHeight: 44, fontWeight: '600', fontVariant: ['tabular-nums'] },
  executionDetail: { flexGrow: 1, flexBasis: 110, gap: 8 },
  clock: { color: colors.text, fontSize: 28, fontWeight: '600', fontVariant: ['tabular-nums'] },
  transport: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 8, paddingTop: 4 },
  speedRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 12 },
  event: { paddingLeft: 16, borderLeftWidth: 2, borderLeftColor: colors.accent, gap: 4 },
  queue: { padding: 16, gap: 12 },
  queueMark: { width: 3, height: 16, borderRadius: 2 },
  queueItem: { minWidth: 100, padding: 12, borderRadius: 8, gap: 4 },
  stateRow: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16 },
});
