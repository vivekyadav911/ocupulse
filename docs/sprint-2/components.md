# Sprint 2 — shared components

All components read the active theme via [`useAppTheme()`](../../theme/useAppTheme.ts) so light/dark mode applies without per-screen color imports.

## `Button`

**File:** [`components/Button.tsx`](../../components/Button.tsx)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | — | Visible label (also default `accessibilityLabel`) |
| `variant` | `'primary' \| 'secondary' \| 'danger'` | `'primary'` | Visual style |
| `style` | `ViewStyle` | — | Container override |
| `textStyle` | `TextStyle` | — | Label override |
| `onPress` | `PressableProps['onPress']` | — | Tap handler |
| `disabled` | `boolean` | — | Disables press |

**Variants**

- **primary** — navy background, inverse text  
- **secondary** — surface background, bordered, body text  
- **danger** — red background, inverse text  

**A11y:** `minHeight` / `minWidth` ≥ 48dp touch target.

## `Card`

**File:** [`components/Card.tsx`](../../components/Card.tsx)

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Card body |
| `style` | `ViewStyle` | Optional layout override |

Elevated surface using theme `surface`, `radii.lg`, and `spacing.md` padding.

## `StatReadout`

**File:** [`components/StatReadout.tsx`](../../components/StatReadout.tsx)

| Prop | Type | Description |
|------|------|-------------|
| `label` | `string` | Caption under the value |
| `value` | `string` | Large KPI string |

## Zustand stores

### `useThemeStore` — [`store/themeStore.ts`](../../store/themeStore.ts)

| Field / method | Type | Description |
|----------------|------|-------------|
| `mode` | `'light' \| 'dark'` | Current theme |
| `setMode` | `(m) => void` | Set explicitly |
| `toggle` | `() => void` | Flip light ↔ dark (persisted) |

### `useSessionStore` — [`store/sessionStore.ts`](../../store/sessionStore.ts)

| Field / method | Type | Description |
|----------------|------|-------------|
| `teamName` | `string` | Active team label |
| `studentFirstName` | `string` | Student display name |
| `gradeLevel` | `GradeLevel` | Cohort / AdMob gate |
| `currentActivity` | `ActivityType \| null` | In-progress activity |
| `currentSessionId` | `string \| null` | Latest session id |
| `setTeam` | `(partial) => void` | Update team fields |
| `setActivity` | `(a) => void` | Set activity type |
| `setSessionId` | `(id) => void` | Set session id |
| `showAdsInterstitial` | `() => boolean` | High-school ad gate |

**Spike:** [`app/_spikes/components.tsx`](../../app/_spikes/components.tsx) renders all button variants + `StatReadout`.
