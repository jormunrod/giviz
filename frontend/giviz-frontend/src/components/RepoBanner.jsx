import { useEffect, useState } from "react";
import Card from "./Card";

const LANGUAGE_COLORS = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Java: "#b07219",
  "C++": "#f34b7d",
  "C#": "#178600",
  C: "#555555",
  Go: "#00ADD8",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#f05138",
  Kotlin: "#A97BFF",
  Rust: "#dea584",
  Dart: "#00B4AB",
  Haskell: "#5e5086",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Vue: "#41b883",
  "Objective-C": "#438eff",
  Elixir: "#6e4a7e",
  Erlang: "#B83998",
  Perl: "#0298c3",
  "PowerShell": "#012456",
  MATLAB: "#e16737",
  R: "#198CE7",
  "Jupyter Notebook": "#DA5B0B",
};

export default function RepoBanner({ owner, repo }) {
  const [meta, setMeta] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    async function fetchMeta() {
      if (!owner || !repo) return;
      setLoading(true);
      setLanguages([]);
      setError(null);
      try {
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
        if (!res.ok) throw new Error("Failed to load repo metadata");
        const data = await res.json();
        let fetchedLanguages = [];
        if (data.languages_url) {
          try {
            const langsRes = await fetch(data.languages_url);
            if (langsRes.ok) {
              const langsJson = await langsRes.json();
              fetchedLanguages = Object.entries(langsJson)
                .filter(([, bytes]) => Number.isFinite(bytes) && bytes > 0)
                .map(([name, bytes]) => ({ name, bytes }))
                .sort((a, b) => b.bytes - a.bytes);
            }
          } catch (langError) {
            console.error("Failed to load languages", langError);
          }
        }
        if (active) {
          setMeta(data);
          setLanguages(fetchedLanguages);
        }
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
  const stars = meta?.stargazers_count;
  const forks = meta?.forks_count;
  const license = meta?.license?.spdx_id || meta?.license?.key || null;
  const updatedAt = meta?.updated_at
    ? new Date(meta.updated_at).toLocaleDateString()
    : null;
  const totalLanguageBytes = languages.reduce(
    (sum, item) => (Number.isFinite(item.bytes) ? sum + item.bytes : sum),
    0
  );
  const languagesToShow = languages.length
    ? languages.slice(0, 3)
    : meta?.language
    ? [{ name: meta.language, bytes: null }]
    : [];
  const formatPercent = (value) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: value >= 10 ? 0 : 1,
      maximumFractionDigits: 1,
    }).format(value);

  return (
    <Card className="mt-8 w-full max-w-4xl">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          {meta?.owner?.avatar_url ? (
            <img
              src={meta.owner.avatar_url}
              alt={`${owner} avatar`}
              className="h-16 w-16 rounded-full border border-black/10 shadow-md"
              loading="lazy"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-black/30 shadow-md">
              <GithubGlyph className="h-8 w-8 text-givizBlue4" />
            </div>
          )}

          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.32em] text-givizBlue4/70">
              Currently analyzing
            </p>
            <a
              href={htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block text-2xl font-bold leading-tight text-givizBlack hover:underline md:text-3xl"
            >
              <span>{owner}</span>
              <span className="mx-1 text-givizBlack/50">/</span>
              <span className="break-words">{repo}</span>
            </a>
            {description ? (
              <p className="mt-2 max-w-2xl text-sm text-givizBlack/70">
                {description}
              </p>
            ) : loading ? (
              <div
                className="mt-3 h-3 w-48 rounded-full bg-white/50 animate-pulse"
                aria-hidden="true"
              />
            ) : null}
          </div>
        </div>

        <div className="flex w-full justify-start md:w-auto md:justify-end">
          <a
            href={htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-black/20 px-4 py-2 text-sm font-semibold text-givizBlack transition hover:bg-givizBlack/5 md:w-auto"
          >
            <ExternalLinkIcon className="h-4 w-4" />
            Open in GitHub
          </a>
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="flex flex-wrap gap-3" aria-live="polite">
            <SkeletonPill />
            <SkeletonPill className="w-24" />
            <SkeletonPill className="w-28" />
            <SkeletonPill className="w-20" />
          </div>
        ) : error ? (
          <div className="text-xs font-medium text-red-500">
            Could not load repository details.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 text-xs md:text-sm text-givizBlack/70">
            {languagesToShow.map(({ name, bytes }) => {
              const color = LANGUAGE_COLORS[name] || "#64748B";
              const percentValue =
                typeof bytes === "number" && bytes > 0 && totalLanguageBytes > 0
                  ? (bytes / totalLanguageBytes) * 100
                  : null;
              const isFallbackLanguage = !languages.length && meta?.language === name;
              const percentLabel = percentValue !== null
                ? `${formatPercent(percentValue)}%`
                : isFallbackLanguage
                ? "100%"
                : "—";
              const sizeLabel = percentValue !== null
                ? `${bytes.toLocaleString()} bytes (${percentLabel})`
                : isFallbackLanguage
                ? "Primary language (percentage estimated)"
                : "Primary language";
              return (
                <span
                  key={name}
                  className="inline-flex items-center gap-2 rounded-full border border-black/10 px-3 py-1 font-medium"
                  title={`${name} • ${sizeLabel}`}
                >
                  <LanguageBadge color={color} />
                  <span>{name}</span>
                  <span className="text-givizBlack/60">{percentLabel}</span>
                </span>
              );
            })}
          {typeof stars === "number" && (
              <span className="inline-flex items-center gap-2 rounded-full border border-black/10 px-3 py-1 font-medium">
                <StarIcon className="h-4 w-4 text-givizBlue3" />
                <span className="font-semibold text-givizBlack">
                  {stars.toLocaleString()}
                </span>
                <span className="text-givizBlack/60">Stars</span>
              </span>
            )}
            {typeof forks === "number" && (
              <span className="inline-flex items-center gap-2 rounded-full border border-black/10 px-3 py-1 font-medium">
                <ForkIcon className="h-4 w-4 text-givizBlue3" />
                <span className="font-semibold text-givizBlack">
                  {forks.toLocaleString()}
                </span>
                <span className="text-givizBlack/60">Forks</span>
              </span>
            )}
            {license && (
              <span className="inline-flex items-center gap-2 rounded-full border border-black/10 px-3 py-1 font-medium">
                <LicenseIcon className="h-4 w-4 text-givizBlue3" />
                <span className="truncate">{license}</span>
              </span>
            )}
            {updatedAt && (
              <span className="inline-flex items-center gap-2 rounded-full border border-black/10 px-3 py-1 font-medium">
                <ClockIcon className="h-4 w-4 text-givizBlue3" />
                <span className="text-givizBlack/60">Updated</span>
                <span className="font-semibold text-givizBlack">{updatedAt}</span>
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

function ExternalLinkIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M14 3h7v7" />
      <path d="M10 14 21 3" />
      <path d="M21 14v7h-7" />
      <path d="M14 21 3 10" />
    </svg>
  );
}

function LicenseIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M7 3h10l1 2h3v5h-3l-1 2H7l-1-2H3V5h3l1-2Z" />
      <path d="M7 13v8" />
      <path d="M17 13v8" />
    </svg>
  );
}

function ClockIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m12 7 0 5 3 3" />
    </svg>
  );
}

function GithubGlyph({ className = "w-8 h-8" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.483 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.339-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.202 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.847-2.338 4.695-4.566 4.944.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.749 0 .268.18.579.688.481C19.138 20.2 22 16.447 22 12.021 22 6.484 17.523 2 12 2Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function LanguageBadge({ color }) {
  return (
    <span
      className="flex h-5 w-5 items-center justify-center rounded-full text-white shadow-inner"
      style={{ backgroundColor: color }}
    >
      <LanguageIcon className="h-3 w-3 text-white/90" />
    </span>
  );
}

function LanguageIcon({ className = "w-3 h-3" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M8 7 4 12l4 5" />
      <path d="m16 7 4 5-4 5" />
      <path d="m14 4-4 16" />
    </svg>
  );
}

function SkeletonPill({ className = "w-20" }) {
  return (
    <span
      className={`inline-flex h-6 ${className} animate-pulse rounded-full bg-slate-200/70`}
      aria-hidden="true"
    />
  );
}
