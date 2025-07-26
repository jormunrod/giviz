import { useState, useEffect, useMemo } from "react";
import Card from "./Card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import GivizButton from "./GivizButton";

const CATEGORY_LABELS = {
  commit: "Commits",
  issue: "Issues",
  pr: "PRs",
};

const QUALITY_BANDS = [
  { label: "Low", min: 0, max: 5, color: "#FF6699" },
  { label: "Medium", min: 6, max: 8, color: "#FFBB28" },
  { label: "High", min: 9, max: 10, color: "#00C49F" },
];

export default function MessageQualityBarChart() {
  const [messageQuality, setMessageQuality] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedType, setSelectedType] = useState("commit");

  // Puedes cambiar estos valores por props si lo necesitas
  const owner = "jormunrod";
  const repo = "giviz";
  const API_BASE =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

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
    fetchQuality();
  }, [owner, repo]);

  const filtered = useMemo(() => {
    if (!Array.isArray(messageQuality)) return [];
    return messageQuality.filter((m) => m.type === selectedType);
  }, [messageQuality, selectedType]);

  const bandCounts = useMemo(() => {
    const counts = QUALITY_BANDS.map((band) => ({
      label: band.label,
      color: band.color,
      count: 0,
    }));
    filtered.forEach((msg) => {
      const bandIdx = QUALITY_BANDS.findIndex(
        (b) => msg.score >= b.min && msg.score <= b.max
      );
      if (bandIdx !== -1) counts[bandIdx].count++;
    });
    return counts;
  }, [filtered]);

  return (
    <Card className="max-w-2xl w-full py-8 p-6">
      {loading ? (
        <div>Loading message quality...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <>
          <div className="flex gap-2 mb-4">
            {Object.entries(CATEGORY_LABELS).map(([type, label]) => (
              <GivizButton
                key={type}
                className={`mb-4 ${
                  selectedType === type
                    ? "bg-givizPurple text-white"
                    : "bg-blue-300 text-givizPurple border border-givizPurple"
                }`}
                onClick={() => setSelectedType(type)}
              >
                {label}
              </GivizButton>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={bandCounts}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip
                formatter={(value, name) => [`${value} contributions`, name]}
                labelFormatter={(label) => `${label} quality`}
              />
              <Bar dataKey="count">
                {bandCounts.map((entry) => (
                  <Cell key={entry.label} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 text-xs text-gray-500">
            Total analyzed: {filtered.length}
          </div>
        </>
      )}
    </Card>
  );
  // ...existing code...
}
