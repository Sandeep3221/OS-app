const { sampleData } = require('./sampleData');

const initialSession = {
  processes: [],
  quantum: '2',
  result: null,
  nextId: 1,
  revision: 0,
};

function sessionReducer(state, action) {
  const changed = { ...state, result: null, revision: state.revision + 1 };
  switch (action.type) {
    case 'add':
      return {
        ...changed,
        nextId: state.nextId + 1,
        processes: [
          ...state.processes,
          { ...action.process, id: `P${state.nextId}` },
        ],
      };
    case 'edit':
      return {
        ...changed,
        processes: state.processes.map((p) =>
          p.id === action.process.id ? { ...action.process } : p,
        ),
      };
    case 'delete':
      return {
        ...changed,
        processes: state.processes.filter((p) => p.id !== action.id),
      };
    case 'clear':
      return { ...changed, processes: [] };
    case 'sample':
      return {
        ...changed,
        processes: sampleData.map((p) => ({ ...p })),
        quantum: '2',
        nextId: 6,
      };
    case 'quantum':
      return { ...changed, quantum: action.value };
    case 'result':
      return action.revision === state.revision
        ? { ...state, result: action.result }
        : state;
    default:
      return state;
  }
}

function integerError(value, min, max, label) {
  if (
    !/^\d+$/.test(value) ||
    !Number.isSafeInteger(Number(value)) ||
    Number(value) < min ||
    Number(value) > max
  ) {
    return `${label} must be a whole number from ${min} to ${max}.`;
  }
  return '';
}

module.exports = { initialSession, sessionReducer, integerError };
