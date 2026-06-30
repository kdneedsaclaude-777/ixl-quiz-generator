"use client";

import { useEffect, useState } from "react";

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

// Lets a parent turn phone push notifications on/off for this device. Registers
// the service worker, subscribes via the VAPID public key, and saves the
// subscription server-side.
export default function PushToggle() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      Boolean(VAPID);
    setSupported(ok);
    if (!ok) return;
    navigator.serviceWorker.getRegistration().then(async (reg) => {
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      setEnabled(Boolean(sub));
    });
  }, []);

  async function enable() {
    setBusy(true);
    setMsg(null);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setMsg("Notifications are blocked in your browser/device settings.");
        setBusy(false);
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      if (!res.ok) throw new Error();
      setEnabled(true);
      setMsg("Push notifications are on for this device. 🔔");
    } catch {
      setMsg("Couldn't enable push notifications.");
    }
    setBusy(false);
  }

  async function disable() {
    setBusy(true);
    setMsg(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setEnabled(false);
      setMsg("Push notifications are off for this device.");
    } catch {
      setMsg("Couldn't turn off push.");
    }
    setBusy(false);
  }

  return (
    <section className="cm-card p-6 dark:border-slate-700 dark:bg-slate-800">
      <h2 className="text-[15px] font-bold text-slate-900 dark:text-slate-100">Push notifications</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Get streak reminders and updates as notifications on this device — even when the app is closed.
      </p>
      {supported ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={enabled ? disable : enable}
            disabled={busy}
            className={`cm-btn ${enabled ? "ghost" : "primary"} disabled:opacity-50`}
          >
            {busy ? "…" : enabled ? "Turn off on this device" : "Enable push notifications"}
          </button>
          {msg && <span className="text-xs text-slate-500 dark:text-slate-400">{msg}</span>}
        </div>
      ) : (
        <p className="mt-3 text-xs text-slate-400">
          Not available on this browser. Install the QuizSpark app (or use Chrome) to turn on push.
        </p>
      )}
    </section>
  );
}
