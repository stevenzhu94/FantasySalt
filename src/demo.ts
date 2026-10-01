import type { LeagueData, Team, Week } from "./types";

export const DEMO_LEAGUE_ID = "demo";

const NAMES = ["Alex", "Chris", "Manny", "Dylan", "Kevin", "Mondo", "Steven", "Tanner", "Van", "Yannick"];

/** Small deterministic PRNG so the demo league looks the same every load. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Circle-method round robin, repeated to fill the season. */
function pairings(n: number, week: number): [number, number][] {
  const ids = Array.from({ length: n }, (_, i) => i);
  const round = (week - 1) % (n - 1);
  const rotated = [ids[0], ...ids.slice(1).slice(round), ...ids.slice(1).slice(0, round)];
  return Array.from({ length: n / 2 }, (_, i) => [rotated[i], rotated[n - 1 - i]]);
}

export function demoLeague(): LeagueData {
  const rand = mulberry32(2024);
  const teams: Team[] = NAMES.map((name, i) => ({
    rosterId: i + 1, name, owner: name, avatar: null, division: i % 2 ? 2 : 1,
  }));
  const skill = teams.map(() => 105 + rand() * 25);
  const weeks: Week[] = [];
  for (let w = 1; w <= 14; w++) {
    const scores: Record<number, number> = {};
    const opponents: Record<number, number> = {};
    teams.forEach((t, i) => {
      scores[t.rosterId] = Math.round((skill[i] + (rand() - 0.5) * 60) * 100) / 100;
    });
    for (const [a, b] of pairings(teams.length, w)) {
      opponents[a + 1] = b + 1;
      opponents[b + 1] = a + 1;
    }
    weeks.push({ week: w, scores, opponents });
  }
  return {
    leagueId: DEMO_LEAGUE_ID,
    name: "Salt Mine (demo)",
    season: "2025",
    teams,
    divisions: [{ id: 1, name: "Salt Flats" }, { id: 2, name: "Brine Pit" }],
    weeks,
    history: [{ leagueId: DEMO_LEAGUE_ID, season: "2025" }],
  };
}
