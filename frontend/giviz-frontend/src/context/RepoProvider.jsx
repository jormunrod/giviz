import { useState } from "react";
import { RepoContext } from "./RepoContext";

export function RepoProvider({ children }) {
  const [repoUrl, setRepoUrl] = useState("");

  return (
    <RepoContext.Provider value={{ repoUrl, setRepoUrl }}>
      {children}
    </RepoContext.Provider>
  );
}