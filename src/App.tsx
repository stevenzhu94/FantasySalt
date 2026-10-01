import { useEffect, useMemo, useState } from "react";
import { loadLeague } from "./sleeper";
import { DEMO_LEAGUE_ID, demoLeague } from "./demo";
import type { LeagueData } from "./types";
import { Login } from "./components/Login";
import { TeamPicker } from "./components/TeamPicker";
import { MyTeam } from "./components/MyTeam";
import { Shakeup } from "./components/Shakeup";
import { ScheduleSwap } from "./components/ScheduleSwap";
import { RankFrequency } from "./components/RankFrequency";
import { Summary } from "./components/Summary";
import { Divisions } from "./components/Divisions";
import { Avatar } from "./components/Avatar";

const TABS = [
  { id: "me", label: "My Team" },
  { id: "shakeup", label: "Salt Shakeup" },
  { id: "swap", label: "Schedule Swap" },
  { id: "rank", label: "Weekly Rank" },
  { id: "opp", label: "Opponent Rank" },
  { id: "summary", label: "Rank Breakdown" },
  { id: "divisions", label: "Divisions" },
] as const;
type Tab = (typeof TABS)[number]["id"];

const storage = {
  get(key: string) {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key: string, value: string | null) {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch { /* storage unavailable; the app still works without it */ }
  },
};
const teamKey = (leagueId: string) => `fantasysalt:team:${leagueId}`;

/** League ID from a shared link (#123…) or the last league used on this device. */
function initialLeague() {
  return location.hash.slice(1) || storage.get("fantasysalt:league") || null;
}

export default function App() {
  const [leagueId, setLeagueId] = useState<string | null>(initialLeague);
  const [data, setData] = useState<LeagueData | null>(null);
  const [seasons, setSeasons] = useState<LeagueData["history"]>([]);
  const [error, setError] = useState<string>();
  const [me, setMe] = useState<number | null>(null);
  const [through, setThrough] = useState(0);
  const [tab, setTab] = useState<Tab>("me");

  useEffect(() => {
    history.replaceState(null, "", leagueId ? `#${leagueId}` : location.pathname);
    storage.set("fantasysalt:league", leagueId);
    if (!leagueId) return;
    let cancelled = false;
    setError(undefined);
    const load = leagueId === DEMO_LEAGUE_ID ? Promise.resolve(demoLeague()) : loadLeague(leagueId);
    load.then(
      (d) => {
        if (cancelled) return;
        // Switching seasons: follow the same manager into the other season.
        const prevOwner = data?.teams.find((t) => t.rosterId === me)?.owner;
        const saved = Number(storage.get(teamKey(d.leagueId)));
        const match = d.teams.find((t) => t.owner === prevOwner) ?? d.teams.find((t) => t.rosterId === saved);
        setData(d);
        setMe(match?.rosterId ?? null);
        setSeasons((h) => (h.some((s) => s.leagueId === d.leagueId) ? h : d.history));
        setThrough(d.weeks.length ? d.weeks[d.weeks.length - 1].week : 0);
      },
      (e: Error) => {
        if (cancelled) return;
        setError(`Couldn't load that league: ${e.message}`);
        setLeagueId(null);
      },
    );
    return () => { cancelled = true; };
    // `data` and `me` are read only to carry the team across a season switch.
  }, [leagueId]);

  const weeks = useMemo(() => data?.weeks.filter((w) => w.week <= through) ?? [], [data, through]);

  function pickTeam(rosterId: number | null) {
    setMe(rosterId);
    if (data) storage.set(teamKey(data.leagueId), rosterId === null ? null : String(rosterId));
  }

  function signOut() {
    if (data) storage.set(teamKey(data.leagueId), null);
    setLeagueId(null);
    setData(null);
    setSeasons([]);
    setMe(null);
  }

  const loading = leagueId !== null && data?.leagueId !== leagueId;
  const myTeam = data?.teams.find((t) => t.rosterId === me);

  return (
    <div className="app">
      <header className="topbar">
        <h1>🧂 Fantasy Salt</h1>
        {data && !loading && (
          <div className="league-meta">
            <span className="league-name">{data.name}</span>
            {seasons.length > 1 ? (
              <select value={data.leagueId} onChange={(e) => setLeagueId(e.target.value)} aria-label="Season">
                {seasons.map((s) => <option key={s.leagueId} value={s.leagueId}>{s.season}</option>)}
              </select>
            ) : (
              <span className="muted">{data.season}</span>
            )}
            {myTeam && (
              <button className="ghost me-chip" onClick={() => pickTeam(null)} title="Switch team">
                <Avatar team={myTeam} size={22} /> {myTeam.name}
              </button>
            )}
            <button className="link" onClick={signOut}>Change league</button>
          </div>
        )}
      </header>

      <main>
        {!leagueId && <Login onLeague={setLeagueId} error={error} />}
        {loading && <p className="muted center">Loading league…</p>}
        {data && !loading && me === null && <TeamPicker teams={data.teams} onPick={pickTeam} />}
        {data && !loading && me !== null && (
          data.weeks.length === 0 ? (
            <div className="card login">
              <h2>No games yet</h2>
              <p className="muted">This season has no completed weeks. Check back after week 1, or pick an earlier season.</p>
            </div>
          ) : (
            <>
              <nav className="tabs" role="tablist">
                {TABS.filter((t) => t.id !== "divisions" || data.divisions.length > 0).map((t) => (
                  <button
                    key={t.id}
                    role="tab"
                    aria-selected={tab === t.id}
                    className={tab === t.id ? "active" : ""}
                    onClick={() => setTab(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
                <label className="through">
                  Through week
                  <select value={through} onChange={(e) => setThrough(Number(e.target.value))}>
                    {data.weeks.map((w) => <option key={w.week} value={w.week}>{w.week}</option>)}
                  </select>
                </label>
              </nav>
              {tab === "me" && <MyTeam teams={data.teams} weeks={weeks} me={me} />}
              {tab === "shakeup" && <Shakeup teams={data.teams} weeks={weeks} divisions={data.divisions} me={me} />}
              {tab === "swap" && <ScheduleSwap teams={data.teams} weeks={weeks} me={me} />}
              {tab === "rank" && <RankFrequency teams={data.teams} weeks={weeks} me={me} />}
              {tab === "opp" && <RankFrequency teams={data.teams} weeks={weeks} me={me} ofOpponent />}
              {tab === "summary" && <Summary teams={data.teams} weeks={weeks} me={me} />}
              {tab === "divisions" && data.divisions.length > 0 && (
                <Divisions teams={data.teams} weeks={weeks} divisions={data.divisions} me={me} />
              )}
            </>
          )
        )}
      </main>

      <footer className="site-footer">
        <p>© {new Date().getFullYear()} Steven Zhu. All rights reserved.</p>
        <p>Shoutout to Yannick Vela, whose original Excel sheets and manual data tracking inspired this site.</p>
      </footer>
    </div>
  );
}
