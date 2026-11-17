import React, { useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProcessCard from '../components/ProcessCard';
import { Button, Choice, Disclosure, Field, Header, Page, useReducedMotion } from '../components/UI';
import { LIMITS, validateInput } from '../utils/scheduler';
import { integerError } from '../utils/session';
import { colors, shared } from '../utils/theme';

export default function ProcessScreen({ session, dispatch, runSimulation }) {
  const { processes, quantum, nextId } = session;
  const reducedMotion = useReducedMotion();
  const [draft, setDraft] = useState(null);
  const [errors, setErrors] = useState({});
  const foregroundCount = processes.filter(
    (p) => p.queue === 'foreground',
  ).length;
  const totalBurst = processes.reduce((sum, p) => sum + p.burst, 0);
  const quantumError = integerError(quantum, 1, LIMITS.quantum, 'Time quantum');
  const openEditor = (p) => {
    setErrors({});
    setDraft(
      p
        ? {
            ...p,
            arrival: String(p.arrival),
            burst: String(p.burst),
            editing: true,
          }
        : {
            id: `P${nextId}`,
            arrival: '0',
            burst: '',
            queue: 'foreground',
            editing: false,
          },
    );
  };
  const save = () => {
    const nextErrors = {
      arrival: integerError(draft.arrival, 0, LIMITS.arrival, 'Arrival'),
      burst: integerError(draft.burst, 1, LIMITS.totalBurst, 'Burst'),
      queue: ['foreground', 'background'].includes(draft.queue)
        ? ''
        : 'Choose a queue.',
    };
    if (Object.values(nextErrors).some(Boolean)) {
      setErrors(nextErrors);
      return;
    }
    const process = {
      id: draft.id,
      arrival: Number(draft.arrival),
      burst: Number(draft.burst),
      queue: draft.queue,
    };
    const proposed = draft.editing
      ? processes.map((p) => (p.id === process.id ? process : p))
      : [...processes, process];
    try {
      validateInput(proposed, 2);
    } catch (error) {
      setErrors({ form: error.message });
      return;
    }
    dispatch({ type: draft.editing ? 'edit' : 'add', process });
    Keyboard.dismiss();
    setDraft(null);
  };
  const loadSample = () => {
    const load = () => dispatch({ type: 'sample' });
    if (processes.length)
      Alert.alert(
        'Load sample workload?',
        'This replaces your current processes and sets the time quantum to 2.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Load sample', onPress: load },
        ],
      );
    else load();
  };
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Page>
        <Header
          title="Processes"
          subtitle="Build your workload."
        />
        <Text style={shared.caption}>
          {processes.length} processes · {foregroundCount} foreground · {processes.length - foregroundCount} background
        </Text>
        <View style={shared.section}>
          <View style={[shared.row, { justifyContent: 'space-between', flexWrap: 'wrap' }]}>
            <Text style={shared.heading}>Workload</Text>
            <Text style={shared.caption}>
              {totalBurst} / {LIMITS.totalBurst} burst units
            </Text>
          </View>
          <View style={shared.row}>
            <Button
              title="Add process"
              secondary
              onPress={() => openEditor(null)}
              disabled={
                processes.length >= LIMITS.processes ||
                totalBurst >= LIMITS.totalBurst
              }
              style={{ flex: 1 }}
            />
            <Button
              title="Load sample"
              secondary
              onPress={loadSample}
              style={{ flex: 1 }}
            />
          </View>
          {!processes.length && (
            <View style={shared.card}>
              <Text style={shared.heading}>Your CPU is ready.</Text>
              <Text style={shared.body}>
                Add your first process, or load the five-process sample to
                explore foreground preemption.
              </Text>
            </View>
          )}
          <View style={shared.group}>
            {processes.map((p) => (
              <ProcessCard
                key={p.id}
                process={p}
                onEdit={() => openEditor(p)}
                onDelete={() =>
                  Alert.alert(
                    `Delete ${p.id}?`,
                    'The current simulation results will be cleared.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => dispatch({ type: 'delete', id: p.id }),
                      },
                    ],
                  )
                }
              />
            ))}
          </View>
        </View>
        <View style={shared.card}>
          <Field
            label="Time quantum"
            value={quantum}
            onChangeText={(value) => dispatch({ type: 'quantum', value })}
            error={quantumError}
            maxLength={4}
            hint="CPU time per foreground turn · Default 2 units"
          />
        </View>
        {!!processes.length && (
          <Button
            title="Clear all processes"
            secondary
            danger
            onPress={() =>
              Alert.alert(
                'Clear all processes?',
                'This removes your workload and simulation results.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Clear all',
                    style: 'destructive',
                    onPress: () => dispatch({ type: 'clear' }),
                  },
                ],
              )
            }
          />
        )}
        <Disclosure title="Input limits & settings">
          <Text style={shared.body}>Up to {LIMITS.processes} processes · Arrival 0–{LIMITS.arrival} · Combined burst ≤ {LIMITS.totalBurst} units.</Text>
          <Text style={shared.body}>Changing any input clears previous results. Run again to apply your changes.</Text>
        </Disclosure>
      </Page>
      <View style={styles.footer}>
        <Button
          title="Run simulation"
          disabled={!processes.length || !!quantumError}
          onPress={() => {
            Keyboard.dismiss();
            runSimulation();
          }}
        />
      </View>
      <Modal
        visible={!!draft}
        transparent
        animationType={reducedMotion ? 'none' : 'slide'}
        onRequestClose={() => setDraft(null)}
        statusBarTranslucent
      >
        <SafeAreaView style={styles.overlay}>
          <KeyboardAvoidingView
            style={{
              width: '100%',
              maxWidth: 600,
              flex: 1,
              justifyContent: 'flex-end',
            }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: 'flex-end',
                paddingVertical: 16,
              }}
              keyboardShouldPersistTaps="handled"
            >
              {draft && (
                <View accessibilityViewIsModal style={styles.editor}>
                  <View style={[shared.row, { alignItems: 'flex-start' }]}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text accessibilityRole="header" style={shared.heading}>{draft.editing ? 'Edit process' : 'New process'}</Text>
                      <Text style={shared.caption}>{draft.id} · Fixed process ID</Text>
                    </View>
                    <Button title="Cancel" secondary style={{ backgroundColor: 'transparent', paddingHorizontal: 8, minHeight: 48 }} onPress={() => setDraft(null)} />
                  </View>
                  <View style={[shared.row, { alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }]}>
                    <Field
                      style={{ flex: 1, minWidth: 120 }}
                      label="Arrival time"
                      value={draft.arrival}
                      onChangeText={(arrival) => setDraft({ ...draft, arrival })}
                      error={errors.arrival}
                      maxLength={5}
                      hint="Enters the ready queue, in time units"
                    />
                    <Field
                      style={{ flex: 1, minWidth: 120 }}
                      label="Burst time"
                      value={draft.burst}
                      onChangeText={(burst) => setDraft({ ...draft, burst })}
                      error={errors.burst}
                      maxLength={4}
                      hint="Required CPU time, in time units"
                    />
                  </View>
                  <Text style={shared.label}>Assigned queue</Text>
                  <Choice
                    label="Foreground · Round Robin"
                    selected={draft.queue === 'foreground'}
                    onPress={() => setDraft({ ...draft, queue: 'foreground' })}
                  />
                  <Choice
                    label="Background · FCFS"
                    color={colors.backgroundQueue}
                    selected={draft.queue === 'background'}
                    onPress={() => setDraft({ ...draft, queue: 'background' })}
                  />
                  {!!errors.queue && (
                    <Text style={shared.error}>{errors.queue}</Text>
                  )}
                  {!!errors.form && (
                    <Text accessibilityLiveRegion="polite" style={shared.error}>
                      {errors.form}
                    </Text>
                  )}
                  <Button
                    title={draft.editing ? 'Save changes' : 'Add process'}
                    onPress={save}
                  />
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  footer: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: colors.background,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.scrim,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  editor: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    gap: 16,
  },
});
