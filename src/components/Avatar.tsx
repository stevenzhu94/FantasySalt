import type { Team } from "../types";

export function Avatar({ team, size = 32 }: { team: Team; size?: number }) {
  if (team.avatar) {
    return <img className="avatar" src={team.avatar} width={size} height={size} alt="" />;
  }
  return (
    <span className="avatar placeholder" style={{ width: size, height: size, fontSize: size * 0.45 }} aria-hidden>
      {team.name.slice(0, 1).toUpperCase()}
    </span>
  );
}
