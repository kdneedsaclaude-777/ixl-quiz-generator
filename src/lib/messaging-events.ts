// In-memory pub/sub for SSE messaging. Pinned to globalThis so Next.js HMR
// doesn't drop subscribers between hot reloads. Single-instance correct;
// for horizontal scale swap for Redis pub/sub behind the same surface.

type MessagePayload = {
  type: "new_message" | "read" | "unread_count";
  conversationId?: string;
  message?: Record<string, unknown>;
  count?: number;
};

type Subscriber = (payload: MessagePayload) => void;

declare global {
  // eslint-disable-next-line no-var
  var __messagingEvents: {
    conversationSubs: Map<string, Set<Subscriber>>;
    userSubs: Map<string, Set<Subscriber>>;
  } | undefined;
}

if (!globalThis.__messagingEvents) {
  globalThis.__messagingEvents = {
    conversationSubs: new Map(),
    userSubs: new Map(),
  };
}

const store = globalThis.__messagingEvents;

export function subscribeToConversation(
  conversationId: string,
  fn: Subscriber,
): () => void {
  if (!store.conversationSubs.has(conversationId)) {
    store.conversationSubs.set(conversationId, new Set());
  }
  store.conversationSubs.get(conversationId)!.add(fn);
  return () => {
    store.conversationSubs.get(conversationId)?.delete(fn);
  };
}

export function subscribeToUser(userId: string, fn: Subscriber): () => void {
  if (!store.userSubs.has(userId)) {
    store.userSubs.set(userId, new Set());
  }
  store.userSubs.get(userId)!.add(fn);
  return () => {
    store.userSubs.get(userId)?.delete(fn);
  };
}

export function publishToConversation(
  conversationId: string,
  payload: MessagePayload,
) {
  store.conversationSubs.get(conversationId)?.forEach((fn) => fn(payload));
}

export function publishToUser(userId: string, payload: MessagePayload) {
  store.userSubs.get(userId)?.forEach((fn) => fn(payload));
}
