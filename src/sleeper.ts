import type { LeagueData, Team, Week } from "./types";

const API = "https://api.sleeper.app/v1";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`Sleeper request failed (${res.status}) for ${path}`);
  const body = await res.json();
  // Sleeper answers unknown IDs/usernames with 200 + null.
  if (body === null) throw new Error("Not found on Sleeper");
  return body as T;
}

interface SleeperState {
  week: number;
  season: string;
  season_type: "pre" | "regular" | "post" | "off";
  league_season: string;
}

interface SleeperLeague {
  league_id: string;
  name: string;
  season: string;
  status: string;
  previous_league_id: string | null;
  settings: { playoff_week_start?: number };
}

interface SleeperUser {
  user_id: string;
  display_name: string;
  avatar: string | null;
  metadata?: { team_name?: string };
}

interface SleeperRoster {
  roster_id: number;
  owner_id: string | null;
}

interface SleeperMatchup {
  roster_id: number;
  matchup_id: number | null;
  points: number;
}

export interface LeagueSummary {
  leagueId: string;
  name: string;
  season: string;
}

export const avatarUrl = (avatar: string | null) =>
  avatar ? `https://sleepercdn.com/avatars/thumbs/${avatar}` : null;

export async function leaguesForUser(username: string): Promise<LeagueSummary[]> {
  const [user, state] = await Promise.all([
    get<{ user_id: string }>(`/user/${encodeURIComponent(username)}`),
    get<SleeperState>("/state/nfl"),
  ]);
  const leagues = await get<SleeperLeague[]>(`/user/${user.user_id}/leagues/nfl/${state.league_season}`);
  return leagues.map((l) => ({ leagueId: l.league_id, name: l.name, season: l.season }));
}

/** Last regular-season week whose games are finished. */
function lastCompletedWeek(league: SleeperLeague, state: SleeperState): number {
  const playoffStart = league.settings.playoff_week_start ?? 0;
  const regularEnd = playoffStart > 1 ? playoffStart - 1 : 18;
  if (league.season !== state.league_season) return regularEnd;
  if (state.season_type === "pre") return 0;
  if (state.season_type === "regular") return Math.min(regularEnd, state.week - 1);
  return regularEnd;
}

function toWeek(week: number, matchups: SleeperMatchup[]): Week | null {
  const scores: Record<number, number> = {};
  const opponents: Record<number, number> = {};
  const byMatchup = new Map<number, number[]>();
  for (const m of matchups) {
    scores[m.roster_id] = m.points ?? 0;
    if (m.matchup_id == null) continue;
    byMatchup.set(m.matchup_id, [...(byMatchup.get(m.matchup_id) ?? []), m.roster_id]);
  }
  for (const pair of byMatchup.values()) {
    if (pair.length !== 2) continue;
    opponents[pair[0]] = pair[1];
    opponents[pair[1]] = pair[0];
  }
  // A week nobody has scored in hasn't been played yet.
  if (!Object.values(scores).some((p) => p > 0)) return null;
  return { week, scores, opponents };
}

async function seasonHistory(league: SleeperLeague) {
  const history = [{ leagueId: league.league_id, season: league.season }];
  let prev = league.previous_league_id;
  while (prev && prev !== "0" && history.length < 10) {
    try {
      const l = await get<SleeperLeague>(`/league/${prev}`);
      history.push({ leagueId: l.league_id, season: l.season });
      prev = l.previous_league_id;
    } catch {
      break;
    }
  }
  return history;
}

export async function loadLeague(leagueId: string): Promise<LeagueData> {
  const [league, users, rosters, state] = await Promise.all([
    get<SleeperLeague>(`/league/${leagueId}`),
    get<SleeperUser[]>(`/league/${leagueId}/users`),
    get<SleeperRoster[]>(`/league/${leagueId}/rosters`),
    get<SleeperState>("/state/nfl"),
  ]);

  const usersById = new Map(users.map((u) => [u.user_id, u]));
  const teams: Team[] = rosters.map((r) => {
    const u = r.owner_id ? usersById.get(r.owner_id) : undefined;
    return {
      rosterId: r.roster_id,
      name: u?.metadata?.team_name || u?.display_name || `Team ${r.roster_id}`,
      owner: u?.display_name ?? "Unclaimed",
      avatar: avatarUrl(u?.avatar ?? null),
    };
  });

  const last = lastCompletedWeek(league, state);
  const weekNums = Array.from({ length: last }, (_, i) => i + 1);
  const [weeks, history] = await Promise.all([
    Promise.all(
      weekNums.map(async (w) => toWeek(w, await get<SleeperMatchup[]>(`/league/${leagueId}/matchups/${w}`))),
    ),
    seasonHistory(league),
  ]);

  return {
    leagueId,
    name: league.name,
    season: league.season,
    teams,
    weeks: weeks.filter((w): w is Week => w !== null),
    history,
  };
}
