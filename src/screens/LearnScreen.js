import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Disclosure, Header, Icon, Page, Reveal } from '../components/UI';
import { colors, shared } from '../utils/theme';

const topics = [
  [
    'CPU scheduling',
    'The operating system chooses which ready process gets the CPU next. With one CPU, only one process executes at a time. Scheduling affects responsiveness, waiting, and how quickly work finishes.',
  ],
  [
    'Multilevel Queue Scheduling',
    'MLQ divides ready processes into fixed queues, often by process type. Each queue may use its own scheduling algorithm. A separate policy decides which queue gets the CPU. Processes do not migrate between queues in this model.',
  ],
  [
    'Foreground vs background',
    'Foreground represents interactive work that benefits from a quick response. Background represents less urgent batch work. Here you assign each process to a queue; these labels describe simulated jobs, not apps on your phone.',
  ],
  [
    'Round Robin (RR)',
    'Foreground processes take turns in FIFO order. Each gets up to one time quantum. If it still has work left, it goes to the end of the queue; if it finishes sooner, the CPU immediately becomes available.',
  ],
  [
    'First Come First Serve (FCFS)',
    'Background processes are selected in arrival order. A background process retains the head position if foreground interrupts it, and later resumes its remaining burst before newer background processes.',
  ],
  [
    'Fixed queue priority',
    'Foreground always has higher priority. A background process can execute only when no foreground process is ready. This is strict priority between queues, not a priority ranking within the foreground queue.',
  ],
  [
    'Preemptive scheduling',
    'Preemption stops a running process before it finishes. In this app, a foreground arrival immediately preempts background execution. The interrupted process keeps its remaining burst; no CPU work is lost. Foreground arrivals do not interrupt another foreground process mid-quantum.',
  ],
  [
    'Time quantum',
    'A quantum is the maximum CPU time for one foreground turn. A smaller quantum creates more frequent turns; a larger one can make RR behave like FCFS when every burst fits in one turn. A lone foreground process can receive consecutive quanta. This app models no switching overhead.',
  ],
  [
    'Starvation',
    'A continuing stream of foreground work could prevent background processes from ever getting CPU time. With this app’s finite input, all valid processes eventually finish, but background waiting may still be long. Aging is not implemented.',
  ],
  [
    'Waiting time (WT)',
    'Total time spent ready but not executing. WT = Turnaround − Burst. Time before a process arrives does not count. All interruptions and waits between RR turns contribute to waiting time.',
  ],
  [
    'Turnaround time (TAT)',
    'Elapsed time from arrival until completion. TAT = Completion − Arrival. It includes both running and waiting. For sample P1: 16 − 0 = 16 time units.',
  ],
  [
    'Response time (RT)',
    'Time from arrival to the first CPU execution. RT = First start − Arrival. It is counted once, even if a process later pauses and resumes. Sample P1 responds at time 0, so its RT is 0 even though its WT is 9.',
  ],
  [
    'Advantages of MLQ',
    'Separate policies can suit different types of work. Fixed queues make the model easy to understand, and higher-priority interactive work can receive a quick response.',
  ],
  [
    'Disadvantages of MLQ',
    'Strict priority can starve lower queues. Fixed assignments are inflexible if a process’s needs change. Choosing the queue policies and time quantum requires care.',
  ],
  [
    'MLQ vs MLFQ',
    'MLQ uses fixed queue membership. Multilevel Feedback Queue (MLFQ) allows processes to move between queues according to feedback policies, often based on CPU use or waiting. This app is MLQ: no migration, feedback, or aging.',
  ],
  [
    'Arrivals and ties in this app',
    'Simultaneous arrivals follow the original input order. At an RR quantum boundary, new arrivals join before the unfinished process is requeued. If a process completes at the same instant a new process arrives, its completion is recorded before the next dispatch.',
  ],
];

export default function LearnScreen({ navigate }) {
  const [expanded, setExpanded] = useState(1);
  return (
    <Page>
      <Header
        title="Learn MLQ"
        subtitle="The ideas behind every scheduling decision."
      />
      <Disclosure title="The model used in this app">
        <Text style={shared.body}>
          Foreground uses Round Robin. Background uses FCFS. Between them,
          strict preemptive priority always favors foreground.
        </Text>
        <Text style={shared.caption}>
          MLQ can use other queue algorithms and inter-queue policies. This app
          demonstrates this particular configuration, not every possible MLQ
          policy.
        </Text>
      </Disclosure>
      <View style={shared.group}>
        {topics.map(([title, text], index) => (
          <View key={title} style={styles.topic}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: expanded === index }}
              onPress={() => setExpanded(expanded === index ? null : index)}
              style={({ pressed }) => [
                styles.topicButton,
                pressed && { opacity: 0.65 },
              ]}
            >
              <Text style={[shared.label, { flex: 1, lineHeight: 22 }]}>
                {title}
              </Text>
              <Icon name={expanded === index ? 'down' : 'chevron'} size={20} />
            </Pressable>
            {expanded === index && (
              <Reveal><Text style={[shared.body, styles.answer]}>{text}</Text></Reveal>
            )}
          </View>
        ))}
      </View>
      <Disclosure title="Viva: explain it in 30 seconds">
        <Text style={shared.body}>
          “Our project visualizes one CPU serving two fixed queues. Foreground
          gets Round Robin turns and can interrupt background at any arrival.
          Background follows FCFS and resumes where it stopped. We replay the
          scheduler’s exact decisions and calculate waiting, turnaround, and
          response times from the same execution.”
        </Text>
      </Disclosure>
      <Button
        title="Try a workload"
        onPress={() => navigate('processes')}
      />
    </Page>
  );
}
const styles = StyleSheet.create({
  topic: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  topicButton: { minHeight: 64, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16 },
  answer: { paddingHorizontal: 16, paddingBottom: 24, lineHeight: 26 },
});
