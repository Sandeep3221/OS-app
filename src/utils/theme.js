import { StyleSheet } from 'react-native';

export const colors = {
  background: '#080F1D',
  surface: '#111C2E',
  raised: '#17253B',
  border: '#2B3E57',
  text: '#F0F5FC',
  muted: '#A5B5CD',
  cyan: '#68DFFF',
  blue: '#72A8FF',
  purple: '#C2A3FF',
  green: '#70E2AD',
  amber: '#FFD080',
  red: '#FFA6AE',
  idle: '#A5B0C3',
  foregroundTint: '#132C40',
  backgroundTint: '#28223E',
  successTint: '#12352D',
  scrim: '#020610DD',
  buttonText: '#071625',
};

const processColors = [
  '#68DFFF',
  '#B9A0FF',
  '#FFD080',
  '#70E2AD',
  '#FFABC8',
  '#8EBEFF',
  '#FFB593',
  '#D6E980',
  '#B0B9FF',
  '#8AE3D4',
  '#E5ABFF',
  '#D6C5A1',
  '#8ACBEF',
  '#C4B3F2',
  '#E6C881',
  '#A4D9A0',
  '#EAA5B5',
  '#B5CEF9',
  '#EEB99B',
  '#CBDDA4',
  '#C3C9F3',
  '#A1D8D3',
  '#DCBDEB',
  '#C8D1B7',
];
export const processColor = (id) =>
  id
    ? processColors[(Number(id.slice(1)) - 1) % processColors.length]
    : colors.idle;
export const queueColor = (queue) =>
  queue === 'foreground' ? colors.cyan : colors.purple;
export const queueName = (queue) =>
  queue === 'foreground' ? 'Foreground' : 'Background';
export const format = (value, digits = 2) =>
  value == null ? '—' : Number(value).toFixed(digits);

export const shared = StyleSheet.create({
  page: {
    padding: 20,
    paddingBottom: 32,
    gap: 24,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.7,
  },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 23 },
  body: { color: colors.muted, fontSize: 15, lineHeight: 23 },
  eyebrow: {
    color: colors.cyan,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.6,
  },
  heading: { color: colors.text, fontSize: 19, fontWeight: '700' },
  label: { color: colors.text, fontSize: 14, fontWeight: '600' },
  caption: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 18,
    gap: 14,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  section: { gap: 12 },
  number: { fontVariant: ['tabular-nums'] },
  error: { color: colors.red, fontSize: 14, lineHeight: 21 },
});
