# Professional Support — Feature Roadmap

> Beta feature. All sprints tracked below as a TODO list.
> Flag: `PROFESSIONAL_SUPPORT_BETA_ENABLED` in `constants/ProfessionalSupport.ts`

---

## Sprint 1 — Foundation

- [x] Install `react-native-webview` dependency
- [x] Install `@stripe/stripe-react-native` dependency
- [x] Create `constants/ProfessionalSupport.ts` with all feature constants
- [x] Create `types/professional.ts` with all new types
- [x] Write `supabase/migrations/YYYYMMDD_professional_support.sql` (all tables + RLS)
- [x] Scaffold `services/professional/` with stub exports
- [x] Scaffold `professional-portal/` Next.js 15 project with Supabase SSR auth
- [x] Run migration in dev — verify tables + RLS

---

## Sprint 2 — Professional Profiles & Directory

- [x] Implement `services/professional/directory.ts`
- [x] Add "Support" tab to `app/(tabs)/_layout.tsx`
- [x] Create `app/(tabs)/support.tsx` with beta gate + directory list + specialty filters
- [x] Create `app/(professional)/profile.tsx` — professional detail screen
- [x] Add "Become a Professional" self-registration entry in Profile tab

---

## Sprint 3 — Availability & Booking Flow

- [x] Implement `services/professional/availability.ts`
- [x] Create `app/(professional)/book.tsx` — weekly slot grid picker
- [x] Create `app/(professional)/checkout-summary.tsx` — pre-payment summary
- [x] DB-level uniqueness check to prevent double-booking same slot

---

## Sprint 4 — Stripe Payment

- [ ] Create Edge Function `supabase/functions/create-payment-intent/`
- [ ] Create Edge Function `supabase/functions/stripe-webhook/` (with HMAC signature verification)
- [ ] Create `app/(professional)/checkout.tsx` — Stripe PaymentSheet
- [ ] Create `app/(professional)/booking-confirmation.tsx` — success screen
- [ ] Add `STRIPE_PUBLISHABLE_KEY` to Expo config env vars

---

## Sprint 5 — User Session Dashboard

- [ ] Implement `services/professional/booking.ts` fully
- [ ] Create `app/(professional)/my-sessions.tsx` — Upcoming / Past tabs
- [ ] Create `app/(professional)/session-detail.tsx`
- [ ] Implement cancel flow (>24h only; trigger partial refund edge function)

---

## Sprint 6 — Session Text Chat

- [ ] Create `services/professional/chat.ts` (mirrors peer chat pattern)
- [ ] Create `app/(professional)/session-chat.tsx`
- [ ] Extend `send-push` Edge Function for session messages
- [ ] Add crisis banner (reuse `containsCrisisKeywords`)
- [ ] Add session message unread tracking

---

## Sprint 7 — Jitsi Video Call

- [ ] Create `app/(professional)/video-call.tsx` — WebView → `meet.jit.si/homewithin-{sessionId}`
- [ ] Handle camera/microphone permissions
- [ ] Gate join button to ±30 min of `scheduled_at`
- [ ] Add "Join Video Call" button in session-detail screen

---

## Sprint 8 — Next.js Professional Portal

- [ ] Build `/dashboard` page — upcoming sessions
- [ ] Build `/patients` page — list of users
- [ ] Build `/patients/[userId]` page — patient session timeline
- [ ] Build `/sessions/[sessionId]` page — notes editor + `is_shared_with_ai` toggle + Jitsi button
- [ ] Auth middleware — only `role = 'professional'` users can access
- [ ] Deploy to Vercel

---

## Sprint 9 — Portal WebView Mobile Entry

- [ ] Create `app/(professional)/portal.tsx` — WebView loading portal URL
- [ ] Inject Supabase JWT via `injectedJavaScriptBeforeContentLoaded` (localStorage, NOT URL)
- [ ] Whitelist portal domain in WebView `originWhitelist`
- [ ] Add "Professional Portal" entry in Profile tab (visible only for `role = 'professional'`)

---

## Sprint 10 — AI Companion Enhancement

- [ ] Add `therapistNotes` field to `UserContext` — fetch via `services/professional/notes.ts`
- [ ] Update `buildSystemPrompt()` in `services/wellness/ai.ts` to include shared notes block
- [ ] Update AI consent modal in `app/ai-companion.tsx` to disclose therapist note usage
- [ ] Implement `services/professional/notes.ts` — `getSharedNotes(userId)`

---

## Sprint 11 — Beta Gate & Polish

- [ ] `ComingSoonProfessional` screen when `PROFESSIONAL_SUPPORT_BETA_ENABLED = false`
- [ ] Amber "BETA" tab badge when feature is enabled
- [ ] "Verified" badge on professionals with `license_verified = true`
- [ ] Add locked "Find a Professional" card to Home Dashboard

---

## Sprint 12 — Security & Compliance

- [ ] Stripe webhook HMAC signature verification
- [ ] RLS audit — cross-user session note access blocked
- [ ] Input validation — price, scheduled_at, body max length (2000 chars)
- [ ] GDPR data export — include sessions, messages, shared notes
- [ ] GDPR deletion — verify CASCADE on all user-owned professional tables
- [ ] Crisis detection in session chat
- [ ] Rate limit — max 3 pending bookings per user (DB trigger or edge function)

---

## Sprint 13 — Tests

- [ ] Unit: `booking.ts` — rejects past slots; cancel window enforcement
- [ ] Unit: `payments.ts` — correct amount passed to edge function
- [ ] Unit: `notes.ts` — only `is_shared_with_ai = true` rows returned
- [ ] Unit: `buildSystemPrompt` — therapist notes block present/absent
- [ ] Component: `support.tsx` — beta flag off → ComingSoon; on → list renders
- [ ] Component: `checkout.tsx` — loading state + success navigation
- [ ] Component: `video-call.tsx` — correct `sessionId` in WebView src
- [ ] Integration: full booking flow with Stripe test keys
- [ ] Integration: RLS — user A cannot read user B's session notes
- [ ] Integration: Stripe webhook `payment_intent.succeeded` → `status = 'confirmed'`
- [ ] E2E (Playwright): portal login → save note → toggle `is_shared_with_ai`

---

## Constants to Set Before Launch

| Constant                            | File                               | Value            |
| ----------------------------------- | ---------------------------------- | ---------------- |
| `PROFESSIONAL_SUPPORT_BETA_ENABLED` | `constants/ProfessionalSupport.ts` | `false` → `true` |
| `PLATFORM_COMMISSION_PERCENT`       | `constants/ProfessionalSupport.ts` | TBD              |
| `SESSION_MIN_PRICE_SEK`             | `constants/ProfessionalSupport.ts` | TBD              |
| `STRIPE_PUBLISHABLE_KEY`            | Expo env / `app.config.js`         | TBD              |
| `PROFESSIONAL_PORTAL_URL`           | `constants/ProfessionalSupport.ts` | TBD (Vercel URL) |
