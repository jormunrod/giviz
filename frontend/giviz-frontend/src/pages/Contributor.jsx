import { useParams, useNavigate } from "react-router-dom";

export default function Contributor() {
  const { username } = useParams();
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] mb-16">
      <button
        className="self-start mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        onClick={() => navigate("/analysis")}
      >
        ← Back to general analysis
      </button>
      <h1 className="text-3xl font-bold mb-4">Contributor: {username}</h1>
      {/* Cards with contributor information will be added here */}
      <div className="mt-6 bg-gray-100 p-4 rounded-lg shadow-md">
        <span className="font-semibold">
          Contributor view under development...
        </span>
      </div>
    </div>
  );
}
