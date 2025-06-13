import { useState } from "react";
import { RepoContext } from "./RepoContext";

export function RepoProvider({ children }) {
  const [repoInfo, setRepoInfo] = useState("");

  return (
    <RepoContext.Provider value={{ repoInfo, setRepoInfo }}>
      {children}
    </RepoContext.Provider>
  );
}