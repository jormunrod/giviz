import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
} from "recharts";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export default function ContributorsRolesBarChart({ owner, repo }) {
  const [roleCounts, setRoleCounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEffortData() {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/merge/contributors_effort_by_category/`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ owner, repo }),
          }
        );
        const data = await res.json();
        const contributors = data.contributors || {};
        const roleMap = {};
        Object.values(contributors).forEach((categories) => {
          let mainRole = null;
          let maxDedication = -1;
          Object.entries(categories).forEach(([role, vals]) => {
            if (
              typeof vals.dedication === "number" &&
              vals.dedication > maxDedication
            ) {
              mainRole = role;
              maxDedication = vals.dedication;
            }
          });
          if (mainRole) {
            roleMap[mainRole] = (roleMap[mainRole] || 0) + 1;
          }
        });
        const chartData = Object.entries(roleMap).map(([role, count]) => ({
          role,
          count,
        }));
        setRoleCounts(chartData);
      } catch {
        setRoleCounts([]);
      }
      setLoading(false);
    }
    if (owner && repo) fetchEffortData();
  }, [owner, repo]);

  return (
    <div className="w-full max-w-2xl flex flex-col items-center">
      {loading ? (
        <div>Loading...</div>
      ) : roleCounts.length === 0 ? (
        <div>No data available.</div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={roleCounts}
            layout="vertical"
            margin={{ left: 40, right: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="role" />
            <Tooltip />
            <Bar dataKey="count" fill="#8884d8">
              <LabelList dataKey="count" position="right" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
