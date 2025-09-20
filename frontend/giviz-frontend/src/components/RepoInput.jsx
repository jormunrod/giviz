import { useRef, useState } from "react";
import Card from "./Card";
import TextInput from "./TextInput";
import GivizButton from "./GivizButton";
import { useRepo } from "../hooks/useRepo";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "./LoadingSpinner";
import GivizModal from "./GivizModal";

export default function RepoInput() {
  const API_BASE =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

  const parseEnvLimit = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  };

  const showDevLimitsBox =
    String(import.meta.env.VITE_SHOW_DEV_LIMITS_BOX ?? "true").toLowerCase() !==
    "false";

  const maxCommitsDefault = parseEnvLimit(import.meta.env.VITE_MAX_COMMITS, 30);
  const maxIssuesDefault = parseEnvLimit(import.meta.env.VITE_MAX_ISSUES, 30);
  const maxPullsDefault = parseEnvLimit(import.meta.env.VITE_MAX_PULLS, 30);

  const checkRepoStatus = async ({ owner, repo }) => {
    try {
      const res = await fetch(`${API_BASE}/repo/status/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error("Error checking repo status:", err);
      return null;
    }
  };
  const fetchMessageQuality = async ({ owner, repo }) => {
    try {
      // 1) Try to load cached message quality
      const resCached = await fetch(
        `${API_BASE}/merge/contributors_message_quality/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ owner, repo }),
        }
      );
      if (resCached.ok) {
        const data = await resCached.json();
        if (data?.status === "ok" && Array.isArray(data.data)) {
          return { status: "ok", results: data.data };
        }
      }

      // 2) If not cached, compute now
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

  // Styled confirmation modal for cache reuse
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMsg, setConfirmMsg] = useState("");
  const confirmResolveRef = useRef(null);

  const confirmAsync = ({ title, message }) =>
    new Promise((resolve) => {
      confirmResolveRef.current = resolve;
      setConfirmTitle(title || "");
      setConfirmMsg(message || "");
      setConfirmOpen(true);
    });
  const handleConfirmYes = () => {
    setConfirmOpen(false);
    if (confirmResolveRef.current) confirmResolveRef.current(true);
    confirmResolveRef.current = null;
  };
  const handleConfirmNo = () => {
    setConfirmOpen(false);
    if (confirmResolveRef.current) confirmResolveRef.current(false);
    confirmResolveRef.current = null;
  };

  const [maxCommits, setMaxCommits] = useState(() => maxCommitsDefault);
  const [maxIssues, setMaxIssues] = useState(() => maxIssuesDefault);
  const [maxPulls, setMaxPulls] = useState(() => maxPullsDefault);

  const examples = [
    { label: "giviz", url: "https://github.com/jormunrod/giviz" },
    {
      label: "HelloGitWorld",
      url: "https://github.com/githubtraining/hellogitworld",
    },
    {
      label: "PetClinic",
      url: "https://github.com/spring-projects/spring-petclinic",
    },
    {
      label: "PythonMiniProjects",
      url: "https://github.com/Python-World/python-mini-projects",
    },
  ];

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
      // Check repo status to see if cache is available
      const status = await checkRepoStatus(result);
      let useCache = false;
      if (status?.available) {
        const last = status?.last_updated
          ? new Date(status.last_updated).toLocaleString()
          : "unknown date";
        const msg = status?.stale_hint
          ? `Saved data found (last update: ${last}). It appears to be old. Do you want to use it anyway?`
          : `Saved data found (last update: ${last}). Do you want to use it to save time?`;
        useCache = await confirmAsync({
          title: "Reuse saved data",
          message: msg,
        });
      }

      if (useCache) {
        // Reuse cached data: skip extraction
        setStep("Loading saved analysis...");
        const analysis = await fetchAnalysis({ ...result, depth: 0 });
        // Try cached message quality first; if missing, compute now
        setStep("Fetching message quality (cached if available)...");
        const messageQuality = await fetchMessageQuality(result);
        if (analysis && messageQuality) {
          setRepoInfo({ ...result, analysis, messageQuality });
          navigate("/analysis");
        } else {
          setLoading(false);
          setStep("");
          alert("Failed to load saved analysis or message quality.");
        }
      } else {
        // Full analysis path
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
      }
    } else {
      alert("Please enter a valid GitHub URL.");
    }
  }

  const handleExample = async (url) => {
    setInputUrl(url);
    const result = extractOwnerRepo(url);
    if (result) {
      setLoading(true);
      // Check status and ask to reuse cached data
      const status = await checkRepoStatus(result);
      let useCache = false;
      if (status?.available) {
        const last = status?.last_updated
          ? new Date(status.last_updated).toLocaleString()
          : "unknown date";
        const msg = status?.stale_hint
          ? `Saved data found (last update: ${last}). It appears to be old. Do you want to use it anyway?`
          : `Saved data found (last update: ${last}). Do you want to use it to save time?`;
        useCache = await confirmAsync({
          title: "Reuse saved data",
          message: msg,
        });
      }
      if (useCache) {
        setStep("Loading saved analysis...");
        const analysis = await fetchAnalysis({ ...result, depth: 0 });
        setStep("Fetching message quality (cached if available)...");
        const messageQuality = await fetchMessageQuality(result);
        if (analysis && messageQuality) {
          setRepoInfo({ ...result, analysis, messageQuality });
          navigate("/analysis");
        } else {
          setLoading(false);
          setStep("");
          alert("Failed to load saved analysis or message quality.");
        }
      } else {
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
      }
    } else {
      alert("Please enter a valid GitHub URL.");
    }
  };

  return (
    <Card className="max-w-3xl w-full py-8 p-6 mb-12">
      {loading && (
        <div
          className="absolute inset-[1px] rounded-2xl z-20 flex items-center justify-center bg-white/70 backdrop-blur-[1px]"
          aria-busy="true"
          aria-live="polite"
          role="status"
        >
          <LoadingSpinner text={step || "Extracting repository data..."} />
        </div>
      )}
      <GivizModal
        open={confirmOpen}
        title={confirmTitle}
        message={confirmMsg}
        onConfirm={handleConfirmYes}
        onCancel={handleConfirmNo}
        confirmText={<GivizButton>Use saved data</GivizButton>}
        cancelText={
          <GivizButton variant="secondary">Recalculate now</GivizButton>
        }
      />
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-givizBlue4 leading-tight">
            Analyze a repository
          </h2>
          <p className="text-xs text-gray-500">
            Paste the GitHub repository URL and we'll show you the analysis.
          </p>
        </div>
      </div>
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
            {loading ? "Processing..." : "Analyze"}
          </GivizButton>
        </div>
      </form>
      {showDevLimitsBox && (
        <div className="mb-4">
          <div className="bg-yellow-50 border border-yellow-300 rounded p-4 flex flex-col gap-2">
            <div className="text-xs text-yellow-800 font-semibold mb-1">
              Development only: extraction limits (will be removed in
              production)
            </div>
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex flex-col items-start">
                <label
                  className="text-xs font-medium mb-1"
                  htmlFor="max-commits"
                >
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
                <label
                  className="text-xs font-medium mb-1"
                  htmlFor="max-issues"
                >
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
      )}
      {/* spacer to avoid layout jump on small screens; keeps card steady */}
      {!loading && <div className="hidden sm:block h-0" aria-hidden="true" />}
      <p className="text-sm text-gray-500 mb-2 text-center">
        Try these repositories:
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
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
