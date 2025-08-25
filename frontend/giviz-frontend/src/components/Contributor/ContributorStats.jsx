import React, { useEffect, useState } from "react";

export default function ContributorStats({ owner, repo, contributor }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!owner || !repo || !contributor) return;
    setLoading(true);
    setError(null);
    async function fetchStats() {
      try {
        const API_BASE =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
        const url = `${API_BASE}/merge/contributor_stats/`;
        const body = JSON.stringify({ owner, repo, contributor });
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
        const data = await res.json();
        if (res.ok && data.stats) {
          setStats(data.stats);
        } else {
          setError(data.error || "No stats available");
        }
      } catch {
        setError("Error fetching stats");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [owner, repo, contributor]);

  function QualityBar({ value }) {
    if (value === null) return <span className="text-gray-400 ml-1">N/A</span>;
    const pct = value;
    const color =
      pct >= 80
        ? "bg-green-500"
        : pct >= 60
        ? "bg-emerald-400"
        : pct >= 40
        ? "bg-amber-400"
        : pct >= 20
        ? "bg-orange-500"
        : "bg-red-500";
    return (
      <span className="inline-flex items-center gap-2 ml-1">
        <span className="relative inline-block w-24 h-2 rounded bg-gray-200 overflow-hidden align-middle">
          <span
            className={`${color} absolute inset-y-0 left-0`}
            style={{ width: `${pct}%` }}
            aria-label={`Quality ${pct}%`}
          />
        </span>
        <span className="tabular-nums">{pct}%</span>
      </span>
    );
  }

  function renderStats(stats) {
    if (!stats || typeof stats !== "object") return null;
    const contributorStats = stats[contributor];
    if (!contributorStats) return <span>No stats for this contributor.</span>;

    let totalCommits = 0,
      totalCommitScore = 0,
      totalCommitScoreCount = 0;
    let totalIssues = 0,
      totalIssueScore = 0,
      totalIssueScoreCount = 0;
    let totalPRs = 0,
      totalPRScore = 0,
      totalPRScoreCount = 0;

    const commitsByCategory = {},
      issuesByCategory = {},
      prsByCategory = {};

    Object.entries(contributorStats).forEach(([category, catStats]) => {
      const commitsArr = Array.isArray(catStats.commits)
        ? catStats.commits
        : [];
      const issuesArr = Array.isArray(catStats.issues) ? catStats.issues : [];
      const pullsArr = Array.isArray(catStats.pulls) ? catStats.pulls : [];

      const nCommits = commitsArr.length;
      commitsByCategory[category] = nCommits;
      totalCommits += nCommits;
      commitsArr.forEach((c) => {
        if (typeof c.score === "number") {
          totalCommitScore += c.score;
          totalCommitScoreCount++;
        }
      });

      const nIssues = issuesArr.length;
      issuesByCategory[category] = nIssues;
      totalIssues += nIssues;
      issuesArr.forEach((i) => {
        if (typeof i.score === "number") {
          totalIssueScore += i.score;
          totalIssueScoreCount++;
        }
      });

      const nPRs = pullsArr.length;
      prsByCategory[category] = nPRs;
      totalPRs += nPRs;
      pullsArr.forEach((p) => {
        if (typeof p.score === "number") {
          totalPRScore += p.score;
          totalPRScoreCount++;
        }
      });
    });

    const commitQuality =
      totalCommitScoreCount > 0
        ? +((totalCommitScore / (totalCommitScoreCount * 10)) * 100).toFixed(1)
        : null;
    const issueQuality =
      totalIssueScoreCount > 0
        ? +((totalIssueScore / (totalIssueScoreCount * 10)) * 100).toFixed(1)
        : null;
    const prQuality =
      totalPRScoreCount > 0
        ? +((totalPRScore / (totalPRScoreCount * 10)) * 100).toFixed(1)
        : null;

    const prettyCat = (cat) =>
      cat === "null" ? "General" : cat.charAt(0).toUpperCase() + cat.slice(1);

    return (
      <div className="space-y-6">
        {/* Commits */}
        <div>
          <div className="font-bold text-[13px] mb-1">Commits:</div>
          <div className="ml-4 space-y-1">
            <div>
              Total: <span className="font-semibold">{totalCommits}</span>
            </div>
            {Object.entries(commitsByCategory).map(([cat, n]) => (
              <div key={cat}>
                {prettyCat(cat)}: <span className="font-semibold">{n}</span>
              </div>
            ))}
            <div>
              Quality:
              <QualityBar value={commitQuality} />
            </div>
          </div>
        </div>
        {/* Issues */}
        <div>
          <div className="font-bold text-[13px] mb-1">Issues:</div>
          <div className="ml-4 space-y-1">
            <div>
              Total: <span className="font-semibold">{totalIssues}</span>
            </div>
            {Object.entries(issuesByCategory).map(([cat, n]) => (
              <div key={cat}>
                {prettyCat(cat)}: <span className="font-semibold">{n}</span>
              </div>
            ))}
            <div>
              Quality:
              <QualityBar value={issueQuality} />
            </div>
          </div>
        </div>
        {/* PRs */}
        <div>
          <div className="font-bold text-[13px] mb-1">Pull Requests:</div>
          <div className="ml-4 space-y-1">
            <div>
              Total: <span className="font-semibold">{totalPRs}</span>
            </div>
            {Object.entries(prsByCategory).map(([cat, n]) => (
              <div key={cat}>
                {prettyCat(cat)}: <span className="font-semibold">{n}</span>
              </div>
            ))}
            <div>
              Quality:
              <QualityBar value={prQuality} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-xs leading-tight text-left">
      {loading ? (
        <span className="text-gray-500">Loading stats...</span>
      ) : error ? (
        <span className="text-red-600 font-semibold">{error}</span>
      ) : (
        renderStats(stats)
      )}
    </div>
  );
}
