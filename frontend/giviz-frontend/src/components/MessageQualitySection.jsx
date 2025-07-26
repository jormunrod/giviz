import { useEffect, useState } from "react";
import MessageQualityBarChart from "./MessageQualityBarChart";
import Card from "./Card";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export default function MessageQualitySection({ owner, repo }) {
  const [messageQuality, setMessageQuality] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchQuality() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${API_BASE}/merge/contributors_message_quality/`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ owner, repo }),
          }
        );
        const data = await res.json();
        if (data.status === "ok" && Array.isArray(data.data)) {
          setMessageQuality(data.data);
        } else {
          setError("Unexpected response format");
        }
      } catch {
        setError("Failed to fetch data");
        setMessageQuality([]);
      }
      setLoading(false);
    }
    if (owner && repo) fetchQuality();
  }, [owner, repo]);

  return (
    <Card className="max-w-2xl w-full py-8 p-6">
      {loading ? (
        <div>Loading message quality...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <MessageQualityBarChart messageQuality={messageQuality} />
      )}
    </Card>
  );
}
