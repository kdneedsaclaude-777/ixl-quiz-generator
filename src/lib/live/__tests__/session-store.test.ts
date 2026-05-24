import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  scoreAnswer,
  leaderboard,
  nextPhase,
  distributionFor,
  createSession,
  joinSession,
  submitAnswer,
  hostAction,
  snapshot,
  _resetSessions,
  type Participant,
  type LiveSession,
} from "@/lib/live/session-store";

beforeEach(() => _resetSessions());
afterEach(() => _resetSessions());

describe("scoreAnswer", () => {
  it("wrong answers score 0", () => {
    expect(scoreAnswer(false, 100, 25_000)).toBe(0);
  });
  it("correct + instant ≈ 1000, correct + slow → 500 floor", () => {
    expect(scoreAnswer(true, 0, 25_000)).toBe(1000);
    expect(scoreAnswer(true, 25_000, 25_000)).toBe(500);
    expect(scoreAnswer(true, 12_500, 25_000)).toBe(750);
  });
});

describe("leaderboard", () => {
  it("sorts by score desc, then name", () => {
    const base = { liveConnections: 0, disconnectTimer: null };
    const ps: Participant[] = [
      { token: "1", id: "a", name: "Zoe", score: 10, answered: new Map(), ...base },
      { token: "2", id: "b", name: "Al", score: 30, answered: new Map(), ...base },
      { token: "3", id: "c", name: "Bo", score: 30, answered: new Map(), ...base },
    ];
    expect(leaderboard(ps)).toEqual([
      { name: "Al", score: 30 },
      { name: "Bo", score: 30 },
      { name: "Zoe", score: 10 },
    ]);
  });
});

describe("nextPhase state machine", () => {
  it("lobby→question only via start with questions", () => {
    expect(nextPhase("lobby", "start", -1, 3)).toEqual({ phase: "question", index: 0 });
    expect(nextPhase("lobby", "start", -1, 0)).toBeNull();
  });
  it("question→reveal→next cycles then ends", () => {
    expect(nextPhase("question", "reveal", 0, 3)).toEqual({ phase: "reveal", index: 0 });
    expect(nextPhase("reveal", "next", 0, 3)).toEqual({ phase: "question", index: 1 });
    expect(nextPhase("reveal", "next", 2, 3)).toEqual({ phase: "ended", index: 2 });
  });
  it("skip jumps past a live question to the next (or end)", () => {
    expect(nextPhase("question", "skip", 0, 3)).toEqual({ phase: "question", index: 1 });
    expect(nextPhase("question", "skip", 2, 3)).toEqual({ phase: "ended", index: 2 });
    expect(nextPhase("reveal", "skip", 0, 3)).toBeNull(); // skip only from a live question
  });
  it("end is always valid", () => {
    expect(nextPhase("question", "end", 1, 3)).toEqual({ phase: "ended", index: 1 });
  });
});

describe("distributionFor", () => {
  it("counts picks per option for a question index", () => {
    const s = createSession({
      hostUserId: "h",
      hostName: "H",
      questions: [
        { prompt: "q", options: { A: "1", B: "2" }, correct: "A", unit: "u", skillTitle: "s" },
      ],
    });
    hostAction(s.code, "h", false, "start");
    const a = joinSession(s.code, "Ann");
    const b = joinSession(s.code, "Bo");
    submitAnswer(s.code, (a as { token: string }).token, "A");
    submitAnswer(s.code, (b as { token: string }).token, "B");
    expect(distributionFor(s as LiveSession, 0)).toEqual({ A: 1, B: 1 });
  });
});

describe("session flow", () => {
  const questions = [
    { prompt: "2+2?", options: { A: "3", B: "4" }, correct: "B", unit: "Add", skillTitle: "Addition" },
    { prompt: "3+3?", options: { A: "6", B: "7" }, correct: "A", unit: "Add", skillTitle: "Addition" },
  ];

  it("create → join → start → answer → reveal hides then shows correct", () => {
    const s = createSession({ hostUserId: "host1", hostName: "Mr. T", questions });
    const j = joinSession(s.code, "Ada");
    expect(j.ok).toBe(true);
    const token = (j as { token: string }).token;

    expect(hostAction(s.code, "host1", false, "start").ok).toBe(true);
    let snap = snapshot(s.code) as { phase: string; question: { correct?: string }; endsAt: number | null };
    expect(snap.phase).toBe("question");
    expect(snap.question.correct).toBeUndefined();
    expect(snap.endsAt).toBeGreaterThan(Date.now());

    // Single participant answering → auto-reveal fires immediately.
    expect(submitAnswer(s.code, token, "B").ok).toBe(true);
    snap = snapshot(s.code) as { phase: string; question: { correct?: string }; endsAt: number | null };
    expect(snap.phase).toBe("reveal");
    expect(snap.question.correct).toBe("B");
  });

  it("superadmin can drive a session they did not create; a random user cannot", () => {
    const s = createSession({ hostUserId: "host1", hostName: "H", questions });
    expect(hostAction(s.code, "intruder", false, "start").ok).toBe(false);
    expect(hostAction(s.code, "anyAdmin", true, "start").ok).toBe(true);
  });

  it("pause blocks answers; resume restores the live question", () => {
    const s = createSession({ hostUserId: "h", hostName: "H", questions });
    const j = joinSession(s.code, "P1");
    joinSession(s.code, "P2"); // 2 players so one answer won't auto-reveal
    hostAction(s.code, "h", false, "start");
    expect(hostAction(s.code, "h", false, "pause").ok).toBe(true);
    expect((snapshot(s.code) as { paused: boolean }).paused).toBe(true);
    expect(submitAnswer(s.code, (j as { token: string }).token, "B").ok).toBe(false);
    expect(hostAction(s.code, "h", false, "resume").ok).toBe(true);
    expect((snapshot(s.code) as { paused: boolean }).paused).toBe(false);
    expect(submitAnswer(s.code, (j as { token: string }).token, "B").ok).toBe(true);
  });

  it("kick removes a participant by public id", () => {
    const s = createSession({ hostUserId: "h", hostName: "H", questions });
    const j = joinSession(s.code, "Spammer") as { token: string; id: string };
    expect((snapshot(s.code) as { participantCount: number }).participantCount).toBe(1);
    expect(hostAction(s.code, "h", false, "kick", j.id).ok).toBe(true);
    expect((snapshot(s.code) as { participantCount: number }).participantCount).toBe(0);
  });

  it("allows late join after the quiz has started", () => {
    const s = createSession({ hostUserId: "h", hostName: "H", questions });
    hostAction(s.code, "h", false, "start");
    const late = joinSession(s.code, "Latecomer");
    expect(late.ok).toBe(true);
  });

  it("rejects joining an ended session", () => {
    const s = createSession({ hostUserId: "h", hostName: "H", questions });
    hostAction(s.code, "h", false, "end");
    expect(joinSession(s.code, "TooLate").ok).toBe(false);
  });
});
