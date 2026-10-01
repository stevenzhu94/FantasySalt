export interface Team {
  rosterId: number;
  name: string;
  owner: string;
  avatar: string | null;
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
  weeks: Week[];
  /** Other seasons of the same league, newest first. */
  history: { leagueId: string; season: string }[];
}

export interface Record3 {
  wins: number;
  losses: number;
  ties: number;
}
