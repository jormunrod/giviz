import React, { useState } from "react";

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
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 divide-y-0">
        {paginated.map((c, i) => (
          <li
            key={c.login || c.username || c.name || i}
            className="flex items-center py-4 px-3 cursor-pointer hover:bg-blue-50 rounded-lg shadow-sm transition mb-2 border border-gray-100"
            onClick={() => onSelect(c.login || c.username || c.name)}
          >
            <img
              src={
                c.avatar_url ||
                c.avatar ||
                `https://github.com/${c.login || c.username || c.name}.png`
              }
              alt={c.login || c.username || c.name}
              className="w-12 h-12 rounded-full mr-4 border object-cover bg-white"
              onError={(e) => (e.target.style.display = "none")}
            />
            <span className="font-semibold text-lg text-gray-800">
              {c.login || c.username || c.name}
            </span>
          </li>
        ))}
      </ul>
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          <button
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Previous
          </button>
          <span className="px-2">
            Page {page + 1} of {totalPages}
          </span>
          <button
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
