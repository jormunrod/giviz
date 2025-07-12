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
  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold text-center mb-4">
        Top 3 Contributors by Role
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(ROLE_LABELS).map(([roleKey, label]) => {
          const top = getTopContributorsByRole(contributors, roleKey, 3);
          return (
            <div
              key={roleKey}
              className="bg-white rounded-xl shadow p-4 border border-gray-200"
            >
              <h3 className="text-lg font-bold mb-2 text-givizBlue4 text-center">
                {label}
              </h3>
              {top.length === 0 ? (
                <div className="text-gray-400 text-center">No contributors</div>
              ) : (
                <ol className="list-decimal pl-4">
                  {top.map((user) => (
                    <li
                      key={user.username}
                      className="mb-1 flex justify-between"
                    >
                      <span className="font-medium">{user.username}</span>
                      <span className="text-gray-500">{user.total} pts</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
