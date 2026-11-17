import { StyleSheet } from 'react-native';

// Warm paper, ink, and one botanical accent. Queue identity is also written out.
export const colors = {
  background: '#F6F5F1',
  surface: '#FFFFFF',
  raised: '#EEEDE8',
  border: '#DEDFD8',
  inputBorder: '#898D84',
  text: '#252923',
  muted: '#666B62',
  accent: '#35644A',
  foreground: '#35644A',
  backgroundQueue: '#686359',
  success: '#35644A',
  warning: '#805D24',
  danger: '#AD3E36',
  idle: '#666B62',
  foregroundTint: '#E9F0E9',
  backgroundTint: '#EEECE6',
  successTint: '#E9F0E9',
  dangerTint: '#FAEEEB',
  scrim: '#25292366',
  buttonText: '#FFFFFF',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const motion = { feedback: 120, reveal: 180 };
export const type = {
  title: { fontSize: 30, lineHeight: 36, fontWeight: '700' },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24 },
  label: { fontSize: 15, lineHeight: 21, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 19 },
  value: { fontSize: 32, lineHeight: 40, fontWeight: '600', fontVariant: ['tabular-nums'] },
};

export const queueColor = (queue) =>
  queue === 'foreground' ? colors.foreground : colors.backgroundQueue;
export const queueName = (queue) =>
  queue === 'foreground' ? 'Foreground' : 'Background';
export const format = (value, digits = 2) =>
  value == null ? '—' : Number(value).toFixed(digits);

export const shared = StyleSheet.create({
  page: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  title: { ...type.title, color: colors.text },
  subtitle: { ...type.body, color: colors.muted },
  body: { ...type.body, color: colors.muted },
  heading: { ...type.heading, color: colors.text },
  label: { ...type.label, color: colors.text },
  caption: { ...type.caption, color: colors.muted },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.md,
  },
  group: { backgroundColor: colors.surface, borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  section: { gap: spacing.md },
  number: { fontVariant: ['tabular-nums'] },
  error: { color: colors.danger, fontSize: 14, lineHeight: 21 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
});
