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
import GivizButton from "./GivizButton";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export default function ContributorsRolesBarChart({ owner, repo }) {
  const [roleCounts, setRoleCounts] = useState([]);
  const [contributorsList, setContributorsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;
  const totalPages = Math.ceil(contributorsList.length / pageSize);
  const paginatedContributors = contributorsList.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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
        // contributors: { username: { category: { ... } } }
        const roleMap = {};
        const contributorsArr = [];
        Object.entries(contributors).forEach(([username, categories]) => {
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
            contributorsArr.push({
              username,
              mainRole,
              dedication: maxDedication,
            });
          }
        });
        const chartData = Object.entries(roleMap).map(([role, count]) => ({
          role,
          count,
        }));
        setRoleCounts(chartData);
        setContributorsList(contributorsArr);
      } catch {
        setRoleCounts([]);
        setContributorsList([]);
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
        <>
          <div className="w-full flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500">
              Roles detected: {roleCounts.length}
            </span>
          </div>
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
          <div className="mt-8 w-full flex flex-col items-center">
            <div className="grid grid-cols-3 gap-2 px-2 mb-2 text-xs font-semibold text-gray-500 w-full max-w-md mx-auto text-left">
              <div>Username</div>
              <div>Main Role</div>
              <div>Dedication</div>
            </div>
            <ul className="divide-y divide-gray-200 w-full max-w-md mx-auto">
              {paginatedContributors.map(
                ({ username, mainRole, dedication }) => (
                  <li
                    key={username}
                    className="grid grid-cols-3 gap-2 py-2 text-sm items-center text-left"
                  >
                    <span className="font-mono font-bold">{username}</span>
                    <span className="text-givizBlue4 font-semibold">
                      {mainRole}
                    </span>
                    <span className="text-gray-600">
                      {(dedication * 100).toFixed(1)}%
                    </span>
                  </li>
                )
              )}
            </ul>
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <GivizButton
                  variant="secondary"
                  className="px-2 py-1"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </GivizButton>
                <span className="text-xs text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <GivizButton
                  variant="secondary"
                  className="px-2 py-1"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </GivizButton>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
