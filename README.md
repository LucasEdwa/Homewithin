# HomeWithin

> A safe space for LGBTQ+ people affected by family violence, rejection, or isolation.

**"You are safe here."**

---

## Vision

HomeWithin helps LGBTQ+ people navigate crisis, heal emotionally, find peer support, and intentionally build a chosen family — anonymously and safely.

The product is built around 4 pillars:

| Pillar | Question |
|---|---|
| Safety | Am I safe right now? |
| Healing | How do I recover emotionally? |
| Connection | How do I find people like me? |
| Growth | How do I build a chosen family? |

---

## Tech Stack

| Layer | Choice |
|---|---|
| Mobile | Expo (React Native) |
| Auth | Supabase Auth |
| Database | Supabase Postgres |
| Storage | Supabase Storage |
| Secure local data | Expo SecureStore |
| Push notifications | Expo Notifications |
| Chat | Stream Chat or Supabase Realtime |
| AI | OpenAI API |

---

## Design System

### Colors

| Name | Hex | Usage |
|---|---|---|
| Safe Blue | `#5B8DEF` | Primary actions |
| Soft Green | `#7BC9A7` | Positive states |
| Muted Lavender | `#B8A8E3` | Accent |
| Warm White | `#FAF9F7` | Background |
| Soft Gray | `#F2F4F7` | Cards |
| Alert Red | `#D9534F` | Emergency only |

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

### Sprint 2 — Emotional Tracking & Journal
**Goal:** Users can track their daily emotional state and write privately.
**Duration:** Week 3

#### Daily Check-In
- [ ] Mood emoji row (5 states)
- [ ] Anxiety slider
- [ ] Loneliness slider
- [ ] Safety slider
- [ ] Text prompt: "What has been hardest today?"
- [ ] Save check-in to Supabase
- [ ] Mood history list view
- [ ] Basic trend chart (last 7 days)
- [ ] Trigger tracking tags (family, work, identity, loneliness, fear, hope)

#### Private Journal
- [ ] Full-screen text area with "Write anything. This is private." placeholder
- [ ] Voice note recording (Expo AV)
- [ ] Emotion tag picker (fear, shame, hope, anger, relief)
- [ ] Save entry (encrypted via Expo SecureStore or Supabase RLS)
- [ ] Journal entry list with date + mood tag
- [ ] Export journal as text file
- [ ] Hidden journal — accessible only via PIN

#### Home Dashboard
- [ ] Greeting: "How are you feeling today?"
- [ ] Card: Daily Check-in
- [ ] Card: Write in Journal
- [ ] Card: Support Matches
- [ ] Card: Resources for You
- [ ] Card: Safety Status (green/yellow/red indicator)
- [ ] Floating Emergency button (above bottom nav)
- [ ] Bottom Navigation: Home / Journal / Connect / Resources / Profile

---

### Sprint 3 — Resource Library
**Goal:** Immediate educational value for users who are not yet ready to connect with others.
**Duration:** Week 4

#### Resource Library
- [ ] Search bar
- [ ] Category filter tabs: Family rejection / Internalized shame / Religious trauma / Boundaries / Coming out safely / Crisis help
- [ ] Article card: Title, 2-line summary, Read button
- [ ] Article detail screen (Markdown or rich text)
- [ ] Bookmark article feature
- [ ] Bookmarks list in Profile
- [ ] Seed library with at least 12 articles (2 per category)
- [ ] Supabase table for resources (title, body, category, language)

---

### Sprint 4 — Peer Matching & Chat
**Goal:** Users can connect anonymously with others who share their experience.
**Duration:** Week 5–6

#### Peer Support Matching
- [ ] Matching prompt screen: "Who would help most today?"
- [ ] Intention cards: Someone who survived family rejection / First gay friend / Mentor / Someone to listen / Group support
- [ ] Matching algorithm: age range + language + country + identity + trauma experience + goals
- [ ] Anonymous match card: avatar placeholder + nickname + shared experience badges
- [ ] Connect button
- [ ] Pass button (no swipe behavior — tap only)
- [ ] Match stored in Supabase with opt-in status
- [ ] Easy block from match card
- [ ] Easy report from match card

#### Safe Chat
- [ ] 1:1 chat screen (Stream Chat or Supabase Realtime)
- [ ] Safety reminder banner at top: "You can block or report anytime."
- [ ] Disappearing messages toggle (24h expiry)
- [ ] Report message flow
- [ ] Block user flow
- [ ] Crisis keyword detection → surface hotline banner
- [ ] Moderation flag queue (admin-side, basic)

---

### Sprint 5 — Support Circles (Beta)
**Goal:** Small group spaces that feel safer than large public feeds.
**Duration:** Week 7

- [ ] Support circle cards: name, member count, join button
- [ ] Seed circles: Family Rejection Survivors / Newly Out / Building Confidence / Religious Trauma
- [ ] Circle size cap: 4–8 members per circle
- [ ] Group chat screen (same chat component as 1:1)
- [ ] Circle rules / intro screen on first join
- [ ] Leave circle option
- [ ] Report in circle

---

### Sprint 6 — Healing Programs & AI Companion
**Goal:** Structured recovery paths and gentle AI support.
**Duration:** Week 8–9

#### Guided Healing Programs
- [ ] Program list: Healing from parental rejection / Rebuilding self-worth / Learning to trust / Reducing shame / Creating boundaries
- [ ] Daily lesson cards (title + body + reflection prompt)
- [ ] Mark lesson complete
- [ ] Program progress bar
- [ ] Supabase table: programs, lessons, user_progress

#### AI Support Companion
- [ ] Chat-like UI for AI companion
- [ ] System prompt: warm, grounding, non-therapeutic support role
- [ ] Can reflect feelings, suggest grounding exercises, summarize journal patterns, recommend resources
- [ ] "AI is not a therapist" disclaimer — visible always
- [ ] Optional after Daily Check-in: "Would you like a gentle reflection?"
- [ ] Optional after Journal save: "Would you like an AI insight?"
- [ ] OpenAI API integration with rate limiting per user

---

### Sprint 7 — Chosen Family Builder
**Goal:** Help users intentionally map and grow their support network.
**Duration:** Week 10

- [ ] Visual support map: trusted friend / mentor / therapist / emergency contact / community group
- [ ] Add person to map: nickname + role + contact info (stored locally)
- [ ] Contact trusted person shortcut (links to SMS or call)
- [ ] Suggest "next step" based on empty map slots
- [ ] Milestone: "You've added your first trusted person"

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
