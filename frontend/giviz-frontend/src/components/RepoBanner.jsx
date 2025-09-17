import { useEffect, useState } from "react";
import Card from "./Card";

export default function RepoBanner({ owner, repo }) {
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    async function fetchMeta() {
      if (!owner || !repo) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
        if (!res.ok) throw new Error("Failed to load repo metadata");
        const data = await res.json();
        if (active) setMeta(data);
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchMeta();
    return () => {
      active = false;
    };
  }, [owner, repo]);

  const htmlUrl = meta?.html_url || (owner && repo ? `https://github.com/${owner}/${repo}` : "#");
  const description = meta?.description;
  const language = meta?.language;
  const stars = meta?.stargazers_count;
  const forks = meta?.forks_count;
  const license = meta?.license?.spdx_id || meta?.license?.key || null;
  const updatedAt = meta?.updated_at
    ? new Date(meta.updated_at).toLocaleDateString()
    : null;

  return (
    <Card className="mt-10 w-full max-w-3xl p-0 overflow-hidden">
      {/* Top gradient header */}
      <div className="bg-gradient-to-r from-givizBlue3 to-givizBlue4 text-white p-6">
        <div className="flex items-center gap-4">
          {/* Avatar or default icon */}
          {meta?.owner?.avatar_url ? (
            <img
              src={meta.owner.avatar_url}
              alt={`${owner} avatar`}
              className="w-14 h-14 rounded-full border-2 border-white/70 shadow"
              loading="lazy"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-8 h-8 text-white/90"
                aria-label="GitHub logo"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.483 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.339-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.202 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.847-2.338 4.695-4.566 4.944.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.749 0 .268.18.579.688.481C19.138 20.2 22 16.447 22 12.021 22 6.484 17.523 2 12 2Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="uppercase tracking-widest text-[10px] text-white/70">Analysis for</div>
            <a
              href={htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-2xl md:text-3xl font-extrabold leading-tight hover:underline"
            >
              <span className="text-white/90">{owner}</span>
              <span className="mx-1 text-white/50">/</span>
              <span className="text-white">{repo}</span>
            </a>
            {description && (
              <p className="mt-1 text-xs md:text-sm text-white/80 truncate">
                {description}
              </p>
            )}
          </div>
          <div className="hidden md:flex">
            <a
              href={htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="appearance-none rounded-md font-medium border border-black shadow-[3px_3px_0px_0px_#0F172A] hover:shadow-[1px_1px_0px_0px_#0F172A] hover:translate-y-[1px] transition-all cursor-pointer px-4 py-2 text-white bg-givizBlue3 border-givizBlue4 hover:bg-givizBlue4 self-start text-xs"
            >
              Open in GitHub ↗
            </a>
          </div>
        </div>
      </div>

      {/* Bottom meta row */}
      <div className="px-6 py-3 bg-givizBlue1">
        {loading ? (
          <div className="text-xs text-gray-500">Loading repository details…</div>
        ) : error ? (
          <div className="text-xs text-red-500">Could not load repository details.</div>
        ) : (
          <div className="flex flex-wrap gap-2 text-xs">
            {language && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-givizBlue1 text-givizBlue4 border border-givizBlue2">
                <span className="w-2 h-2 rounded-full bg-givizBlue4"></span>
                {language}
              </span>
            )}
            {typeof stars === "number" && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-givizBlue1 text-givizBlue4 border border-givizBlue2">
                <StarIcon className="w-3 h-3 text-givizBlue3" />
                {stars.toLocaleString()} Stars
              </span>
            )}
            {typeof forks === "number" && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-givizBlue1 text-givizBlue4 border border-givizBlue2">
                <ForkIcon className="w-3 h-3 text-givizBlue3" />
                {forks.toLocaleString()} Forks
              </span>
            )}
            {license && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-givizBlue1 text-givizBlue4 border border-givizBlue2">
                License: {license}
              </span>
            )}
            {updatedAt && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-givizBlue1 text-givizBlue4 border border-givizBlue2">
                Updated: {updatedAt}
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

function StarIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 .587l3.668 7.431 8.2 1.193-5.934 5.787 1.402 8.168L12 18.896l-7.336 3.87 1.402-8.168L.132 9.211l8.2-1.193L12 .587z" />
    </svg>
  );
}

function ForkIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 7.5A2.5 2.5 0 1 0 7 2.5a2.5 2.5 0 0 0 0 5Zm0 0v2a5 5 0 0 0 5 5m5-7a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm0 0v3a5 5 0 0 1-5 5m0 0v3m0-3a5 5 0 0 1-5-5"
      />
    </svg>
  );
}
