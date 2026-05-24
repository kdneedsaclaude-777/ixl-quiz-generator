╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║              IXL QUIZ APP  —  DEMO GUIDE                             ║
║              Per-role walkthroughs + change history                  ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

This folder is the SINGLE SOURCE OF TRUTH for the demo. Each file shows
exactly what one role sees, what they can do, and which URL to land on.

Open one file per browser tab and you can run the whole demo without
ever switching context.


┌──────────────────────────────────────────────────────────────────────┐
│  FILES IN THIS FOLDER                                                │
└──────────────────────────────────────────────────────────────────────┘

  01-super-admin.txt    Highest privilege — sees every org + every metric.
  02-org-admin.txt      Scoped admin — manages a single organization.
  03-parent.txt         Owns children, monitors progress, sets controls.
  04-tutor.txt          Assigned to specific kids, runs Live quizzes.
  05-student.txt        The kid panel — quizzes, XP, badges, streaks.
  06-emails.txt         Full email matrix — what fires when, for who.
  CHANGELOG.txt         Updated on every major release. Read this first
                        if something looks different from your memory.


┌──────────────────────────────────────────────────────────────────────┐
│  URLS                                                                │
└──────────────────────────────────────────────────────────────────────┘

  Same machine:        http://localhost:3000
  Same Wi-Fi network:  http://192.168.2.10:3000   (use on phones)

  All accounts are PRE-VERIFIED. No email confirmation required.


┌──────────────────────────────────────────────────────────────────────┐
│  ACCOUNTS — QUICK REFERENCE                                          │
└──────────────────────────────────────────────────────────────────────┘

  ROLE             EMAIL                      PASSWORD          GRADE
  ---------------- -------------------------- ----------------- -----
  Super Admin      admin@ixl.local            Admin1234!        —
  Org Admin        orgadmin@demo.local        OrgAdmin1234!     —
  Parent           parent@demo.local          Parent1234!       —
  Tutor            tutor@demo.local           Tutor1234!        —
  Student (G2)     ada@demo.local             Student1234!      2
  Student (G6)     ben@demo.local             Student1234!      6


┌──────────────────────────────────────────────────────────────────────┐
│  5-MINUTE DEMO ARC                                                   │
└──────────────────────────────────────────────────────────────────────┘

   1.  Student     →  Take a quiz, watch XP + streak + badge animate.
   2.  Parent      →  Open child card, see weak topics + trend chart,
                      set a parental window, export PDF.
   3.  Tutor       →  Cohort dashboard, sees only assigned kids.
   4.  Admin       →  Analytics 30d, drill into a graph bar, view audit.
   5.  Live quiz   →  Admin/tutor hosts. Phones join via /live/<CODE>.


┌──────────────────────────────────────────────────────────────────────┐
│  SERVER CONTROLS  (Mac terminal)                                     │
└──────────────────────────────────────────────────────────────────────┘

  Start (localhost only):
      cd ~/quiz-app/ixl-quiz-generator && npm run dev

  Start (LAN-accessible — required for phone joins):
      cd ~/quiz-app/ixl-quiz-generator && npx next dev -H 0.0.0.0

  Stop:
      pkill -f "next dev"


Last updated: see CHANGELOG.txt for the current version.
