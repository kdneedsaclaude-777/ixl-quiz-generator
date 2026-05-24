import { prisma } from "@/lib/db";

// One row per admin mutation. Immutable by convention (no PATCH/DELETE
// endpoints reach AuditLog). metadata is JSON-stringified for SQLite.
export async function auditLog(args: {
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: args.actorId,
      action: args.action,
      targetType: args.targetType,
      targetId: args.targetId,
      metadata: args.metadata ? JSON.stringify(args.metadata) : null,
    },
  });
}
