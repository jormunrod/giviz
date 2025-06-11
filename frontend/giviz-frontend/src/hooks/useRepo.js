import { useContext } from "react";
import { RepoContext } from "../context/RepoContext";

export function useRepo() {
  return useContext(RepoContext);
}