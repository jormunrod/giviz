import React from "react";
import { useState } from "react";

const ROLE_LABELS = {
  development: "Developer",
  testing: "Tester",
  documentation: "Docs",
};

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
  const ROLE_ICONS = {
    development: (
      <span className="inline-block mr-2 text-givizBlue4">
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
          <path
            d="M8 17l-5-5 5-5M16 7l5 5-5 5"
            stroke="#2563eb"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    ),
    testing: (
      <span className="inline-block mr-2 text-green-500">
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
          <path
            d="M9 12l2 2 4-4"
            stroke="#22c55e"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    ),
    documentation: (
      <span className="inline-block mr-2 text-yellow-500">
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
          <path
            d="M7 7h10M7 11h10M7 15h6"
            stroke="#eab308"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    ),
  };

  return (
    <div className="w-full flex flex-col items-center py-6">
      <h2 className="text-2xl font-extrabold text-center mb-8 text-givizBlue4 tracking-wide">
        Top 3 Contributors by Role
      </h2>
      <div className="w-full rounded-2xl p-7 flex flex-col gap-4">
        <div className="flex flex-row items-center gap-6 w-full mb-2">
          <div className="min-w-[120px]" />
          <div className="flex flex-row gap-4 w-full justify-center">
            <div className="flex flex-col items-center min-w-[100px]">
              <span className="text-3xl">🥇</span>
            </div>
            <div className="flex flex-col items-center min-w-[100px]">
              <span className="text-3xl">🥈</span>
            </div>
            <div className="flex flex-col items-center min-w-[100px]">
              <span className="text-3xl">🥉</span>
            </div>
          </div>
        </div>
        {Object.entries(ROLE_LABELS).map(([roleKey, label]) => {
          const top = getTopContributorsByRole(contributors, roleKey, 3) || [];
          return (
            <div
              key={roleKey}
              className="flex flex-row items-center gap-6 w-full"
            >
              <div className="flex items-center min-w-[120px]">
                {ROLE_ICONS[roleKey]}
                <span className="text-lg font-bold text-givizBlue4 uppercase tracking-wide drop-shadow">
                  {label}
                </span>
              </div>
              <div className="flex flex-row gap-4 w-full justify-center">
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
                      className="flex flex-col items-center justify-center min-w-[100px] relative"
                      onMouseEnter={() =>
                        user && setHovered({ username: user.username, roleKey })
                      }
                      onMouseLeave={() =>
                        setHovered({ username: null, roleKey: null })
                      }
                    >
                      <span
                        className={`inline-block font-semibold text-base mb-1 max-w-[90px] truncate ${
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
