import { useRepo } from "../hooks/useRepo";

export default function Analysis() {
  const { repoInfo } = useRepo();
  const globalEffortPercentages = repoInfo?.analysis?.globalEffortPercentages;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-3xl font-bold mb-4">🔧 Page under construction</h1>
      <p className="text-lg mb-2">
        The collaborative analysis of your repository will be displayed here
        soon.
      </p>
      <div className="mt-6 bg-gray-100 p-4 rounded-lg shadow-md">
        <span className="font-semibold">Selected repository:</span>
        <div className="mt-2 text-blue-600 break-words">
          {repoInfo ? `${repoInfo.owner}/${repoInfo.repo}` : "None"}
        </div>
      </div>
      <div className="mt-6 bg-green-100 p-4 rounded-lg shadow-md w-full max-w-xl">
        <span className="font-semibold">Global Effort Percentages:</span>
        <pre className="text-xs mt-2 whitespace-pre-wrap break-words">
          {globalEffortPercentages
            ? JSON.stringify(globalEffortPercentages, null, 2)
            : "No data"}
        </pre>
      </div>
    </div>
  );
}
