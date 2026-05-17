# HomeWithin

> A safe space for LGBTQ+ people affected by family violence, rejection, or isolation.

**"You are safe here."**

---

## Vision

HomeWithin helps LGBTQ+ people navigate crisis, heal emotionally, find peer support, and intentionally build a chosen family — anonymously and safely.

The product is built around 4 pillars:

| Pillar     | Question                        |
| ---------- | ------------------------------- |
| Safety     | Am I safe right now?            |
| Healing    | How do I recover emotionally?   |
| Connection | How do I find people like me?   |
| Growth     | How do I build a chosen family? |

---

## Tech Stack

| Layer              | Choice                           |
| ------------------ | -------------------------------- |
| Mobile             | Expo (React Native)              |
| Auth               | Supabase Auth                    |
| Database           | Supabase Postgres                |
| Storage            | Supabase Storage                 |
| Secure local data  | Expo SecureStore                 |
| Push notifications | Expo Notifications               |
| Chat               | Stream Chat or Supabase Realtime |
| AI                 | OpenAI API                       |

---

## Design System

### Colors

| Name           | Hex       | Usage           |
| -------------- | --------- | --------------- |
| Safe Blue      | `#5B8DEF` | Primary actions |
| Soft Green     | `#7BC9A7` | Positive states |
| Muted Lavender | `#B8A8E3` | Accent          |
| Warm White     | `#FAF9F7` | Background      |
| Soft Gray      | `#F2F4F7` | Cards           |
| Alert Red      | `#D9534F` | Emergency only  |

### Typography (Inter / SF Pro)

- H1 → 28px / semibold
- H2 → 22px / semibold
- Body → 16px / regular
- Small → 14px / regular
- Caption → 12px / medium

### UX Principles

- Calm and discreet, never flashy
- Anonymous by default
- One question at a time — never overload
- Trauma-informed language ("What has been hardest?" not "What is your trauma?")
- Warm, human copy ("You are safe here")
- Friendship-focused, not dating-app vibes
- Small circles over large public feeds
- Large tap targets, high contrast, screen reader labels

---

## App Structure

```
Splash
└─ Welcome
   └─ Anonymous Onboarding
      └─ Safety Assessment
         └─ Home Dashboard
            ├─ Daily Check-in
            ├─ Journal
            ├─ Connect (Peer Matching)
            ├─ Support Circles
            ├─ Resources
            ├─ Emergency Mode
            └─ Profile & Privacy
```

---

## Roadmap

### Phase 1 — Core survival + trust (MVP)

### Phase 2 — Human connection

### Phase 3 — Healing & recovery

### Phase 4 — Community ecosystem

---

## Sprints

---

### Sprint 1 — Foundation & Safety Core ✅

**Goal:** Users can enter safely, assess their risk, and access emergency tools.
**Duration:** Week 1–2 · **Completed:** 2026-05-15

#### Setup

- [x] Initialize Expo project with TypeScript
- [x] Configure Supabase project (auth, database, storage) — `services/supabase.ts`
- [x] Set up Expo SecureStore for local token storage — `services/storage.ts`
- [x] Define folder structure (`/app`, `/components`, `/hooks`, `/services`, `/constants`, `/context`)
- [x] Configure navigation (Expo Router)
- [x] Set up design tokens (colors, typography, spacing) — `constants/Colors.ts`, `Typography.ts`, `Spacing.ts`
- [x] Create base UI components: Button (primary, secondary, danger), Card, Input, Slider, Tag

#### Splash & Welcome Screen

- [x] Splash screen with app logo and tagline "You are safe here." — `app/index.tsx`
- [x] Quick Exit button (top-right) — closes app or switches to decoy screen — `app/decoy.tsx`
- [x] "Start anonymously" CTA — `app/welcome.tsx`
- [x] "Sign in" CTA — `app/signin.tsx`

#### Anonymous Onboarding

- [x] Step 1 form: Nickname, Pronouns, Age range, Language, Country — `app/onboarding/step1.tsx`
- [x] "Hide my profile from search" toggle
- [x] Step 2: Need selection cards (Emotional safety, Healing, Someone to talk to, Gay friends, Support group, Crisis help) — `app/onboarding/step2.tsx`
- [x] Guest/anonymous mode — no email required
- [x] Optional email signup via Supabase Auth
- [x] Store session securely with Expo SecureStore
- [x] No profile photo required at any step

#### Safety Assessment

- [x] Mood slider: Unsafe ←→ Safe — `app/safety.tsx`
- [x] Question cards: Lives with family / Phone access risk / Currently in danger / Trusted contact available
- [x] Safety score algorithm (green / yellow / red)
- [x] Green state UI: "You seem safe."
- [x] Yellow state UI: "Some support may help." + resource suggestions
- [x] Red state UI: "You may need immediate support." + hotline + emergency plan + hide app guide
- [x] Safety plan creation (simple text steps user can save)
- [x] Emergency resources by country (static list, expandable later) — `constants/hotlines.ts`

#### Emergency Mode

- [x] Floating emergency button visible across all main screens — `components/EmergencyButton.tsx`
- [x] Emergency screen: Call support / Safety plan / Quick hide / Delete sensitive data / Contact trusted person — `app/emergency.tsx`
- [x] Quick Exit: one tap closes app entirely
- [x] App disguise mode toggle (neutral icon + app name in settings)
- [x] PIN lock screen (infrastructure in `services/storage.ts`)
- [x] Delete sensitive data flow (journal entries, chat history)
- [x] Crisis hotline links by country (static JSON, 12 countries)

---

### Sprint 2 — Emotional Tracking & Journal ✅

**Goal:** Users can track their daily emotional state and write privately.
**Duration:** Week 3 · **Completed:** 2026-05-16

#### Daily Check-In

- [x] Mood picker row (5 states: Terrible → Great with Ionicons) — `app/checkin.tsx`
- [x] Anxiety slider (1–10, Calm → Overwhelmed) — `components/ui/RangeSlider.tsx`
- [x] Loneliness slider (1–10, Connected → Isolated)
- [x] Safety slider (1–10, Unsafe → Safe)
- [x] Text prompt: "What has been hardest today?"
- [x] Save check-in to Supabase (authenticated) + SecureStore (offline-first) — `services/storage.ts`
- [x] Mood history list view — `app/(tabs)/journal.tsx`
- [x] Basic trend chart (last 7 days) — `components/ui/MoodChart.tsx`
- [x] Trigger tracking tags (family, work, identity, loneliness, fear, hope) — `types/index.ts`

#### Private Journal

- [x] Full-screen text area with "Write anything. This is private." placeholder — `app/journal-entry.tsx`
- [ ] Voice note recording (Expo AV) — deferred, expo-av not installed
- [x] Emotion tag picker (fear, shame, hope, anger, relief)
- [x] Save entry (encrypted via Expo SecureStore, one key per entry)
- [x] Journal entry list with date + emotion tags
- [x] Export journal as text file (native Share sheet)
- [x] Hidden journal — accessible only via PIN (modal PIN flow)

#### Home Dashboard

- [x] Greeting: "How are you feeling today?"
- [x] Card: Daily Check-in → routes to `/checkin`
- [x] Card: Write in Journal → routes to `/journal-entry`
- [x] Card: Support Matches
- [x] Card: Resources for You
- [x] Card: Safety Status (green/yellow/red indicator from session context)
- [x] Today's mood strip — shows today's check-in mood inline on Home
- [x] Floating Emergency button (above bottom nav)
- [x] Bottom Navigation: Home / Journal / Connect / Resources / Profile

---

### Sprint 3 — Resource Library ✅

**Goal:** Immediate educational value for users who are not yet ready to connect with others.
**Duration:** Week 4 · **Completed:** 2026-05-16

#### Resource Library

- [x] Search bar — `app/(tabs)/resources.tsx`
- [x] Category filter tabs: Family rejection / Internalized shame / Religious trauma / Boundaries / Coming out safely / Crisis help
- [x] Article card: Title, 2-line summary, category badge, read time, bookmark indicator
- [x] Article detail screen with share + bookmark toggle — `app/article.tsx`
- [x] Bookmark article feature (SecureStore, `hw_bookmarks` key) — `services/resources.ts`
- [x] Bookmarks list in Profile — `app/(tabs)/profile.tsx`
- [x] Seed library with 12 articles (2 per category) — `constants/articles.ts`
- [x] Supabase table for resources (title, body, category, language) + RLS — `supabase/migrations/20260516010000_sprint3.sql`
- [x] Offline fallback: always shows local seed articles when Supabase unreachable

---

### Sprint 4 — Peer Matching & Chat ✅

**Goal:** Users can connect anonymously with others who share their experience.
**Duration:** Week 5–6 · **Completed:** 2026-05-16

#### Peer Support Matching

- [x] Matching prompt screen: "Who would help most today?" — `app/(tabs)/connect.tsx`
- [x] Intention cards: Survived family rejection / First queer friend / A mentor / Someone to listen / Group support
- [x] Matching algorithm: filters by hide_from_search, excludes already-interacted + blocked users — `services/matching.ts`
- [x] Anonymous match card: avatar initial + nickname + age range / country / language chips + need tags
- [x] Connect button (tap only, no swipe)
- [x] Pass button (tap only)
- [x] Match stored in Supabase `matches` table with status `accepted`/`passed`/`blocked`
- [x] Easy block from chat options menu
- [x] Easy report from chat options menu

#### Safe Chat

- [x] 1:1 chat screen with Supabase Realtime subscription — `app/chat.tsx`
- [x] Safety reminder banner: "You can block or report anytime." (always visible)
- [x] Disappearing messages toggle (24h expiry — `expires_at` field, filtered on fetch)
- [x] Report message flow (Alert.prompt → `reports` table)
- [x] Block user flow (ActionSheet/Alert → `blocks` table + match status → `blocked`)
- [x] Crisis keyword detection → inline hotline banner with Trevor Project + Crisis Text Line
- [x] Supabase tables: `user_profiles`, `matches`, `messages`, `blocks`, `reports` + RLS + indexes — `supabase/migrations/20260516020000_sprint4.sql`

---

### Sprint 5 — Support Circles (Beta) ✅

**Goal:** Small group spaces that feel safer than large public feeds.
**Duration:** Week 7 · **Completed:** 2026-05-16

- [x] Support circle cards: name, member count, join button — `app/circles.tsx`
- [x] Seed circles: Family Rejection Survivors / Newly Out / Building Confidence / Religious Trauma — `supabase/migrations/20260516040000_sprint5.sql`
- [x] Circle size cap: 4–8 members per circle (DB trigger `enforce_circle_cap`)
- [x] Group chat screen (mirrors 1:1 chat component) — `app/circle.tsx`
- [x] Circle rules / intro screen on first join — `app/circle-intro.tsx`
- [x] Leave circle option (chat options menu)
- [x] Report in circle (report circle or individual message via long-press)

---

### Sprint 6 — Healing Programs & AI Companion

**Goal:** Structured recovery paths and gentle AI support.
**Duration:** Week 8–9

#### Guided Healing Programs

- [x] Program list: Healing from parental rejection / Rebuilding self-worth / Learning to trust / Reducing shame / Creating boundaries
- [x] Daily lesson cards (title + body + reflection prompt)
- [x] Mark lesson complete
- [x] Program progress bar
- [x] Supabase table: user_progress (client-side programs/lessons in constants/programs.ts)

#### AI Support Companion

- [x] Chat-like UI for AI companion
- [x] System prompt: warm, grounding, non-therapeutic support role
- [x] Can reflect feelings, suggest grounding exercises, summarize journal patterns, recommend resources
- [x] "AI is not a therapist" disclaimer — visible always
- [x] Optional after Daily Check-in: "Would you like a gentle reflection?"
- [x] Optional after Journal save: "Would you like an AI insight?"
- [x] OpenAI API integration with rate limiting per user (20/day client-side via SecureStore)
- [x] Supabase Edge Function proxy (ai-companion) — API key server-side only
      (Untested with ai - yet to do it)

---

### Sprint 7 — Chosen Family Builder ✅

**Goal:** Help users intentionally map and grow their support network.
**Duration:** Week 10 · **Completed:** 2026-05-16

- [x] Visual support map: trusted friend / mentor / therapist / emergency contact / community group — `app/chosen-family.tsx`
- [x] Add person to map: nickname + role + contact info (stored locally) — `services/chosenFamily.ts`
- [x] Contact trusted person shortcut (links to SMS or call via `Linking`)
- [x] Suggest "next step" based on empty map slots
- [x] Milestone: "You've added your first trusted person" (Alert on first add)

---

### Sprint 8 — Local Resources & Events

**Goal:** Connect users to real-world support when they are ready.
**Duration:** Week 11

#### Local LGBTQ+ Resources

- [ ] Optional location permission request
- [ ] Resource types: LGBTQ centers / shelters / therapists / legal aid / support groups
- [ ] Filterable list (no map required in MVP)
- [ ] Static dataset per country (expandable)
- [ ] Link to external website or phone

#### Events & Connection

- [ ] Online circles board (curated, not user-created in v1)
- [ ] Workshops list
- [ ] Local meetup cards (when location available)

---

### Sprint 9 — Progress Dashboard & Polish

**Goal:** Show users how far they've come and refine the full experience.
**Duration:** Week 12

#### Progress Dashboard

- [ ] Mood trend over 30 days
- [ ] Safety improvement indicator
- [ ] Connections made count
- [ ] Journal streak counter
- [ ] Healing program milestones
- [ ] Onboarding completion badge

#### Profile & Privacy

- [ ] Change nickname
- [ ] PIN lock toggle
- [ ] App disguise mode toggle
- [ ] Notification preferences
- [ ] Data export (journal + check-ins as JSON)
- [ ] Delete account (full data wipe)
- [ ] Privacy explanation screen: "You control your visibility."

#### Final Polish

- [ ] Accessibility audit: contrast, tap targets, screen reader labels
- [ ] Trauma-informed copy review across all screens
- [ ] Animations: gentle fade-ins, no jarring transitions
- [ ] Onboarding tooltip overlays for first-time users
- [ ] Error states for all forms
- [ ] Offline fallback for journal and check-in
- [ ] App icon + splash screen final assets
- [ ] App Store / Play Store metadata

---

## Figma Pages

```
01 Design System
02 Components
03 Onboarding
04 Safety Flow
05 Home
06 Journal
07 Matching
08 Chat
09 Resources
10 Emergency
11 Settings
12 Prototype
```

---

## Beta Launch Checklist

- [ ] All Sprint 1–4 features complete and tested
- [ ] Crisis hotlines verified per country
- [ ] Emergency mode QA'd on both iOS and Android
- [ ] Data encryption confirmed (journal, tokens)
- [ ] Block/report flows tested end-to-end
- [ ] "AI is not a therapist" disclaimer in place
- [ ] Privacy policy written
- [ ] Moderation process defined
- [ ] TestFlight / Google Play internal track set up
- [ ] 5 beta users recruited for feedback

---

## Contributing

This is a collaborative build. Every feature shipped is potentially life-saving.

When in doubt, default to:

- **Less data** over more
- **Anonymous** over identified
- **Calm** over engaging
- **One step** over many
