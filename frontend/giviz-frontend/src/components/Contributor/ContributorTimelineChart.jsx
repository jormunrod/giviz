import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import InfoTooltip from "../InfoTooltip";
import GivizButton from "../GivizButton";
import GivizSegmentedSelector from "../GivizSegmentedSelector";

export default function ContributorTimelineRecharts({
  owner,
  repo,
  contributor,
}) {
  const [selectedCategories, setSelectedCategories] = useState(["null"]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupBy, setGroupBy] = useState("month");

  useEffect(() => {
    if (!owner || !repo || !contributor) return;
    setLoading(true);
    setError(null);
    async function fetchStats() {
      try {
        const API_BASE =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
        const url = `${API_BASE}/merge/contributor_stats/`;
        const body = JSON.stringify({ owner, repo, contributor });
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        });
        const result = await res.json();
        if (res.ok && result.stats && result.stats[contributor]) {
          setData(result.stats[contributor]);
        } else {
          setError(result.error || "No stats available");
        }
      } catch {
        setError("Error fetching stats");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [owner, repo, contributor]);

  function formatDate(dateStr, groupBy) {
    if (groupBy === "year") {
      return dateStr.slice(0, 4);
    } else if (groupBy === "month") {
      return dateStr.slice(0, 7);
    }
    return dateStr;
  }

  function buildTimelineData(selectedCatStatsArr) {
    const dateMap = {};
    selectedCatStatsArr.forEach((catStats) => {
      ["commits", "issues", "pulls"].forEach((type) => {
        (catStats[type] || []).forEach((item) => {
          const groupKey = formatDate(item.date, groupBy);
          if (!dateMap[groupKey])
            dateMap[groupKey] = {
              date: groupKey,
              commits: 0,
              issues: 0,
              pulls: 0,
            };
          dateMap[groupKey][type] += 1;
        });
      });
    });
    const dates = Object.keys(dateMap).sort();
    return dates.map((date) => dateMap[date]);
  }

  const categories = data ? Object.keys(data) : [];

  let chartData = null;
  if (data && selectedCategories.length > 0) {
    const selectedCatStatsArr = selectedCategories
      .map((cat) => data[cat])
      .filter(Boolean);
    chartData = buildTimelineData(selectedCatStatsArr);
  }

  function toggleCategory(cat) {
    setSelectedCategories((prev) =>
      prev.includes(cat)
        ? prev.length === 1
          ? prev
          : prev.filter((c) => c !== cat)
        : [...prev, cat]
    );
  }

  return (
    <div className="w-full max-w-2xlrounded-xl p-4 mt-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-semibold text-sm">Contributions over time</span>
        <InfoTooltip
          text={
            "Shows the number of contributions (commits, issues, PRs) over time for " +
            contributor +
            "."
          }
        />
      </div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-medium">Group by:</span>
        <GivizSegmentedSelector
          options={[
            { value: "year", label: "Year" },
            { value: "month", label: "Month" },
            { value: "day", label: "Day" },
          ]}
          value={groupBy}
          onChange={setGroupBy}
        />
      </div>
      {categories.length > 1 && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-medium">Categories:</span>
          {categories.map((cat) => (
            <GivizButton
              key={cat}
              variant={
                selectedCategories.includes(cat) ? "primary" : "secondary"
              }
              className="text-xs px-3 py-1"
              onClick={() => toggleCategory(cat)}
            >
              {cat === "null" ? "General" : cat}
            </GivizButton>
          ))}
        </div>
      )}
      {loading ? (
        <span className="text-gray-500">Loading timeline...</span>
      ) : error ? (
        <span className="text-red-600 font-semibold">{error}</span>
      ) : chartData && chartData.length ? (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              fontSize={12}
              angle={-30}
              textAnchor="end"
              height={50}
            />
            <YAxis allowDecimals={false} fontSize={12} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="commits"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              name="Commits"
            />
            <Line
              type="monotone"
              dataKey="issues"
              stroke="#f59e42"
              strokeWidth={2}
              dot={false}
              name="Issues"
            />
            <Line
              type="monotone"
              dataKey="pulls"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              name="PRs"
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <span className="text-gray-500">No contribution data available.</span>
      )}
    </div>
  );
}
