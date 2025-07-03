import { useState } from "react";
import Card from "./Card";
import TextInput from "./TextInput";
import GivizButton from "./GivizButton";
import { useRepo } from "../hooks/useRepo";
import { useNavigate } from "react-router-dom";

export default function RepoInput() {
  const [inputUrl, setInputUrl] = useState("");
  const { setRepoInfo } = useRepo();
  const navigate = useNavigate();

  const examples = [
    { label: "giviz", url: "https://github.com/jormunrod/giviz" },
    { label: "Rath", url: "https://github.com/rath-team/rath" },
    { label: "PetClinic", url: "https://github.com/spring-projects/spring-petclinic" },
    { label: "Mastodon", url: "https://github.com/mastodon/mastodon" },
  ];

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

  const extractOwnerRepo = (url) => {
    const regex = /github\.com\/([\w.-]+)\/([\w.-]+)(\/)?$/;
    const match = url.match(regex);
    if (!match) return null;
    return { owner: match[1], repo: match[2] };
  };

  const validateRepo = async ({ owner, repo }) => {
    try {
      const res = await fetch(`${API_BASE}/check-repo/?owner=${owner}&repo=${repo}`);
      const data = await res.json();
      if (data.exists) {
        setRepoInfo({ owner, repo });
        navigate("/analysis");
      } else {
        alert("Repository not found or is private.");
      }
    } catch (err) {
      console.error("API error:", err);
      alert("Error connecting to backend.");
    }
  };

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = inputUrl.trim();
    const result = extractOwnerRepo(trimmed);

    if (result) {
      validateRepo(result);
    } else {
      alert("Please enter a valid GitHub repository URL.");
    }
  }

  return (
    <Card className="max-w-3xl w-full py-8 p-6">
      <form onSubmit={handleSubmit} className="flex items-center gap-4 mb-4">
        <TextInput
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          placeholder="https://github.com/user/repo"
          className="flex-grow"
        />
        <GivizButton type="submit" className="px-6 py-2 text-sm">
          Go!
        </GivizButton>
      </form>
      <p className="text-sm text-givizBlack mb-2">
        Try these example repositories:
      </p>
      <div className="flex flex-wrap gap-3">
        {examples.map(({ label, url }) => {
          const data = extractOwnerRepo(url);
          return (
            <GivizButton
              key={label}
              className="px-4 py-1 text-sm"
              onClick={() => data && validateRepo(data)}
            >
              {label}
            </GivizButton>
          );
        })}
      </div>
    </Card>
  );
}