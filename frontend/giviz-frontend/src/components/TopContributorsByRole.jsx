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

export function Medal({ place = 0, size = 44, className = "", noRibbon = false }) {
  const palette = [
    {
      // Gold
      from: "#FDE68A",
      to: "#F59E0B",
      ring: "rgba(245, 158, 11, 0.5)",
      glow: "rgba(245, 158, 11, 0.35)",
    },
    {
      // Silver
      from: "#E5E7EB",
      to: "#9CA3AF",
      ring: "rgba(156, 163, 175, 0.5)",
      glow: "rgba(156, 163, 175, 0.25)",
    },
    {
      // Bronze
      from: "#F59E0B",
      to: "#B45309",
      ring: "rgba(180, 83, 9, 0.5)",
      glow: "rgba(180, 83, 9, 0.25)",
    },
  ];
  const p = palette[Math.min(Math.max(place, 0), 2)];
  const sz = Math.max(28, size);
  const starSize = Math.floor(sz * 0.52);
  const medalStyle = {
    width: sz,
    height: sz,
    background: `linear-gradient(145deg, ${p.from}, ${p.to})`,
    boxShadow: `0 6px 18px ${p.glow}, inset 0 2px 4px rgba(255,255,255,0.35), inset 0 -2px 6px rgba(0,0,0,0.12)`,
    border: `2px solid ${p.ring}`,
  };
  return (
    <div className={`relative inline-flex items-center justify-center rounded-full ${className}`} style={medalStyle}>
      {/* glossy highlight */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(60% 60% at 30% 30%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.05) 60%, rgba(255,255,255,0) 100%)",
          mixBlendMode: "overlay",
          pointerEvents: "none",
        }}
      />
      {/* star icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={starSize}
        height={starSize}
        viewBox="0 0 24 24"
        className="drop-shadow-sm"
        fill="white"
      >
        <path d="M12 2.5l2.84 5.76 6.36.92-4.6 4.48 1.09 6.34L12 17.98 6.31 20.99l1.09-6.34-4.6-4.48 6.36-.92L12 2.5z" />
      </svg>
      {/* small ribbons */}
      {!noRibbon && (
        <div className="absolute -bottom-2 flex gap-1">
          <div
            className="w-2 h-3 rounded-sm"
            style={{ background: p.to, boxShadow: `0 2px 6px ${p.glow}` }}
          />
          <div
            className="w-2 h-3 rounded-sm"
            style={{ background: p.to, boxShadow: `0 2px 6px ${p.glow}` }}
          />
        </div>
      )}
    </div>
  );
}

export default function TopContributorsByRole({ contributors }) {
  const [hovered, setHovered] = useState({ username: null, roleKey: null });
  const allRoles = useMemo(() => getAllRoles(contributors), [contributors]);
  const topRoles = useMemo(() => {
    const counts = {};
    allRoles.forEach((roleKey) => {
      counts[roleKey] = Object.values(contributors || {}).filter(
        (roles) => !!roles[roleKey]
      ).length;
    });
    return allRoles
      .slice()
      .sort((a, b) => counts[b] - counts[a])
      .slice(0, 3);
  }, [allRoles, contributors]);
  const [selectedRoles, setSelectedRoles] = useState(() => topRoles);
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
          <div className="min-w-[120px]" />
          <div className="flex flex-row gap-2 w-full justify-center">
            {[0, 1, 2].map((idx) => (
              <div
                key={`header-medal-${idx}`}
                className="flex flex-col items-center w-[140px]"
              >
                <div className="group">
                  <Medal
                    place={idx}
                    size={42}
                    className="transition-transform group-hover:scale-105"
                    noRibbon
                  />
                </div>
                <span className="mt-1 text-xs text-gray-500">{`#${idx + 1}`}</span>
              </div>
            ))}
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
                  let tileBg = "bg-gray-50 border-gray-200";
                  let accent = "";
                  if (idx === 0) {
                    medalText = "text-yellow-700";
                    tileBg = "bg-yellow-50 border-yellow-200";
                    accent = "shadow-[0_8px_24px_rgba(245,158,11,0.25)]";
                  } else if (idx === 1) {
                    medalText = "text-gray-700";
                    tileBg = "bg-gray-50 border-gray-200";
                    accent = "shadow-[0_8px_24px_rgba(156,163,175,0.2)]";
                  } else if (idx === 2) {
                    medalText = "text-orange-700";
                    tileBg = "bg-amber-50 border-amber-200";
                    accent = "shadow-[0_8px_24px_rgba(180,83,9,0.2)]";
                  }
                  return (
                    <div
                      key={user ? user.username : idx}
                      className={`group flex flex-col items-center justify-center w-[140px] relative z-0 hover:z-30 rounded-xl border ${tileBg} ${accent} px-3 py-3 transition-transform hover:-translate-y-0.5`}
                      onMouseEnter={() =>
                        user && setHovered({ username: user.username, roleKey })
                      }
                      onMouseLeave={() =>
                        setHovered({ username: null, roleKey: null })
                      }
                    >
                      <div className="mb-2">
                        <Medal
                          place={idx}
                          size={42}
                          className={user ? "group-hover:scale-105 transition-transform" : "opacity-40"}
                        />
                      </div>
                      <span
                        className={`block text-center font-semibold text-[12px] leading-tight mb-1 h-[2.4rem] w-full px-1 whitespace-normal break-words ${
                          user ? medalText : "text-gray-400"
                        }`}
                        style={{ cursor: user ? "pointer" : "default" }}
                        title={user ? user.username : "-"}
                      >
                        {user ? user.username : "-"}
                      </span>
                      <span
                        className={`mt-1 text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                          idx === 0
                            ? "bg-yellow-100/60 text-yellow-800 border-yellow-200"
                            : idx === 1
                            ? "bg-gray-100/60 text-gray-700 border-gray-200"
                            : "bg-amber-100/60 text-orange-800 border-amber-200"
                        }`}
                      >
                        {user ? `${user.total} pts` : ""}
                      </span>
                      {user &&
                        hovered.username === user.username &&
                        hovered.roleKey === roleKey && (
                          <div className="absolute left-1/2 -translate-x-1/2 top-12 z-[999] pointer-events-none bg-white/95 backdrop-blur-sm text-gray-800 rounded-lg shadow-xl border border-gray-200 px-3 py-2 text-xs whitespace-pre">
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
