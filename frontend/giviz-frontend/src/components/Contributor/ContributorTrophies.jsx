import { useEffect, useMemo, useState } from "react";
import { Medal } from "../TopContributorsByRole";

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

export default function ContributorTrophies({ owner, repo, username }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    async function fetchRoleContributors() {
      if (!owner || !repo) return;
      setLoading(true);
      setError(null);
      try {
        const API_BASE =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
        const url = `${API_BASE}/merge/contributors_effort_by_category/`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ owner, repo }),
        });
        const json = await res.json();
        if (!active) return;
        if (json && json.contributors) {
          setData(json.contributors);
        } else {
          setData(null);
          setError("No contributor role data");
        }
      } catch {
        if (!active) return;
        setData(null);
        setError("Failed to load trophies");
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchRoleContributors();
    return () => {
      active = false;
    };
  }, [owner, repo]);

  const trophies = useMemo(() => {
    if (!data || !username) return [];
    const rolesSet = new Set();
    Object.values(data).forEach((roles) => {
      Object.keys(roles).forEach((r) => rolesSet.add(r));
    });
    const roles = Array.from(rolesSet);

    const res = [];
    for (const roleKey of roles) {
      const arr = [];
      for (const [user, rolesMap] of Object.entries(data)) {
        if (rolesMap[roleKey]) {
          const { commits = 0, issues = 0, pulls = 0 } = rolesMap[roleKey];
          const total = commits + issues + pulls;
          arr.push({ user, total, commits, issues, pulls });
        }
      }
      const top3 = arr.sort((a, b) => b.total - a.total).slice(0, 3);
      const idx = top3.findIndex((u) => u.user === username);
      if (idx !== -1) {
        res.push({
          roleKey,
          roleLabel: getRoleLabel(roleKey),
          place: idx,
          total: top3[idx].total,
          commits: top3[idx].commits,
          issues: top3[idx].issues,
          pulls: top3[idx].pulls,
        });
      }
    }
    // Sort by place (1st first), then points desc
    return res.sort((a, b) => a.place - b.place || b.total - a.total);
  }, [data, username]);

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center text-gray-500 text-sm">
        Loading trophies...
      </div>
    );
  }

  if (error || !trophies.length) {
    return null;
  }

  return (
    <div className="w-full flex flex-col items-center mt-4">
      <div className="flex items-center mb-3">
        <h3 className="text-lg font-semibold mr-2">Trophies</h3>
        <span className="text-xs text-gray-500">Top roles in this repo</span>
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        {trophies.map((t) => (
          <div
            key={`${t.roleKey}-${t.place}`}
            className="flex items-center gap-2 rounded-xl border px-3 py-2 bg-white shadow-sm hover:shadow transition"
          >
            <Medal place={t.place} size={28} noRibbon className="shrink-0" />
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-gray-800">
                #{t.place + 1} · {t.roleLabel}
              </span>
              <span className="text-[11px] text-gray-600 font-mono">
                {t.total} pts
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
