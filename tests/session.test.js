const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  initialSession,
  sessionReducer,
  integerError,
} = require('../src/utils/session');
const { simulateMLQ } = require('../src/utils/scheduler');

function completedSession() {
  const sample = sessionReducer(initialSession, { type: 'sample' });
  return sessionReducer(sample, {
    type: 'result',
    result: simulateMLQ(sample.processes, 2),
    revision: sample.revision,
  });
}
test('sample loads five processes, resets quantum, and clears results', () => {
  const state = sessionReducer(
    { ...completedSession(), quantum: '4' },
    { type: 'sample' },
  );
  assert.equal(state.quantum, '2');
  assert.equal(state.processes.length, 5);
  assert.equal(state.nextId, 6);
  assert.equal(state.result, null);
});
test('every input change invalidates the previous simulation', () => {
  for (const action of [
    { type: 'add', process: { arrival: 0, burst: 1, queue: 'foreground' } },
    {
      type: 'edit',
      process: { id: 'P1', arrival: 2, burst: 2, queue: 'foreground' },
    },
    { type: 'delete', id: 'P1' },
    { type: 'clear' },
    { type: 'quantum', value: '' },
  ]) {
    const state = completedSession();
    const updated = sessionReducer(state, action);
    assert.equal(updated.result, null);
    assert.equal(updated.revision, state.revision + 1);
    assert.ok(state.result);
  }
});
test('IDs remain unique after deletions, edits, and clear', () => {
  let state = sessionReducer(initialSession, { type: 'sample' });
  state = sessionReducer(state, { type: 'delete', id: 'P5' });
  state = sessionReducer(state, {
    type: 'add',
    process: { arrival: 0, burst: 1, queue: 'background' },
  });
  assert.equal(state.processes.at(-1).id, 'P6');
  state = sessionReducer(state, {
    type: 'edit',
    process: { id: 'P6', arrival: 1, burst: 2, queue: 'foreground' },
  });
  assert.equal(state.processes.at(-1).burst, 2);
  assert.equal(
    new Set(state.processes.map((p) => p.id)).size,
    state.processes.length,
  );
  state = sessionReducer(state, { type: 'clear' });
  state = sessionReducer(state, {
    type: 'add',
    process: { arrival: 0, burst: 1, queue: 'foreground' },
  });
  assert.equal(state.processes[0].id, 'P7');
});
test('late results from a previous input revision are ignored', () => {
  const state = completedSession();
  const changed = sessionReducer(state, { type: 'quantum', value: '3' });
  assert.equal(
    sessionReducer(changed, {
      type: 'result',
      result: state.result,
      revision: state.revision,
    }).result,
    null,
  );
});
test('form validation rejects empty, decimal, signed, and nonnumeric values', () => {
  for (const value of ['', ' ', '-1', '+1', '1.1', '2e2', 'NaN', '501'])
    assert.ok(integerError(value, 1, 500, 'Quantum'));
  assert.equal(integerError('2', 1, 500, 'Quantum'), '');
  assert.equal(integerError('0', 0, 1000, 'Arrival'), '');
  assert.ok(integerError('0', 1, 500, 'Burst'));
});
