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
const src = readFileSync(path, "utf8");
const next = src.replace(
  /provider = "(?:sqlite|postgresql)"/,
  `provider = "${target}"`,
);

if (!/provider = "(?:sqlite|postgresql)"/.test(src)) {
  console.error("Could not find a datasource provider line to switch.");
  process.exit(1);
}
if (src === next) {
  console.log(`Prisma provider already "${target}".`);
} else {
  writeFileSync(path, next);
  console.log(`Prisma provider set to "${target}".`);
}
