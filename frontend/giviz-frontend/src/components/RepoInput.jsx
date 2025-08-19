import { useState } from "react";
import Card from "./Card";
import TextInput from "./TextInput";
import GivizButton from "./GivizButton";
import { useRepo } from "../hooks/useRepo";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "./LoadingSpinner";

export default function RepoInput() {
  const fetchMessageQuality = async ({ owner, repo }) => {
    try {
      const res = await fetch(`${API_BASE}/analysis/analyze_message_quality/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo,
          type: "all",
          max_commits: maxCommits,
          max_issues: maxIssues,
          max_pulls: maxPulls,
        }),
      });
      const data = await res.json();
      return data;
    } catch (err) {
      alert("Error fetching message quality data");
      console.error("Error fetching message quality data:", err);
      return null;
    }
  };
  const [inputUrl, setInputUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("");
  const { setRepoInfo } = useRepo();
  const navigate = useNavigate();

  const [maxCommits, setMaxCommits] = useState(30);
  const [maxIssues, setMaxIssues] = useState(30);
  const [maxPulls, setMaxPulls] = useState(30);

  const examples = [
    { label: "giviz", url: "https://github.com/jormunrod/giviz" },
    { label: "Rath", url: "https://github.com/rath-team/rath" },
    {
      label: "PetClinic",
      url: "https://github.com/spring-projects/spring-petclinic",
    },
    { label: "Mastodon", url: "https://github.com/mastodon/mastodon" },
  ];

  const API_BASE =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

  const extractOwnerRepo = (url) => {
    const regex = /github\.com\/([\w.-]+)\/([\w.-]+)(\/)?$/;
    const match = url.match(regex);
    if (!match) return null;
    return { owner: match[1], repo: match[2] };
  };

  const extractAll = async ({ owner, repo, depth = 0 }) => {
    try {
      const res = await fetch(`${API_BASE}/repo/extract_all/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo,
          depth,
          max_commits: maxCommits,
          max_issues: maxIssues,
          max_pulls: maxPulls,
        }),
      });
      const data = await res.json();
      return data;
    } catch (err) {
      alert("Error extracting repo data");
      console.error("Error extracting repo data:", err);
      return null;
    }
  };

  const fetchAnalysis = async ({ owner, repo, depth = 0 }) => {
    try {
      const res = await fetch(
        `${API_BASE}/analysis/classify_contributions_percentages/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ owner, repo, depth }),
        }
      );
      const data = await res.json();
      let classified = null;
      if (data && data.status === "ok" && Array.isArray(data.percentages)) {
        if (data.classified) {
          classified = data.classified;
        } else {
          const res2 = await fetch(
            `${API_BASE}/analysis/classify_contributions/`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ owner, repo, depth }),
            }
          );
          const data2 = await res2.json();
          if (
            data2 &&
            data2.status === "ok" &&
            Array.isArray(data2.classified)
          ) {
            classified = data2.classified;
          }
        }
        return {
          globalEffortPercentages: data.percentages,
          classified: classified || [],
        };
      }
      return null;
    } catch (err) {
      alert("Error fetching analysis data");
      console.error("Error fetching analysis data:", err);
      return null;
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = inputUrl.trim();
    const result = extractOwnerRepo(trimmed);
    if (result) {
      setLoading(true);
      setStep("Cloning and extracting repository data...");
      const extractResult = await extractAll({ ...result, depth: 0 });
      if (extractResult && extractResult.status === "ok") {
        setStep("Analyzing contributions with AI...");
        const analysis = await fetchAnalysis({ ...result, depth: 0 });
        setStep("Analyzing message quality...");
        const messageQuality = await fetchMessageQuality(result);
        if (analysis && messageQuality) {
          setRepoInfo({ ...result, analysis, messageQuality });
          navigate("/analysis");
        } else {
          setLoading(false);
          setStep("");
          alert("Failed to classify contributions or fetch message quality.");
        }
      } else {
        setLoading(false);
        setStep("");
        alert("Failed to extract repository data.");
      }
    } else {
      alert("Please enter a valid GitHub repository URL.");
    }
  }

  const handleExample = async (url) => {
    setInputUrl(url);
    const result = extractOwnerRepo(url);
    if (result) {
      setLoading(true);
      setStep("Cloning and extracting repository data...");
      const extractResult = await extractAll({ ...result, depth: 0 });
      if (extractResult && extractResult.status === "ok") {
        setStep("Analyzing contributions with AI...");
        const analysis = await fetchAnalysis({ ...result, depth: 0 });
        setStep("Analyzing message quality...");
        const messageQuality = await fetchMessageQuality(result);
        if (analysis && messageQuality) {
          setRepoInfo({ ...result, analysis, messageQuality });
          navigate("/analysis");
        } else {
          setLoading(false);
          setStep("");
          alert("Failed to classify contributions or fetch message quality.");
        }
      } else {
        setLoading(false);
        setStep("");
        alert("Failed to extract repository data.");
      }
    } else {
      alert("Please enter a valid GitHub repository URL.");
    }
  };

  return (
    <Card className="max-w-3xl w-full py-8 p-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-4">
        <div className="flex items-center gap-4">
          <TextInput
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="https://github.com/user/repo"
            className="flex-grow"
          />
          <GivizButton
            type="submit"
            className="px-6 py-2 text-sm"
            disabled={loading}
          >
            {loading ? "Extracting..." : "Go!"}
          </GivizButton>
        </div>
      </form>
      {/* DEV LIMITS BOX - REMOVE IN PRODUCTION */}
      <div className="mb-4">
        <div className="bg-yellow-50 border border-yellow-300 rounded p-4 flex flex-col gap-2">
          <div className="text-xs text-yellow-800 font-semibold mb-1">
            Development only: Extraction limits (will be removed in production)
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex flex-col items-start">
              <label className="text-xs font-medium mb-1" htmlFor="max-commits">
                Max commits
              </label>
              <input
                id="max-commits"
                type="number"
                min={1}
                value={maxCommits}
                onChange={(e) => setMaxCommits(Number(e.target.value))}
                className="w-20 border rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-givizPurple"
              />
            </div>
            <div className="flex flex-col items-start">
              <label className="text-xs font-medium mb-1" htmlFor="max-issues">
                Max issues
              </label>
              <input
                id="max-issues"
                type="number"
                min={1}
                value={maxIssues}
                onChange={(e) => setMaxIssues(Number(e.target.value))}
                className="w-20 border rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-givizPurple"
              />
            </div>
            <div className="flex flex-col items-start">
              <label className="text-xs font-medium mb-1" htmlFor="max-pulls">
                Max PRs
              </label>
              <input
                id="max-pulls"
                type="number"
                min={1}
                value={maxPulls}
                onChange={(e) => setMaxPulls(Number(e.target.value))}
                className="w-20 border rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-givizPurple"
              />
            </div>
          </div>
        </div>
      </div>
      {loading && (
        <LoadingSpinner text={step || "Extracting repository data..."} />
      )}
      <p className="text-sm text-givizBlack mb-2">
        Try these example repositories:
      </p>
      <div className="flex flex-wrap gap-3">
        {examples.map(({ label, url }) => (
          <GivizButton
            key={label}
            className="px-4 py-1 text-sm"
            onClick={() => handleExample(url)}
            disabled={loading}
          >
            {label}
          </GivizButton>
        ))}
      </div>
    </Card>
  );
}
