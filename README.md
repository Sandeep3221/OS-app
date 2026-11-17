<div align="center">

# MLQ Scheduler

### One CPU. Two queues. Every scheduling decision, visualized.

A clean, interactive **Multilevel Queue (MLQ) CPU Scheduling Simulator** built with **React Native + Expo**. Create workloads, watch the CPU switch between queues, explore execution timelines, and understand exactly how scheduling decisions affect performance.

[![Android](https://img.shields.io/badge/Android-APK-3DDC84?style=flat-square&logo=android&logoColor=white)](https://github.com/Sandeep3221/OS-app/releases/latest)
[![React Native](https://img.shields.io/badge/React_Native-0.88-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK_58-000020?style=flat-square&logo=expo&logoColor=white)](https://expo.dev/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![OTA updates](https://img.shields.io/badge/OTA_updates-EAS_Update-35644A?style=flat-square)](https://docs.expo.dev/eas-update/introduction/)

**[Download Android APK](https://github.com/Sandeep3221/OS-app/releases/latest)** · **[View releases](https://github.com/Sandeep3221/OS-app/releases)** · **[Source code](https://github.com/Sandeep3221/OS-app)**

</div>

---

## Overview

**MLQ Scheduler** is an educational Android application that makes CPU scheduling easier to see, experiment with, and explain. Instead of manually drawing Gantt charts or calculating waiting times, you define the processes and let the simulator show how the scheduler makes each decision.

The app models **a single CPU serving two fixed-priority queues**:

| Queue | Scheduling policy | Priority |
| :--- | :--- | :--- |
| **Foreground** | Round Robin (RR) with a configurable time quantum | High |
| **Background** | First Come First Serve (FCFS) | Low |

When a foreground process arrives, it can **preempt a running background process immediately**. The background process retains its remaining burst time and resumes when the foreground queue becomes empty.

> [!NOTE]
> This is a **simulation of OS scheduling**, not a process manager. It does not inspect, schedule, or control real Android system processes. The implementation demonstrates **MLQ**, not Multilevel Feedback Queue (MLFQ): processes never migrate between queues.

## What you can do

| Screen | Experience |
| :--- | :--- |
| **Home** | Understand the two queues and their shared CPU through a simple visual overview. |
| **Processes** | Add, edit, delete, clear, or load sample processes; assign queues and set the Round Robin quantum. |
| **Simulation** | Watch the running process, ready queues, scheduling events, progress, and execution timeline. Play, pause, step, reset, or change playback speed. |
| **Results** | Inspect the Gantt chart, per-process completion/waiting/turnaround/response times, CPU utilization, throughput, and queue comparisons. |
| **Learn** | Read concise explanations of scheduling, preemption, starvation, RR, FCFS, MLQ vs. MLFQ, and performance metrics. |

### Designed for clarity

A restrained native-style interface with warm neutral surfaces, a botanical green accent, accessible process labels, compact editing, clear typography, and progressive disclosure for detailed explanations. The visualization stays focused on the **CPU, ready queues, and timeline** instead of overwhelming the screen with dashboard elements.

<!-- Screenshots can be added after committing actual device captures.
## Screenshots
| Home | Simulation | Results |
| :--: | :--: | :--: |
| ![Home](docs/screenshots/home.png) | ![Simulation](docs/screenshots/simulation.png) | ![Results](docs/screenshots/results.png) |
-->

## Try it on Android

**[Download the latest APK →](https://github.com/Sandeep3221/OS-app/releases/latest)**

1. Open the latest release on an Android device.
2. Under **Assets**, download the `.apk` file.
3. Open the download and approve installation from that source if Android prompts you.
4. Launch **MLQ Scheduler** and choose **Load sample** or create your own workload.

The scheduling engine runs **locally and offline**. No account, backend, or database is required to simulate a workload. Internet access is only needed for downloads and receiving published over-the-air updates.

## How the scheduler works

```text
           HIGH PRIORITY
       ┌─────────────────────┐
       │ Foreground queue    │
       │ Round Robin (RR)    │
       └──────────┬──────────┘
                  │ preferred
                  ▼
              ┌───────┐
              │  CPU  │
              └───────┘
                  ▲
                  │ only when foreground is empty
       ┌──────────┴──────────┐
       │ Background queue    │
       │ FCFS                │
       └─────────────────────┘
            LOWER PRIORITY
```

The implementation follows these rules:

- **Strict inter-queue priority:** ready foreground work always runs before background work.
- **Foreground / RR:** processes take turns in FIFO order, each for up to one time quantum. An unfinished process returns to the end of its queue.
- **Background / FCFS:** processes run in arrival order, unless a foreground arrival interrupts them; an interrupted process resumes ahead of later background work.
- **Fixed membership:** no promotion, demotion, aging, or feedback between queues.
- **Deterministic tie handling:** simultaneous arrivals follow input order; at an RR quantum boundary, new arrivals enter before the unfinished process is requeued.
- **Simplified CPU model:** one CPU, integer logical time, one burst per process, no I/O blocking and no context-switch overhead.

### Under the hood

The scheduling engine lives in [`src/utils/scheduler.js`](src/utils/scheduler.js). Its pure `simulateMLQ(processes, timeQuantum)` function validates inputs and produces five outputs:

```js
{
  timeline,      // CPU execution intervals (including idle gaps)
  steps,         // Exact scheduling-event snapshots for playback
  processes,     // Completion and per-process performance metrics
  metrics,       // Overall workload statistics
  queueMetrics   // Foreground vs. background averages
}
```

The engine **jumps between scheduling events**—arrivals, RR quantum boundaries, and completions—rather than simulating every time unit. The UI then replays the resulting snapshots, so changing playback speed **does not change scheduling results**. Every Gantt segment includes exact start and end times; visual segment widths are adjusted for readability.

## Example simulation

Try the built-in sample with a **time quantum of 2**:

| Process | Queue | Arrival | Burst |
| :--- | :--- | ---: | ---: |
| P1 | Background | 0 | 7 |
| P2 | Foreground | 2 | 4 |
| P3 | Foreground | 3 | 3 |
| P4 | Background | 5 | 4 |
| P5 | Foreground | 9 | 2 |

**Resulting execution order:**

```text
Time     0   2   4   6   8   9   11      16    20
         | P1| P2| P3| P2|P3| P5 |   P1   | P4  |
         | BG| FG| FG| FG|FG| FG |   BG   | BG  |
```

Notice that **P1 is interrupted at time 2**, when foreground process P2 arrives. P1 later resumes at time 11, once foreground work has finished.

| Metric | Result |
| :--- | ---: |
| Average waiting time | **5.00** units |
| Average turnaround time | **9.00** units |
| Average response time | **2.40** units |
| CPU utilization | **100%** |
| Throughput | **0.25** processes/unit |
| Makespan | **20** units |

<details>
<summary><strong>How are these metrics calculated?</strong></summary>

| Metric | Formula |
| :--- | :--- |
| Turnaround time | Completion time − Arrival time |
| Waiting time | Turnaround time − Burst time |
| Response time | First CPU start − Arrival time |
| CPU utilization | Total CPU busy time ÷ Makespan × 100 |
| Throughput | Completed processes ÷ Makespan |

Makespan is measured from time zero to the final completion, including any initial idle time.

</details>

## Tech stack

| Layer | Technology |
| :--- | :--- |
| Mobile application | React Native **0.88.1**, React **19.3.0** |
| Tooling | Expo **SDK 58** |
| Language | JavaScript (functional components, Hooks) |
| Styling | React Native `StyleSheet` and reusable design tokens |
| State management | `useReducer` + React Hooks |
| Scheduling core | Pure JavaScript, event-driven MLQ scheduler |
| Android builds | Expo Application Services (**EAS Build**) |
| In-app updates | **expo-updates** + **EAS Update** |
| CI/CD | **GitHub Actions** |
| Distribution | **GitHub Releases** (signed APK) |
| Tests | Node.js built-in test runner; mocked UI smoke checks |

**No backend or database:** the workloads and results exist in memory and reset when the app restarts.

## Project structure

```text
OS-app/
├── .github/
│   └── workflows/
│       └── eas-update.yml        # Automated EAS Update publishing
├── src/
│   ├── components/               # Shared UI, process cards, metrics, Gantt chart
│   ├── screens/
│   │   ├── HomeScreen.js
│   │   ├── ProcessScreen.js
│   │   ├── SimulationScreen.js
│   │   ├── ResultsScreen.js
│   │   └── LearnScreen.js
│   └── utils/
│       ├── scheduler.js         # Deterministic MLQ engine
│       ├── session.js           # Workload state + result invalidation
│       ├── sampleData.js        # Built-in example workload
│       └── theme.js             # Colors, type scale, spacing, shared styles
├── tests/                        # Scheduler and UI smoke tests
├── App.js                        # Screen navigation and app orchestration
├── app.json                      # Expo identity and update configuration
├── eas.json                      # Build profiles and update channels
├── package.json
└── README.md
```

## Run locally

**Prerequisites:** Node.js 22.13+ and npm; Expo Go or an Android development environment to run the app.

```bash
git clone https://github.com/Sandeep3221/OS-app.git
cd OS-app
npm ci
npx expo start
```

Scan the QR code using a compatible Expo Go installation, or use an Android emulator. On Windows PowerShell, `npm.cmd` and `npx.cmd` work if your shell restricts PowerShell script shims.

### Tests

```bash
npm test
npm run test:ui
```

The repository includes deterministic scheduling tests and a separate mocked UI interaction suite. Scheduling coverage includes queue priority, arrivals and ties, preemption/resumption, time quanta, metric correctness, input validation, and a comparison against an **independent unit-time reference implementation across 300 seeded workloads**.

## Android delivery & CI/CD

This repository supports two complementary kinds of delivery:

### 1. Installable APK — EAS Build + GitHub Releases

```text
Source code → EAS Build → Signed APK → GitHub Release → Android installation
```

The `preview` build profile in [`eas.json`](eas.json) generates an installable APK and subscribes to the **`preview` update channel**.

```bash
# Requires EAS CLI and an authenticated Expo account
eas build --platform android --profile preview
```

After the build, publish the signed APK as an asset on [GitHub Releases](https://github.com/Sandeep3221/OS-app/releases).

### 2. JavaScript / asset updates — GitHub Actions + EAS Update

```text
Push compatible UI/JS changes to main
                  ↓
           GitHub Actions
                  ↓
        Publish to EAS Update
           (preview channel)
                  ↓
    Installed compatible Android apps
           receive the update
```

The workflow in [`.github/workflows/eas-update.yml`](.github/workflows/eas-update.yml) is triggered by changes to `App.js`, `index.js`, `src/**`, or `assets/**`. It installs the project dependencies, authenticates with the **`EXPO_TOKEN` GitHub Actions secret**, and publishes to EAS Update. It can also be run manually.

**What updates without a new APK?** Compatible JavaScript, UI, and bundled asset changes. Updates are generally downloaded and activated on a later app launch; a Git push is **not** instant hot reload.

**What requires a new APK?** Native dependencies, Android permissions, or other native/runtime-incompatible changes. The existing workflow contains a basic configuration-change safeguard, but it is **not** a substitute for native compatibility review. The currently installed build must also be subscribed to the matching channel and runtime version.

The update pipeline has been verified end-to-end on an installed Android device: a committed UI change was published through GitHub Actions and subsequently appeared in the app without reinstalling the APK.

> [!IMPORTANT]
> GitHub Releases delivers the downloadable APK. **EAS Update delivers compatible code updates to already-installed builds.** They are different parts of the release pipeline.

## Why this project?

MLQ scheduling is easy to define on paper but harder to follow when processes arrive mid-execution, a background job gets interrupted, or several foreground tasks rotate through time quanta.

This project connects **the algorithm, its execution trace, and its performance metrics** in a single interactive app. It is both an Operating Systems learning tool and a practical exercise in building, signing, distributing, and continuously updating a React Native Android application.

---

<div align="center">

Built by **[Sandeep Adhikari](https://github.com/Sandeep3221)**

[GitHub](https://github.com/Sandeep3221) · [Download APK](https://github.com/Sandeep3221/OS-app/releases/latest)

</div>
