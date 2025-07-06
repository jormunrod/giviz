import { useState } from "react";
import Card from "./Card";
import TextInput from "./TextInput";
import GivizButton from "./GivizButton";
import { useRepo } from "../hooks/useRepo";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "./LoadingSpinner";

export default function RepoInput() {
  const [inputUrl, setInputUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("");
  const { setRepoInfo } = useRepo();
  const navigate = useNavigate();

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
        body: JSON.stringify({ owner, repo, depth }),
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
      return data && data.status === "ok" && Array.isArray(data.percentages)
        ? { globalEffortPercentages: data.percentages }
        : null;
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
        if (analysis) {
          setRepoInfo({ ...result, analysis });
          navigate("/analysis");
        } else {
          setLoading(false);
          setStep("");
          alert("Failed to classify contributions.");
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
        if (analysis) {
          setRepoInfo({ ...result, analysis });
          navigate("/analysis");
        } else {
          setLoading(false);
          setStep("");
          alert("Failed to classify contributions.");
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
      <form onSubmit={handleSubmit} className="flex items-center gap-4 mb-4">
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
      </form>
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
