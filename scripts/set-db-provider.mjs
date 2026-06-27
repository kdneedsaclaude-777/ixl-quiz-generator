#!/usr/bin/env node
// Switches the Prisma datasource provider in-place. One schema, no second
// file to drift out of sync. SQLite is the local/demo default; production
// runs `db:use-postgres` before `prisma migrate deploy`.
//
//   node scripts/set-db-provider.mjs sqlite|postgresql
import { readFileSync, writeFileSync } from "node:fs";

const target = process.argv[2];
if (target !== "sqlite" && target !== "postgresql") {
  console.error("usage: set-db-provider.mjs <sqlite|postgresql>");
  process.exit(1);
}

const path = new URL("../prisma/schema.prisma", import.meta.url);
let src = readFileSync(path, "utf8");

if (!/provider = "(?:sqlite|postgresql)"/.test(src)) {
  console.error("Could not find a datasource provider line to switch.");
  process.exit(1);
}

// 1) Switch the provider.
src = src.replace(/provider = "(?:sqlite|postgresql)"/, `provider = "${target}"`);

// 2) Manage directUrl. Postgres on Supabase's pooler needs a separate DIRECT_URL
//    (port 5432, session mode) for migrations, while the app runs on the pooled
//    DATABASE_URL (6543). SQLite must NOT declare directUrl. Keep one schema that
//    serves both by adding/removing the line automatically.
const hasDirect = /\n[ \t]*directUrl\s*=\s*env\("DIRECT_URL"\)/.test(src);
if (target === "postgresql" && !hasDirect) {
  src = src.replace(
    /(url\s*=\s*env\("DATABASE_URL"\))/,
    `$1\n  directUrl = env("DIRECT_URL")`,
  );
} else if (target === "sqlite" && hasDirect) {
  src = src.replace(/\n[ \t]*directUrl\s*=\s*env\("DIRECT_URL"\)/, "");
}

writeFileSync(path, src);
console.log(
  `Prisma provider set to "${target}"${target === "postgresql" ? " (with directUrl)" : ""}.`,
);
