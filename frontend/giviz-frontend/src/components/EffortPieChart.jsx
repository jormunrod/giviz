import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useState } from "react";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A28CFF",
  "#FF6699",
  "#00B8D9",
];

function groupSmallCategories(data, threshold = 2) {
  let others = [];
  let sumOthers = 0;
  const main = [];
  for (const item of data) {
    if (item.percentage < threshold) {
      others.push(item);
      sumOthers += item.percentage;
    } else {
      main.push(item);
    }
  }
  if (others.length > 0) {
    main.push({
      category: "Others",
      percentage: Number(sumOthers.toFixed(2)),
      _details: others,
    });
  }
  return main;
}

export default function EffortPieChart({ data }) {
  const [showDetails, setShowDetails] = useState(false);
  if (!Array.isArray(data) || data.length === 0) {
    return <div className="text-gray-500">No data to display</div>;
  }
  const grouped = groupSmallCategories(data);
  const othersDetails =
    grouped.find((c) => c.category === "Others")?._details || [];

  return (
    <div
      className={`w-full flex flex-col items-center justify-center transition-all duration-500 ${
        showDetails ? "h-auto min-h-[28rem]" : "h-80"
      }`}
    >
      <ResponsiveContainer width="100%" height={showDetails ? 320 : "100%"}>
        <PieChart>
          <Pie
            data={grouped}
            dataKey="percentage"
            nameKey="category"
            cx="50%"
            cy="50%"
            outerRadius={100}
            labelLine={false}
          >
            {grouped.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name, props) => {
              if (
                props.payload.category === "Others" &&
                props.payload._details
              ) {
                return [`${value}%`, `${name} (click for details)`];
              }
              return [`${value}%`, name];
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      {othersDetails.length > 0 && (
        <button
          className="mt-4 flex items-center gap-1 text-sm text-blue-700 font-medium hover:underline focus:outline-none"
          onClick={() => setShowDetails((v) => !v)}
        >
          {showDetails ? (
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path stroke="#2563eb" strokeWidth="2" d="M18 15l-6-6-6 6" />
            </svg>
          ) : (
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path stroke="#2563eb" strokeWidth="2" d="M6 9l6 6 6-6" />
            </svg>
          )}
          {showDetails
            ? "Hide details of 'Others'"
            : "Show details of 'Others'"}
        </button>
      )}
      <div
        className={`transition-all duration-500 overflow-hidden w-full flex justify-center ${
          showDetails ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"
        }`}
        aria-hidden={!showDetails}
      >
        <div className="bg-givizBlue1 border-2 border-givizBlue3 rounded-2xl p-5 w-full max-w-md text-sm shadow-lg">
          <strong className="block mb-2 text-givizBlue3 text-base font-bold">
            Categories in 'Others':
          </strong>
          <ul className="list-disc ml-5 space-y-1">
            {othersDetails.map((item, i) => (
              <li key={i} className="text-givizBlue4">
                <span className="font-semibold">{item.category}</span>:{" "}
                {item.percentage.toFixed(2)}%
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
