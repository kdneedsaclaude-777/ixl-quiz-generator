// Simple dependency-free load test. Fires N concurrent workers at a target URL
// for a fixed duration and reports throughput + latency percentiles + errors.
//
// Usage:
//   node scripts/loadtest.mjs <baseUrl> <path> <concurrency> <seconds>
// Example (gentle live check):
//   node scripts/loadtest.mjs https://quizspark-cm.vercel.app /api/health 25 8
//
// Read-only endpoints only — never point this at a mutating route.

const [, , baseUrl = "http://localhost:3000", path = "/api/health", concStr = "20", secsStr = "8"] = process.argv;
const concurrency = parseInt(concStr, 10);
const seconds = parseInt(secsStr, 10);
const url = baseUrl.replace(/\/$/, "") + path;

function pct(sorted, p) {
  if (sorted.length === 0) return 0;
  const i = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[i];
}

async function run() {
  const latencies = [];
  let ok = 0;
  let errors = 0;
  const started = Date.now();
  const deadline = started + seconds * 1000;

  async function worker() {
    while (Date.now() < deadline) {
      const t0 = Date.now();
      try {
        const res = await fetch(url, {
          cache: "no-store",
          headers: process.env.LOADTEST_COOKIE ? { cookie: process.env.LOADTEST_COOKIE } : {},
          redirect: "manual",
        });
        // Drain the body so the connection completes.
        await res.text();
        const dt = Date.now() - t0;
        latencies.push(dt);
        if (res.ok) ok += 1;
        else errors += 1;
      } catch {
        errors += 1;
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  const wall = (Date.now() - started) / 1000;
  const total = ok + errors;
  latencies.sort((a, b) => a - b);
  const avg = latencies.length ? Math.round(latencies.reduce((s, x) => s + x, 0) / latencies.length) : 0;

  console.log(
    `conc=${String(concurrency).padStart(4)} | ` +
      `req=${String(total).padStart(6)} | ` +
      `${(total / wall).toFixed(0).padStart(5)} req/s | ` +
      `errors=${errors} (${((errors / Math.max(1, total)) * 100).toFixed(1)}%) | ` +
      `avg=${avg}ms p50=${pct(latencies, 50)}ms p95=${pct(latencies, 95)}ms p99=${pct(latencies, 99)}ms`,
  );
}

console.log(`→ ${url}  (concurrency ${concurrency}, ${seconds}s)`);
run();
