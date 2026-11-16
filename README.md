# Multilevel Queue Scheduling Simulator

**College project 4 · Objective:** Visualize foreground and background process scheduling on one CPU. This educational app does not inspect or manage Android processes.

## Stack and setup

Plain JavaScript, React functional components/Hooks, React Native StyleSheet, Expo SDK 58, React 19.3.0, React Native 0.88.1. Only safe-area support and Expo status bar are added to the blank JavaScript template dependency set. No server, database, account, or internet is needed by the simulator itself. Workloads are held in memory and reset when the app restarts.

Use Node 22.13+ (Node 24 is suitable). From this existing folder:

```sh
npm install
npx expo install expo-status-bar react-native-safe-area-context
npx expo install --check
npx expo-doctor
npm test
npm run test:ui
npx expo start
```

On Windows PowerShell, if script execution is restricted, use `npm.cmd` and `npx.cmd` instead. Do not change system execution policy. Connect your computer and Android phone to the same Wi-Fi, open Expo Go with SDK 58 support, and scan the terminal QR code. The standard LAN connection is sufficient; no tunnel is configured.

**Build-environment limitation:** Source implementation and Node tests were completed here, but npm downloads failed with `EACCES` under the environment’s network restrictions. SDK 58 dependencies could not be installed; Expo compatibility diagnostics, Metro bundling, and device testing still require the commands above on a network-enabled machine. There is no generated dependency lockfile because installation did not succeed. Dependency versions follow the [official SDK 58 blank JavaScript template](https://github.com/expo/expo/blob/sdk-58/templates/expo-template-blank/package.json) and [SDK 58 compatibility map](https://github.com/expo/expo/blob/sdk-58/packages/expo/bundledNativeModules.json). No physical Android test is claimed.

## Use the app

1. **Home:** See how two queues share one CPU; select Start Simulation.
2. **Processes:** Add, edit, delete, or load the sample. IDs are assigned automatically, remain fixed during edits, and are not reused after deletion within a workload. Select each queue and set the foreground quantum (default 2).
3. **Simulate:** Run, then play/pause, step backward/forward, reset, or select 0.5×/1×/2× speed. Leaving the screen stops playback; returning starts from the first snapshot. App backgrounding pauses playback.
4. **Results:** Explore the full Gantt chart, process table, overall statistics, and queue comparison. Results describe the entire computed run even before playback finishes.
5. **Learn:** Expand beginner-friendly topics and the viva explanation.

Input changes immediately invalidate the old result. Clear All and sample replacement ask for confirmation. Limits: 24 processes, 500 total burst units, arrival times 0–1000, quantum 1–500. Arrival must be a non-negative integer; burst and quantum must be positive integers. All input is validated again by the scheduler.

## Scheduling policy and trace

- Foreground: **Round Robin**, higher priority, FIFO ready queue.
- Background: **FCFS**, lower priority. An interrupted background process retains the FCFS head position and resumes its remaining burst.
- Between queues: **strict preemptive priority**. Ready foreground work always wins. A foreground arrival interrupts background at that exact time; it never interrupts a foreground turn.
- Fixed membership: no queue migration, feedback, or aging. This is **MLQ, not MLFQ**. Other educational MLQ models may choose different policies.
- Simultaneous arrivals use original input order. At a quantum boundary, new arrivals are enqueued before the unfinished foreground process is requeued.
- One CPU, one CPU burst per process, integer logical time, no I/O blocking, no context-switch overhead. Initial idle time counts toward makespan.

`src/utils/scheduler.js` exports pure `simulateMLQ(processes, timeQuantum)`. Input objects have `{ id, arrival, burst, queue }`; queue is `foreground` or `background`. The function returns `timeline`, `steps`, `processes`, `metrics`, and `queueMetrics`, without mutating input.

Snapshots consistently represent state **after boundary events and dispatch, before the next interval executes**. Arrivals are admitted first, then completion, quantum expiry/requeueing, background preemption, and dispatch are resolved. Running processes are excluded from ready queues. Every snapshot includes exact logical time, running process, both FIFO queues, remaining time for every process, completed IDs, and an event explanation.

The engine jumps to arrivals, quantum boundaries, and completions; idle gaps jump to the next arrival. Playback speed only changes how long snapshots stay on screen. The same trace drives all visuals. Gantt widths have readability limits, with exact start/end labels; RR quantum boundaries are preserved even when one foreground process gets consecutive turns.

## Results and formulas

- Turnaround = Completion − Arrival
- Waiting = Turnaround − Burst
- Response = First CPU start − Arrival
- CPU utilization = Total busy time ÷ Makespan × 100
- Throughput = Completed process count ÷ Makespan
- Makespan = Last completion time − 0 (includes initial idle)

Empty queues have `null` averages and display “No processes in this queue.” Comparisons apply only to the chosen workload.

Sample with quantum 2:

```text
0–2 P1 | 2–4 P2 | 4–6 P3 | 6–8 P2 | 8–9 P3
9–11 P5 | 11–16 P1 | 16–20 P4
```

| ID | Queue | AT | BT | CT | TAT | WT | RT |
|---|---|---:|---:|---:|---:|---:|---:|
| P1 | Background | 0 | 7 | 16 | 16 | 9 | 0 |
| P2 | Foreground | 2 | 4 | 8 | 6 | 2 | 0 |
| P3 | Foreground | 3 | 3 | 9 | 6 | 3 | 1 |
| P4 | Background | 5 | 4 | 20 | 15 | 11 | 11 |
| P5 | Foreground | 9 | 2 | 11 | 2 | 0 | 0 |

Average WT **5**, TAT **9**, RT **2.4**; utilization **100%**; throughput **0.25 processes/unit**; makespan **20**.

## Verification

`npm test` uses Node’s built-in runner, without installing a testing framework. It checks the official sample, single and multiple queues, arrivals/ties, quantum boundaries, idle intervals, preemption/resumption, all metrics, validation, input immutability, independent snapshots, deterministic output, bounded execution, and stale-result invalidation. A seeded set of 300 workloads is compared against an independent unit-time reference scheduler. Invariants check priority, no overlaps, no execution before arrival, complete accounting of burst time, and snapshot/timeline agreement.

`npm run test:ui` exercises JavaScript callbacks using explicitly mocked native components/hooks and Babel supplied by Expo. It checks navigation, add/edit/delete, dialogs, validation, playback timers, results, learning topics, and theme contrast. This is a callback smoke check, not a React Native renderer or device test. In the restricted build environment it ran using an existing local Babel cache via `MLQ_TEST_NODE_MODULES`; after normal installation no override is needed. All 32 Node tests and 66 UI interactions passed, and 15 application modules passed JSX compilation.

Before your presentation, test on your actual phone: add/edit/delete, sample/clear confirmations, invalid inputs, keyboard and Android back, large text, horizontal charts, every tab, playback controls, pausing when backgrounded, and result invalidation after edits.

## Explain it to teammates or in a viva

Imagine one service counter and two fixed lines. Foreground customers take short turns and always get priority. Background customers are served in arrival order but can be paused when foreground work appears. When foreground empties, the paused background job continues where it stopped. The app shows each decision and measures how long jobs waited, how soon they first ran, and when they finished. With unlimited foreground arrivals, background could starve; our finite workloads eventually complete.
