import { useState } from "react";
import Card from "./Card";
import TextInput from "./TextInput";
import GivizButton from "./GivizButton";
import { useRepo } from "../hooks/useRepo";

export default function RepoInput() {
  const [repoUrlInput, setRepoUrlInput] = useState("");
  const { setRepoUrl } = useRepo();
  const examples = [
    { label: "gitignore", url: "https://github.com/github/gitignore" },
    { label: "Rath", url: "https://github.com/rath-team/rath" },
    {
      label: "PetClinic",
      url: "https://github.com/spring-projects/spring-petclinic",
    },
    { label: "Mastodon", url: "https://github.com/mastodon/mastodon" },
  ];

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = repoUrlInput.trim();
    const githubRepoRegex =
      /^(https?:\/\/)?(www\.)?github\.com\/([\w.-]+)\/([\w.-]+)(\.git)?$/;

    if (githubRepoRegex.test(trimmed)) {
      setRepoUrl(trimmed);
      // TODO: navigate to analysis page
    } else {
      alert("Please enter a valid GitHub repository URL.");
    }
  }

  return (
    <Card className="max-w-3xl w-full py-8 p-6">
      <form onSubmit={handleSubmit} className="flex items-center gap-4 mb-4">
        <TextInput
          value={repoUrlInput}
          onChange={(e) => setRepoUrlInput(e.target.value.toLowerCase())}
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
        {examples.map(({ label, url }) => (
          <GivizButton
            key={label}
            className="px-4 py-1 text-sm"
            onClick={() => {
              setRepoUrl(url);
              // TODO: navigate("/analyze");
            }}
          >
            {label}
          </GivizButton>
        ))}
      </div>
    </Card>
  );
}
