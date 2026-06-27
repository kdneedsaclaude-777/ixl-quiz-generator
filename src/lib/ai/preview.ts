import { buildBuckets, type SkillRecord } from "@/lib/ai/mock";

// One row per skill the generator would actually draw from, with the same
// count it would assign. Reuses buildBuckets so the live preview can never
// drift from real generation — if the distribution engine changes, this
// changes with it.
export type PreviewRow = {
  code: string;
  name: string;
  weak: boolean;
  adjacent: boolean;
  count: number;
};

export type PreviewWeighting = { weak: number; adjacent: number; other: number };

export type PreviewResult = {
  rows: PreviewRow[];
  weighting: PreviewWeighting;
};

// The 60/25/15 weak/adjacent/other split mirrors the constants inside
// buildBuckets. It's surfaced here only as a label for the UI; the real
// counts come straight from the buckets below.
const WEIGHTING: PreviewWeighting = { weak: 60, adjacent: 25, other: 15 };

export function previewDistribution(args: {
  skillsByGroup: Map<string, SkillRecord[]>;
  weakSkillIds: Set<number>;
  totalQuestions: number;
}): PreviewResult {
  const { skillsByGroup, weakSkillIds } = args;
  const buckets = buildBuckets(args);

  // Re-derive adjacency the same way buildBuckets does: a skill is "adjacent"
  // when it's the ±1 neighbour (by skill number, same topic group) of a weak
  // skill and isn't itself weak. buildBuckets reports weak via weakTargeted;
  // anything not weak and adjacent to a weak skill gets the "adj" tag.
  const adjacentIds = new Set<number>();
  const weakSkills = [...skillsByGroup.values()].flat().filter((s) => weakSkillIds.has(s.id));
  for (const ws of weakSkills) {
    const sameGroup = skillsByGroup.get(ws.topicGroup.letter) ?? [];
    for (const s of sameGroup) {
      if (Math.abs(s.number - ws.number) === 1) adjacentIds.add(s.id);
    }
  }
  for (const id of weakSkillIds) adjacentIds.delete(id);

  const rows: PreviewRow[] = buckets.map((b) => ({
    code: b.skill.code,
    name: b.skill.name,
    weak: b.weakTargeted,
    adjacent: !b.weakTargeted && adjacentIds.has(b.skill.id),
    count: b.count,
  }));

  return { rows, weighting: WEIGHTING };
}
