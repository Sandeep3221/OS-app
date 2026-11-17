import React, { useCallback, useEffect, useReducer, useState } from 'react';
import {
  Alert,
  BackHandler,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Icon, MotionProvider } from './src/components/UI';
import HomeScreen from './src/screens/HomeScreen';
import ProcessScreen from './src/screens/ProcessScreen';
import SimulationScreen from './src/screens/SimulationScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import LearnScreen from './src/screens/LearnScreen';
import { simulateMLQ } from './src/utils/scheduler';
import {
  initialSession,
  sessionReducer,
  integerError,
} from './src/utils/session';
import { colors } from './src/utils/theme';

const tabs = [
  ['home', 'Home'],
  ['processes', 'Processes'],
  ['simulation', 'Simulate'],
  ['results', 'Results'],
  ['learn', 'Learn'],
];

function Workspace() {
  const [session, dispatch] = useReducer(sessionReducer, initialSession);
  const [history, setHistory] = useState(['home']);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const active = history[history.length - 1];
  const navigate = useCallback((screen) => {
    Keyboard.dismiss();
    setHistory((previous) =>
      previous[previous.length - 1] === screen
        ? previous
        : [...previous.slice(-19), screen],
    );
  }, []);
  useEffect(() => {
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      if (history.length <= 1) return false;
      setHistory((previous) => previous.slice(0, -1));
      return true;
    });
    return () => back.remove();
  }, [history.length]);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  const runSimulation = () => {
    try {
      const error = integerError(session.quantum, 1, 500, 'Time quantum');
      if (error) throw new Error(error);
      const result = simulateMLQ(session.processes, Number(session.quantum));
      dispatch({ type: 'result', result, revision: session.revision });
      navigate('simulation');
    } catch (error) {
      Alert.alert('Check your workload', error.message);
    }
  };
  return (
    <SafeAreaView style={styles.app}>
      <StatusBar style="dark" />
      <View style={{ flex: 1 }}>
        {active === 'home' && (
          <HomeScreen
            navigate={navigate}
            processCount={session.processes.length}
          />
        )}
        {active === 'processes' && (
          <ProcessScreen
            session={session}
            dispatch={dispatch}
            runSimulation={runSimulation}
          />
        )}
        {active === 'simulation' && (
          <SimulationScreen result={session.result} navigate={navigate} />
        )}
        {active === 'results' && (
          <ResultsScreen result={session.result} navigate={navigate} />
        )}
        {active === 'learn' && <LearnScreen navigate={navigate} />}
      </View>
      {!keyboardVisible && (
        <View style={styles.navigation}>
          {tabs.map(([id, title]) => {
            const selected = active === id;
            return (
              <Pressable
                key={id}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                accessibilityLabel={title}
                onPress={() => navigate(id)}
                style={({ pressed }) => [
                  styles.tab,
                  pressed && { opacity: 0.6 },
                ]}
              >
                <Icon name={id} color={selected ? colors.accent : colors.muted} />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: selected ? colors.accent : colors.muted, fontWeight: selected ? '700' : '400' },
                  ]}
                >
                  {title}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MotionProvider>
        <Workspace />
      </MotionProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.background },
  navigation: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 6,
    paddingTop: 4,
    paddingBottom: 6,
    gap: 3,
  },
  tab: {
    flex: 1,
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 0,
  },
  tabLabel: { fontSize: 12, textAlign: 'center', maxWidth: '100%' },
});
