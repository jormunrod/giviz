from api.utils.common.save import save_repo_data, load_repo_data


def build_classified_index(classified):
    index = {}
    for entry in classified:
        t = entry.get("type")
        if t == "commit":
            key = entry.get("hash")
        elif t == "contributor":
            key = entry.get("login")
        elif t == "issue":
            key = entry.get("number")
        elif t == "pull":
            key = entry.get("number")
        else:
            continue
        if key is not None:
            index[(t, key)] = entry
    return index


FILES = {
    "commits": ("commits.json", "hash", "commit"),
    "contributors": ("contributors.json", "login", "contributor"),
    "issues": ("issues.json", "number", "issue"),
    "pulls": ("pulls.json", "number", "pull"),
}


def merge_contributions(
    owner: str,
    repo: str,
    classified_subfolder: str = "ai",
    output_subfolder: str = "merged",
):
    classified = load_repo_data(
        owner, repo, "contributions_classified.json", subfolder=classified_subfolder
    )
    if classified is None:
        raise FileNotFoundError(f"No classified file found for {owner}/{repo}")
    index = build_classified_index(classified)
    for name, (filename, id_field, t) in FILES.items():
        items = load_repo_data(owner, repo, filename)
        if items is None:
            continue
        new_items = []
        for item in items:
            key = item.get(id_field)
            classified_entry = index.get((t, key))
            item["type"] = classified_entry["type"] if classified_entry else None
            item["category"] = (
                classified_entry["category"]
                if classified_entry and "category" in classified_entry
                else None
            )
            new_items.append(item)
        save_repo_data(
            owner, repo, new_items, f"{name}_typed.json", subfolder=output_subfolder
        )
