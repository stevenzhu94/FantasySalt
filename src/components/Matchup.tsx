import { useEffect, useMemo } from "react";
import { matchupsVersus } from "../stats";
import type { Team, Week } from "../types";

const pts = (n: number) => n.toFixed(2);

export function Matchup({
  x, y, weeks, onClose,
}: { x: Team; y: Team; weeks: Week[]; onClose: () => void }) {
  const rows = useMemo(() => matchupsVersus(x.rosterId, y.rosterId, weeks), [x, y, weeks]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="card modal matchup-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${x.name} versus ${y.name}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2>{x.name} <span className="muted">vs</span> {y.name}</h2>
          <button className="ghost" onClick={onClose} autoFocus>Close</button>
        </div>
        <p className="muted small">Each week as if these two teams had played. Bench = points left on the bench.</p>
        <div className="modal-scroll">
          <table className="matchup-table">
            <thead>
              <tr>
                <th>Week</th>
                <th className="left">{x.name}</th>
                <th className="left">{y.name}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.week} className={r.result === "tie" ? "" : r.result}>
                  <td>{r.week}</td>
                  <td className="left">
                    <strong>{pts(r.x.score)}</strong>
                    <span className="muted small block">bench {pts(r.x.bench)}</span>
                  </td>
                  <td className="left">
                    <strong>{pts(r.y.score)}</strong>
                    <span className="muted small block">bench {pts(r.y.bench)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
