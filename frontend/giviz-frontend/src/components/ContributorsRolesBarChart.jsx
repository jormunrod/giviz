import { useEffect, useState } from "react";
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

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const PAGE_SIZE = 4;

export default function ContributorsRolesBarChart({ owner, repo, contributors }) {
  const [roleCounts, setRoleCounts] = useState([]);
  const [contributorsList, setContributorsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeIndex, setActiveIndex] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const pageSize = PAGE_SIZE;
  const filteredContributors = selectedRole
    ? contributorsList.filter((c) => c.mainRole === selectedRole)
    : contributorsList;
  const totalPages = Math.ceil(filteredContributors.length / pageSize);
  const paginatedContributors = filteredContributors.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    const buildFromContributors = (contributorsObj) => {
      const roleMap = {};
      const contributorsArr = [];

      Object.entries(contributorsObj).forEach(([username, categories]) => {
        let mainRole = null;
        let maxDedication = -1;
        Object.entries(categories).forEach(([role, vals]) => {
          if (typeof vals?.dedication === "number" && vals.dedication > maxDedication) {
            mainRole = role;
            maxDedication = vals.dedication;
          }
        });
        if (mainRole) {
          roleMap[mainRole] = (roleMap[mainRole] || 0) + 1;
          contributorsArr.push({ username, mainRole, dedication: maxDedication });
        }
      });

      let chartData = Object.entries(roleMap).map(([role, count]) => ({ role, count }));
      if (contributorsArr.length === 1 && chartData.length === 0 && contributorsArr[0].mainRole) {
        chartData = [{ role: contributorsArr[0].mainRole, count: 1 }];
      }
      setRoleCounts(chartData);
      setContributorsList(contributorsArr);
    };

    let mounted = true;

    // If contributors are provided via props, use them and skip fetching.
    if (contributors && typeof contributors === "object") {
      setLoading(true);
      buildFromContributors(contributors);
      if (mounted) setLoading(false);
      return () => {
        mounted = false;
      };
    }

    if (!owner || !repo) return;
    setLoading(true);

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/merge/contributors_effort_by_category/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ owner, repo }),
        });
        const data = await res.json().catch(() => ({}));
        if (!mounted) return;
        const contributorsObj = data?.contributors || {};
        buildFromContributors(contributorsObj);
      } catch {
        // swallow
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [owner, repo, contributors]);

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#A28CFF",
    "#FF6699",
    "#00B8D9",
  ];

  const getRoleColorMap = (roles) => {
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
  };
  const roleColorMap = getRoleColorMap(roleCounts.map((r) => r.role));

  const getGlobalIndex = (role) => roleCounts.findIndex((r) => r.role === role);

  return (
    <div className="w-full max-w-2xl flex flex-col items-center">
      {loading && roleCounts.length === 0 ? (
        <div>Loading...</div>
      ) : roleCounts.length === 0 ? (
        <div>No data available.</div>
      ) : (
        <>
          <div className="w-full flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500">
              Contributors analyzed: {contributorsList.length}
              <span className="mx-2">|</span> Roles detected:{" "}
              {roleCounts.length}
            </span>
          </div>
          <ResponsiveContainer
            width="100%"
            height={Math.max(Math.min(60 * roleCounts.length, 400), 120)}
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
                      fill={roleColorMap[entry.role]}
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
            <div className="grid grid-cols-3 gap-2 px-2 mb-2 w-full max-w-md mx-auto">
              <div className="col-span-3 flex">
                <div className="w-1/3 py-2 px-3 text-left text-base font-bold text-givizBlue4 flex items-center">
                  Username
                </div>
                <div className="w-1/3 py-2 px-3 text-center text-base font-bold text-givizBlue4 flex items-center justify-center">
                  Main Role
                </div>
                <div className="w-1/3 py-2 px-3 text-center text-base font-bold text-givizBlue4 flex items-center justify-center">
                  Dedication
                </div>
              </div>
            </div>
            <hr className="w-full max-w-md border-t border-gray-200 mb-2" />
            <ul className="divide-y divide-gray-200 w-full max-w-md mx-auto">
              {paginatedContributors.map(
                ({ username, mainRole, dedication }) => (
                  <li
                    key={username}
                    className="grid grid-cols-3 gap-2 py-2 text-sm items-center text-left hover:bg-gray-50 transition rounded"
                  >
                    <span
                      className="font-mono font-bold cursor-pointer hover:underline text-givizBlue4 flex items-center gap-1 justify-start"
                      title="View contributor GitHub profile"
                      onClick={() => {
                        window.open(
                          `https://github.com/${username}`,
                          "_blank",
                          "noopener,noreferrer"
                        );
                      }}
                      style={{ minWidth: 0 }}
                    >
                      <span
                        style={{
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          viewBox="0 0 16 16"
                          className="inline-block align-middle text-gray-500 mr-1"
                          style={{ minWidth: 16, minHeight: 16 }}
                        >
                          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.65 7.65 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.19 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
                        </svg>
                      </span>
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {username}
                      </span>
                    </span>
                    <span
                      className={`font-semibold cursor-pointer transition underline-offset-2 text-center flex items-center justify-center gap-2`}
                      style={{ color: roleColorMap[mainRole] }}
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
                      <span>{mainRole}</span>
                      <span
                        style={{
                          display: "inline-block",
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          background: roleColorMap[mainRole],
                          border: "1px solid #e5e7eb",
                        }}
                        title={`Color for ${mainRole}`}
                      />
                    </span>
                    <span className="text-gray-600 text-center">
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
