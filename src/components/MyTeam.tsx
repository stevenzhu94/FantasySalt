import { useMemo } from "react";
import {
  actualRecord, allPlayRecord, formatRecord, rankFrequency, scheduleSwap, shakeup, summary, winPct,
} from "../stats";
import type { Record3, Team, Week } from "../types";

interface Stat {
  label: string;
  value: string;
  note: string;
  tone?: "good" | "bad";
}

function extremes(entries: [Team, Record3][]) {
  const sorted = [...entries].sort((a, b) => winPct(b[1]) - winPct(a[1]));
  return { best: sorted[0], worst: sorted[sorted.length - 1] };
}

const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export function MyTeam({ teams, weeks, me }: { teams: Team[]; weeks: Week[]; me: number }) {
  const stats = useMemo<Stat[]>(() => {
    const others = teams.filter((t) => t.rosterId !== me);
    const actual = actualRecord(me, weeks);
    const allPlay = allPlayRecord(me, weeks);
    const luck = winPct(actual) - winPct(allPlay);

    const shake = shakeup(teams, weeks)[me];
    const shakeEx = extremes(others.map((t) => [t, shake[t.rosterId]]));

    const swap = scheduleSwap(teams, weeks);
    const swapEx = extremes(others.map((t) => [t, swap[me][t.rosterId]]));
    const myScheduleEx = extremes(others.map((t) => [t, swap[t.rosterId][me]]));

    const row = summary(teams, weeks).find((r) => r.rosterId === me)!;
    const freq = rankFrequency(teams, weeks)[me];
    const mostCommon = freq.indexOf(Math.max(...freq)) + 1;

    return [
      {
        label: "Actual record",
        value: formatRecord(actual),
        note: `All-play record: ${formatRecord(allPlay)}, as if you played everyone every week.`,
      },
      {
        label: "Luck",
        value: `${luck >= 0 ? "+" : ""}${Math.round(luck * 100)}%`,
        note: luck > 0.05 ? "You've won more than your scores deserve. Enjoy it while it lasts."
          : luck < -0.05 ? "Your scores deserve a better record than this. Maximum salt."
          : "Your record is about what your scores earned.",
        tone: luck > 0.05 ? "good" : luck < -0.05 ? "bad" : undefined,
      },
      {
        label: "Favorite victim",
        value: formatRecord(shakeEx.best[1]),
        note: `Your record if you played ${shakeEx.best[0].name} every week.`,
        tone: "good",
      },
      {
        label: "Kryptonite",
        value: formatRecord(shakeEx.worst[1]),
        note: `Your record if you played ${shakeEx.worst[0].name} every week.`,
        tone: "bad",
      },
      {
        label: "Dream schedule",
        value: formatRecord(swapEx.best[1]),
        note: `Your record with ${swapEx.best[0].name}'s schedule.`,
        tone: "good",
      },
      {
        label: "Nightmare schedule",
        value: formatRecord(swapEx.worst[1]),
        note: `Your record with ${swapEx.worst[0].name}'s schedule.`,
        tone: "bad",
      },
      {
        label: "Who'd do best with your schedule",
        value: formatRecord(myScheduleEx.best[1]),
        note: `${myScheduleEx.best[0].name} with your opponents.`,
      },
      {
        label: "Avg weekly rank",
        value: row.avgRank.toFixed(2),
        note: `Usual finish: ${ordinal(mostCommon)}. Top 3 in ${row.top3} weeks, bottom 3 in ${row.bottom3}.`,
      },
      {
        label: "Avg opponent rank",
        value: row.avgOppRank.toFixed(2),
        note: `You've faced a top-3 scorer ${row.oppTop3} times and lost ${row.lossesToTop3} of those.`,
      },
    ];
  }, [teams, weeks, me]);

  const team = teams.find((t) => t.rosterId === me)!;

  return (
    <section>
      <h2>{team.name}: the salt report</h2>
      <div className="stat-grid">
        {stats.map((s) => (
          <div key={s.label} className={`card stat ${s.tone ?? ""}`}>
            <div className="muted small">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="small">{s.note}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
