# QuizSpark — Google Play listing pack

Copy/paste-ready listing content plus the answers for Google Play's **Data
Safety** form and **content rating** questionnaire. Review before submitting;
adjust anything that doesn't match final practices.

> **📍 Current phase = free build (no in-app purchases live).** Billing is muted
> (`NEXT_PUBLIC_BILLING_ENABLED=false`), so the app currently has **no paid tier
> and no digital purchases**. The copy and answers below are written for that
> free build. When the paid $5/mo model is switched back on, re-add: the
> "QuizSpark Plus" section to the description, the **Payment info** row to Data
> Safety, and change **Digital purchases** to **Yes** in the content rating.

---

## App identity
- **App name:** QuizSpark
- **Package name:** `com.conceptmastery.quizspark`
- **Developer:** Concept Mastery
- **Default language:** English (Canada) 
- **Category:** Education
- **Tags:** education, math, kids, practice, quizzes
- **Contact email:** admin@conceptmastery.ca
- **Privacy policy URL:** `https://quizspark-cm.vercel.app/privacy`

---

## Store listing copy

### Short description (≤ 80 chars)
> Adaptive math practice for Grades 1–8 — quizzes that adjust to each child.

### Full description (≤ 4000 chars)
```
QuizSpark turns math practice into a habit kids actually keep.

Built by Concept Mastery, QuizSpark gives children in Grades 1–8 adaptive math
quizzes that adjust to their level — easing off when a topic is tough and
stepping up when they're ready. Parents stay in control and can see exactly how
each child is progressing.

WHY FAMILIES LOVE IT
• Adaptive difficulty — every quiz meets your child where they are.
• Aligned to the curriculum — practice that matches what's taught in school.
• Clear explanations — kids see why an answer was right or wrong.
• Motivation built in — XP, levels, badges, and daily streaks.
• Parent dashboard — track progress, scores, and topics at a glance.

FREE TO USE
• Unlimited quizzes, unlimited learners, full progress and topic mastery —
  all free while we're in early access.

SAFE BY DESIGN
A parent creates and controls the account and decides which children are added.
We don't show behavioral ads to children and we never sell personal information.

Start free today and make math practice something your child looks forward to.
```

### What's new (release notes — first release)
```
First release of QuizSpark! Adaptive math quizzes for Grades 1–8, a parent
dashboard, XP & streaks, and QuizSpark Plus for unlimited practice.
```

---

## Graphics assets needed (you/designer supply)
Google requires these — the in-repo `/icon.svg` is the design source.
- **App icon:** 512×512 PNG (PWABuilder can generate from the manifest).
- **Feature graphic:** 1024×500 PNG (banner shown at top of the listing).
- **Phone screenshots:** 2–8, min 320px side (capture from the live app:
  landing, a quiz in progress, results screen, parent dashboard, progress charts).
- (Optional) 7" / 10" tablet screenshots.

---

## Data Safety form (Play Console → App content → Data safety)

**Does your app collect or share user data?** Yes (collects; does **not** sell/share for ads).

Data types collected:
| Type | Collected | Purpose | Optional? |
|------|-----------|---------|-----------|
| Name (parent + child first name) | Yes | App functionality, account management | Required |
| Email address | Yes | Account management, comms | Required |
| Phone number | Yes (if user verifies one) | Account security | Optional |
| App activity (quiz results, progress) | Yes | App functionality, analytics | Required |
| App info & performance (logs/diagnostics) | Yes | Security, diagnostics | Required |

Answers to the standard questions:
- **Is data encrypted in transit?** Yes.
- **Can users request data deletion?** Yes — in-app account/child deletion and by
  emailing admin@conceptmastery.ca.
- **Is any data shared with third parties?** Only with service providers
  (payments, email, hosting) to operate the app — not sold, not used for
  third-party ads.

---

## Content rating questionnaire (IARC)
Expect an **Everyone / PEGI 3 / "Rated for 3+"** outcome. Answer truthfully:
- Violence, sexual content, profanity, controlled substances, gambling: **None**.
- User-to-user communication / shared content: **No** (no chat; the weekly
  leaderboard shows first names within the family/cohort only).
- Personal info shared with others: **No**.
- Digital purchases: **No** (free build — no in-app purchases live; change to
  **Yes** when the Plus subscription is switched on).

---

## Target audience & content (Families policy)
Because children are a target audience, expect the **"Designed for Families"**
review path:
- **Target age groups:** include under-13 bands (the app is for Grades 1–8).
- Confirm ads: the app shows **no ads** → declare "No ads."
- Confirm compliance with Google Play's Families Policy and applicable
  children's privacy law (COPPA in the US / PIPEDA in Canada). The privacy policy
  at `/privacy` must reflect this and be reviewed by counsel.

---

## Pricing & distribution
- **App is free to download and free to use** — the current build has **no
  in-app purchases**. (When the paid $5/mo Plus tier is switched on, revisit
  Google Play's payments policy: subscriptions sold outside Google Play Billing
  via the web/TWA need confirming before launch.)
- **Countries:** start with Canada (+ others as desired).
