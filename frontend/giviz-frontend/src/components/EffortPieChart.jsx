import { useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label,
  Sector,
} from "recharts";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A28CFF",
  "#FF6699",
  "#00B8D9",
];

function renderCustomizedLabel({ cx, cy, midAngle, outerRadius, percent }) {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 32;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#222"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={10}
      fontWeight={400}
      style={{ textShadow: "0 1px 2px #fff8" }}
    >
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
}

function CustomLegend({ payload }) {
  return (
    <ul className="flex flex-wrap gap-3 justify-center mt-4">
      {payload.map((entry, i) => (
        <li key={i} className="flex items-center gap-2 text-sm">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ background: entry.color }}
          ></span>
          <span>{entry.value}</span>
        </li>
      ))}
    </ul>
  );
}

function groupSmallCategories(data, threshold = 2) {
  let others = [];
  let sumOthers = 0;
  const main = [];
  for (const item of data) {
    if (item.percentage < threshold) {
      others.push(item);
      sumOthers += item.percentage;
    } else {
      main.push(item);
    }
  }
  if (others.length > 0) {
    main.push({
      category: "Others",
      percentage: Number(sumOthers.toFixed(2)),
      _details: others,
    });
  }
  return main;
}

export default function EffortPieChart({ data, contributions }) {
  const [showDetails, setShowDetails] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);
  const grouped = useMemo(() => groupSmallCategories(data), [data]);
  const othersDetails =
    grouped.find((c) => c.category === "Others")?._details || [];

  const counts = useMemo(() => {
    if (!Array.isArray(contributions)) return null;
    let commits = 0,
      issues = 0,
      pulls = 0;
    for (const c of contributions) {
      if (c.type === "commit") commits++;
      else if (c.type === "issue") issues++;
      else if (c.type === "pull") pulls++;
    }
    return { commits, issues, pulls, total: commits + issues + pulls };
  }, [contributions]);

  if (!Array.isArray(data) || data.length === 0) {
    return <div className="text-gray-500">No data to display</div>;
  }

  return (
    <div className="w-full flex flex-col items-center justify-center transition-all duration-500">
      <ResponsiveContainer width="100%" height={showDetails ? 320 : 260}>
        <PieChart>
          <Pie
            data={grouped}
            dataKey="percentage"
            nameKey="category"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={renderCustomizedLabel}
            labelLine={true}
            onMouseEnter={(_, idx) => setActiveIndex(idx)}
            onMouseLeave={() => setActiveIndex(null)}
            activeIndex={activeIndex}
            activeShape={(props) => (
              <Sector {...props} outerRadius={110} fill={props.fill} />
            )}
          >
            {grouped.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                stroke="#fff"
                strokeWidth={activeIndex === index ? 3 : 1}
                style={{
                  filter:
                    activeIndex === index
                      ? "drop-shadow(0 2px 8px #0002)"
                      : undefined,
                }}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name, props) => {
              const val = props.payload.value;
              return [`${value}%${val !== undefined ? ` (${val})` : ""}`, name];
            }}
          />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
      {othersDetails.length > 0 && (
        <button
          className="mt-4 flex items-center gap-1 text-sm text-blue-700 font-medium hover:underline focus:outline-none"
          onClick={() => setShowDetails((v) => !v)}
        >
          {showDetails ? (
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path stroke="#2563eb" strokeWidth="2" d="M18 15l-6-6-6 6" />
            </svg>
          ) : (
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path stroke="#2563eb" strokeWidth="2" d="M6 9l6 6 6-6" />
            </svg>
          )}
          {showDetails
            ? "Hide details of 'Others'"
            : "Show details of 'Others'"}
        </button>
      )}
      <div
        className={`transition-all duration-500 overflow-hidden w-full flex flex-col items-center justify-center ${
          showDetails ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"
        }`}
        aria-hidden={!showDetails}
      >
        <div className="bg-givizBlue1 border-2 border-givizBlue3 rounded-2xl p-5 w-full max-w-md text-sm shadow-lg">
          <strong className="block mb-2 text-givizBlue3 text-base font-bold">
            Categories in 'Others':
          </strong>
          <ul className="list-disc ml-5 space-y-1">
            {othersDetails.map((item, i) => (
              <li key={i} className="text-givizBlue4">
                <span className="font-semibold">{item.category}</span>:{" "}
                {item.percentage.toFixed(2)}%
              </li>
            ))}
          </ul>
        </div>
      </div>
      {counts && (
        <div className="mt-6 w-full max-w-md text-xs text-center text-givizBlue4 bg-givizBlue1 border border-givizBlue2 rounded-xl p-2">
          <span className="font-semibold">Analyzed contributions:</span>{" "}
          {counts.total} &nbsp;|&nbsp;
          <span className="font-semibold">Commits:</span> {counts.commits}{" "}
          &nbsp;|&nbsp;
          <span className="font-semibold">Issues:</span> {counts.issues}{" "}
          &nbsp;|&nbsp;
          <span className="font-semibold">PRs:</span> {counts.pulls}
        </div>
      )}
    </div>
  );
}
