import { describe, expect, it } from "vitest";
import {
  allPlayRecord, actualRecord, divisionStrength, rankFrequency, scheduleSwap, shakeup, summary,
  matchupsVersus, sumRecords, weeklyRanks, winPct,
} from "./stats";
import { demoLeague } from "./demo";
import type { Team, Week } from "./types";

const teams: Team[] = [1, 2, 3, 4].map((id) => ({ rosterId: id, name: `T${id}`, owner: "", avatar: null }));

// Week 1: 1v2, 3v4. Week 2: 1v3, 2v4.
const weeks: Week[] = [
  { week: 1, scores: { 1: 100, 2: 90, 3: 120, 4: 80 }, bench: { 1: 20, 2: 30, 3: 10, 4: 40 }, opponents: { 1: 2, 2: 1, 3: 4, 4: 3 } },
  { week: 2, scores: { 1: 70, 2: 110, 3: 95, 4: 95 }, bench: { 1: 25, 2: 15, 3: 35, 4: 5 }, opponents: { 1: 3, 3: 1, 2: 4, 4: 2 } },
];

describe("weeklyRanks", () => {
  it("ranks by points with ties sharing the better rank", () => {
    expect(weeklyRanks(weeks[0])).toEqual({ 3: 1, 1: 2, 2: 3, 4: 4 });
    expect(weeklyRanks(weeks[1])).toEqual({ 2: 1, 3: 2, 4: 2, 1: 4 });
  });
});

describe("matchupsVersus", () => {
  it("lists x vs y each week with scores, bench and result", () => {
    expect(matchupsVersus(1, 4, weeks)).toEqual([
      { week: 1, x: { score: 100, bench: 20 }, y: { score: 80, bench: 40 }, result: "win" },
      { week: 2, x: { score: 70, bench: 25 }, y: { score: 95, bench: 5 }, result: "loss" },
    ]);
  });

  it("skips weeks either team has no score and reports ties", () => {
    const extra: Week[] = [
      ...weeks,
      { week: 3, scores: { 1: 50 }, bench: { 1: 1 }, opponents: {} },
      { week: 4, scores: { 3: 60, 4: 60 }, bench: {}, opponents: {} },
    ];
    expect(matchupsVersus(3, 4, extra).map((r) => [r.week, r.result])).toEqual([[1, "win"], [2, "tie"], [4, "tie"]]);
    expect(matchupsVersus(1, 4, extra)).toHaveLength(2);
  });
});

describe("shakeup", () => {
  it("compares x and y every week and mirrors", () => {
    const s = shakeup(teams, weeks);
    expect(s[1][2]).toEqual({ wins: 1, losses: 1, ties: 0 });
    expect(s[3][4]).toEqual({ wins: 1, losses: 0, ties: 1 });
    expect(s[4][3]).toEqual({ wins: 0, losses: 1, ties: 1 });
  });

  it("is symmetric across the demo league", () => {
    const { teams: t, weeks: w } = demoLeague();
    const s = shakeup(t, w);
    for (const x of t) for (const y of t) {
      if (x === y) continue;
      expect(s[x.rosterId][y.rosterId].wins).toBe(s[y.rosterId][x.rosterId].losses);
    }
  });
});

describe("scheduleSwap", () => {
  it("uses y's opponents, swapping in y when y played x", () => {
    // Team 1 with team 2's schedule: wk1 2 played 1 -> 1 vs 2 (100>90 W); wk2 2 played 4 -> 1 vs 4 (70<95 L).
    expect(scheduleSwap(teams, weeks)[1][2]).toEqual({ wins: 1, losses: 1, ties: 0 });
  });

  it("with your own schedule equals your actual record", () => {
    const { teams: t, weeks: w } = demoLeague();
    const s = scheduleSwap(t, w);
    for (const x of t) expect(s[x.rosterId][x.rosterId]).toEqual(actualRecord(x.rosterId, w));
  });
});

describe("records", () => {
  it("computes actual and all-play records", () => {
    expect(actualRecord(1, weeks)).toEqual({ wins: 1, losses: 1, ties: 0 });
    expect(allPlayRecord(4, weeks)).toEqual({ wins: 1, losses: 4, ties: 1 });
  });
});

describe("rankFrequency", () => {
  it("counts own and opponent weekly ranks", () => {
    expect(rankFrequency(teams, weeks)[1]).toEqual([0, 1, 0, 1]);
    expect(rankFrequency(teams, weeks, true)[1]).toEqual([0, 1, 1, 0]);
  });

  it("each column sums to the number of weeks (no ties in demo)", () => {
    const { teams: t, weeks: w } = demoLeague();
    const f = rankFrequency(t, w);
    for (let r = 0; r < t.length; r++) {
      expect(t.reduce((sum, x) => sum + f[x.rosterId][r], 0)).toBe(w.length);
    }
  });
});

describe("summary", () => {
  it("tracks top/bottom 3 and results against them", () => {
    const row = summary(teams, weeks).find((r) => r.rosterId === 1)!;
    expect(row.avgRank).toBe(3);
    expect(row.avgOppRank).toBe(2.5);
    expect(row.top3).toBe(1);
    // With 4 teams, "top 3" is ranks 1-3 and "bottom 3" is ranks 2-4.
    expect(row.bottom3).toBe(2);
    expect(row.oppTop3).toBe(2);
    expect(row.lossesToTop3).toBe(1);
    expect(row.winsVsBottom3).toBe(1);
  });
});

describe("divisionStrength", () => {
  const divTeams = teams.map((t) => ({ ...t, division: t.rosterId <= 2 ? 1 : 2 }));
  const divisions = [{ id: 1, name: "A" }, { id: 2, name: "B" }];

  it("compares each division against the others", () => {
    const [first, second] = divisionStrength(divTeams, weeks, divisions);
    // Division A (1,2) vs B (3,4): wk1 100,90 vs 120,80 -> 2-2; wk2 70,110 vs 95,95 -> 2-2.
    expect(first.vsOtherDivisions).toEqual({ wins: 4, losses: 4, ties: 0 });
    // Only week 2 had cross-division games (1v3, 2v4).
    const a = [first, second].find((d) => d.division.id === 1)!;
    expect(a.crossDivisionGames).toEqual({ wins: 1, losses: 1, ties: 0 });
    expect(a.avgPoints).toBe(92.5);
  });

  it("cross-division all-play records mirror each other", () => {
    const { teams: t, weeks: w, divisions: d } = demoLeague();
    const [x, y] = divisionStrength(t, w, d);
    expect(x.vsOtherDivisions.wins).toBe(y.vsOtherDivisions.losses);
    expect(x.crossDivisionGames.wins).toBe(y.crossDivisionGames.losses);
    expect(winPct(x.vsOtherDivisions)).toBeGreaterThanOrEqual(winPct(y.vsOtherDivisions));
  });
});

describe("sumRecords", () => {
  it("adds records", () => {
    expect(sumRecords([{ wins: 1, losses: 2, ties: 0 }, { wins: 3, losses: 0, ties: 1 }]))
      .toEqual({ wins: 4, losses: 2, ties: 1 });
  });
});
