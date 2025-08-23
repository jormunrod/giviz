import { useEffect, useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
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

function CustomLegend({ payload }) {
  const sorted = [...payload].sort((a, b) => b.payload.value - a.payload.value);
  return (
    <ul className="flex flex-wrap gap-3 justify-center mt-8">
      {sorted.map((entry, i) => (
        <li key={i} className="flex items-center gap-2 text-sm">
          <span
            className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{ background: entry.color, color: "#fff" }}
          >
            {(entry.payload.value * 100).toFixed(1)}%
          </span>
          <span>{entry.value}</span>
        </li>
      ))}
    </ul>
  );
}

function groupSmallCategories(data, threshold = 0.02) {
  let others = [];
  let sumOthers = 0;
  const main = [];
  for (const item of data) {
    if (item.value < threshold) {
      others.push(item);
      sumOthers += item.value;
    } else {
      main.push(item);
    }
  }
  if (others.length > 0) {
    main.push({
      role: "Others",
      value: Number(sumOthers.toFixed(4)),
      _details: others,
    });
  }
  main.sort((a, b) => b.value - a.value);
  return main;
}

export default function ContributorRolesPieChart({ owner, repo, username }) {
  const [roleData, setRoleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    async function fetchContributorRoles() {
      setLoading(true);
      try {
        const res = await fetch(
          `${
            import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"
          }/merge/contributors_effort_by_category/`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ owner, repo }),
          }
        );
        const data = await res.json();
        const contributors = data.contributors || {};
        const usernameKey = Object.keys(contributors).find(
          (key) => key.toLowerCase() === username.toLowerCase()
        );
        const contributor = usernameKey ? contributors[usernameKey] : {};
        const chartData = Object.entries(contributor)
          .filter(
            ([, vals]) =>
              typeof vals.dedication === "number" && vals.dedication > 0
          )
          .map(([role, vals]) => ({ role, value: vals.dedication }));
        setRoleData(chartData);
      } catch {
        setRoleData([]);
      }
      setLoading(false);
    }
    if (owner && repo && username) fetchContributorRoles();
  }, [owner, repo, username]);

  const grouped = useMemo(() => groupSmallCategories(roleData), [roleData]);
  const othersDetails =
    grouped.find((c) => c.role === "Others")?._details || [];

  if (loading) {
    return <div>Loading...</div>;
  }
  if (!grouped.length) {
    return (
      <div className="text-gray-500">
        No role data available for this contributor.
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center justify-center transition-all duration-500 pt-8 pb-4">
      <ResponsiveContainer width="100%" height={showDetails ? 360 : 300}>
        <PieChart margin={{ top: 32, bottom: 16 }}>
          <Pie
            data={grouped}
            dataKey="value"
            nameKey="role"
            cx="50%"
            cy="55%"
            outerRadius={100}
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
            formatter={(value, name) => [`${(value * 100).toFixed(1)}%`, name]}
          />
          <Legend content={<CustomLegend />} wrapperStyle={{ marginTop: 32 }} />
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
            Roles in 'Others':
          </strong>
          <ul className="list-disc ml-5 space-y-1">
            {othersDetails.map((item, i) => (
              <li key={i} className="text-givizBlue4">
                <span className="font-semibold">{item.role}</span>:{" "}
                {(item.value * 100).toFixed(2)}%
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
