---
name: ixl-quiz-generator
description: >
  Generates structured, adaptive math quizzes for Grades 4–8 aligned exactly
  to the IXL Ontario skill taxonomy with precise skill codes (e.g. C.3, D.7).
  Use this skill whenever anyone asks to generate a quiz, create practice
  questions, build a question set, or produce curriculum-aligned problems for
  Grades 4–8 Math. Also triggers for: IXL skill practice, adaptive quizzes,
  student weak area focus, parent-configured learning paths, tutor-reviewed
  grade progression, or any request like "make Grade 6 fractions questions" or
  "quiz on G7 integers." Always use this skill — never generate quiz questions
  without it.
---

# Concept Mastery Quiz Generator

Adaptive, curriculum-exact quiz questions for Grades 4–8 Math. Mirrors IXL
Ontario skill codes precisely. Questions adapt to each student's weak points,
progress as the student improves, and are configured initially by a parent with
tutor oversight for grade changes.

---

## How the system works

### Onboarding flow (parent-led)
1. Parent receives onboarding email → sets up child's profile
2. Parent selects:
   - Child's current grade (4–8)
   - Topic groups to practise (e.g. Fractions, Geometry)
   - Starting difficulty (defaults to 1 if unsure)
3. Tutor reviews and approves before student's first quiz is released
4. **Grade upgrades always require tutor review and approval**
5. Parent can change topic/skill selections freely without review

### Adaptive engine rules
| Signal | Action |
|--------|--------|
| New student | Start at difficulty 1 on parent-selected topics |
| 3 consecutive correct on a skill | Advance to next numbered skill in group |
| 80%+ quiz score | Increase difficulty by 1 |
| 50–79% quiz score | Hold — stay on same skills and difficulty |
| Below 50% quiz score | Step back one skill number, decrease difficulty by 1 |
| 2+ quizzes below 50% on same skill | Set `remediation_flag: true`, alert tutor |
| Grade change request | Lock — requires tutor approval |

Adaptive weighting operates **within parent-selected topics only**. The system
never introduces topics the parent has not enabled.

---

## Step 1 — Parse the request

Extract or ask for:

| Input | Source | Default |
|-------|--------|---------|
| Grade | Parent config | Required — ask if missing |
| Topic group letters | Parent config | Required — ask if missing |
| Weak skill codes | Past attempt data | None (fresh start) |
| Difficulty | Adaptive engine | 1 for new students |
| Question count | Tutor / student | 10 |
| New student? | Context | Assume returning if not stated |

---

## Step 2 — Load the grade reference file

Read the matching file **before generating any questions**:

| Grade | Reference file |
|-------|---------------|
| 4 | `references/grade4.md` |
| 5 | `references/grade5.md` |
| 6 | `references/grade6.md` |
| 7 | `references/grade7.md` |
| 8 | `references/grade8.md` |

Identify the exact letter codes and skill numbers for the requested topic groups.
Every `skill_code` in output must match a real entry in that file.

---

## Step 3 — Question type by difficulty

Question type is determined entirely by the student's current difficulty level.

| Difficulty | Types available | Style split |
|------------|----------------|-------------|
| 1 — Recall | True/false, MCQ | 100% conceptual |
| 2 — Understanding | MCQ, fill-in-the-blank | 70% conceptual / 30% word problem |
| 3 — Application | MCQ, short answer | 50% / 50% |
| 4 — Analysis | Short answer, multi-step MCQ | 30% conceptual / 70% word problem |
| 5 — Exam-style | Short answer multi-step, complex MCQ | 100% word problem |

---

## Step 4 — Adaptive question distribution

### Multiple questions per skill
Generate minimum **2 questions per skill** in the quiz. Do not cover a skill
with only 1 question — repetition is how the adaptive engine detects mastery.

### Weighting by weak skills
If weak skill codes are provided:
- Weak skills → 60% of total questions
- Adjacent skills (skill number ±1 from weak) → 25%
- Other skills in the group → 15%

If no weak skills (fresh start):
- Distribute evenly, ordered by skill number (lower = more foundational first)

### Example — Grade 4, Topic S (Geometric measurement), 10 questions, weak on S.1 + S.4
| Skill | Name | Questions | Reason |
|-------|------|-----------|--------|
| S.1 | Perimeter | 3 | Weak — weighted up |
| S.4 | Area of unit squares | 3 | Weak — weighted up |
| S.2 | Perimeter on grids | 2 | Adjacent to S.1 |
| S.8 | Multiply to find area | 1 | Adjacent to S.4 |
| S.11 | Find area or missing side | 1 | Broader group coverage |

---

## Step 5 — Generate questions

Output a raw JSON array. No prose, no markdown fences, no wrapper object.

```json
{
  "id": "uuid-placeholder",
  "grade": 4,
  "subject": "math",
  "topic_group_letter": "S",
  "topic_group_name": "Geometric measurement",
  "skill_code": "S.1",
  "skill_name": "Perimeter",
  "ixl_skill_ref": "grade4-S-1",
  "difficulty": 2,
  "question_type": "mcq",
  "question_style": "conceptual",
  "question_text": "A rectangle has a length of 8 cm and a width of 3 cm. What is its perimeter?",
  "answer_options": {
    "A": "11 cm",
    "B": "22 cm",
    "C": "24 cm",
    "D": "16 cm"
  },
  "correct_answer": "B",
  "display_label": "Perimeter",
  "needs_visual": false,
  "visual_note": null,
  "visual_svg": null,
  "learning_objective": "Calculate the perimeter of a rectangle",
  "concept_tags": ["perimeter", "rectangle", "measurement"],
  "explanation": {
    "short": "P = 2 × (length + width) = 2 × (8 + 3) = 22 cm.",
    "step_by_step": [
      "Perimeter means the total distance around the outside of a shape.",
      "For a rectangle: P = 2 × (length + width).",
      "Substitute the values: P = 2 × (8 + 3) = 2 × 11 = 22 cm."
    ],
    "why_wrong": {
      "A": "11 cm adds length + width only once — you must double it for a rectangle.",
      "C": "24 cm comes from 8 × 3 which gives area, not perimeter.",
      "D": "16 cm only counts the two lengths and forgets the two widths."
    },
    "misconception": "Students often confuse perimeter (distance around) with area (space inside).",
    "revision_tip": "For a rectangle: add all 4 sides, or use P = 2l + 2w."
  },
  "tone_grade": 4,
  "estimated_complexity": "low",
  "remediation_flag": false,
  "weak_skill_targeted": true
}
```

### Field rules

| Field | Rule |
|-------|------|
| `skill_code` | Exact IXL code from reference file — e.g. `S.1`, `C.3`, `BB.7` |
| `ixl_skill_ref` | Format: `grade{N}-{letter}-{number}` — e.g. `grade4-S-1` |
| `display_label` | Friendly skill name shown to student — **never** the code |
| `question_style` | `"conceptual"` or `"word_problem"` per difficulty table above |
| `needs_visual` | `true` for grids, number lines, area models, graphs, shapes, nets |
| `visual_note` | One-sentence description of what the visual shows — required when `needs_visual: true` |
| `visual_svg` | Inline SVG string if generatable (see Step 6) — else `null` |
| `why_wrong` | MCQ only — one sentence per wrong option, all options covered |
| `step_by_step` | Minimum 2 steps; depth scales with difficulty level |
| `remediation_flag` | `true` if skill has 2+ failed quizzes in past attempt data |
| `weak_skill_targeted` | `true` if question was weighted up due to weak skill data |

---

## Step 6 — Visual generation

### Set needs_visual: true for any question referencing
Grids, number lines, area models, coordinate planes, bar graphs, line plots,
geometric figures, fraction bars, strip models, decimal blocks, arrays, circle
graphs, nets of 3D shapes, dot plots, stem-and-leaf plots.

### Attempt SVG generation for simple visuals
Try to generate `visual_svg` for:
- Number lines (mark a point, show a range)
- Rectangles or squares with labelled sides
- Fraction bars split into equal parts
- Simple grids with shaded squares (decimals, fractions)
- Basic bar graphs (3–4 bars, labelled axes)

SVG rules:
- Max width 400px, viewBox proportional
- `stroke="#555"` for lines, `fill="#e8f4fd"` for shaded regions
- `fill="#1a1a1a"` for all text labels, font-size 12px minimum
- Label all key measurements and axes
- Keep paths simple — rectangles, lines, basic polygons only

### Set visual_svg: null for complex visuals
Coordinate planes with plotted shapes, nets of 3D figures, area models for
multi-digit multiplication, circle graphs, stem-and-leaf plots. Set a detailed
`visual_note` instead so a human or image step can produce it.

---

## Step 7 — Tone by grade

| Grade | Language style | Contexts to use | Math terminology |
|-------|---------------|-----------------|-----------------|
| 4 | Warm, simple, encouraging | Toys, food, animals, classroom | Introduce terms with brief explanation |
| 5 | Clear, friendly | School supplies, money, distances | Use terms, briefly reinforce meaning |
| 6 | Academic, accessible | Budgets, maps, data, recipes | Full terminology, no hand-holding |
| 7 | Formal, precise | Rates, proportions, real statistics | Standard terms expected throughout |
| 8 | Exam-style, concise | Finance, science, abstract scenarios | Terse, professional, no scaffolding |

---

## Step 8 — Validation checklist

Before returning output, check every question:

- [ ] `skill_code` exists in the grade reference file
- [ ] `correct_answer` is one of the keys in `answer_options` (MCQ)
- [ ] `why_wrong` covers every wrong option key (MCQ)
- [ ] `step_by_step` has at least 2 entries
- [ ] `needs_visual` is `true` for any question mentioning a visual concept
- [ ] `question_style` matches the difficulty table in Step 3
- [ ] No two questions in the quiz have identical `question_text`
- [ ] Vocabulary matches `tone_grade`
- [ ] At least 2 questions per skill code in the quiz

Regenerate any failing question. Never include a known flawed question.

---

## Step 9 — New student config block

For a brand-new student's first quiz only, prepend one config object to the
array before the question objects.

```json
{
  "config_type": "student_quiz_setup",
  "student_grade": 4,
  "configured_by": "parent",
  "selected_topic_groups": ["S", "E", "H"],
  "selected_topic_names": ["Geometric measurement", "Multiplication", "Division"],
  "tutor_approved": false,
  "approval_required_for": ["grade_change"],
  "starting_difficulty": 1,
  "adaptive_mode": true,
  "notes": "Parent selected topics. Quiz held pending tutor approval before release to student."
}
```

`tutor_approved` is always `false` on creation. The app blocks quiz delivery
until a tutor sets this to `true`.

---

## Output format

**New student first quiz:**
```
[config_object, question, question, ...]
```

**Returning student quiz:**
```
[question, question, ...]
```

Raw JSON array only. No markdown. No prose. No wrapper object.
