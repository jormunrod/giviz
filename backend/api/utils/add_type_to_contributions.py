import json
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), "../../data/jormunrod__giviz")
AI_DIR = os.path.join(DATA_DIR, "ai")

FILES = {
    "commits": ("commits.json", "hash"),
    "contributors": ("contributors.json", "login"),
    "issues": ("issues.json", "number"),
    "pulls": ("pulls.json", "number"),
}

CLASSIFIED_FILE = os.path.join(AI_DIR, "contributions_classified.json")


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


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


def add_type_to_all():
    classified = load_json(CLASSIFIED_FILE)
    index = build_classified_index(classified)
    all_items = []
    for name, (filename, id_field) in FILES.items():
        path = os.path.join(DATA_DIR, filename)
        items = load_json(path)
        for item in items:
            if name == "commits":
                key = item.get("hash")
                t = "commit"
            elif name == "contributors":
                key = item.get("login")
                t = "contributor"
            elif name == "issues":
                key = item.get("number")
                t = "issue"
            elif name == "pulls":
                key = item.get("number")
                t = "pull"
            else:
                continue
            classified_entry = index.get((t, key))
            item["type"] = classified_entry["type"] if classified_entry else None
            item["category"] = (
                classified_entry["category"]
                if classified_entry and "category" in classified_entry
                else None
            )
            item["_source"] = name
            all_items.append(item)
    out_path = os.path.join(AI_DIR, "all_contributions_typed.json")
    save_json(out_path, all_items)


if __name__ == "__main__":
    add_type_to_all()
