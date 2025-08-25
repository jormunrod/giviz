import { useParams, useNavigate } from "react-router-dom";
import { useRepo } from "../hooks/useRepo";
import Card from "../components/Card";
import { useEffect, useState } from "react";
import GivizButton from "../components/GivizButton";
import ContributorRolesPieChart from "../components/Contributor/ContributorRolesPieChart";
import ContributorSummary from "../components/Contributor/ContributorSummary";
import ContributorStats from "../components/Contributor/ContributorStats";

export default function Contributor() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { repoInfo } = useRepo();
  const [contributor, setContributor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchContributor() {
      if (!repoInfo?.owner || !repoInfo?.repo || !username) return;
      setLoading(true);
      setError(null);
      try {
        const API_BASE =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
        const url = `${API_BASE}/contributors/single/?owner=${repoInfo.owner}&repo=${repoInfo.repo}&username=${username}`;
        const res = await fetch(url);
        const data = await res.json();
        if (res.ok && data.contributor) {
          setContributor(data.contributor);
        } else {
          setError(data.error || "Contributor not found");
        }
      } catch {
        setError("Error fetching contributor data");
      } finally {
        setLoading(false);
      }
    }
    fetchContributor();
  }, [repoInfo, username]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] mb-16">
      <GivizButton
        className="self-start mb-4"
        onClick={() => navigate("/analysis")}
      >
        ← Back to general analysis
      </GivizButton>
      <Card className="w-full max-w-3xl p-10 flex flex-col items-center">
        {loading ? (
          <span className="text-gray-500">Loading contributor...</span>
        ) : error ? (
          <span className="text-red-600 font-semibold">{error}</span>
        ) : (
          <div className="flex flex-col md:flex-row items-center mb-8 w-full gap-8">
            <div className="flex-shrink-0 flex items-center justify-center w-full md:w-auto">
              <img
                src={
                  contributor?.avatar_url ||
                  contributor?.avatar ||
                  `https://github.com/${username}.png`
                }
                alt={username}
                className="w-32 h-32 rounded-full border-4 border-blue-200 shadow object-cover bg-white ring-2 ring-blue-400/30 mb-4 md:mb-0 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:ring-4 hover:ring-blue-400/60 avatar-glow"
                onError={(e) => (e.target.style.display = "none")}
                style={{
                  boxShadow: "0 0 0 0 #3b82f6, 0 0 20px 4px #60a5fa33",
                }}
              />
            </div>
            <div className="flex flex-col items-center md:items-start w-full">
              <span className="font-bold text-2xl text-gray-800 mb-1">
                {contributor?.login || contributor?.username || username}
              </span>
              {contributor?.name && contributor?.name !== username && (
                <span className="text-gray-500 text-lg mb-1">
                  {contributor.name}
                </span>
              )}
              {contributor?.bio && (
                <span className="text-gray-600 text-base text-center md:text-left mt-2">
                  {contributor.bio}
                </span>
              )}
              <div className="flex flex-col items-center md:items-start mt-4 space-y-1 w-full">
                {contributor?.company && (
                  <span className="text-gray-700 text-base">
                    <b>Company:</b> {contributor.company}
                  </span>
                )}
                {contributor?.location && (
                  <span className="text-gray-700 text-base">
                    <b>Location:</b> {contributor.location}
                  </span>
                )}
                {contributor?.email && (
                  <span className="text-gray-700 text-base">
                    <b>Email:</b> {contributor.email}
                  </span>
                )}
                {contributor?.url && (
                  <span className="text-gray-700 text-base">
                    <b>GitHub:</b>{" "}
                    <a
                      href={contributor.url}
                      className="text-blue-600 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {contributor.url}
                    </a>
                  </span>
                )}
                {contributor?.createdAt && (
                  <span className="text-gray-700 text-base">
                    <b>Joined:</b>{" "}
                    {new Date(contributor.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
        <div>
          <span className="font-semibold text-gray-700 mb-4">
            Summary of Contributions
          </span>
        </div>
        {repoInfo?.owner && repoInfo?.repo && username && (
          <ContributorSummary
            owner={repoInfo.owner}
            repo={repoInfo.repo}
            contributor={username}
          />
        )}
        <div className="w-full mt-4 p-6 rounded-2xl flex flex-col items-center">
          <span className="font-semibold text-gray-700 mb-4">
            Collaborative Roles
          </span>
          {repoInfo?.owner && repoInfo?.repo && username && (
            <div className="w-full max-w-md">
              <ContributorRolesPieChart
                owner={repoInfo.owner}
                repo={repoInfo.repo}
                username={username}
              />
            </div>
          )}
        </div>
        <div>
          <span className="font-semibold text-gray-700 mb-4">Stats</span>
        </div>
        {repoInfo?.owner && repoInfo?.repo && username && (
          <ContributorStats
            owner={repoInfo.owner}
            repo={repoInfo.repo}
            contributor={username}
          />
        )}
      </Card>
    </div>
  );
}
