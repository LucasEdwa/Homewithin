# HomeWithin — Policy Model

**Last updated: 20 May 2026**  
**Version: 1.0**

This document defines the complete governance framework for the HomeWithin app — covering privacy, security, content moderation, community standards, safety protocols, and data governance. It is intended for internal reference, App Store review, and compliance audits.

For the user-facing privacy policy, see [PRIVACY_POLICY.md](./PRIVACY_POLICY.md).

---

## Table of Contents

1. [Scope & Audience](#1-scope--audience)
2. [Data Policy Model](#2-data-policy-model)
3. [Access Control Policy](#3-access-control-policy)
4. [Security Policy](#4-security-policy)
5. [Content Moderation Policy](#5-content-moderation-policy)
6. [Community Standards](#6-community-standards)
7. [Safety & Crisis Protocol](#7-safety--crisis-protocol)
8. [Device Security Policy](#8-device-security-policy)
9. [Third-Party Dependency Policy](#9-third-party-dependency-policy)
10. [Incident Response Policy](#10-incident-response-policy)
11. [GDPR Compliance Checklist](#11-gdpr-compliance-checklist)
12. [Policy Change Management](#12-policy-change-management)

---

## 1. Scope & Audience

| Applies to | Details |
|---|---|
| Platform | iOS (primary), with future Android support planned |
| Users | LGBTQ+ people in Sweden, 13 years and older |
| Data jurisdiction | European Union / GDPR |
| Backend | Supabase (EU region) |

HomeWithin serves a **high-vulnerability population**. All policies in this document are written with an elevated standard of care — particularly for users who may be at risk of family violence, surveillance, or homelessness.

---

## 2. Data Policy Model

### 2.1 Data Classification

| Class | Description | Examples | Storage |
|---|---|---|---|
| **Private** | Sensitive data never shared with others | Journal entries, PIN, safety assessments | Local (encrypted) |
| **Semi-private** | Shared only between consenting matched users | Chat messages, chosen-family connections | Supabase (RLS-protected) |
| **Profile** | Voluntarily shared for matching | Nickname, age range, intentions | Supabase (RLS-protected) |
| **Functional** | Required only to deliver a feature | Push token, location | Supabase / never stored |
| **Technical** | System-level operational data | Request timestamps | Supabase logs |

### 2.2 Data Minimisation

- No real name collected at any point
- No email address required (anonymous sign-in supported)
- Location is never written to the database — used in memory only
- Profile avatar is optional

### 2.3 Retention Schedule

| Data type | Retention period | Deletion trigger |
|---|---|---|
| Profile & account | Duration of account | Account deletion |
| Chat messages | Duration of match | Conversation deletion or account deletion |
| Journal entries (local) | Indefinite, on-device | Manual deletion by user |
| Journal entries (synced) | Duration of account | Account deletion |
| Location data | Never stored | N/A |
| Push notification token | Duration of session | Sign-out or account deletion |
| Safety assessment results | Never stored server-side | N/A |

---

## 3. Access Control Policy

HomeWithin uses Supabase Row-Level Security (RLS) to enforce access control at the database level.

### 3.1 Rules

| Table | Read | Write |
|---|---|---|
| `profiles` | Own row + matched users (limited fields) | Own row only |
| `matches` | Rows where `user_id` or `matched_user_id` = self | Insert only (request), update own side |
| `messages` | Rows in matches the user belongs to | Own messages only |
| `push_tokens` | None (server-side only) | Own token only |
| `check_ins` | Own rows only | Own rows only |
| `journal_entries` | Own rows only | Own rows only |

### 3.2 Anonymous vs. Authenticated Users

- **Anonymous users** can access safety resources, the AI companion, and articles
- **Authenticated users** unlock Connect, chat, chosen-family, and progress tracking
- **No admin UI is exposed to users** — backend management is server-only

---

## 4. Security Policy

### 4.1 Encryption

| Layer | Mechanism |
|---|---|
| Transport | HTTPS / TLS 1.2+ (enforced by Supabase) |
| At-rest (server) | AES-256 via Supabase's managed encryption |
| At-rest (local sensitive data) | `expo-secure-store` (iOS Keychain / Android Keystore) |
| PIN hash | `expo-crypto` SHA-256 hash — PIN is never stored in plaintext |

### 4.2 Authentication

- Supabase Auth with JWT tokens
- Anonymous sessions supported via Supabase anon keys
- Session tokens stored in `expo-secure-store`, not `AsyncStorage`
- Sessions expire and are refreshed automatically

### 4.3 Dependency Security

- `@supabase/supabase-js` is patched where required (see `patches/`)
- No advertising SDKs
- No analytics SDKs that fingerprint users
- Dependencies are audited on every release with `npm audit`

### 4.4 Security Headers

All Supabase API calls use the `apikey` and `Authorization` headers. No API key is embedded in plain-text source code — keys are injected via `eas.json` environment configuration at build time.

---

## 5. Content Moderation Policy

### 5.1 Automated Controls

- Users can only message people they have mutually matched with
- Profile fields have character limits enforced at the database level
- Avatar uploads are size-limited and type-restricted (JPEG/PNG only)

### 5.2 User Reporting

Users can report other users directly from their profile or chat. Reports are:

1. Flagged in the `reports` table with the reporter, reported user, reason, and timestamp
2. Reviewed manually within 48 hours
3. Actioned (warning, temporary suspension, permanent ban) based on severity

### 5.3 Prohibited Content

The following is never permitted on HomeWithin:

- Sexual content involving minors (CSAM) — immediate permanent ban and law enforcement referral
- Doxxing or sharing another user's real identity
- Conversion therapy advocacy or content intended to change someone's sexual orientation or gender identity
- Threats of violence
- Spam or commercial solicitation

### 5.4 Zero-Tolerance Items

The following result in immediate permanent account termination without warning:

- CSAM
- Coordinated harassment targeting a specific user
- Impersonating HomeWithin staff or crisis services

---

## 6. Community Standards

HomeWithin is built on the principle that **every user deserves to feel safe**. Community standards are enforced to protect that principle.

### 6.1 Core Principles

1. **Be kind** — Treat others with the same care you would want for yourself
2. **Respect privacy** — Never share another user's information outside the app
3. **No outing** — Never reveal or speculate about another person's identity, orientation, or gender
4. **Support, don't diagnose** — You can offer support; you are not a therapist
5. **Crisis first** — If someone is in danger, encourage them to contact emergency services

### 6.2 Enforcement

| Violation level | Action |
|---|---|
| Minor (first offence) | In-app warning |
| Repeated minor | 24-hour suspension |
| Major | Permanent ban |
| Zero-tolerance | Immediate permanent ban |

---

## 7. Safety & Crisis Protocol

### 7.1 In-App Safety Assessment

The 6-step safety assessment (`(wellness)/safety`) is a clinical tool for self-reflection. It:

- Runs entirely on-device — results are never transmitted
- Produces a colour-coded risk level (green / yellow / red)
- Displays context-appropriate resources based on the outcome
- Does not replace professional mental health evaluation

### 7.2 Crisis Resources

When a user is assessed as high-risk (red), the app surfaces:

- **BRIS** — Children's Rights in Society crisis line (Sweden)
- **Mind** — Swedish mental health support line
- **RFSL** — LGBTQ+ national support organisation (Sweden)
- **SOS Alarm 112** — Emergency services

These resources are hard-coded in `data/hotlines.ts` and updated with each release.

### 7.3 AI Companion Guardrails

The AI Companion (`ai-companion.tsx`) is subject to the following constraints:

- It must not diagnose, prescribe, or provide medical advice
- It must redirect to crisis resources when a user expresses suicidal ideation
- It must not engage in romantic or sexual role-play
- Responses are generated via a system prompt that enforces these rules

### 7.4 Mandatory Reporting

HomeWithin is not a legal mandated reporter in Sweden. However, in cases involving:

- A user disclosing ongoing abuse of a minor
- CSAM (see Section 5.4)

...we will cooperate fully with Swedish law enforcement.

---

## 8. Device Security Policy

### 8.1 PIN Lock

- Users set a 4-digit PIN stored as a SHA-256 hash in `expo-secure-store`
- After 5 failed attempts, the app locks for 15 minutes
- PIN reset requires the user's account credentials

### 8.2 Disguise Mode

- Disguise mode replaces the app's UI with a decoy screen (calculator, weather, notes)
- This feature is for physical safety — no extra data is collected in disguise mode
- Disguise mode activation pattern is set by the user (e.g. triple-tap)

### 8.3 Background Security

- Sensitive content is blurred when the app is backgrounded (iOS app switcher)
- Session is locked after configurable inactivity timeout
- `expo-secure-store` data is not included in iOS backups (`accessible: WHEN_UNLOCKED_THIS_DEVICE_ONLY`)

---

## 9. Third-Party Dependency Policy

### 9.1 Approved Services

| Service | Purpose | Data shared |
|---|---|---|
| Supabase | Auth, database, storage | Profile, matches, messages, push tokens |
| Expo / EAS | Build, push notifications | App bundle, push token |
| Apple (APNs) | Push notification delivery | Push token, notification payload |

### 9.2 Prohibited Integrations

The following categories of third-party services are **never** permitted:

- Advertising networks (Meta, Google Ads, etc.)
- Behavioural analytics (Mixpanel, Amplitude, etc.)
- Device fingerprinting SDKs
- Social login that shares data with the provider (e.g. "Sign in with Facebook")

### 9.3 Dependency Review

- All new dependencies must be reviewed for data collection practices before adding
- Any dependency that introduces analytics or tracking is rejected
- `npm audit` must pass (no critical vulnerabilities) before a production release

---

## 10. Incident Response Policy

### 10.1 Definitions

| Severity | Description |
|---|---|
| P1 — Critical | Data breach, service outage, zero-day exploit |
| P2 — High | Confirmed abuse (CSAM, harassment campaign), auth failure |
| P3 — Medium | Bug causing data exposure for a limited set of users |
| P4 — Low | Non-security bugs, content violations |

### 10.2 Response Timelines

| Severity | Acknowledge | Mitigate | Notify users |
|---|---|---|---|
| P1 | 1 hour | 4 hours | Within 72 hours (GDPR requirement) |
| P2 | 4 hours | 24 hours | If personal data affected, within 72 hours |
| P3 | 24 hours | 7 days | In-app notice if warranted |
| P4 | 72 hours | Next release | No notification required |

### 10.3 GDPR Breach Notification

Under GDPR Article 33, a personal data breach involving risk to individuals **must** be reported to:

**Integritetsskyddsmyndigheten (IMY)**  
imy.se/anmalan-om-personuppgiftsincident  
Within **72 hours** of becoming aware.

---

## 11. GDPR Compliance Checklist

| Requirement | Status | Notes |
|---|---|---|
| Lawful basis documented for each data type | ✅ | See PRIVACY_POLICY.md §3 |
| Data minimisation applied | ✅ | No real name, no email required |
| User consent for optional data | ✅ | Location, notifications |
| Right to erasure implemented | ✅ | Account deletion removes all server data |
| Right to access implemented | 🔄 | Manual process via email |
| Data portability | 🔄 | Manual process via email |
| DPA with Supabase | ✅ | Covered by Supabase's DPA |
| EU data storage | ✅ | Supabase EU region |
| Breach notification plan | ✅ | See Section 10.3 |
| Children's data protection (under 13) | ✅ | No under-13 accounts permitted |

---

## 12. Policy Change Management

### 12.1 Versioning

This document follows semantic versioning:
- **Major** version: Fundamental changes to data practices or user rights
- **Minor** version: New sections or material policy changes
- **Patch** version: Clarifications and corrections

### 12.2 Communication

| Change type | How users are notified |
|---|---|
| Major (affects user rights) | In-app prompt requiring acknowledgment on next launch |
| Minor (new data use) | In-app notice |
| Patch (clarification only) | Updated date in document only |

### 12.3 Review Schedule

This policy is reviewed:
- Before every major app release
- Whenever a new third-party service is added
- When Swedish or EU data protection law changes
- At minimum once per year

---

*For questions about this policy, contact **lucas.eduardo2070@gmail.com**.*
