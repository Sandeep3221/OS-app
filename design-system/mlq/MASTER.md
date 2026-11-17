# MLQ interface

Native educational tool for inspecting a single CPU and two fixed queues.

## Design direction

UI UX Pro Max was consulted through its installed SKILL.md, a product-wide
design-system search, a focused color search, and React Native accessibility
guidance. The applicable recommendation is Minimalism & Swiss Style: clear type,
functional hierarchy, whitespace, and minimal effects. Generated web landing-page
patterns, navy/purple palettes, and downloadable fonts do not fit this brief and
are not used. Native typography and the user's restrained light direction take
precedence.

The implemented source of truth is `src/utils/theme.js`.

- Paper background: `#F6F5F1`; grouped surfaces: white.
- Primary ink: `#252923`; secondary ink: `#666B62`.
- One accent: botanical green `#35644A`, used for actions and foreground work.
- Background queue: warm gray `#686359`; always accompanied by a queue label.
- Errors: `#AD3E36`, accompanied by the original validation text.
- Native system fonts; titles 30/36, sections 20/26, body 16/24,
  labels 15/21, supporting text 13/19. Tabular figures for changing values.
- Spacing rhythm: 4, 8, 16, 24, 32, 48. Phone gutters 24 (16 on narrow phones),
  larger-device gutters 32; readable content width capped at 720.
- Surfaces group related information. Individual rows use hairline separators.
  No shadows, gradients, decorative badges, or per-process rainbow colors.
- Interactive targets at least 48 units; primary buttons 52. Inputs retain
  visible labels. Native text scaling stays enabled.

## Screen hierarchy

- Home: identity, two queue lanes feeding one CPU, one primary action.
- Processes: grouped process rows and explicit edit/delete controls; quantum
  field; persistent Run action. Editor uses a keyboard-aware bottom sheet.
- Simulation: CPU state and time, media controls, current event, ready queues,
  Gantt chart. Process states and explanatory material use disclosure rows.
- Results: one summary surface, timeline, per-process metric rows that wrap
  on phones, queue comparisons, disclosed formulas.
- Learn: separated expandable topics; model notes and viva material retained.
- Navigation: the same five destinations with consistent native line geometry,
  labels, selected weight/color, and safe-area clearance.

## Motion and accessibility

Immediate opacity feedback on presses. Disclosure content fades in over 180ms;
progress uses a native-driven transform over 180ms. Reduced-motion preferences
disable these transitions and the modal slide. Playback state and scheduling
timing remain independent of presentation animation.

Measured contrast: primary ink/paper 13.56:1, secondary ink/paper 5.01:1,
white/accent 6.83:1, foreground ink/tint 5.89:1, background ink/tint 5.05:1,
error/white 5.97:1, input outline/white 3.38:1.

This is a light-only design, matching the requested scope. Native device rendering,
largest accessibility sizes, keyboard presentation, and screen-reader traversal
still need a device review; no connected device or emulator was available here.
