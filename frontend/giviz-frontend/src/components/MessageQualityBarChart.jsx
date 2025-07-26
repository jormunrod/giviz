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
  const [suggestionsPage, setSuggestionsPage] = useState(0);
  const SUGGESTIONS_PER_PAGE = 3;

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

  // Filter messages with suggestions
  const messagesWithSuggestions = filtered.filter(
    (msg) => Array.isArray(msg.suggestions) && msg.suggestions.length > 0
  );
  const totalPages = Math.ceil(
    messagesWithSuggestions.length / SUGGESTIONS_PER_PAGE
  );
  const paginatedSuggestions = messagesWithSuggestions.slice(
    suggestionsPage * SUGGESTIONS_PER_PAGE,
    (suggestionsPage + 1) * SUGGESTIONS_PER_PAGE
  );

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
            onClick={() => {
              setSelectedType(type);
              setSuggestionsPage(0);
            }}
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

      <div className="w-full mt-6">
        {messagesWithSuggestions.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold mb-2 text-givizPurple">
              Suggestions to improve messages
            </h3>
            <ul className="space-y-4">
              {paginatedSuggestions.map((msg) => (
                <li key={msg.id} className="">
                  <div className="text-xs text-gray-700 font-bold mb-1">
                    <span className="mr-2">Problem:</span>
                    <a
                      href={`https://github.com/search?q=${msg.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-givizBlue4 underline"
                    >
                      {msg.text.length > 80
                        ? msg.text.slice(0, 80) + "..."
                        : msg.text}
                    </a>
                  </div>
                  <div className="text-xs text-gray-600 mb-1">Suggestions:</div>
                  <ul className="list-disc ml-6 text-xs text-gray-600">
                    {msg.suggestions.map((sug, idx) => (
                      <li key={idx}>{sug}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-6 gap-2">
                <GivizButton
                  className="px-2 py-1 text-xs"
                  onClick={() => setSuggestionsPage((p) => Math.max(0, p - 1))}
                  disabled={suggestionsPage === 0}
                >
                  &#60;
                </GivizButton>
                <span className="text-xs text-gray-500 font-medium">
                  {suggestionsPage + 1}/{totalPages}
                </span>
                <GivizButton
                  className="px-2 py-1 text-xs"
                  onClick={() =>
                    setSuggestionsPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={suggestionsPage === totalPages - 1}
                >
                  &#62;
                </GivizButton>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
