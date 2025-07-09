import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRepo } from "../hooks/useRepo";
import EffortPieChart from "../components/EffortPieChart";
import InfoTooltip from "../components/InfoTooltip";
import Card from "../components/Card";

export default function Analysis() {
  const { repoInfo } = useRepo();
  const globalEffortPercentages = repoInfo?.analysis?.globalEffortPercentages;
  const [contributors, setContributors] = useState([]);
  const [loadingContrib, setLoadingContrib] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchContributors() {
      if (!repoInfo?.owner || !repoInfo?.repo) return;
      setLoadingContrib(true);
      try {
        const API_BASE =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
        const url = `${API_BASE}/contributors/?owner=${repoInfo.owner}&repo=${repoInfo.repo}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data && Array.isArray(data.contributors)) {
          setContributors(data.contributors);
        }
      } catch {
        setContributors([]);
      } finally {
        setLoadingContrib(false);
      }
    }
    fetchContributors();
  }, [repoInfo]);

  function handleSelectContributor(username) {
    navigate(`/contributor/${username}`);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] mb-16">
      <h1 className="text-3xl font-bold mb-4">Analysis for {repoInfo?.repo}</h1>
      <div className="mt-6 bg-gray-100 p-4 rounded-lg shadow-md">
        <span className="font-semibold">Selected repo:</span>
        <div className="mt-2 text-blue-600 break-words">
          {repoInfo ? `${repoInfo.owner}/${repoInfo.repo}` : "None"}
        </div>
      </div>
      <Card className="mt-8 w-full max-w-2xl flex flex-col items-center">
        <div className="flex items-center mb-4">
          <h2 className="text-xl font-semibold text-center mr-2">
            Effort Distribution
          </h2>
          <InfoTooltip
            text={`This chart shows the percentage of total effort per category. Effort is calculated as the sum of lines added and deleted for commits, and as 1 for each issue or pull request. Categories are determined by AI classification of each contribution.`}
          />
        </div>
        <EffortPieChart
          data={globalEffortPercentages}
          contributions={repoInfo?.analysis?.classified}
        />
      </Card>
      <Card className="mt-8 w-full max-w-2xl flex flex-col items-center">
        <div className="flex items-center mb-4">
          <h2 className="text-xl font-semibold text-center mr-2">
            Select a contributor
          </h2>
        </div>
        {loadingContrib ? (
          <div className="text-center">Loading contributors...</div>
        ) : contributors.length > 0 ? (
          <select
            className="p-2 rounded border border-gray-300"
            onChange={(e) =>
              e.target.value && handleSelectContributor(e.target.value)
            }
            defaultValue=""
          >
            <option value="" disabled>
              -- Select a contributor --
            </option>
            {contributors.map((c, i) => (
              <option key={i} value={c.login || c.username || c.name}>
                {c.login || c.username || c.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="text-center">No contributors for this repo.</div>
        )}
      </Card>
    </div>
  );
}
