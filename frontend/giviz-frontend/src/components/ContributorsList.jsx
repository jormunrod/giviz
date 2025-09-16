import React, { useState } from "react";
import GivizButton from "./GivizButton";

export default function ContributorsList({
  contributors = [],
  onSelect,
  pageSize = 6,
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(contributors.length / pageSize);
  const paginated = contributors.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="w-full">
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {paginated.map((c, i) => (
          <li
            key={c.login || c.username || c.name || i}
            className="flex items-center bg-white/80 backdrop-blur-md py-5 px-4 cursor-pointer hover:scale-[1.025] hover:shadow-lg hover:bg-blue-100/60 transition-all duration-200 rounded-2xl shadow border border-gray-200 mb-2"
            onClick={() => onSelect(c.login || c.username || c.name)}
            style={{ minHeight: 70 }}
          >
            <div className="flex-shrink-0">
              <img
                src={
                  c.avatar_url ||
                  c.avatar ||
                  `https://github.com/${c.login || c.username || c.name}.png`
                }
                alt={c.login || c.username || c.name}
                className="w-14 h-14 rounded-full border-4 border-blue-200 shadow object-cover bg-white ring-2 ring-blue-400/30"
                onError={(e) => (e.target.style.display = "none")}
              />
            </div>
            <div className="ml-5 flex flex-col justify-center">
              <span className="font-bold text-lg text-gray-800 mb-1">
                {c.login || c.username || c.name}
              </span>
              {c.name && c.name !== c.login && c.name !== c.username && (
                <span className="text-gray-500 text-sm">{c.name}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <GivizButton
            variant="secondary"
            className="px-2 py-1"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Previous
          </GivizButton>
          <span className="text-xs text-gray-600">
            Page {page + 1} of {totalPages}
          </span>
          <GivizButton
            variant="secondary"
            className="px-2 py-1"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
          >
            Next
          </GivizButton>
        </div>
      )}
    </div>
  );
}
