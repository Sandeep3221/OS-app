import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Badge, Button, Header, Icon, Page } from '../components/UI';
import { colors, shared } from '../utils/theme';

export default function HomeScreen({ navigate, processCount }) {
  return (
    <Page>
      <View style={[shared.row, { justifyContent: 'space-between' }]}>
        <Badge label="OPERATING SYSTEMS LAB" />
        <Text style={shared.caption}>PROJECT 04</Text>
      </View>
      <Header
        title="MLQ Scheduler"
        subtitle="Multilevel Queue Scheduling Simulator"
      />
      <View style={styles.hero}>
        <View style={styles.cpuIcon}>
          <Icon name="cpu" size={42} color={colors.cyan} />
        </View>
        <Text style={styles.heroTitle}>Two queues.{'\n'}One CPU.</Text>
        <Text style={shared.body}>
          See priority in action. Build a workload, follow every scheduling
          decision, and discover what makes a process wait.
        </Text>
        <View style={shared.wrap}>
          <Badge label="Interactive playback" />
          <Badge label="Runs locally" color={colors.green} />
        </View>
        <Button
          title="Start Simulation →"
          onPress={() => navigate('processes')}
        />
        {processCount > 0 && (
          <Text style={shared.caption}>
            {processCount} processes in your current workspace
          </Text>
        )}
      </View>
      <View style={shared.section}>
        <Text accessibilityRole="header" style={shared.heading}>
          The scheduling path
        </Text>
        <View style={shared.card}>
          <Text style={[shared.label, { textAlign: 'center' }]}>
            Incoming processes
          </Text>
          <Text style={styles.arrow}>↓ assigned to one fixed queue ↓</Text>
          <View
            style={[
              styles.queue,
              {
                borderColor: colors.cyan,
                backgroundColor: colors.foregroundTint,
              },
            ]}
          >
            <View style={shared.wrap}>
              <Text style={[shared.label, { color: colors.cyan }]}>
                01 / Foreground
              </Text>
              <Badge label="HIGH PRIORITY" />
            </View>
            <Text style={shared.body}>Round Robin · shared time quantum</Text>
          </View>
          <View
            style={[
              styles.queue,
              {
                borderColor: colors.purple,
                backgroundColor: colors.backgroundTint,
              },
            ]}
          >
            <View style={shared.wrap}>
              <Text style={[shared.label, { color: colors.purple }]}>
                02 / Background
              </Text>
              <Badge label="LOW PRIORITY" color={colors.purple} />
            </View>
            <Text style={shared.body}>
              First Come First Serve · resumes after interruption
            </Text>
          </View>
          <Text style={styles.arrow}>
            ↓ strict priority selects one process ↓
          </Text>
          <View style={[shared.row, { justifyContent: 'center' }]}>
            <Icon name="cpu" color={colors.cyan} />
            <Text style={shared.label}>Single CPU execution</Text>
          </View>
        </View>
      </View>
      <View style={shared.card}>
        <Text style={shared.heading}>Foreground comes first</Text>
        <Text style={shared.body}>
          A foreground arrival immediately interrupts background execution.
          Background resumes only when foreground is empty. Processes never move
          between queues.
        </Text>
        <Button title="Learn MLQ" secondary onPress={() => navigate('learn')} />
      </View>
      <Text style={shared.caption}>
        Educational simulator · Visualizes foreground and background process
        scheduling. It does not manage Android system processes.
      </Text>
    </Page>
  );
}
const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    padding: 22,
    gap: 18,
  },
  cpuIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: colors.foregroundTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    color: colors.text,
    fontSize: 38,
    fontWeight: '700',
    lineHeight: 44,
    letterSpacing: -1,
  },
  queue: { padding: 14, borderWidth: 1, borderRadius: 14, gap: 8 },
  arrow: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 20,
  },
});
