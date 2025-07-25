import os
from math import ceil
from openai import OpenAI
import json
from typing import List, Dict, Any
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
BATCH_SIZE = 60  # Number of messages to analyze in each batch

client = OpenAI(api_key=OPENAI_API_KEY)

PROMPT_TEMPLATE = """
        Evaluate the quality of each message (commit, issue, or pull request) on a scale from 0 to 10, where 10 is excellent and 0 is very poor. Consider:
        - Clarity and expressiveness
        - Conciseness
        - Relevance
        - Spelling and grammar
        - Whether it provides enough context

        If the score is less than 8, give specific suggestions to improve the message (Always in English).

        **Output format:**
        Return a JSON array where each object includes:
        - `id`: identifier (hash for commits, number for issues/pulls)
        - `type`: "commit" | "issue" | "pr"
        - `score`: quality score (0-10)
        - `suggestions`: array of suggestions (may be empty)
        - `text`: the analyzed message

        Example input:
        {example_input}

        Example output:
        {example_output}

        Now evaluate the following messages:
        {messages}

        Respond only with the JSON array.
        """

EXAMPLE_INPUT = json.dumps(
    [
        {"id": "abc123", "type": "commit", "text": "Add login feature"},
        {"id": 1, "type": "issue", "text": "Crash on invalid input"},
        {"id": 2, "type": "pr", "text": "Optimize image loading"},
    ],
    ensure_ascii=False,
    indent=2,
)

EXAMPLE_OUTPUT = json.dumps(
    [
        {
            "id": "abc123",
            "type": "commit",
            "score": 8,
            "suggestions": [],
            "text": "Add login feature",
        },
        {
            "id": 1,
            "type": "issue",
            "score": 5,
            "suggestions": [
                "Explain the error context better",
                "Suggest steps to reproduce it",
            ],
            "text": "Crash on invalid input",
        },
        {
            "id": 2,
            "type": "pr",
            "score": 9,
            "suggestions": [],
            "text": "Optimize image loading",
        },
    ],
    ensure_ascii=False,
    indent=2,
)


def analyze_message_quality_with_ai(
    messages: List[Dict[str, Any]], model: str = "gpt-4.1-nano"
) -> List[Dict[str, Any]]:
    """
    Calls OpenAI to evaluate message quality (commits, issues, PRs) and return score and suggestions.
    """
    prompt = PROMPT_TEMPLATE.format(
        example_input=EXAMPLE_INPUT,
        example_output=EXAMPLE_OUTPUT,
        messages=json.dumps(messages, ensure_ascii=False, indent=2),
    )
    print("Prompt for AI message quality:\n", prompt)
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
    except json.JSONDecodeError as e:
        start = content.find("[")
        end = content.rfind("]") + 1
        json_str = content[start:end] if start != -1 and end != -1 else content
        try:
            return json.loads(json_str)
        except Exception as e2:
            # Log and raise a clear error
            print("OpenAI response (truncated):", content[:1000])
            raise ValueError(
                f"OpenAI response is not valid JSON. Error: {e2}. Content starts: {content[:200]}"
            )


def analyze_all_message_quality(
    messages: List[Dict[str, Any]],
    model: str = "gpt-4.1-nano",
) -> List[Dict[str, Any]]:
    """
    Splits the messages into batches of BATCH_SIZE, analyzes each batch,
    and returns the concatenated results.
    """
    total = len(messages)
    n_batches = ceil(total / BATCH_SIZE)
    all_results: List[Dict[str, Any]] = []

    for i in range(n_batches):
        start = i * BATCH_SIZE
        end = min(start + BATCH_SIZE, total)
        batch = messages[start:end]
        print(f"Analyzing batch {i+1}/{n_batches} ({len(batch)} items)…")
        batch_results = analyze_message_quality_with_ai(batch, model=model)
        all_results.extend(batch_results)

    return all_results
