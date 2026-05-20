# Folder Structure Audit — Homewithin

**Date:** 2026-05-20  
**Scope:** Architectural analysis of the project's folder and file organization

---

## Current Structure (annotated)

```
Homewithin/
├── app/                         ← Expo Router file-based routing (view layer)
│   ├── (tabs)/                  ← ✅ 5 main tabs, correctly grouped
│   ├── onboarding/              ← ✅ 3-step flow, correctly grouped
│   └── 20+ flat screen files    ← ⚠️ no domain grouping
│
├── components/
│   ├── ui/                      ← ✅ design system primitives
│   ├── profile/                 ← ✅ feature-scoped components
│   ├── safety/                  ← ✅ feature-scoped components
│   └── 7 root-level files       ← ⚠️ orphaned / Expo boilerplate
│
├── services/                    ← ⚠️ 16 flat files, mixed concerns
├── context/                     ← ⚠️ SessionContext is a god object
├── constants/                   ← ⚠️ design tokens + static data mixed
├── hooks/                       ← ⚠️ only 2 color scheme hooks (underused)
├── types/                       ← ⚠️ single index.ts for all domain types
├── supabase/                    ← ✅ migrations, edge functions, config
└── __tests__/                   ← ✅ mirrors source structure
```

---

## Architectural Pattern

The project implements a **Layered Architecture**:

```
┌──────────────────────────────────────────────────┐
│  View Layer         app/  +  components/          │
├──────────────────────────────────────────────────┤
│  State Layer        context/                      │
├──────────────────────────────────────────────────┤
│  Service Layer      services/                     │
├──────────────────────────────────────────────────┤
│  Data Layer         supabase/  +  SecureStore     │
└──────────────────────────────────────────────────┘
```

The layering is correct for the app's scale. The issues are **within each layer** — mostly flat files that need grouping and contexts that are taking on too much responsibility.

---

## Issues by Layer

---

### `app/` — View Layer

**Problem:** 20+ screen files are flat at the root with no domain grouping.

These screens belong to clear feature domains that are currently undifferentiated:

| Domain       | Screens                                                        |
| ------------ | -------------------------------------------------------------- |
| Auth         | `welcome`, `signin`                                            |
| Safety tools | `lock`, `pin`, `disguise`, `decoy`, `emergency`                |
| Social       | `chat`, `circles`, `circle`, `circle-intro`, `chosen-family`   |
| Wellness     | `checkin`, `journal-entry`, `progress`, `intentions`, `safety` |
| Content      | `article`, `programs`, `program`, `events`, `local-resources`  |

Expo Router supports `(group-name)/` folders for logical grouping without affecting the URL. The same pattern is already used correctly for `(tabs)/` and `onboarding/`.

**Target structure:**

```
app/
├── (tabs)/
├── onboarding/
├── (auth)/           ← welcome, signin
├── (safety)/         ← lock, pin, disguise, decoy, emergency
├── (social)/         ← chat, circles, circle, circle-intro, chosen-family
├── (wellness)/       ← checkin, journal-entry, progress, intentions, safety
└── (content)/        ← article, programs, program, events, local-resources
```

---

### `components/` — View Layer

**Problem:** 7 root-level files that should be moved or deleted.

| File                       | Issue                        | Action           |
| -------------------------- | ---------------------------- | ---------------- |
| `hello-wave.tsx`           | Expo starter kit boilerplate | Delete           |
| `parallax-scroll-view.tsx` | Expo starter kit boilerplate | Delete if unused |
| `haptic-tab.tsx`           | Generic UI primitive         | Move → `ui/`     |
| `themed-text.tsx`          | Generic UI primitive         | Move → `ui/`     |
| `themed-view.tsx`          | Generic UI primitive         | Move → `ui/`     |
| `external-link.tsx`        | Generic UI primitive         | Move → `ui/`     |
| `EmergencyButton.tsx`      | Feature component            | Move → `safety/` |

---

### `context/` — State Layer

**Problem:** `SessionContext` is a god object managing 9 unrelated state slices — profile, safety level, onboarding status, PIN, lock, disguise enabled, disguise style, nearby state, and nearby resources.

**Target structure:**

```
context/
├── AuthContext.tsx       ← user identity, profile, onboarding
├── SafetyContext.tsx     ← safety level, safety plan
├── SecurityContext.tsx   ← PIN, lock screen, disguise mode
├── LocationContext.tsx   ← nearbyState, nearbyResources
└── UnreadContext.tsx     ← ✅ already correct, no change needed
```

**Related problem:** No data-fetching hooks. Screens call services directly inside `useEffect`, embedding data logic in the view layer. Custom hooks should own this:

```
hooks/
├── useMatches.ts         ← findMatches + loading/error state
├── useMessages.ts        ← getMessages + subscribeToMessages
├── useProgress.ts        ← getProgressSnapshot
├── useCheckIns.ts        ← getCheckIns
└── use-color-scheme.ts   ← ✅ already exists
```

---

### `services/` — Service Layer

**Problem:** 16 flat files mix infrastructure (`supabase.ts`), local persistence (`storage.ts`), and domain services all in the same directory.

**Target structure:**

```
services/
├── supabase.ts           ← infrastructure singleton (used by all)
├── storage.ts            ← local SecureStore persistence layer
│
├── social/
│   ├── chat.ts
│   ├── matching.ts
│   ├── circles.ts
│   ├── chosenFamily.ts
│   ├── notifications.ts
│   └── unread.ts
│
├── wellness/
│   ├── ai.ts
│   ├── safetyScore.ts
│   └── progressStats.ts
│
├── content/
│   ├── resources.ts
│   ├── programs.ts
│   └── localResources.ts
│
└── user/
    ├── account.ts
    └── avatar.ts
```

---

### `constants/` — Mixed Concerns

**Problem:** Design tokens and static content data sit in the same folder. These serve different purposes — tokens are styling configuration, data files are business content.

```
constants/         ← currently mixed
├── Colors.ts      ← design token
├── Spacing.ts     ← design token
├── Typography.ts  ← design token
├── theme.ts       ← design token
├── articles.ts    ← ⚠️ static content data
├── hotlines.ts    ← ⚠️ static content data
├── localResources.ts ← ⚠️ static content data
└── programs.ts    ← ⚠️ static content data

Target:
constants/         ← design tokens only
data/              ← NEW — static business content
├── articles.ts
├── hotlines.ts
├── localResources.ts
└── programs.ts
```

---

### `types/` — Single Barrel File

**Problem:** A single `types/index.ts` for all domain types becomes hard to navigate and causes unnecessary cross-domain imports.

**Target structure:**

```
types/
├── ui.ts         ← MoodLevel, MoodLabels, tag types, chart types
├── social.ts     ← Match, Message, PeerProfile, IntentionId
├── wellness.ts   ← CheckIn, JournalEntry, AIMessage, SafetyPlan
├── content.ts    ← Resource, Article, Program, LocalResource
└── user.ts       ← UserProfile, SafetyLevel (moved from SessionContext)
```

---

## Refactoring Roadmap

| Priority  | Change                                                                                         | Benefit                             |
| --------- | ---------------------------------------------------------------------------------------------- | ----------------------------------- |
| 🟠 High   | Group `app/` screens into route groups `(auth)` `(safety)` `(social)` `(wellness)` `(content)` | Navigability, onboarding new devs   |
| 🟠 High   | Split `SessionContext` into 4 focused contexts                                                 | Render performance, maintainability |
| 🟠 High   | Create data-fetching hooks in `hooks/` (`useMatches`, `useMessages`, etc.)                     | Thinner screen files, testability   |
| 🟡 Medium | Move `haptic-tab`, `themed-*`, `external-link`, `EmergencyButton` to correct subfolders        | Component discoverability           |
| 🟡 Medium | Delete Expo boilerplate: `hello-wave.tsx`, `parallax-scroll-view.tsx`                          | Cleaner repo                        |
| 🟡 Medium | Group `services/` into `social/` `wellness/` `content/` `user/` subdirectories                 | Service discoverability             |
| 🟡 Medium | Extract data files from `constants/` into a new `data/` folder                                 | Separation of concerns              |
| 🟢 Low    | Split `types/index.ts` into domain-scoped files                                                | Type discoverability                |

---

## TODO List

### Sprint A — High Priority (structural clarity) ✅ DONE 2026-05-20

- [x] Create `app/(auth)/` group and move `welcome.tsx`, `signin.tsx` into it
- [x] Create `app/(safety)/` group and move `lock.tsx`, `pin.tsx`, `disguise.tsx`, `decoy.tsx`, `emergency.tsx` into it
- [x] Create `app/(social)/` group and move `chat.tsx`, `circles.tsx`, `circle.tsx`, `circle-intro.tsx`, `chosen-family.tsx` into it
- [x] Create `app/(wellness)/` group and move `checkin.tsx`, `journal-entry.tsx`, `progress.tsx`, `intentions.tsx`, `safety.tsx` into it
- [x] Create `app/(content)/` group and move `article.tsx`, `programs.tsx`, `program.tsx`, `events.tsx`, `local-resources.tsx` into it
- [x] Split `SessionContext.tsx` into `AuthContext.tsx`, `SafetyContext.tsx`, `SecurityContext.tsx`, `LocationContext.tsx` — `useSession()` kept as backward-compatible aggregate hook via `SessionBridge`
- [x] Create `hooks/useMatches.ts` — extract matching data logic from `connect.tsx`
- [x] Create `hooks/useMessages.ts` — extract chat subscription logic from `chat.tsx`
- [x] Create `hooks/useProgress.ts` — extract progress fetch logic from `progress.tsx`
- [x] Create `hooks/useCheckIns.ts` — extract check-in fetch logic from `journal.tsx`

### Sprint B — Medium Priority (component hygiene) ✅ DONE 2026-05-20

- [x] Delete `components/hello-wave.tsx` (unused Expo starter boilerplate)
- [x] `components/parallax-scroll-view.tsx` — IS used in explore.tsx; moved to `components/ui/parallax-scroll-view.tsx` instead of deleted
- [x] Move `components/haptic-tab.tsx` → `components/ui/haptic-tab.tsx`
- [x] Move `components/themed-text.tsx` → `components/ui/themed-text.tsx`
- [x] Move `components/themed-view.tsx` → `components/ui/themed-view.tsx`
- [x] Move `components/external-link.tsx` → `components/ui/external-link.tsx`
- [x] Move `components/EmergencyButton.tsx` → `components/safety/EmergencyButton.tsx`
- [x] Create `services/social/` and move `chat.ts`, `matching.ts`, `circles.ts`, `chosenFamily.ts`, `notifications.ts`, `unread.ts`
- [x] Create `services/wellness/` and move `ai.ts`, `safetyScore.ts`, `progressStats.ts`
- [x] Create `services/content/` and move `resources.ts`, `programs.ts`, `localResources.ts`
- [x] Create `services/user/` and move `account.ts`, `avatar.ts`
- [x] Update all import paths after service moves

### Sprint C — Medium Priority (constants / data split) ✅ DONE 2026-05-20

- [x] Create `data/` folder at project root
- [x] Move `constants/articles.ts` → `data/articles.ts`
- [x] Move `constants/hotlines.ts` → `data/hotlines.ts`
- [x] Move `constants/localResources.ts` → `data/localResources.ts`
- [x] Move `constants/programs.ts` → `data/programs.ts`
- [x] Update all imports that reference the moved constants

### Sprint D — Low Priority (types) ✅ DONE 2026-05-20

- [x] Create `types/ui.ts` — `MoodLevel`, `MOOD_LABELS`, `MOOD_ICONS`, `MOOD_COLORS`, `TRIGGER_TAGS`, `TriggerTag`, `EMOTION_TAGS`, `EmotionTag`, `EMOTION_COLORS`
- [x] Create `types/social.ts` — `Match`, `Message`, `PeerProfile`, `IntentionId`, `Circle`, `CircleMessage`, `SupportPerson`, etc.
- [x] Create `types/wellness.ts` — `CheckIn`, `JournalEntry`, `AIMessage` (imports `MoodLevel`, `TriggerTag`, `EmotionTag` from `./ui`)
- [x] Create `types/content.ts` — `Resource`, `ResourceCategory`, `Program`, `Lesson`, `LocalResource`, `Workshop`, `LocalMeetup`, etc.
- [x] Create `types/user.ts` — `UserProfile`, `SafetyLevel` (moved from context files)
- [x] Update `context/AuthContext.tsx` to import `UserProfile` from `@/types/user`
- [x] Update `context/SafetyContext.tsx` to import `SafetyLevel` from `@/types/user`
- [x] Rewrite `types/index.ts` as pure re-export barrel (`export * from './ui'` etc.) — all existing `@/types` imports unchanged

---

## Target Structure (end state)

```
Homewithin/
├── app/
│   ├── (tabs)/
│   ├── onboarding/
│   ├── (auth)/
│   ├── (safety)/
│   ├── (social)/
│   ├── (wellness)/
│   └── (content)/
│
├── components/
│   ├── ui/             ← all generic primitives
│   ├── profile/
│   ├── safety/         ← includes EmergencyButton
│   └── (no root files)
│
├── services/
│   ├── supabase.ts
│   ├── storage.ts
│   ├── social/
│   ├── wellness/
│   ├── content/
│   └── user/
│
├── context/
│   ├── AuthContext.tsx
│   ├── SafetyContext.tsx
│   ├── SecurityContext.tsx
│   ├── LocationContext.tsx
│   └── UnreadContext.tsx
│
├── hooks/              ← data-fetching + UI hooks
├── constants/          ← design tokens only
├── data/               ← static business content
├── types/              ← domain-scoped type files
└── supabase/
    ├── functions/
    └── migrations/
```
