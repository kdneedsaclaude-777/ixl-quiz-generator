import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { seedVideoResources } from "./seedVideos";
import {
  seedAdmin,
  seedDemoOrg,
  seedBadges,
  seedFeatureFlags,
  SEED_CREDENTIALS,
} from "./seedAuth";

const prisma = new PrismaClient();
const GRADES = [1, 2, 3, 4, 5, 6, 7, 8] as const;

type ParsedGroup = { letter: string; name: string; skills: { number: number; name: string }[] };

function parseGradeMarkdown(md: string): ParsedGroup[] {
  const groups: ParsedGroup[] = [];
  let current: ParsedGroup | null = null;
  for (const rawLine of md.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    const groupMatch = /^## ([A-Z]+)\. (.+)$/.exec(line);
    if (groupMatch) {
      if (current) groups.push(current);
      current = { letter: groupMatch[1], name: groupMatch[2].trim(), skills: [] };
      continue;
    }
    const skillMatch = /^(\d+)\. (.+)$/.exec(line);
    if (skillMatch && current) {
      current.skills.push({ number: parseInt(skillMatch[1], 10), name: skillMatch[2].trim() });
    }
  }
  if (current) groups.push(current);
  return groups;
}

async function seedGrade(grade: number): Promise<{ groups: number; skills: number }> {
  const path = join(process.cwd(), "references", `grade${grade}.md`);
  const md = readFileSync(path, "utf8");
  const parsed = parseGradeMarkdown(md);

  let skillCount = 0;
  for (const group of parsed) {
    const tg = await prisma.topicGroup.upsert({
      where: { gradeLevel_letter: { gradeLevel: grade, letter: group.letter } },
      update: { name: group.name },
      create: { gradeLevel: grade, letter: group.letter, name: group.name },
    });
    for (const skill of group.skills) {
      await prisma.skill.upsert({
        where: { topicGroupId_number: { topicGroupId: tg.id, number: skill.number } },
        update: { name: skill.name, code: `${group.letter}.${skill.number}` },
        create: {
          topicGroupId: tg.id,
          code: `${group.letter}.${skill.number}`,
          number: skill.number,
          name: skill.name,
        },
      });
      skillCount += 1;
    }
  }
  return { groups: parsed.length, skills: skillCount };
}

async function main(): Promise<void> {
  for (const grade of GRADES) {
    const { groups, skills } = await seedGrade(grade);
    console.log(`Grade ${grade}: ${groups} topic groups, ${skills} skills`);
  }
  const videoCount = await seedVideoResources(prisma);
  console.log(`Videos: ${videoCount} resources`);

  const badgeCount = await seedBadges(prisma);
  console.log(`Badges: ${badgeCount}`);
  const flagCount = await seedFeatureFlags(prisma);
  console.log(`Feature flags: ${flagCount}`);
  await seedAdmin(prisma);
  console.log(`Superadmin: ${SEED_CREDENTIALS.superadmin.email} / ${SEED_CREDENTIALS.superadmin.password}`);
  const demo = await seedDemoOrg(prisma);
  console.log(`Demo org seeded (${demo.studentIds.length} students with own logins):`);
  console.log(`  org-admin: ${SEED_CREDENTIALS.orgadmin.email} / ${SEED_CREDENTIALS.orgadmin.password}`);
  console.log(`  parent:    ${SEED_CREDENTIALS.parent.email} / ${SEED_CREDENTIALS.parent.password}`);
  console.log(`  tutor:     ${SEED_CREDENTIALS.tutor.email} / ${SEED_CREDENTIALS.tutor.password}`);
  console.log(`  student A: ${SEED_CREDENTIALS.studentA.email} / ${SEED_CREDENTIALS.studentA.password}`);
  console.log(`  student B: ${SEED_CREDENTIALS.studentB.email} / ${SEED_CREDENTIALS.studentB.password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
