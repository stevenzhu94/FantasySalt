import { useState, type FormEvent } from "react";
import { leaguesForUser, type LeagueSummary } from "../sleeper";
import { DEMO_LEAGUE_ID } from "../demo";

export function Login({ onLeague, error }: { onLeague: (leagueId: string) => void; error?: string }) {
  const [query, setQuery] = useState("");
  const [leagues, setLeagues] = useState<LeagueSummary[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [lookupError, setLookupError] = useState<string>();

  async function submit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    // Sleeper league IDs are long numeric strings; anything else is a username.
    if (/^\d{10,}$/.test(q)) return onLeague(q);
    setBusy(true);
    setLookupError(undefined);
    try {
      const found = await leaguesForUser(q);
      if (found.length === 1) return onLeague(found[0].leagueId);
      setLeagues(found);
      if (!found.length) setLookupError("That user has no NFL leagues this season.");
    } catch {
      setLookupError("Couldn't find that Sleeper user or league.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card login">
      <h2>Find your league</h2>
      <p className="muted">Enter your Sleeper username or league ID. No password needed.</p>
      <form onSubmit={submit} className="row">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Sleeper username or league ID"
          aria-label="Sleeper username or league ID"
        />
        <button type="submit" disabled={busy}>{busy ? "Looking…" : "Go"}</button>
      </form>
      {(lookupError || error) && <p className="error">{lookupError || error}</p>}
      {leagues && leagues.length > 0 && (
        <ul className="pick-list">
          {leagues.map((l) => (
            <li key={l.leagueId}>
              <button className="ghost" onClick={() => onLeague(l.leagueId)}>
                {l.name} <span className="muted">{l.season}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="muted small">
        No league handy? <button className="link" onClick={() => onLeague(DEMO_LEAGUE_ID)}>Try the demo league</button>
      </p>
    </div>
  );
}
