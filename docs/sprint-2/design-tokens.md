# Sprint 2 — design tokens

Source of truth: [`theme/tokens.ts`](../../theme/tokens.ts). Runtime palette follows `useThemeStore` mode via [`useAppTheme()`](../../theme/useAppTheme.ts).

## Colors (light mode)

| Token | Hex | Usage |
|-------|-----|--------|
| `primary` | `#0B1F3A` | Navy — headings, primary buttons |
| `accent` | `#FFB400` | KPI emphasis, tab active, battery warn |
| `success` | `#2ECC71` | Positive states |
| `danger` | `#E74C3C` | Destructive actions, critical battery |
| `surface` | `#FFFFFF` | Cards, inputs |
| `surfaceAlt` | `#F4F6FA` | Screen backgrounds |
| `text` | `#0B1F3A` | Body text |
| `textInverse` | `#FFFFFF` | Text on primary/danger buttons |
| `muted` | `#6B7A90` | Secondary labels |

## Colors (dark mode)

| Token | Hex |
|-------|-----|
| `primary` | `#E8EEF7` |
| `accent` | `#FFB400` |
| `success` | `#2ECC71` |
| `danger` | `#E74C3C` |
| `surface` | `#1A2332` |
| `surfaceAlt` | `#0F1623` |
| `text` | `#F4F6FA` |
| `textInverse` | `#0B1F3A` |
| `muted` | `#9AA8BC` |

## Spacing

| Token | dp |
|-------|-----|
| `xs` | 4 |
| `sm` | 8 |
| `md` | 16 |
| `lg` | 24 |
| `xl` | 32 |

## Border radii

| Token | dp |
|-------|-----|
| `sm` | 8 |
| `md` | 12 |
| `lg` | 20 |

## Typography

| Token | Size (sp) | Notes |
|-------|-----------|--------|
| `fontFamily` | System | Respects OS dynamic type |
| `title` | 24 | Stat values, screen titles |
| `subtitle` | 18 | Section headers |
| `body` | 16 | Buttons, default copy |
| `caption` | 13 | Labels under stats |

## Theme persistence

`store/themeStore.ts` persists `light` \| `dark` to AsyncStorage key `stemm-theme`. Toggle in **Settings** survives app restart.
