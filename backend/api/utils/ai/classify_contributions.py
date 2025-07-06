import os
from math import ceil
from openai import OpenAI
import json
from typing import List, Dict, Any
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
BATCH_SIZE = 60  # Number of contributions to classify in each batch


client = OpenAI(api_key=OPENAI_API_KEY)


PROMPT_TEMPLATE = """
Classify each contribution (commit, issue, or pull request) into one of these categories, and use 'others' **only** as a last resort:

1. development: new features, enhancements
2. testing: unit/integration tests, test pipelines
3. documentation: README, docs, code comments
4. refactor: code restructuring without behavior changes
5. chore: maintenance (dependencies, linting, formatting)
6. bugfix: bug fixes
7. performance: performance optimizations
8. security: vulnerabilities and security patches
9. build/ci: build scripts, CI/CD configuration
10. ux/ui: user interface or experience changes
11. others: if it truly doesn’t fit any of the above

**Instructions:**  
- Use the `message` (for commits), the `title` + `body` (for issues/pulls), **and** the `files_changed` list to determine intent.  
- For example, if `files_changed` includes `.md` files or a `docs/` folder, favor **documentation** even if the text doesn’t contain “doc.”  
- If you see test paths (`test_*.py`, `__tests__`, `spec/`), favor **testing** even without the word “test” in the message.  
- Only after considering content and file context, apply keyword mapping as a secondary check.  
- Use **others** only when neither content nor files match any category.

**Keyword mapping rules (secondary):**
- testing  ← “test”, “spec”, “ci.yml”
- documentation ← “doc”, “readme”, “md”
- bugfix ← “fix”, “bug”
- performance ← “perf”, “optimi”
- security ← “vulnerab”, “auth”, “encrypt”
- refactor ← “refactor”, “cleanup”
- chore ← “bump”, “lint”, “format”
- build/ci ← “build”, “ci”, “pipeline”
- ux/ui ← “ui”, “ux”, “layout”
- development ← “feat”, “add”, “update”, “new”

Each item has a `type` field: "commit", "issue", or "pull".
Return a JSON array where each object includes:
  - the `type`
  - the identifier (`hash` for commits, `number` for issues/pulls)
  - the assigned `category`

Input example:
{example_input}

Output example:
{example_output}

Now classify the following contributions:
{contributions}

Respond **only** with the output JSON array.
"""

EXAMPLE_INPUT = json.dumps(
    [
        {
            "type": "commit",
            "hash": "abc123",
            "message": "Add login feature",
            "files_changed": ["./login.py", "./auth.py"],
        },
        {
            "type": "commit",
            "hash": "def456",
            "message": "Add unit tests for login",
            "files_changed": ["./test_login.py"],
        },
        {
            "type": "commit",
            "hash": "ghi789",
            "message": "Update README and docs",
            "files_changed": ["./README.md", "./docs/auth.md"],
        },
        {
            "type": "commit",
            "hash": "xyz000",
            "message": "Bump dependencies and fix lint errors",
            "files_changed": ["./requirements.txt", "./.github/workflows/ci.yml"],
        },
        {
            "type": "issue",
            "number": 1,
            "title": "Crash on invalid input",
            "body": "App crashes when given empty string",
        },
        {
            "type": "pull",
            "number": 2,
            "title": "Optimize image loading",
            "body": "Use lazy-loading and caching for images",
        },
    ],
    ensure_ascii=False,
    indent=2,
)

EXAMPLE_OUTPUT = json.dumps(
    [
        {"type": "commit", "hash": "abc123", "category": "development"},
        {"type": "commit", "hash": "def456", "category": "testing"},
        {"type": "commit", "hash": "ghi789", "category": "documentation"},
        {"type": "commit", "hash": "xyz000", "category": "chore"},
        {"type": "issue", "number": 1, "category": "bugfix"},
        {"type": "pull", "number": 2, "category": "performance"},
    ],
    ensure_ascii=False,
    indent=2,
)


def classify_contributions_with_ai(
    contributions: List[Dict[str, Any]], model: str = "gpt-4.1-nano"
) -> List[Dict[str, Any]]:
    """
    Calls OpenAI to classify contributions (commits, issues, pulls) into categories.
    """
    prompt = PROMPT_TEMPLATE.format(
        example_input=EXAMPLE_INPUT,
        example_output=EXAMPLE_OUTPUT,
        contributions=json.dumps(contributions, ensure_ascii=False, indent=2),
    )
    print("Prompt for AI classification:\n", prompt)
    print("Using model:", model)

    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=5000,
        temperature=0.0,
    )
    content = response.choices[0].message.content
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        start = content.find("[")
        end = content.rfind("]") + 1
        return json.loads(content[start:end])


def classify_all_contributions(
    contributions: List[Dict[str, Any]],
    model: str = "gpt-4.1-nano",
) -> List[Dict[str, Any]]:
    """
    Splits the contributions into batches of BATCH_SIZE, classifies each batch,
    and returns the concatenated results.
    """
    total = len(contributions)
    n_batches = ceil(total / BATCH_SIZE)
    all_classified: List[Dict[str, Any]] = []

    for i in range(n_batches):
        start = i * BATCH_SIZE
        end = min(start + BATCH_SIZE, total)
        batch = contributions[start:end]
        print(f"Classifying batch {i+1}/{n_batches} ({len(batch)} items)…")
        classified_batch = classify_contributions_with_ai(batch, model=model)
        all_classified.extend(classified_batch)

    return all_classified
