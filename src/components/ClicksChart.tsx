"use client";

export type ChartPoint = { date: string; clicks: number };

export default function ClicksChart({ data }: { data: ChartPoint[] }) {
  const max = Math.max(1, ...data.map((item) => item.clicks));
  return (
    <div className="chart" aria-label="Cliques por dia nos últimos 30 dias">
      {data.map((item) => (
        <div
          className="chart-bar"
          key={item.date}
          data-label={`${item.date.slice(5).split("-").reverse().join("/")}: ${item.clicks}`}
          style={{ height: `${Math.max(2, (item.clicks / max) * 100)}%` }}
          aria-label={`${item.date}: ${item.clicks} cliques`}
        />
      ))}
    </div>
  );
}
