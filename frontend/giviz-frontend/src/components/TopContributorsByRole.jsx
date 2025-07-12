import { useState, useMemo } from "react";
import GivizButton from "../components/GivizButton";

function getAllRoles(contributorsData) {
  const rolesSet = new Set();
  Object.values(contributorsData || {}).forEach((roles) => {
    Object.keys(roles).forEach((role) => rolesSet.add(role));
  });
  return Array.from(rolesSet);
}

function getRoleLabel(roleKey) {
  const defaultLabels = {
    development: "Developer",
    testing: "Tester",
    documentation: "Docs",
  };
  return (
    defaultLabels[roleKey] || roleKey.charAt(0).toUpperCase() + roleKey.slice(1)
  );
}

function getTopContributorsByRole(contributorsData, roleKey, topN = 3) {
  const result = [];
  for (const [username, roles] of Object.entries(contributorsData || {})) {
    if (roles[roleKey]) {
      const { commits = 0, issues = 0, pulls = 0, dedication } = roles[roleKey];
      const total = commits + issues + pulls;
      result.push({ username, total, commits, issues, pulls, dedication });
    }
  }
  return result.sort((a, b) => b.total - a.total).slice(0, topN);
}

export default function TopContributorsByRole({ contributors }) {
  const [hovered, setHovered] = useState({ username: null, roleKey: null });
  const allRoles = useMemo(() => getAllRoles(contributors), [contributors]);
  const [selectedRoles, setSelectedRoles] = useState(() => allRoles);
  const [showChecklist, setShowChecklist] = useState(false);

  const handleRoleToggle = (roleKey) => {
    setSelectedRoles((prev) =>
      prev.includes(roleKey)
        ? prev.filter((r) => r !== roleKey)
        : [...prev, roleKey]
    );
  };

  return (
    <div className="w-full flex flex-col items-center py-6">
      <GivizButton
        className="mb-4"
        onClick={() => setShowChecklist((v) => !v)}
        aria-expanded={showChecklist}
      >
        {showChecklist ? "Hide filters" : "Show filters"}
      </GivizButton>
      {showChecklist && (
        <div className="mb-6 w-full max-w-lg flex flex-wrap gap-3 justify-center">
          {allRoles.map((roleKey) => (
            <label
              key={roleKey}
              className="flex items-center gap-2 bg-gray-100 rounded px-2 py-1 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedRoles.includes(roleKey)}
                onChange={() => handleRoleToggle(roleKey)}
                className="accent-givizBlue4"
              />
              <span className="text-sm font-medium text-gray-700">
                {getRoleLabel(roleKey)}
              </span>
            </label>
          ))}
        </div>
      )}
      <div className="w-full rounded-2xl p-7 flex flex-col gap-4">
        <div className="flex flex-row items-center gap-4 w-full mb-2">
          <div className="min-w-[100px]" />
          <div className="flex flex-row gap-2 w-full justify-center">
            <div className="flex flex-col items-center min-w-[120px] max-w-[160px]">
              <span className="text-2xl">🥇</span>
            </div>
            <div className="flex flex-col items-center min-w-[120px] max-w-[160px]">
              <span className="text-2xl">🥈</span>
            </div>
            <div className="flex flex-col items-center min-w-[120px] max-w-[160px]">
              <span className="text-2xl">🥉</span>
            </div>
          </div>
        </div>
        {selectedRoles.map((roleKey) => {
          const top = getTopContributorsByRole(contributors, roleKey, 3) || [];
          return (
            <div
              key={roleKey}
              className="flex flex-row items-center gap-6 w-full"
            >
              <div className="flex items-center min-w-[120px]">
                <span className="text-base font-semibold text-givizBlue4 uppercase tracking-wide drop-shadow">
                  {getRoleLabel(roleKey)}
                </span>
              </div>
              <div className="flex flex-row gap-2 w-full justify-center">
                {[0, 1, 2].map((idx) => {
                  const user = top[idx];
                  let medalText = "";
                  if (idx === 0) {
                    medalText = "text-yellow-700";
                  } else if (idx === 1) {
                    medalText = "text-gray-700";
                  } else if (idx === 2) {
                    medalText = "text-orange-700";
                  }
                  return (
                    <div
                      key={user ? user.username : idx}
                      className="flex flex-col items-center justify-center min-w-[120px] max-w-[160px] relative"
                      onMouseEnter={() =>
                        user && setHovered({ username: user.username, roleKey })
                      }
                      onMouseLeave={() =>
                        setHovered({ username: null, roleKey: null })
                      }
                    >
                      <span
                        className={`inline-block font-semibold text-base mb-1 max-w-[140px] truncate ${
                          user ? medalText : "text-gray-400"
                        }`}
                        style={{ cursor: user ? "pointer" : "default" }}
                        title={user ? user.username : "-"}
                      >
                        {user ? user.username : "-"}
                      </span>
                      <span className="text-gray-600 font-mono text-sm mt-1">
                        {user ? `${user.total} pts` : ""}
                      </span>
                      {user &&
                        hovered.username === user.username &&
                        hovered.roleKey === roleKey && (
                          <div className="absolute left-1/2 -translate-x-1/2 top-10 z-10 bg-white/90 text-gray-800 rounded-lg shadow-lg border border-gray-200 px-3 py-2 text-xs whitespace-pre">
                            <div>
                              <span className="font-bold">Username:</span>{" "}
                              {user.username}
                            </div>
                            <div>
                              <span className="font-bold">Commits points:</span>{" "}
                              {user.commits}
                            </div>
                            <div>
                              <span className="font-bold">Issues points:</span>{" "}
                              {user.issues}
                            </div>
                            <div>
                              <span className="font-bold">Pulls points:</span>{" "}
                              {user.pulls}
                            </div>
                          </div>
                        )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
