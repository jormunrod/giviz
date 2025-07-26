import { useState, useMemo } from "react";
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
  { label: "High", min: 9, max: 10, color: "#00C49F" },
  { label: "Medium", min: 6, max: 8, color: "#FFBB28" },
  { label: "Low", min: 0, max: 5, color: "#FF6699" },
];

export default function MessageQualityBarChart({ messageQuality }) {
  const [selectedType, setSelectedType] = useState("commit");

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
    <div className="w-full flex flex-col items-center justify-center transition-all duration-500 pt-8 pb-4">
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
      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={bandCounts}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} />
          <YAxis type="category" dataKey="label" />
          <Tooltip
            formatter={(value, name) => [`${value} contributions`, name]}
            labelFormatter={(label) => `${label} quality`}
          />
          <Bar dataKey="count" orientation="left">
            {bandCounts.map((entry) => (
              <Cell key={entry.label} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 text-xs text-gray-500">
        Total analyzed: {filtered.length}
      </div>
    </div>
  );
}
