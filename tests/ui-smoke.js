// JavaScript callback smoke checks with mocked native primitives and hooks.
// These do NOT validate React Native layout, React reconciliation, or a device.
// Babel is supplied transitively by Expo; no test framework is installed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const dependencyRequire = createRequire(
  process.env.MLQ_TEST_NODE_MODULES
    ? path.join(process.env.MLQ_TEST_NODE_MODULES, 'package.json')
    : path.join(root, 'package.json'),
);
const babel = dependencyRequire('@babel/core');
const plugins = [
  '@babel/plugin-transform-react-jsx',
  '@babel/plugin-transform-modules-commonjs',
].map((name) => dependencyRequire.resolve(name));
let host;
let timerId = 0;
let checks = 0;
const timers = new Map();
const alerts = [];
const listeners = new Map();
const moduleCache = new Map();
const react = {
  createElement: (type, props, ...children) => ({
    type,
    props: {
      ...props,
      children: children.length === 1 ? children[0] : children,
    },
  }),
  useState(initial) {
    const h = host;
    const i = h.cursor++;
    if (!(i in h.slots))
      h.slots[i] = typeof initial === 'function' ? initial() : initial;
    return [
      h.slots[i],
      (value) => {
        const next = typeof value === 'function' ? value(h.slots[i]) : value;
        if (!Object.is(next, h.slots[i])) {
          h.slots[i] = next;
          h.dirty = true;
        }
      },
    ];
  },
  useReducer(reducer, initial) {
    const [state, setState] = react.useState(initial);
    return [
      state,
      (action) => setState((previous) => reducer(previous, action)),
    ];
  },
  useMemo: (fn) => fn(),
  useCallback: (fn) => fn,
  useEffect(fn, deps) {
    const h = host;
    const i = h.cursor++;
    const previous = h.slots[i];
    if (!previous || deps.some((d, j) => !Object.is(d, previous.deps[j]))) {
      h.effects.push(() => {
        previous?.cleanup?.();
        h.slots[i] = { deps, cleanup: fn() };
      });
    }
  },
};
const subscribe = (event, fn) => {
  listeners.set(event, fn);
  return { remove: () => listeners.delete(event) };
};
const native = {
  StyleSheet: { create: (value) => value },
  Platform: { OS: 'android' },
  Alert: { alert: (...args) => alerts.push(args) },
  Keyboard: { dismiss() {}, addListener: subscribe },
  AppState: { addEventListener: subscribe },
  BackHandler: { addEventListener: subscribe },
};
for (const name of [
  'View',
  'Text',
  'TextInput',
  'ScrollView',
  'Pressable',
  'FlatList',
  'KeyboardAvoidingView',
  'Modal',
])
  native[name] = name;

function load(filename) {
  filename = path.resolve(filename);
  if (moduleCache.has(filename)) return moduleCache.get(filename).exports;
  const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
    filename,
    configFile: false,
    babelrc: false,
    plugins,
  }).code;
  const module = { exports: {} };
  moduleCache.set(filename, module);
  const localRequire = (name) => {
    if (name === 'react') return react;
    if (name === 'react-native') return native;
    if (name === 'react-native-safe-area-context')
      return {
        SafeAreaProvider: 'SafeAreaProvider',
        SafeAreaView: 'SafeAreaView',
      };
    if (name === 'expo-status-bar') return { StatusBar: 'StatusBar' };
    if (name.startsWith('.'))
      return load(path.resolve(path.dirname(filename), `${name}.js`));
    throw new Error(`Unmocked dependency: ${name}`);
  };
  vm.runInNewContext(
    code,
    {
      module,
      exports: module.exports,
      require: localRequire,
      setTimeout: (fn, delay) => {
        const id = ++timerId;
        timers.set(id, { fn, delay });
        return id;
      },
      clearTimeout: (id) => timers.delete(id),
    },
    { filename },
  );
  return module.exports;
}

function expand(node) {
  if (Array.isArray(node)) return node.flatMap(expand);
  if (!node || typeof node !== 'object') return [];
  if (node.type === 'Modal' && !node.props.visible) return [];
  if (typeof node.type === 'function' && !node.type.name.endsWith('Screen'))
    return expand(node.type(node.props));
  const children =
    node.type === 'FlatList'
      ? node.props.data.map((item, index) =>
          node.props.renderItem({ item, index }),
        )
      : node.props.children;
  return [node, ...expand(children)];
}

class Harness {
  constructor(component, props = {}) {
    this.component = component;
    this.props = props;
    this.slots = [];
    this.render();
  }
  render() {
    for (let round = 0; round < 10; round++) {
      host = this;
      this.cursor = 0;
      this.dirty = false;
      this.effects = [];
      this.tree = this.component(this.props);
      this.nodes = expand(this.tree);
      for (const effect of this.effects) effect();
      if (!this.dirty) return;
    }
    throw new Error('Unbounded render updates');
  }
  find(type, predicate = () => true) {
    const node = this.nodes.find(
      (n) =>
        (typeof n.type === 'function' ? n.type.name : n.type) === type &&
        predicate(n.props),
    );
    assert.ok(node, `Expected ${type}`);
    return node;
  }
  press(label) {
    const node = this.find('Pressable', (p) => p.accessibilityLabel === label);
    assert.ok(!node.props.disabled, `${label} should be enabled`);
    node.props.onPress();
    this.render();
    checks++;
  }
  input(label, value) {
    this.find(
      'TextInput',
      (p) => p.accessibilityLabel === label,
    ).props.onChangeText(value);
    this.render();
    checks++;
  }
  text() {
    return this.nodes
      .filter((n) => n.type === 'Text')
      .map((n) => flattenText(n.props.children))
      .join(' ');
  }
  unmount() {
    for (const slot of this.slots) slot?.cleanup?.();
  }
}
function flattenText(node) {
  if (Array.isArray(node)) return node.map(flattenText).join('');
  if (node && typeof node === 'object')
    return flattenText(node.props?.children);
  return node == null || typeof node === 'boolean' ? '' : String(node);
}
const screen = (name) =>
  load(path.join(root, `src/screens/${name}Screen.js`)).default;
const { initialSession, sessionReducer } = require('../src/utils/session');
const { simulateMLQ } = require('../src/utils/scheduler');
const { sampleData } = require('../src/utils/sampleData');
const result = simulateMLQ(sampleData, 2);

// Navigation callbacks and Android back in the real root component.
const App = load(path.join(root, 'App.js')).default;
const workspaceComponent = App().props.children.type;
const workspace = new Harness(workspaceComponent);
for (const [label, target] of [
  ['Processes', 'ProcessScreen'],
  ['Simulate', 'SimulationScreen'],
  ['Results', 'ResultsScreen'],
  ['Learn', 'LearnScreen'],
  ['Home', 'HomeScreen'],
]) {
  workspace.press(label);
  workspace.find(target);
}
assert.equal(listeners.get('hardwareBackPress')(), true);
workspace.render();
workspace.find('LearnScreen');
workspace.press('Processes');
workspace.find('ProcessScreen').props.dispatch({ type: 'sample' });
workspace.render();
workspace.find('ProcessScreen').props.runSimulation();
workspace.render();
assert.equal(
  workspace.find('SimulationScreen').props.result.metrics.makespan,
  20,
);
workspace.unmount();

const navigation = [];
const navigate = (target) => navigation.push(target);
const home = new Harness(screen('Home'), { navigate, processCount: 0 });
home.press('Start Simulation →');
home.press('Learn MLQ');
assert.deepEqual(navigation.splice(0), ['processes', 'learn']);

let state = initialSession;
let runs = 0;
const editor = new Harness(screen('Process'), {
  session: state,
  dispatch: (action) => {
    state = sessionReducer(state, action);
  },
  runSimulation: () => runs++,
});
const updateEditor = () => {
  editor.props.session = state;
  editor.render();
};
editor.press('+ Add Process');
editor.press('Add Process');
assert.match(editor.text(), /Burst must be a whole number/);
editor.input('Arrival time', '-1');
editor.input('Burst time', '2');
editor.press('Add Process');
assert.match(editor.text(), /Arrival must be a whole number/);
editor.input('Arrival time', '0');
editor.press('Add Process');
updateEditor();
assert.equal(state.processes[0].id, 'P1');
editor.press('Edit P1');
editor.input('Burst time', '5');
editor.press('Save Changes');
updateEditor();
assert.equal(state.processes[0].burst, 5);
editor.press('Delete P1');
assert.equal(state.processes.length, 1, 'delete waits for confirmation');
alerts
  .pop()[2]
  .find((a) => a.text === 'Delete')
  .onPress();
updateEditor();
assert.equal(state.processes.length, 0);
editor.press('Load Sample');
updateEditor();
assert.equal(state.processes.length, 5);
editor.input('Time quantum', '0');
updateEditor();
assert.equal(
  editor.find('Pressable', (p) => p.accessibilityLabel === 'Run Simulation →')
    .props.disabled,
  true,
);
editor.input('Time quantum', '3');
updateEditor();
editor.press('Run Simulation →');
assert.equal(runs, 1);
editor.press('Load Sample');
alerts
  .pop()[2]
  .find((a) => a.text === 'Load sample')
  .onPress();
updateEditor();
assert.equal(state.quantum, '2');
editor.press('Clear All Processes');
assert.equal(state.processes.length, 5);
alerts
  .pop()[2]
  .find((a) => a.text === 'Clear all')
  .onPress();
updateEditor();
assert.equal(state.processes.length, 0);
editor.unmount();

// Playback uses only the computed snapshots and one cancellable timer.
const simulation = new Harness(screen('Simulation'), { result, navigate });
simulation.press('Next');
assert.match(simulation.text(), /AT TIME 2/);
simulation.press('Previous');
assert.match(simulation.text(), /AT TIME 0/);
simulation.press('Play');
assert.equal(timers.size, 1);
const first = [...timers.entries()][0];
timers.delete(first[0]);
first[1].fn();
simulation.render();
assert.match(simulation.text(), /AT TIME 2/);
assert.equal(timers.size, 1);
simulation.press('Pause');
assert.equal(timers.size, 0);
const speed = simulation.nodes.find(
  (n) =>
    n.type === 'Pressable' &&
    n.props.accessibilityRole === 'radio' &&
    flattenText(n.props.children).includes('2×'),
);
assert.ok(speed);
speed.props.onPress();
simulation.render();
simulation.press('Play');
assert.equal([...timers.values()][0].delay, 550);
listeners.get('change')('background');
simulation.render();
assert.equal(timers.size, 0);
simulation.press('Reset');
assert.match(simulation.text(), /AT TIME 0/);
while (
  !simulation.find('Pressable', (p) => p.accessibilityLabel === 'Next').props
    .disabled
)
  simulation.press('Next');
assert.match(simulation.text(), /All processes are complete/);
assert.equal(
  simulation.find('Pressable', (p) => p.accessibilityLabel === 'Play').props
    .disabled,
  true,
);
simulation.press('View Results & Analysis →');
simulation.press('Edit Processes');
simulation.press('Reset');
simulation.press('Play');
simulation.unmount();
assert.equal(timers.size, 0);

const results = new Harness(screen('Results'), { result, navigate });
assert.match(results.text(), /100.0%/);
assert.match(results.text(), /0.250/);
results.press('Replay Simulation');
results.press('Edit Workload');
const oneQueue = new Harness(screen('Results'), {
  result: simulateMLQ([sampleData[1]], 2),
  navigate,
});
assert.match(oneQueue.text(), /No processes in this queue/);
for (const name of ['Results', 'Simulation']) {
  const empty = new Harness(screen(name), { result: null, navigate });
  empty.press('Set up processes');
  empty.unmount();
}
const learn = new Harness(screen('Learn'), { navigate });
const topics = learn.nodes.filter(
  (n) =>
    n.type === 'Pressable' && 'expanded' in (n.props.accessibilityState || {}),
);
assert.equal(topics.length, 16);
for (const topic of topics) {
  topic.props.onPress();
  learn.render();
  checks++;
}
learn.press('Try It with a Workload →');

// Check theme contrast without relying on visual inspection.
const { colors } = load(path.join(root, 'src/utils/theme.js'));
function luminance(hex) {
  const rgb = hex
    .slice(1)
    .match(/../g)
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
for (const foreground of [
  'text',
  'muted',
  'cyan',
  'purple',
  'green',
  'amber',
  'red',
]) {
  for (const background of [
    'background',
    'surface',
    'raised',
    'foregroundTint',
    'backgroundTint',
  ]) {
    const a = luminance(colors[foreground]);
    const b = luminance(colors[background]);
    assert.ok(
      (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) >= 4.5,
      `${foreground}/${background} contrast`,
    );
  }
}
console.log(
  `Passed UI callback smoke checks (${checks} interactions), navigation, forms, dialogs, playback cleanup, metrics rendering, and 35 text contrast pairs.`,
);
console.log(
  'Native rendering, keyboard behavior, layout, and Expo Go compatibility still require a device/runtime test.',
);
