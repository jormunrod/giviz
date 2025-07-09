import { useRepo } from "../hooks/useRepo";
import EffortPieChart from "../components/EffortPieChart";
import InfoTooltip from "../components/InfoTooltip";
import Card from "../components/Card";

export default function Analysis() {
  const { repoInfo } = useRepo();
  const globalEffortPercentages = repoInfo?.analysis?.globalEffortPercentages;

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
    </div>
  );
}
