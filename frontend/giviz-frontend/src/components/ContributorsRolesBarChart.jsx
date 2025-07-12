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
  Cell,
} from "recharts";
import GivizButton from "./GivizButton";
import { useNavigate } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export default function ContributorsRolesBarChart({
  owner,
  repo,
  onSelectContributor,
}) {
  const navigate = useNavigate();
  const [roleCounts, setRoleCounts] = useState([]);
  const [contributorsList, setContributorsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeIndex, setActiveIndex] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const pageSize = 6;
  const filteredContributors = selectedRole
    ? contributorsList.filter((c) => c.mainRole === selectedRole)
    : contributorsList;
  const totalPages = Math.ceil(filteredContributors.length / pageSize);
  const paginatedContributors = filteredContributors.slice(
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

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#A28CFF",
    "#FF6699",
    "#00B8D9",
  ];

  const getGlobalIndex = (role) => roleCounts.findIndex((r) => r.role === role);

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
          <ResponsiveContainer
            width="100%"
            height={Math.min(60 * roleCounts.length, 400)}
          >
            <BarChart
              data={roleCounts}
              layout="vertical"
              margin={{ left: 80, right: 40, top: 20, bottom: 20 }}
              barCategoryGap={10}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="role" interval={0} width={120} />
              <Tooltip
                content={({ active, payload }) =>
                  active && payload && payload.length ? (
                    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-sm">
                      <div
                        className="font-semibold"
                        style={{
                          color:
                            COLORS[
                              getGlobalIndex(payload[0].payload.role) %
                                COLORS.length
                            ],
                        }}
                      >
                        {payload[0].payload.role}
                      </div>
                      <div className="text-gray-700">
                        Contributors:{" "}
                        <span className="font-bold">{payload[0].value}</span>
                      </div>
                    </div>
                  ) : null
                }
              />
              <Bar
                dataKey="count"
                barSize={22}
                onMouseOver={(_, idx) => setActiveIndex(idx)}
                onMouseOut={() => setActiveIndex(null)}
              >
                {roleCounts.map((entry, index) => {
                  const isSelected = selectedRole === entry.role;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      style={
                        isSelected
                          ? {
                              filter:
                                "drop-shadow(0 4px 16px #3b82f680) drop-shadow(0 1px 4px #64748b40)",
                              cursor: "pointer",
                              opacity: 1,
                            }
                          : selectedRole
                          ? {
                              opacity: 0.3,
                              cursor: "pointer",
                            }
                          : activeIndex === index
                          ? {
                              filter:
                                "drop-shadow(0 4px 16px #3b82f680) drop-shadow(0 1px 4px #64748b40)",
                              cursor: "pointer",
                            }
                          : { cursor: "pointer" }
                      }
                      onClick={() => {
                        if (isSelected) {
                          setSelectedRole(null);
                          setCurrentPage(1);
                        } else {
                          setSelectedRole(entry.role);
                          setCurrentPage(1);
                        }
                      }}
                    />
                  );
                })}
                <LabelList dataKey="count" position="right" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {selectedRole && (
            <div className="w-full flex flex-col items-center mt-2">
              <div className="flex flex-row items-center gap-3 justify-center">
                <span className="text-xs text-blue-600 font-semibold">
                  Filtered by: {selectedRole}
                </span>
                <GivizButton
                  variant="secondary"
                  className="px-3 py-1 text-sm"
                  onClick={() => {
                    setSelectedRole(null);
                    setCurrentPage(1);
                  }}
                >
                  Clear filter
                </GivizButton>
              </div>
            </div>
          )}
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
                    <span
                      className="font-mono font-bold cursor-pointer hover:underline text-givizBlue4"
                      title="View contributor GitHub profile"
                      onClick={() => {
                        window.open(
                          `https://github.com/${username}`,
                          "_blank",
                          "noopener,noreferrer"
                        );
                      }}
                    >
                      {username}
                    </span>
                    <span
                      className={`text-givizBlue4 font-semibold cursor-pointer transition underline-offset-2 ${
                        selectedRole === mainRole
                          ? "underline"
                          : "hover:underline"
                      }`}
                      onClick={() => {
                        if (selectedRole === mainRole) {
                          setSelectedRole(null);
                          setCurrentPage(1);
                        } else {
                          setSelectedRole(mainRole);
                          setCurrentPage(1);
                        }
                      }}
                      title="Filter by this role"
                    >
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
