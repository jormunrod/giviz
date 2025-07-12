import { useEffect, useState } from "react";
import TopContributorsByRole from "../components/TopContributorsByRole";
import { useNavigate } from "react-router-dom";
import { useRepo } from "../hooks/useRepo";
import EffortPieChart from "../components/EffortPieChart";
import InfoTooltip from "../components/InfoTooltip";
import Card from "../components/Card";
import ContributorsList from "../components/ContributorsList";
import ContributorsRolesBarChart from "../components/ContributorsRolesBarChart";

export default function Analysis() {
  const { repoInfo } = useRepo();
  const globalEffortPercentages = repoInfo?.analysis?.globalEffortPercentages;
  const [contributors, setContributors] = useState([]);
  const [loadingContrib, setLoadingContrib] = useState(false);
  const [roleContributors, setRoleContributors] = useState(null);
  const [loadingRoleContrib, setLoadingRoleContrib] = useState(false);
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
    async function fetchRoleContributors() {
      if (!repoInfo?.owner || !repoInfo?.repo) return;
      setLoadingRoleContrib(true);
      try {
        const API_BASE =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
        const url = `${API_BASE}/merge/contributors_effort_by_category/`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ owner: repoInfo.owner, repo: repoInfo.repo }),
        });
        const data = await res.json();
        if (data && data.contributors) {
          setRoleContributors(data.contributors);
        } else {
          setRoleContributors(null);
        }
      } catch {
        setRoleContributors(null);
      } finally {
        setLoadingRoleContrib(false);
      }
    }
    fetchContributors();
    fetchRoleContributors();
  }, [repoInfo]);

  function handleSelectContributor(username) {
    navigate(`/contributor/${username}`);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] mb-16">
      <Card className="mt-10 w-full max-w-md flex flex-row items-center gap-4 border border-black bg-white/80">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-10 h-10 text-givizBlue4"
          aria-label="GitHub logo"
        >
          <path
            fillRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.483 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.339-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.202 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.847-2.338 4.695-4.566 4.944.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.749 0 .268.18.579.688.481C19.138 20.2 22 16.447 22 12.021 22 6.484 17.523 2 12 2Z"
            clipRule="evenodd"
          />
        </svg>
        <div className="flex flex-col">
          <span className="uppercase tracking-widest text-xs text-gray-400 mb-1">
            Analysis for
          </span>
          <a
            href={`https://github.com/${repoInfo?.owner}/${repoInfo?.repo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-2xl font-extrabold text-givizBlue4 hover:underline flex items-center gap-1"
          >
            <span className="text-gray-700">{repoInfo?.owner}</span>
            <span className="mx-1 text-gray-400">/</span>
            <span className="text-givizBlue4">{repoInfo?.repo}</span>
          </a>
          <span className="text-xs text-gray-500 mt-1 break-all">
            https://github.com/{repoInfo?.owner}/{repoInfo?.repo}
          </span>
        </div>
      </Card>
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
          <ContributorsList
            contributors={contributors}
            onSelect={handleSelectContributor}
            pageSize={10}
          />
        ) : (
          <div className="text-center">No contributors for this repo.</div>
        )}
      </Card>
      <Card className="mt-8 w-full max-w-2xl flex flex-col items-center">
        <div className="flex items-center mb-4">
          <h2 className="text-xl font-semibold text-center mr-2">
            Collaborative Roles
          </h2>
          <InfoTooltip
            text={`This chart shows the main collaborative role detected for each contributor, based on their activity and dedication in different categories. Roles are assigned by AI according to the area where each contributor has the highest dedication.`}
          />
        </div>
        <ContributorsRolesBarChart
          owner={repoInfo?.owner}
          repo={repoInfo?.repo}
        />
      </Card>
      <Card className="mt-8 w-full max-w-2xl flex flex-col items-center">
        <div className="flex items-center mb-4">
          <h2 className="text-xl font-semibold text-center mr-2">
            Top 3 Contributors by Role
          </h2>
          <InfoTooltip
            text={`This chart shows the top 3 contributors for each role detected in the repository. Roles are assigned by AI based on the amount of lines added and deleted, issues opened, and pull requests merged.`}
          />
        </div>
        {loadingRoleContrib ? (
          <div className="text-center">Loading top contributors by role...</div>
        ) : roleContributors ? (
          <TopContributorsByRole contributors={roleContributors} />
        ) : (
          <div className="text-center text-gray-400">
            No contributor data available for top roles.
          </div>
        )}
      </Card>
    </div>
  );
}
