import React from "react";

const ROLE_LABELS = {
  development: "Developer",
  testing: "Tester",
  documentation: "Docs",
};

function getTopContributorsByRole(contributorsData, roleKey, topN = 3) {
  const result = [];
  for (const [username, roles] of Object.entries(contributorsData || {})) {
    if (roles[roleKey]) {
      const { commits = 0, issues = 0, pulls = 0 } = roles[roleKey];
      const total = commits + issues + pulls;
      result.push({ username, total });
    }
  }
  return result.sort((a, b) => b.total - a.total).slice(0, topN);
}

export default function TopContributorsByRole({ contributors }) {
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
      <div className="w-full rounded-2xl p-7 flex flex-col gap-8">
        {Object.entries(ROLE_LABELS).map(([roleKey, label]) => {
          const top = getTopContributorsByRole(contributors, roleKey, 3);
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
              <div className="flex flex-row gap-4 w-full">
                {[0, 1, 2].map((idx) => {
                  const user = top[idx];
                  let medalBg = "";
                  let medalText = "";
                  if (idx === 0) {
                    medalBg = "bg-gradient-to-br from-yellow-300 to-yellow-500";
                    medalText = "text-yellow-700";
                  } else if (idx === 1) {
                    medalBg = "bg-gradient-to-br from-gray-300 to-gray-400";
                    medalText = "text-gray-700";
                  } else if (idx === 2) {
                    medalBg = "bg-gradient-to-br from-orange-300 to-orange-500";
                    medalText = "text-orange-700";
                  }
                  return (
                    <div
                      key={user ? user.username : idx}
                      className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg min-w-[100px] bg-transparent ${
                        user ? medalBg : ""
                      }`}
                    >
                      <span
                        className={`inline-block font-semibold text-base mb-1 ${
                          user ? medalText : "text-gray-400"
                        }`}
                      >
                        {user ? user.username : "-"}
                      </span>
                      <span
                        className={`px-2 py-0.5 ${
                          user ? medalBg : "bg-gray-200"
                        } text-xs rounded-full font-bold text-white`}
                      >
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                      </span>
                      <span className="text-gray-600 font-mono text-sm mt-1">
                        {user ? `${user.total} pts` : ""}
                      </span>
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
