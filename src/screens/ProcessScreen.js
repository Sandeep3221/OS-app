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
import { Badge, Button, Choice, Field, Header, Page } from '../components/UI';
import { LIMITS, validateInput } from '../utils/scheduler';
import { integerError } from '../utils/session';
import { colors, shared } from '../utils/theme';

export default function ProcessScreen({ session, dispatch, runSimulation }) {
  const { processes, quantum, nextId } = session;
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
          eyebrow="01 / BUILD YOUR WORKLOAD"
          title="Processes"
          subtitle="Choose when work arrives and which queue it belongs to."
        />
        <View style={shared.wrap}>
          <Badge label={`${processes.length} total`} color={colors.text} />
          <Badge label={`${foregroundCount} foreground`} />
          <Badge
            label={`${processes.length - foregroundCount} background`}
            color={colors.purple}
          />
        </View>
        <View style={shared.card}>
          <View style={shared.row}>
            <Text style={[shared.heading, { flex: 1 }]}>
              Round Robin settings
            </Text>
            <Badge label="FG" />
          </View>
          <Field
            label="Time quantum"
            value={quantum}
            onChangeText={(value) => dispatch({ type: 'quantum', value })}
            error={quantumError}
            maxLength={4}
            hint="CPU time per foreground turn. Default: 2 units."
          />
          <Text style={shared.caption}>
            Changing any input clears previous results. Run again to apply your
            changes.
          </Text>
        </View>
        <View style={shared.section}>
          <View style={[shared.row, { justifyContent: 'space-between' }]}>
            <Text style={shared.heading}>Your workload</Text>
            <Text style={shared.caption}>
              {totalBurst} / {LIMITS.totalBurst} burst units
            </Text>
          </View>
          <View style={shared.row}>
            <Button
              title="+ Add Process"
              secondary
              onPress={() => openEditor(null)}
              disabled={
                processes.length >= LIMITS.processes ||
                totalBurst >= LIMITS.totalBurst
              }
              style={{ flex: 1 }}
            />
            <Button
              title="Load Sample"
              secondary
              onPress={loadSample}
              style={{ flex: 1 }}
            />
          </View>
          <Text style={shared.caption}>
            Up to {LIMITS.processes} processes · Arrival 0–{LIMITS.arrival} ·
            Combined burst ≤ {LIMITS.totalBurst}
          </Text>
          {!processes.length && (
            <View style={shared.card}>
              <Text style={shared.heading}>Your CPU is ready.</Text>
              <Text style={shared.body}>
                Add your first process, or load the five-process sample to
                explore foreground preemption.
              </Text>
            </View>
          )}
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
        <Button
          title="Run Simulation →"
          disabled={!processes.length || !!quantumError}
          onPress={() => {
            Keyboard.dismiss();
            runSimulation();
          }}
        />
        {!!processes.length && (
          <Button
            title="Clear All Processes"
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
      </Page>
      <Modal
        visible={!!draft}
        transparent
        animationType="none"
        onRequestClose={() => setDraft(null)}
        statusBarTranslucent
      >
        <SafeAreaView style={styles.overlay}>
          <KeyboardAvoidingView
            style={{
              width: '100%',
              maxWidth: 600,
              flex: 1,
              justifyContent: 'center',
            }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: 'center',
                paddingVertical: 16,
              }}
              keyboardShouldPersistTaps="handled"
            >
              {draft && (
                <View accessibilityViewIsModal style={styles.editor}>
                  <Header
                    eyebrow={draft.editing ? 'EDIT PROCESS' : 'NEW PROCESS'}
                    title={draft.id}
                    subtitle="IDs are assigned automatically and stay fixed when you edit."
                  />
                  <Field
                    label="Arrival time"
                    value={draft.arrival}
                    onChangeText={(arrival) => setDraft({ ...draft, arrival })}
                    error={errors.arrival}
                    maxLength={5}
                    hint="When this process enters its ready queue."
                  />
                  <Field
                    label="Burst time"
                    value={draft.burst}
                    onChangeText={(burst) => setDraft({ ...draft, burst })}
                    error={errors.burst}
                    maxLength={4}
                    hint="Total CPU time this process needs."
                  />
                  <Text style={shared.label}>Assigned queue</Text>
                  <Choice
                    label="Foreground · Round Robin"
                    selected={draft.queue === 'foreground'}
                    onPress={() => setDraft({ ...draft, queue: 'foreground' })}
                  />
                  <Choice
                    label="Background · FCFS"
                    color={colors.purple}
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
                    title={draft.editing ? 'Save Changes' : 'Add Process'}
                    onPress={save}
                  />
                  <Button
                    title="Cancel"
                    secondary
                    onPress={() => setDraft(null)}
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
  overlay: {
    flex: 1,
    backgroundColor: colors.scrim,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  editor: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 22,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
