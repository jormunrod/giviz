import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A28CFF",
  "#FF6699",
  "#00B8D9",
];

function getRoleColorMap(roles) {
  const colorMap = {};
  roles.forEach((role, idx) => {
    if (idx < COLORS.length) {
      colorMap[role] = COLORS[idx];
    } else {
      const hue = (idx * 47) % 360;
      colorMap[role] = `hsl(${hue}, 70%, 60%)`;
    }
  });
  return colorMap;
}

export default function ContributorRolesPieChart({ owner, repo, username }) {
  const [roleData, setRoleData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContributorRoles() {
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
        console.log({ username, contributorKeys: Object.keys(contributors) });
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

  const roleColorMap = getRoleColorMap(roleData.map((r) => r.role));

  return (
    <div className="w-full flex flex-col items-center">
      {loading ? (
        <div>Loading...</div>
      ) : roleData.length === 0 ? (
        <div>No role data available for this contributor.</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={roleData}
              dataKey="value"
              nameKey="role"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ role, value }) =>
                `${role}: ${(value * 100).toFixed(1)}%`
              }
            >
              {roleData.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={roleColorMap[entry.role]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [
                `${(value * 100).toFixed(1)}%`,
                name,
              ]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
