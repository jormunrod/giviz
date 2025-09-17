import { useEffect, useState } from "react";
import TopContributorsByRole from "../components/TopContributorsByRole";
import { useNavigate } from "react-router-dom";
import { useRepo } from "../hooks/useRepo";
import EffortPieChart from "../components/EffortPieChart";
import InfoTooltip from "../components/InfoTooltip";
import Card from "../components/Card";
import RepoBanner from "../components/RepoBanner";
import ContributorsList from "../components/ContributorsList";
import ContributorsRolesBarChart from "../components/ContributorsRolesBarChart";
import MessageQualityBarChart from "../components/MessageQualityBarChart";

export default function Analysis() {
  const { repoInfo } = useRepo();
  const globalEffortPercentages = repoInfo?.analysis?.globalEffortPercentages;
  const [contributors, setContributors] = useState([]);
  const [loadingContrib, setLoadingContrib] = useState(false);
  const [roleContributors, setRoleContributors] = useState(null);
  const [loadingRoleContrib, setLoadingRoleContrib] = useState(false);
  const [messageQuality, setMessageQuality] = useState([]);
  const [loadingQuality, setLoadingQuality] = useState(false);
  const [errorQuality, setErrorQuality] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    setContributors([]);
    setRoleContributors(null);
    setMessageQuality([]);
    setErrorQuality(null);
    setLoadingContrib(false);
    setLoadingRoleContrib(false);
    setLoadingQuality(false);

    async function fetchContributors() {
      if (!repoInfo?.owner || !repoInfo?.repo) return;
      setLoadingContrib(true);
      try {
        const API_BASE =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
        const url = `${API_BASE}/contributors/?owner=${repoInfo.owner}&repo=${repoInfo.repo}`;
        const res = await fetch(url);
        const data = await res.json();
        if (active) {
          if (data && Array.isArray(data.contributors)) {
            setContributors(data.contributors);
          } else {
            setContributors([]);
          }
        }
      } catch {
        if (active) setContributors([]);
      } finally {
        if (active) setLoadingContrib(false);
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
        if (active) {
          if (data && data.contributors) {
            setRoleContributors(data.contributors);
          } else {
            setRoleContributors(null);
          }
        }
      } catch {
        if (active) setRoleContributors(null);
      } finally {
        if (active) setLoadingRoleContrib(false);
      }
    }
    async function fetchMessageQuality() {
      if (!repoInfo?.owner || !repoInfo?.repo) return;
      setLoadingQuality(true);
      setErrorQuality(null);
      try {
        const API_BASE =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
        const url = `${API_BASE}/merge/contributors_message_quality/`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ owner: repoInfo.owner, repo: repoInfo.repo }),
        });
        const data = await res.json();
        if (active) {
          if (data.status === "ok" && Array.isArray(data.data)) {
            setMessageQuality(data.data);
          } else {
            setErrorQuality("Unexpected response format");
          }
        }
      } catch {
        if (active) {
          setErrorQuality("Failed to fetch data");
          setMessageQuality([]);
        }
      }
      if (active) setLoadingQuality(false);
    }
    fetchContributors();
    fetchRoleContributors();
    fetchMessageQuality();
    return () => {
      active = false;
    };
  }, [repoInfo]);

  function handleSelectContributor(username) {
    navigate(`/contributor/${username}`);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] mb-16">
      <RepoBanner owner={repoInfo?.owner} repo={repoInfo?.repo} />
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
            Collaborative Roles
          </h2>
          <InfoTooltip
            text={`This chart shows the main collaborative role detected for each contributor, based on their activity and dedication in different categories. Roles are assigned by AI according to the area where each contributor has the highest dedication.`}
          />
        </div>
        <ContributorsRolesBarChart
          owner={repoInfo?.owner}
          repo={repoInfo?.repo}
          contributors={roleContributors || undefined}
        />
      </Card>

      <Card className="mt-8 w-full max-w-2xl flex flex-col items-center">
        <div className="flex items-center mb-4">
          <h2 className="text-xl font-semibold text-center mr-2">
            Message Quality by Category
          </h2>
          <InfoTooltip text="Visualize how message quality is distributed across each category (commit, issue, PR). Quality is assessed based on clarity, usefulness, and best practices. For messages that can be improved, you will also see specific suggestions to help you write clearer and more effective contributions." />
        </div>
        {loadingQuality ? (
          <div>Loading message quality...</div>
        ) : errorQuality ? (
          <div className="text-red-500">{errorQuality}</div>
        ) : (
          <MessageQualityBarChart
            messageQuality={messageQuality}
            owner={repoInfo?.owner}
            repo={repoInfo?.repo}
          />
        )}
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
      <Card className="mt-8 w-full max-w-2xl flex flex-col items-center">
        <div className="flex items-center mb-4">
          <h2 className="text-xl font-semibold text-center mr-2">
            Contributors
          </h2>
          <InfoTooltip
            text={`Browse the contributors detected for this repository. Click any contributor to view their detailed page with roles, activity timeline, and message-quality metrics.`}
          />
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
    </div>
  );
}
