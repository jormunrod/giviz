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
          headers: {
            "Content-Type": "application/json",
          },
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
      // Commits
      const nCommits = commitsArr.length;
      commitsByCategory[category] = nCommits;
      totalCommits += nCommits;
      commitsArr.forEach((c) => {
        if (typeof c.score === "number") {
          totalCommitScore += c.score;
          totalCommitScoreCount++;
        }
      });
      // Issues
      const nIssues = issuesArr.length;
      issuesByCategory[category] = nIssues;
      totalIssues += nIssues;
      issuesArr.forEach((i) => {
        if (typeof i.score === "number") {
          totalIssueScore += i.score;
          totalIssueScoreCount++;
        }
      });
      // PRs
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
        ? ((totalCommitScore / (totalCommitScoreCount * 10)) * 100).toFixed(1)
        : null;
    const issueQuality =
      totalIssueScoreCount > 0
        ? ((totalIssueScore / (totalIssueScoreCount * 10)) * 100).toFixed(1)
        : null;
    const prQuality =
      totalPRScoreCount > 0
        ? ((totalPRScore / (totalPRScoreCount * 10)) * 100).toFixed(1)
        : null;

    return (
      <div className="space-y-6">
        {/* Commits */}
        <div>
          <div className="font-bold text-[13px] mb-1">Commits:</div>
          <div className="ml-4">
            <div>
              Total: <span className="font-semibold">{totalCommits}</span>
            </div>
            {Object.entries(commitsByCategory).map(([cat, n]) => (
              <div key={cat}>
                {cat === "null"
                  ? "General"
                  : cat.charAt(0).toUpperCase() + cat.slice(1)}
                : <span className="font-semibold">{n}</span>
              </div>
            ))}
            <div>
              Commits quality:{" "}
              <span className="font-semibold">
                {commitQuality !== null ? `${commitQuality}%` : "N/A"}
              </span>
            </div>
          </div>
        </div>
        {/* Issues */}
        <div>
          <div className="font-bold text-[13px] mb-1">Issues:</div>
          <div className="ml-4">
            <div>
              Total: <span className="font-semibold">{totalIssues}</span>
            </div>
            {Object.entries(issuesByCategory).map(([cat, n]) => (
              <div key={cat}>
                {cat === "null"
                  ? "General"
                  : cat.charAt(0).toUpperCase() + cat.slice(1)}
                : <span className="font-semibold">{n}</span>
              </div>
            ))}
            <div>
              Issues quality:{" "}
              <span className="font-semibold">
                {issueQuality !== null ? `${issueQuality}%` : "N/A"}
              </span>
            </div>
          </div>
        </div>
        {/* PRs */}
        <div>
          <div className="font-bold text-[13px] mb-1">Pull Requests:</div>
          <div className="ml-4">
            <div>
              Total: <span className="font-semibold">{totalPRs}</span>
            </div>
            {Object.entries(prsByCategory).map(([cat, n]) => (
              <div key={cat}>
                {cat === "null"
                  ? "General"
                  : cat.charAt(0).toUpperCase() + cat.slice(1)}
                : <span className="font-semibold">{n}</span>
              </div>
            ))}
            <div>
              PRs quality:{" "}
              <span className="font-semibold">
                {prQuality !== null ? `${prQuality}%` : "N/A"}
              </span>
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
