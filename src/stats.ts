import type { Division, Record3, Team, Week } from "./types";

const emptyRecord = (): Record3 => ({ wins: 0, losses: 0, ties: 0 });

function tally(rec: Record3, mine: number, theirs: number) {
  if (mine > theirs) rec.wins++;
  else if (mine < theirs) rec.losses++;
  else rec.ties++;
}

/**
 * Rank of every team in a week by points scored (1 = highest).
 * Tied scores share the better rank ("1, 2, 2, 4").
 */
export function weeklyRanks(week: Week): Record<number, number> {
  const entries = Object.entries(week.scores).map(([id, pts]) => [Number(id), pts] as const);
  const ranks: Record<number, number> = {};
  for (const [id, pts] of entries) {
    ranks[id] = 1 + entries.filter(([, other]) => other > pts).length;
  }
  return ranks;
}

/** Salt Shakeup: x's record if x played y every single week. */
export function shakeup(teams: Team[], weeks: Week[]): Record<number, Record<number, Record3>> {
  const out: Record<number, Record<number, Record3>> = {};
  for (const x of teams) {
    out[x.rosterId] = {};
    for (const y of teams) {
      if (x.rosterId === y.rosterId) continue;
      const rec = emptyRecord();
      for (const w of weeks) {
        const a = w.scores[x.rosterId];
        const b = w.scores[y.rosterId];
        if (a === undefined || b === undefined) continue;
        tally(rec, a, b);
      }
      out[x.rosterId][y.rosterId] = rec;
    }
  }
  return out;
}

/**
 * Schedule swap: x's record if x had played y's schedule.
 * Weeks where y faced x become x vs y.
 */
export function scheduleSwap(teams: Team[], weeks: Week[]): Record<number, Record<number, Record3>> {
  const out: Record<number, Record<number, Record3>> = {};
  for (const x of teams) {
    out[x.rosterId] = {};
    for (const y of teams) {
      const rec = emptyRecord();
      for (const w of weeks) {
        const opp = w.opponents[y.rosterId];
        if (opp === undefined) continue;
        const oppId = opp === x.rosterId ? y.rosterId : opp;
        const a = w.scores[x.rosterId];
        const b = w.scores[oppId];
        if (a === undefined || b === undefined) continue;
        tally(rec, a, b);
      }
      out[x.rosterId][y.rosterId] = rec;
    }
  }
  return out;
}

/** Actual head-to-head record from the real schedule. */
export function actualRecord(rosterId: number, weeks: Week[]): Record3 {
  const rec = emptyRecord();
  for (const w of weeks) {
    const opp = w.opponents[rosterId];
    if (opp === undefined) continue;
    tally(rec, w.scores[rosterId], w.scores[opp]);
  }
  return rec;
}

/** All-play: record if you played every other team every week. */
export function allPlayRecord(rosterId: number, weeks: Week[]): Record3 {
  const rec = emptyRecord();
  for (const w of weeks) {
    const mine = w.scores[rosterId];
    if (mine === undefined) continue;
    for (const [id, pts] of Object.entries(w.scores)) {
      if (Number(id) !== rosterId) tally(rec, mine, pts);
    }
  }
  return rec;
}

/**
 * counts[rosterId][rank-1] = number of weeks the team (or, with
 * `ofOpponent`, the team's actual opponent) finished with that weekly rank.
 */
export function rankFrequency(
  teams: Team[],
  weeks: Week[],
  ofOpponent = false,
): Record<number, number[]> {
  const out: Record<number, number[]> = {};
  for (const t of teams) out[t.rosterId] = new Array(teams.length).fill(0);
  for (const w of weeks) {
    const ranks = weeklyRanks(w);
    for (const t of teams) {
      const subject = ofOpponent ? w.opponents[t.rosterId] : t.rosterId;
      const rank = subject === undefined ? undefined : ranks[subject];
      if (rank !== undefined) out[t.rosterId][rank - 1]++;
    }
  }
  return out;
}

export interface SummaryRow {
  rosterId: number;
  avgRank: number;
  avgOppRank: number;
  top3: number;
  bottom3: number;
  oppBottom3: number;
  oppTop3: number;
  winsVsBottom3: number;
  lossesToTop3: number;
}

export function summary(teams: Team[], weeks: Week[]): SummaryRow[] {
  const n = teams.length;
  const isTop3 = (r: number) => r <= 3;
  const isBottom3 = (r: number) => r > n - 3;
  return teams.map((t) => {
    const id = t.rosterId;
    let rankSum = 0, rankWeeks = 0, oppRankSum = 0, oppWeeks = 0;
    const row: SummaryRow = {
      rosterId: id, avgRank: 0, avgOppRank: 0, top3: 0, bottom3: 0,
      oppBottom3: 0, oppTop3: 0, winsVsBottom3: 0, lossesToTop3: 0,
    };
    for (const w of weeks) {
      const ranks = weeklyRanks(w);
      const r = ranks[id];
      if (r === undefined) continue;
      rankSum += r;
      rankWeeks++;
      if (isTop3(r)) row.top3++;
      if (isBottom3(r)) row.bottom3++;
      const opp = w.opponents[id];
      if (opp === undefined) continue;
      const or = ranks[opp];
      oppRankSum += or;
      oppWeeks++;
      const won = w.scores[id] > w.scores[opp];
      const lost = w.scores[id] < w.scores[opp];
      if (isBottom3(or)) {
        row.oppBottom3++;
        if (won) row.winsVsBottom3++;
      }
      if (isTop3(or)) {
        row.oppTop3++;
        if (lost) row.lossesToTop3++;
      }
    }
    row.avgRank = rankWeeks ? rankSum / rankWeeks : 0;
    row.avgOppRank = oppWeeks ? oppRankSum / oppWeeks : 0;
    return row;
  });
}

export const formatRecord = (r: Record3) =>
  r.ties ? `${r.wins}-${r.losses}-${r.ties}` : `${r.wins}-${r.losses}`;

/** Win percentage with ties counted as half a win. */
export const winPct = (r: Record3) => {
  const games = r.wins + r.losses + r.ties;
  return games ? (r.wins + r.ties / 2) / games : 0;
};

export interface DivisionStrength {
  division: Division;
  teams: Team[];
  avgPoints: number;
  /** Every team vs every other team in the league, every week. */
  allPlay: Record3;
  /** Every team vs every team in other divisions, every week. */
  vsOtherDivisions: Record3;
  /** Real games played against other divisions. */
  crossDivisionGames: Record3;
  /** Team-weeks finishing in the league's weekly top 3. */
  top3: number;
}

/** Divisions ranked strongest first, by win % against the other divisions. */
export function divisionStrength(teams: Team[], weeks: Week[], divisions: Division[]): DivisionStrength[] {
  const divisionOf = new Map(teams.map((t) => [t.rosterId, t.division]));
  return divisions
    .map((division) => {
      const members = teams.filter((t) => t.division === division.id);
      const row: DivisionStrength = {
        division, teams: members, avgPoints: 0, allPlay: emptyRecord(),
        vsOtherDivisions: emptyRecord(), crossDivisionGames: emptyRecord(), top3: 0,
      };
      let pointSum = 0, teamWeeks = 0;
      for (const w of weeks) {
        const ranks = weeklyRanks(w);
        for (const t of members) {
          const mine = w.scores[t.rosterId];
          if (mine === undefined) continue;
          pointSum += mine;
          teamWeeks++;
          if (ranks[t.rosterId] <= 3) row.top3++;
          for (const [id, pts] of Object.entries(w.scores)) {
            const other = Number(id);
            if (other === t.rosterId) continue;
            tally(row.allPlay, mine, pts);
            if (divisionOf.get(other) !== division.id) tally(row.vsOtherDivisions, mine, pts);
          }
          const opp = w.opponents[t.rosterId];
          if (opp !== undefined && divisionOf.get(opp) !== division.id) {
            tally(row.crossDivisionGames, mine, w.scores[opp]);
          }
        }
      }
      row.avgPoints = teamWeeks ? pointSum / teamWeeks : 0;
      return row;
    })
    .sort((a, b) => winPct(b.vsOtherDivisions) - winPct(a.vsOtherDivisions));
}

export const sumRecords = (records: Record3[]): Record3 =>
  records.reduce(
    (acc, r) => ({ wins: acc.wins + r.wins, losses: acc.losses + r.losses, ties: acc.ties + r.ties }),
    emptyRecord(),
  );
