const { test } = require('node:test');
const assert = require('node:assert/strict');
const { simulateMLQ, LIMITS } = require('../src/utils/scheduler');
const { sampleData } = require('../src/utils/sampleData');

const p = (id, arrival, burst, queue = 'foreground') => ({
  id,
  arrival,
  burst,
  queue,
});
const slices = (r) => r.timeline.map((s) => [s.processId, s.start, s.end]);

function invariants(input, result) {
  const executed = Object.fromEntries(input.map((x) => [x.id, 0]));
  let cursor = 0;
  for (const s of result.timeline) {
    assert.equal(s.start, cursor, 'no overlaps or unrecorded gaps');
    assert.ok(s.end > s.start);
    cursor = s.end;
    if (s.processId) {
      const process = input.find((x) => x.id === s.processId);
      assert.ok(s.start >= process.arrival, 'never execute before arrival');
      assert.equal(s.queue, process.queue);
      executed[s.processId] += s.end - s.start;
      if (s.queue === 'foreground')
        assert.ok(s.end - s.start <= result.timeQuantum);
      if (s.queue === 'background') {
        for (const fg of result.processes.filter(
          (x) => x.queue === 'foreground',
        )) {
          assert.ok(
            fg.arrival >= s.end || fg.completion <= s.start,
            'strict foreground priority',
          );
        }
      }
    }
  }
  assert.equal(cursor, result.metrics.makespan);
  assert.equal(
    result.metrics.busyTime,
    input.reduce((sum, x) => sum + x.burst, 0),
  );
  for (const x of result.processes) {
    assert.equal(executed[x.id], x.burst);
    assert.ok(x.waiting >= 0);
    assert.ok(x.response >= 0);
    assert.equal(x.turnaround, x.completion - x.arrival);
    assert.equal(x.waiting, x.turnaround - x.burst);
    assert.equal(x.response, x.firstStart - x.arrival);
  }
  for (const [i, step] of result.steps.entries()) {
    if (i) assert.ok(step.time > result.steps[i - 1].time);
    const ready = [...step.foreground, ...step.background];
    assert.equal(new Set(ready.map((x) => x.id)).size, ready.length);
    assert.ok(!ready.some((x) => x.id === step.running?.id));
    if (step.running?.queue === 'background')
      assert.equal(step.foreground.length, 0);
    for (const x of input) {
      const done = result.timeline
        .filter((s) => s.processId === x.id)
        .reduce(
          (sum, s) => sum + Math.max(0, Math.min(step.time, s.end) - s.start),
          0,
        );
      assert.equal(
        step.remaining[x.id],
        x.burst - done,
        'snapshot agrees with timeline',
      );
      assert.equal(step.completed.includes(x.id), done === x.burst);
      if (x.arrival <= step.time && done < x.burst) {
        assert.ok(
          step.running?.id === x.id || ready.some((q) => q.id === x.id),
          'arrived work is accounted for',
        );
      } else assert.ok(!ready.some((q) => q.id === x.id));
    }
    for (const q of ready) assert.equal(q.remaining, step.remaining[q.id]);
    if (step.running)
      assert.equal(step.running.remaining, step.remaining[step.running.id]);
  }
  const final = result.steps.at(-1);
  assert.equal(final.running, null);
  assert.equal(final.completed.length, input.length);
}

test('single foreground preserves successive quantum boundaries', () => {
  const r = simulateMLQ([p('P1', 0, 5)], 2);
  assert.deepEqual(slices(r), [
    ['P1', 0, 2],
    ['P1', 2, 4],
    ['P1', 4, 5],
  ]);
});
test('single background runs to completion', () => {
  assert.deepEqual(slices(simulateMLQ([p('P1', 0, 5, 'background')], 2)), [
    ['P1', 0, 5],
  ]);
});
test('multiple foreground processes rotate FIFO', () => {
  assert.deepEqual(slices(simulateMLQ([p('P1', 0, 3), p('P2', 0, 3)], 2)), [
    ['P1', 0, 2],
    ['P2', 2, 4],
    ['P1', 4, 5],
    ['P2', 5, 6],
  ]);
});
test('multiple background processes use arrival order', () => {
  assert.deepEqual(
    slices(
      simulateMLQ(
        [p('P1', 2, 2, 'background'), p('P2', 0, 4, 'background')],
        2,
      ),
    ),
    [
      ['P2', 0, 4],
      ['P1', 4, 6],
    ],
  );
});
test('simultaneous foreground beats background despite input order', () => {
  assert.deepEqual(
    slices(simulateMLQ([p('P1', 0, 2, 'background'), p('P2', 0, 1)], 2)),
    [
      ['P2', 0, 1],
      ['P1', 1, 3],
    ],
  );
});
test('foreground arrival preempts background at exact arrival', () => {
  assert.deepEqual(
    slices(simulateMLQ([p('P1', 0, 4, 'background'), p('P2', 1, 2)], 2)),
    [
      ['P1', 0, 1],
      ['P2', 1, 3],
      ['P1', 3, 6],
    ],
  );
});
test('preempted FCFS head resumes before later background arrivals', () => {
  assert.deepEqual(
    slices(
      simulateMLQ(
        [
          p('P1', 0, 4, 'background'),
          p('P2', 1, 2),
          p('P3', 1, 2, 'background'),
        ],
        2,
      ),
    ),
    [
      ['P1', 0, 1],
      ['P2', 1, 3],
      ['P1', 3, 6],
      ['P3', 6, 8],
    ],
  );
});
test('arrivals within quantum do not preempt foreground', () => {
  const r = simulateMLQ([p('P1', 0, 5), p('P2', 1, 1), p('P3', 2, 1)], 3);
  assert.deepEqual(slices(r), [
    ['P1', 0, 3],
    ['P2', 3, 4],
    ['P3', 4, 5],
    ['P1', 5, 7],
  ]);
  assert.equal(r.steps.find((s) => s.time === 1).running.id, 'P1');
});
test('idle jumps cover initial and intermediate gaps', () => {
  const r = simulateMLQ([p('P1', 5, 1), p('P2', 1000, 1)], 2);
  assert.deepEqual(slices(r), [
    [null, 0, 5],
    ['P1', 5, 6],
    [null, 6, 1000],
    ['P2', 1000, 1001],
  ]);
  assert.equal(r.steps.length, 5);
});
test('quantum one rotates every unit', () => {
  assert.deepEqual(slices(simulateMLQ([p('P1', 0, 2), p('P2', 0, 2)], 1)), [
    ['P1', 0, 1],
    ['P2', 1, 2],
    ['P1', 2, 3],
    ['P2', 3, 4],
  ]);
});
test('quantum larger than burst releases CPU early', () => {
  assert.deepEqual(slices(simulateMLQ([p('P1', 0, 2), p('P2', 0, 1)], 20)), [
    ['P1', 0, 2],
    ['P2', 2, 3],
  ]);
});
test('quantum-boundary arrivals go before the expired process in input order', () => {
  const r = simulateMLQ([p('P1', 0, 4), p('P3', 2, 1), p('P2', 2, 1)], 2);
  assert.deepEqual(slices(r), [
    ['P1', 0, 2],
    ['P3', 2, 3],
    ['P2', 3, 4],
    ['P1', 4, 6],
  ]);
  assert.deepEqual(
    r.steps.find((s) => s.time === 2).foreground.map((x) => x.id),
    ['P2', 'P1'],
  );
});
test('all arrivals zero preserve original order within each queue', () => {
  assert.deepEqual(
    slices(
      simulateMLQ(
        [
          p('P4', 0, 1, 'background'),
          p('P3', 0, 1),
          p('P2', 0, 1),
          p('P1', 0, 1, 'background'),
        ],
        2,
      ),
    ).map((s) => s[0]),
    ['P3', 'P2', 'P4', 'P1'],
  );
});
test('official sample timeline and exact completion times', () => {
  const r = simulateMLQ(sampleData, 2);
  assert.deepEqual(slices(r), [
    ['P1', 0, 2],
    ['P2', 2, 4],
    ['P3', 4, 6],
    ['P2', 6, 8],
    ['P3', 8, 9],
    ['P5', 9, 11],
    ['P1', 11, 16],
    ['P4', 16, 20],
  ]);
  assert.deepEqual(
    r.processes.map((x) => x.completion),
    [16, 8, 9, 20, 11],
  );
  invariants(sampleData, r);
});
test('official sample turnaround times', () =>
  assert.deepEqual(
    simulateMLQ(sampleData, 2).processes.map((x) => x.turnaround),
    [16, 6, 6, 15, 2],
  ));
test('official sample waiting times', () =>
  assert.deepEqual(
    simulateMLQ(sampleData, 2).processes.map((x) => x.waiting),
    [9, 2, 3, 11, 0],
  ));
test('official sample response times', () =>
  assert.deepEqual(
    simulateMLQ(sampleData, 2).processes.map((x) => x.response),
    [0, 0, 1, 11, 0],
  ));
test('overall averages and queue comparison', () => {
  const r = simulateMLQ(sampleData, 2);
  assert.equal(r.metrics.averageWaiting, 5);
  assert.equal(r.metrics.averageTurnaround, 9);
  assert.equal(r.metrics.averageResponse, 2.4);
  assert.equal(r.queueMetrics.foreground.averageWaiting, 5 / 3);
  assert.equal(r.queueMetrics.background.averageWaiting, 10);
  assert.equal(r.queueMetrics.background.averageTurnaround, 15.5);
  assert.equal(r.queueMetrics.background.averageResponse, 5.5);
});
test('CPU utilization includes initial idle', () => {
  assert.equal(simulateMLQ([p('P1', 3, 2)], 2).metrics.cpuUtilization, 40);
  assert.equal(simulateMLQ(sampleData, 2).metrics.cpuUtilization, 100);
});
test('throughput uses makespan from zero', () => {
  assert.equal(simulateMLQ([p('P1', 3, 2)], 2).metrics.throughput, 0.2);
  assert.equal(simulateMLQ(sampleData, 2).metrics.throughput, 0.25);
});
test('empty queue averages are null, not zero', () =>
  assert.deepEqual(simulateMLQ([p('P1', 0, 1)], 2).queueMetrics.background, {
    count: 0,
    averageWaiting: null,
    averageTurnaround: null,
    averageResponse: null,
  }));
test('input immutability including frozen objects', () => {
  const input = Object.freeze(sampleData.map((x) => Object.freeze({ ...x })));
  const before = JSON.stringify(input);
  simulateMLQ(input, 2);
  assert.equal(JSON.stringify(input), before);
});
test('invalid quantum rejected', () => {
  for (const quantum of [
    0,
    -1,
    1.5,
    NaN,
    Infinity,
    undefined,
    null,
    '',
    '2',
    501,
  ])
    assert.throws(() => simulateMLQ(sampleData, quantum), /quantum/);
});
test('invalid process data and limits rejected', () => {
  const invalid = [
    [],
    null,
    [null],
    [p('bad', 0, 1)],
    [p('P1', -1, 2)],
    [p('P1', 0.5, 1)],
    [p('P1', 1001, 1)],
    [p('P1', '0', 1)],
    [p('P1', 0, 0)],
    [p('P1', 0, -1)],
    [p('P1', 0, 1.5)],
    [p('P1', 0, NaN)],
    [p('P1', 0, 1, '')],
    [p('P1', 0, 1), p('P1', 2, 3)],
    [p('P1', 0, 300), p('P2', 0, 201)],
    Array.from({ length: 25 }, (_, i) => p(`P${i + 1}`, 0, 1)),
  ];
  for (const input of invalid) assert.throws(() => simulateMLQ(input, 2));
});
test(
  'bounded work terminates at maximum burst and idle',
  { timeout: 1000 },
  () => {
    const r = simulateMLQ([p('P1', LIMITS.arrival, LIMITS.totalBurst)], 1);
    assert.equal(r.metrics.makespan, 1500);
    assert.equal(r.timeline.length, 501);
  },
);
test('deterministic output and independent snapshots', () => {
  const r = simulateMLQ(sampleData, 2);
  assert.deepEqual(r, simulateMLQ(sampleData, 2));
  r.steps[0].remaining.P1 = 999;
  assert.equal(r.steps[1].remaining.P1, 5);
  assert.equal(r.processes[0].burst, 7);
});

// Independent unit-time oracle: compare against the event-based engine across
// generated workloads. This deliberately uses ticks rather than event jumps.
function reference(input, quantum) {
  const jobs = input.map((x) => ({
    ...x,
    left: x.burst,
    start: null,
    finish: null,
  }));
  const fg = [];
  const bg = [];
  const ticks = [];
  let active = null;
  let used = 0;
  for (let time = 0; jobs.some((x) => x.finish === null); time++) {
    for (const x of jobs.filter((x) => x.arrival === time))
      (x.queue === 'foreground' ? fg : bg).push(x);
    if (active && active.left === 0) {
      active.finish = time;
      active = null;
    }
    if (active?.queue === 'foreground' && used === quantum) {
      fg.push(active);
      active = null;
    }
    if (active?.queue === 'background' && fg.length) {
      bg.unshift(active);
      active = null;
    }
    if (!active) {
      active = fg.shift() || bg.shift();
      used = 0;
    }
    if (jobs.every((x) => x.finish !== null)) break;
    ticks.push(active?.id ?? null);
    if (active) {
      active.start ??= time;
      active.left--;
      used++;
    }
    assert.ok(time < 2000, 'reference terminates');
  }
  return { ticks, jobs };
}
test(
  '300 seeded workloads match independent oracle and all scheduling invariants',
  { timeout: 5000 },
  () => {
    let seed = 421;
    const random = (n) => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed % n;
    };
    for (let trial = 0; trial < 300; trial++) {
      const input = Array.from({ length: 1 + random(12) }, (_, i) =>
        p(
          `P${i + 1}`,
          random(16),
          1 + random(8),
          random(3) ? 'foreground' : 'background',
        ),
      );
      const quantum = 1 + random(8);
      const r = simulateMLQ(input, quantum);
      const oracle = reference(input, quantum);
      assert.deepEqual(
        r.timeline.flatMap((s) => Array(s.end - s.start).fill(s.processId)),
        oracle.ticks,
      );
      assert.deepEqual(
        r.processes.map((x) => [x.firstStart, x.completion]),
        oracle.jobs.map((x) => [x.start, x.finish]),
      );
      invariants(input, r);
    }
  },
);
