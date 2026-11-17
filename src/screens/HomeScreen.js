import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Disclosure, Header, Icon, Page } from '../components/UI';
import { colors, shared } from '../utils/theme';

export default function HomeScreen({ navigate, processCount }) {
  return (
    <Page contentContainerStyle={{ flexGrow: 1, gap: 32 }}>
      <Header title="MLQ Scheduler" subtitle="See how two queues share one CPU." />
      <View style={styles.diagram} accessible accessibilityLabel="Two fixed queues feed a single CPU. Foreground uses Round Robin with higher priority. Background uses First Come First Serve when foreground is empty.">
        <View style={styles.lanes}>
          <View style={styles.lane}>
            <View style={shared.row}><View style={[styles.queueMark, { backgroundColor: colors.foreground }]} /><Text style={shared.label}>Foreground</Text></View>
            <Text style={shared.caption}>Round Robin · Higher priority</Text>
            <View style={styles.jobs}>{['P2', 'P3', 'P5'].map((id) => <View key={id} style={[styles.job, { backgroundColor: colors.foregroundTint }]}><Text style={[shared.label, { color: colors.foreground }]}>{id}</Text></View>)}</View>
          </View>
          <View style={styles.lane}>
            <View style={shared.row}><View style={[styles.queueMark, { backgroundColor: colors.backgroundQueue }]} /><Text style={shared.label}>Background</Text></View>
            <Text style={shared.caption}>First Come First Serve</Text>
            <View style={styles.jobs}>{['P1', 'P4'].map((id) => <View key={id} style={[styles.job, { backgroundColor: colors.backgroundTint }]}><Text style={[shared.label, { color: colors.backgroundQueue }]}>{id}</Text></View>)}</View>
          </View>
        </View>
        <View style={styles.connector}><View style={styles.connectorLine} /><Icon name="down" size={18} /></View>
        <View style={styles.cpu}><Icon name="cpu" color={colors.accent} size={32} /><View style={{ gap: 4 }}><Text style={shared.heading}>One CPU</Text><Text style={shared.caption}>Foreground comes first</Text></View></View>
      </View>
      <View style={{ gap: 12 }}>
        <Button title={processCount ? 'Continue to processes' : 'Create a simulation'} onPress={() => navigate('processes')} />
        {processCount > 0 && <Text style={[shared.caption, { textAlign: 'center' }]}>{processCount} processes in your workspace</Text>}
      </View>
      <View style={{ marginTop: 'auto' }}>
        <Disclosure title="How this model works">
          <Text style={shared.body}>A foreground arrival immediately interrupts background execution. Background resumes when foreground is empty. Processes stay in their assigned queue.</Text>
          <Text style={shared.caption}>Educational simulator. Visualizes scheduling; it does not manage your device’s system processes.</Text>
          <Button title="Learn MLQ" secondary onPress={() => navigate('learn')} />
        </Disclosure>
      </View>
    </Page>
  );
}
const styles = StyleSheet.create({
  diagram: { paddingVertical: 8 },
  lanes: { gap: 24 },
  lane: { gap: 8 },
  queueMark: { width: 3, height: 16, borderRadius: 2 },
  jobs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 4 },
  job: { minWidth: 60, minHeight: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center', padding: 8 },
  connector: { alignItems: 'center', height: 40, justifyContent: 'center' },
  connectorLine: { width: 1, height: 20, backgroundColor: colors.inputBorder, marginBottom: -8 },
  cpu: { padding: 20, backgroundColor: colors.surface, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 20 },
});
