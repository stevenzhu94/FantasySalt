export interface Team {
  rosterId: number;
  name: string;
  owner: string;
  avatar: string | null;
  /** Division id (1-based), when the league uses divisions. */
  division?: number;
}

export interface Division {
  id: number;
  name: string;
}

/** One completed week: each team's score and who they actually played. */
export interface Week {
  week: number;
  scores: Record<number, number>;
  /** rosterId -> opponent rosterId (absent on a bye). */
  opponents: Record<number, number>;
}

export interface LeagueData {
  leagueId: string;
  name: string;
  season: string;
  teams: Team[];
  /** Empty when the league has no divisions. */
  divisions: Division[];
  weeks: Week[];
  /** Other seasons of the same league, newest first. */
  history: { leagueId: string; season: string }[];
}

export interface Record3 {
  wins: number;
  losses: number;
  ties: number;
}
