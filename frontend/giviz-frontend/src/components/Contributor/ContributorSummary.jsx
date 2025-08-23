import React, { useEffect, useState } from "react";

export default function ContributorSummary({ owner, repo, contributor }) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!owner || !repo || !contributor) return;
    setLoading(true);
    setError(null);
    async function fetchSummary() {
      try {
        const API_BASE =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
        const url = `${API_BASE}/analysis/summarize_contributor_activity/`;
        const body = JSON.stringify({ owner, repo, contributor });
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        });
        const data = await res.json();
        if (res.ok && data.summary) {
          setSummary(data.summary);
        } else {
          setError(data.error || "No summary available");
        }
      } catch {
        setError("Error fetching summary");
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, [owner, repo, contributor]);

  return (
    <div className="w-full max-w-2xl bg-blue-50 border border-blue-200 rounded-xl p-6 mt-4 shadow">
      {loading ? (
        <span className="text-gray-500">Loading summary...</span>
      ) : error ? (
        <span className="text-red-600 font-semibold">{error}</span>
      ) : (
        <span className="text-gray-800 text-base whitespace-pre-line">
          {summary}
        </span>
      )}
    </div>
  );
}
