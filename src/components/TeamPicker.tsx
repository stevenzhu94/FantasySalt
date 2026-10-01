import type { Team } from "../types";
import { Avatar } from "./Avatar";

export function TeamPicker({ teams, onPick }: { teams: Team[]; onPick: (rosterId: number) => void }) {
  return (
    <div className="card login">
      <h2>Which team is yours?</h2>
      <ul className="pick-list grid">
        {teams.map((t) => (
          <li key={t.rosterId}>
            <button className="ghost team-btn" onClick={() => onPick(t.rosterId)}>
              <Avatar team={t} />
              <span>
                <strong>{t.name}</strong>
                {t.owner !== t.name && <span className="muted small block">{t.owner}</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
