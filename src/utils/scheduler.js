const LIMITS = Object.freeze({
  processes: 24,
  totalBurst: 500,
  arrival: 1000,
  quantum: 500,
});

function validateInput(processes, timeQuantum) {
  if (
    !Number.isSafeInteger(timeQuantum) ||
    timeQuantum < 1 ||
    timeQuantum > LIMITS.quantum
  ) {
    throw new Error(
      `Time quantum must be a whole number from 1 to ${LIMITS.quantum}.`,
    );
  }
  if (!Array.isArray(processes) || !processes.length)
    throw new Error('Add at least one process.');
  if (processes.length > LIMITS.processes)
    throw new Error(`Use at most ${LIMITS.processes} processes.`);
  const ids = new Set();
  let totalBurst = 0;
  for (const p of processes) {
    if (!p || typeof p.id !== 'string' || !/^P[1-9]\d{0,3}$/.test(p.id)) {
      throw new Error('Each process needs an ID from P1 to P9999.');
    }
    if (ids.has(p.id)) throw new Error(`Process ID ${p.id} is already in use.`);
    ids.add(p.id);
    if (
      !Number.isSafeInteger(p.arrival) ||
      p.arrival < 0 ||
      p.arrival > LIMITS.arrival
    ) {
      throw new Error(
        `${p.id}: arrival must be a whole number from 0 to ${LIMITS.arrival}.`,
      );
    }
    if (
      !Number.isSafeInteger(p.burst) ||
      p.burst < 1 ||
      p.burst > LIMITS.totalBurst
    ) {
      throw new Error(
        `${p.id}: burst must be a whole number from 1 to ${LIMITS.totalBurst}.`,
      );
    }
    if (!['foreground', 'background'].includes(p.queue))
      throw new Error(`${p.id}: select a queue.`);
    totalBurst += p.burst;
  }
  if (totalBurst > LIMITS.totalBurst)
    throw new Error(
      `Combined burst time must not exceed ${LIMITS.totalBurst} units.`,
    );
}

function summarize(processes) {
  const count = processes.length;
  const average = (key) =>
    count ? processes.reduce((sum, p) => sum + p[key], 0) / count : null;
  return {
    count,
    averageWaiting: average('waiting'),
    averageTurnaround: average('turnaround'),
    averageResponse: average('response'),
  };
}

/**
 * Snapshots are AFTER boundary processing and dispatch, BEFORE the next interval.
 * Boundary order: admit arrivals (input order), finish/requeue/preempt, dispatch.
 * A running process is excluded from both ready queues. Remaining times describe
 * exactly snapshot.time. Idle gaps jump directly to the next arrival.
 */
function simulateMLQ(processes, timeQuantum) {
  validateInput(processes, timeQuantum);
  const work = processes.map((p, order) => ({
    ...p,
    order,
    remaining: p.burst,
    firstStart: null,
    completion: null,
  }));
  const arrivals = [...work].sort(
    (a, b) => a.arrival - b.arrival || a.order - b.order,
  );
  const foreground = [];
  const background = [];
  const completed = [];
  const timeline = [];
  const steps = [];
  let time = 0;
  let arrivalIndex = 0;
  let running = null;
  let quantumLeft = 0;
  let dispatch = 0;
  let previousDispatch = -1;

  while (true) {
    // Every iteration either advances time or ends. This guard also catches regressions.
    if (steps.length > LIMITS.totalBurst + LIMITS.processes * 2 + 2)
      throw new Error('Scheduling progress limit exceeded.');
    const events = [];
    while (
      arrivalIndex < arrivals.length &&
      arrivals[arrivalIndex].arrival === time
    ) {
      const p = arrivals[arrivalIndex++];
      (p.queue === 'foreground' ? foreground : background).push(p);
      events.push(`${p.id} arrives in ${p.queue}.`);
    }
    if (running && running.remaining === 0) {
      running.completion = time;
      completed.push(running.id);
      events.push(`${running.id} completes.`);
      running = null;
    }
    if (running && running.queue === 'foreground' && quantumLeft === 0) {
      events.push(
        `${running.id}'s quantum expires; it joins the end of foreground after new arrivals.`,
      );
      foreground.push(running);
      running = null;
    }
    if (running && running.queue === 'background' && foreground.length) {
      events.push(
        `${running.id} is preempted by foreground work; ${running.remaining} units are saved.`,
      );
      // The interrupted FCFS head retains its position ahead of later background jobs.
      background.unshift(running);
      running = null;
    }
    if (!running) {
      running = foreground.shift() || background.shift() || null;
      dispatch++;
      if (running) {
        const resumed = running.firstStart !== null;
        if (!resumed) running.firstStart = time;
        quantumLeft = running.queue === 'foreground' ? timeQuantum : Infinity;
        events.push(
          `${running.id} ${resumed ? 'resumes' : 'starts'} on the CPU (${running.queue === 'foreground' ? 'Round Robin' : 'FCFS'}).`,
        );
      }
    }
    if (!running)
      events.push(
        completed.length === work.length
          ? 'All processes are complete.'
          : 'CPU idle until the next arrival.',
      );
    const readyItem = (p) => ({
      id: p.id,
      queue: p.queue,
      remaining: p.remaining,
    });
    steps.push({
      time,
      running: running ? readyItem(running) : null,
      foreground: foreground.map(readyItem),
      background: background.map(readyItem),
      remaining: Object.fromEntries(work.map((p) => [p.id, p.remaining])),
      completed: [...completed],
      event: events.join(' '),
    });
    if (completed.length === work.length) break;
    const nextArrival = arrivals[arrivalIndex]?.arrival ?? Infinity;
    const end = running
      ? Math.min(time + running.remaining, time + quantumLeft, nextArrival)
      : nextArrival;
    if (!Number.isFinite(end) || end <= time)
      throw new Error('Scheduler could not advance time.');
    const last = timeline[timeline.length - 1];
    // Arrivals can add snapshots without splitting a dispatch in the Gantt chart.
    // A renewed RR quantum always has a new dispatch, even for the same process.
    if (last && previousDispatch === dispatch) last.end = end;
    else
      timeline.push({
        processId: running?.id ?? null,
        queue: running?.queue ?? 'idle',
        start: time,
        end,
      });
    previousDispatch = dispatch;
    if (running) {
      running.remaining -= end - time;
      quantumLeft -= end - time;
    }
    time = end;
  }

  const results = work.map(({ order, remaining, ...p }) => ({
    ...p,
    turnaround: p.completion - p.arrival,
    waiting: p.completion - p.arrival - p.burst,
    response: p.firstStart - p.arrival,
  }));
  const busyTime = results.reduce((sum, p) => sum + p.burst, 0);
  return {
    timeQuantum,
    timeline,
    steps,
    processes: results,
    metrics: {
      ...summarize(results),
      busyTime,
      makespan: time,
      cpuUtilization: (busyTime / time) * 100,
      throughput: results.length / time,
    },
    queueMetrics: {
      foreground: summarize(results.filter((p) => p.queue === 'foreground')),
      background: summarize(results.filter((p) => p.queue === 'background')),
    },
  };
}

module.exports = { simulateMLQ, validateInput, LIMITS };
