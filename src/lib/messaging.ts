import { prisma } from "@/lib/db";
import crypto from "crypto";

export type MessageRole = "parent" | "tutor" | "student" | "orgadmin" | "superadmin";

// Deterministic key so two users always land on the same conversation.
// Order-independent: sorted so (A,B) and (B,A) hash identically.
// studentId anchor distinguishes parent↔tutor threads per child.
export function buildTopicKey(
  userIds: string[],
  studentId?: number,
): string {
  const sorted = [...userIds].sort();
  const base = sorted.join(":");
  const anchor = studentId != null ? `:s${studentId}` : "";
  return crypto.createHash("sha256").update(base + anchor).digest("hex");
}

// Permission matrix — returns true if the caller can initiate a conversation
// with the target, given optional shared student context.
export async function canMessage(
  callerId: string,
  callerRole: MessageRole,
  targetId: string,
  targetRole: MessageRole,
  studentId?: number,
): Promise<boolean> {
  if (callerId === targetId) return false;

  // Check neither party is suspended/deleted
  const [caller, target] = await prisma.$transaction([
    prisma.user.findUnique({ where: { id: callerId }, select: { suspendedAt: true, deletedAt: true, orgId: true } }),
    prisma.user.findUnique({ where: { id: targetId }, select: { suspendedAt: true, deletedAt: true, orgId: true } }),
  ]);
  if (!caller || !target) return false;
  if (caller.suspendedAt || caller.deletedAt) return false;
  if (target.suspendedAt || target.deletedAt) return false;

  const sameOrg = caller.orgId === target.orgId;

  if (callerRole === "parent" && targetRole === "tutor") {
    // parent↔tutor: must share a child
    if (!studentId) return false;
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        parentId: callerId,
        tutorAssignments: { some: { tutorId: targetId } },
      },
    });
    return student !== null;
  }

  if (callerRole === "tutor" && targetRole === "parent") {
    if (!studentId) return false;
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        parentId: targetId,
        tutorAssignments: { some: { tutorId: callerId } },
      },
    });
    return student !== null;
  }

  if (
    (callerRole === "parent" && (targetRole === "orgadmin" || targetRole === "superadmin")) ||
    ((callerRole === "orgadmin" || callerRole === "superadmin") && targetRole === "parent")
  ) {
    return sameOrg || callerRole === "superadmin" || targetRole === "superadmin";
  }

  if (
    (callerRole === "tutor" && (targetRole === "orgadmin" || targetRole === "superadmin")) ||
    ((callerRole === "orgadmin" || callerRole === "superadmin") && targetRole === "tutor")
  ) {
    return sameOrg || callerRole === "superadmin" || targetRole === "superadmin";
  }

  if (
    (callerRole === "orgadmin" || callerRole === "superadmin") &&
    (targetRole === "orgadmin" || targetRole === "superadmin")
  ) {
    return true;
  }

  if (callerRole === "student" && targetRole === "tutor") {
    const student = await prisma.student.findFirst({
      where: {
        account: { id: callerId },
        tutorAssignments: { some: { tutorId: targetId } },
      },
    });
    return student !== null;
  }

  if (callerRole === "tutor" && targetRole === "student") {
    const student = await prisma.student.findFirst({
      where: {
        account: { id: targetId },
        tutorAssignments: { some: { tutorId: callerId } },
      },
    });
    return student !== null;
  }

  return false;
}

// Get or create a conversation between two users.
export async function getOrCreateConversation(
  userIds: [string, string],
  studentId?: number,
) {
  const topicKey = buildTopicKey(userIds, studentId);

  const existing = await prisma.conversation.findUnique({
    where: { topicKey },
    include: { participants: true },
  });
  if (existing) return existing;

  return prisma.conversation.create({
    data: {
      topicKey,
      studentId: studentId ?? null,
      participants: {
        create: userIds.map((uid) => ({ userId: uid })),
      },
    },
    include: { participants: true },
  });
}

// List all conversations for a user with last message + unread count.
export async function listConversations(userId: string) {
  const participations = await prisma.conversationParticipant.findMany({
    where: { userId },
    include: {
      conversation: {
        include: {
          participants: {
            include: { user: { select: { id: true, name: true, role: true } } },
          },
          messages: {
            where: { deletedAt: null },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          student: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { conversation: { lastMessageAt: "desc" } },
  });

  return participations.map((p) => {
    const lastMsg = p.conversation.messages[0] ?? null;
    const unread =
      lastMsg && (!p.lastReadAt || lastMsg.createdAt > p.lastReadAt) ? 1 : 0;
    const otherParticipants = p.conversation.participants.filter(
      (cp) => cp.userId !== userId,
    );
    return {
      id: p.conversation.id,
      topicKey: p.conversation.topicKey,
      student: p.conversation.student,
      otherParticipants: otherParticipants.map((cp) => cp.user),
      lastMessage: lastMsg
        ? { body: lastMsg.deletedAt ? "(deleted)" : lastMsg.body, createdAt: lastMsg.createdAt, senderId: lastMsg.senderId }
        : null,
      lastMessageAt: p.conversation.lastMessageAt,
      unread,
    };
  });
}

// Count total unread conversations for a user.
export async function countUnread(userId: string): Promise<number> {
  const participations = await prisma.conversationParticipant.findMany({
    where: { userId },
    include: {
      conversation: {
        include: {
          messages: {
            where: { deletedAt: null },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  return participations.filter((p) => {
    const lastMsg = p.conversation.messages[0];
    if (!lastMsg) return false;
    if (lastMsg.senderId === userId) return false;
    return !p.lastReadAt || lastMsg.createdAt > p.lastReadAt;
  }).length;
}

// Get messages in a conversation (newest last).
export async function getMessages(conversationId: string, limit = 50) {
  return prisma.message.findMany({
    where: { conversationId },
    include: { sender: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
}

// Send a message.
export async function sendMessage(
  conversationId: string,
  senderId: string,
  body: string,
) {
  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: { conversationId, senderId, body: body.trim() },
      include: { sender: { select: { id: true, name: true, role: true } } },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    }),
  ]);
  return message;
}

// Mark all messages in a conversation as read for a user.
export async function markConversationRead(
  conversationId: string,
  userId: string,
) {
  await prisma.conversationParticipant.updateMany({
    where: { conversationId, userId },
    data: { lastReadAt: new Date() },
  });
}

// List who a user can start a new message with.
export async function listRecipients(callerId: string, callerRole: MessageRole) {
  const caller = await prisma.user.findUnique({
    where: { id: callerId },
    select: { orgId: true },
  });
  if (!caller) return [];

  if (callerRole === "parent") {
    // can message: tutors of their children, admins in same org
    const studentIds = await prisma.student.findMany({
      where: { parentId: callerId },
      select: { id: true, name: true, tutorAssignments: { include: { tutor: { select: { id: true, name: true, role: true } } } } },
    });
    const tutors: { user: { id: string; name: string; role: string }; studentId: number }[] = [];
    for (const s of studentIds) {
      for (const ta of s.tutorAssignments) {
        tutors.push({ user: ta.tutor, studentId: s.id });
      }
    }
    const admins = await prisma.user.findMany({
      where: { role: { in: ["orgadmin", "superadmin"] }, orgId: caller.orgId, deletedAt: null, suspendedAt: null },
      select: { id: true, name: true, role: true },
    });
    return [
      ...tutors.map((t) => ({ ...t.user, studentId: t.studentId })),
      ...admins.map((a) => ({ ...a, studentId: undefined })),
    ];
  }

  if (callerRole === "tutor") {
    // can message: parents of assigned students, admins, student accounts
    const assignments = await prisma.tutorAssignment.findMany({
      where: { tutorId: callerId },
      include: {
        student: {
          include: {
            parent: { select: { id: true, name: true, role: true } },
            account: { select: { id: true, name: true, role: true } },
          },
        },
      },
    });
    const results: { id: string; name: string; role: string; studentId?: number }[] = [];
    const seen = new Set<string>();
    for (const a of assignments) {
      if (a.student.parent && !seen.has(a.student.parent.id)) {
        seen.add(a.student.parent.id);
        results.push({ ...a.student.parent, studentId: a.student.id });
      }
      if (a.student.account && !seen.has(a.student.account.id)) {
        seen.add(a.student.account.id);
        results.push({ ...a.student.account, studentId: a.student.id });
      }
    }
    const admins = await prisma.user.findMany({
      where: { role: { in: ["orgadmin", "superadmin"] }, orgId: caller.orgId, deletedAt: null, suspendedAt: null },
      select: { id: true, name: true, role: true },
    });
    for (const a of admins) {
      if (!seen.has(a.id)) results.push({ ...a, studentId: undefined });
    }
    return results;
  }

  if (callerRole === "student") {
    // can message only their tutor(s)
    const student = await prisma.student.findFirst({
      where: { account: { id: callerId } },
      include: { tutorAssignments: { include: { tutor: { select: { id: true, name: true, role: true } } } } },
    });
    if (!student) return [];
    return student.tutorAssignments.map((ta) => ({ ...ta.tutor, studentId: student.id }));
  }

  if (callerRole === "orgadmin" || callerRole === "superadmin") {
    // can message anyone in same org (or all for superadmin)
    const where = callerRole === "superadmin"
      ? { id: { not: callerId }, deletedAt: null as null, suspendedAt: null as null }
      : { orgId: caller.orgId, id: { not: callerId }, deletedAt: null as null, suspendedAt: null as null };
    return prisma.user.findMany({
      where,
      select: { id: true, name: true, role: true },
      take: 100,
    }).then((users) => users.map((u) => ({ ...u, studentId: undefined })));
  }

  return [];
}
