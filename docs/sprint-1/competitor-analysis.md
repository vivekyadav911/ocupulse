# Competitor analysis — Phyphox vs Kahoot! (imported from Assessment 2)

_Originally produced as **Assessment 2 — Usability Evaluation Report**, submitted **17 April 2026** (student: Vivek Yadav, CSE3MAD)._

## 2. Brief description of the two apps

### 2.1 Phyphox — Physical phone experiments

Phyphox (RWTH Aachen University, 2024) is a free, open-source app that turns a smartphone into a scientific instrument using accelerometer, gyroscope, microphone, barometer, and magnetometer. Organised across **Raw Sensors**, **Acoustics**, **Mechanics**, **Magnetism**, and **Tools**.

**Navigation** — Scrollable grouped list by sensor type; powerful for researchers but **no guided onboarding**; configuration buried in sub-menus.

**Feedback** — Excellent real-time graphs (line, FFT) and numerical readouts; **no celebratory completion feedback** tuned for school-age motivation.

**Accessibility** — Several controls **below 44×44 dp**; **no VoiceOver/TalkBack**; error dialogs can show raw codes without plain-language guidance.

**Consistency** — Strong Material Design on Android; minor iOS back-gesture differences.

**Learnability** — Assumes undergraduate literacy; help is an overlay menu, **no progressive tutorial**; reviewers note it is “overwhelming for year 7 students”.

### 2.2 Kahoot! — Game-based learning

Kahoot! (Kahoot! ASA, 2024) is a classroom quiz platform: PIN join, nicknames, live play, instant score reveals.

**Navigation** — Frictionless **Join → PIN → nickname → play**; persistent bottom tabs (**Home, Discover, Create, Library, Join**).

**Feedback** — **Dino Hunt** gamification, animated rank reveals, confetti — strong engagement loop.

**Accessibility** — Large colour-coded account tiles aid colour-blind users; **some non-dismissible animations** risk WCAG 2.1 SC 2.3.3.

**Consistency** — **Pixel-identical** iOS/Android UI via shared design tokens and one tab model.

**Learnability** — Short welcome onboarding; progressive disclosure; classroom anecdotes show **fast adoption** in primary years.

## 3. Usability evaluation — SUS scores

| App         | SUS score | Grade (Bangor et al., 2008)                            |
| ----------- | --------- | ------------------------------------------------------ |
| **Phyphox** | **62.5**  | C+ (above average, but weak learnability for children) |
| **Kahoot!** | **85.0**  | A (excellent)                                          |

_See Assessment 2 PDF Table 1 for full per-question raw/converter workings._

### Table 2 — Heuristic summary (abridged)

| Criterion     | Phyphox                                       | Kahoot!                                   |
| ------------- | --------------------------------------------- | ----------------------------------------- |
| Navigation    | Moderate — logical for experts; no onboarding | Excellent — 3-tap join/play               |
| Learnability  | Low — assumes science literacy                | High — tutorial + progressive disclosure  |
| Feedback      | Good live graphs; weak celebration            | Excellent animated score reveal + rewards |
| Consistency   | Good Android; small iOS deviations            | Excellent cross-platform parity           |
| Accessibility | Poor — targets, a11y gaps, raw errors         | Good — large tiles; some animation risk   |

## 4. Comparative analysis (strengths / weaknesses)

**Strengths**

- Phyphox: scientific depth, exportable data, sensor breadth aligned with STEMM Lab’s seven experiments.
- Kahoot!: engagement mechanics, frictionless join, leaderboard + reward psychology.

**Weaknesses**

- Phyphox: expert-centric IA, weak child onboarding, accessibility gaps.
- Kahoot!: not sensor-first; ads on free tier noted in reviews; animations vs reduced-motion needs.

## 5. Design implications for STEMM Lab

Adopt **Kahoot’s frictionless join** (anonymous quick play + optional teacher email).  
Pair **Phyphox-grade live charts** (`react-native-chart-kit`) with **Kahoot-style score reveals** (`react-native-reanimated` + `expo-haptics`).  
Mandate **accessibilityLabel/Hint** on every control, **44×44 dp** targets, and **useReducedMotionEnabled()** for motion-heavy UI.  
Centralise tokens in **`theme/tokens.ts`** + **Zustand** for Kahoot-like consistency.  
Use **Firestore `onSnapshot`** for leaderboard pub/sub.  
Plan **Jest** for pure calculations and **Maestro** for login → experiment → results flows.

---

### References (abridged — see full list in Assessment 2 PDF)

Brooke, J. (1996). _SUS: A quick and dirty usability scale._  
Bangor et al. (2008). _Empirical evaluation of the System Usability Scale._  
Userfocus (2024). Usability Dashboard.  
Phyphox / Kahoot official product pages & store listings as cited in A2.
