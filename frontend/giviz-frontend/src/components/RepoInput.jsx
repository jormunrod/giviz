import { useState } from "react";
import Card from "./Card";
import TextInput from "./TextInput";

export default function RepoInput() {
  const [repoUrl, setRepoUrl] = useState("");

  return (
    <Card className="max-w-3xl w-full py-8 p-6">
      <div className="flex items-center gap-4 mb-4">
        <TextInput
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="https://github.com/user/repo"
          className="flex-grow"
        />
        <button className="btn-giviz px-6 py-2 text-sm">Go!</button>
      </div>
      <p className="text-sm text-givizBlack mb-2">
        Try these example repositories:
      </p>
      <div className="flex flex-wrap gap-3">
        {["gitignore", "Rath", "PetClinic", "Mastodon"].map((name) => (
          <button key={name} className="btn-giviz px-4 py-1 text-sm">
            {name}
          </button>
        ))}
      </div>
    </Card>
  );
}
