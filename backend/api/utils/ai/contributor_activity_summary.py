import os
from openai import OpenAI
import json
from dotenv import load_dotenv

from api.utils.common.save import load_repo_data
from api.utils.common.merge import merge_contributor_activity

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
BATCH_SIZE = os.getenv("AI_BATCH_SIZE", 20)

client = OpenAI(api_key=OPENAI_API_KEY)

PROMPT_TEMPLATE = """
You are an expert software development assistant. Your task is to generate a comprehensive summary of a contributor's activity in a software project based on the provided data.
The summary should include key contributions, patterns in their work, and any notable achievements.
You will be provided with data of the contributor's activity, including commits, issues, and pull requests.
Please analyze the data and provide a structured summary of about 100-200 words, focusing on the most important aspects of the contributor's work.

The data provided has the following structure:

- Contributor: The contributor name.
- Commits: A list of commit objects, each containing details about the commit.
- Issues: A list of issue objects, each containing details about the issue.
- Pull Requests: A list of pull request objects, each containing details about the pull request.

An example of the data structure is as follows:

{
  "contributor": "Contributor One",
  "commits": [
    {
      "hash": "abc123",
      "date": "2023-01-01",
      "message": "Initial commit",
      "insertions": 10,
      "deletions": 2,
      "affected_extensions": [
        ".py"
        ".js"
      ]
      "category": "feature",
      "score": 5,
      "suggestions": [
        "Consider breaking this commit into smaller, more focused commits.",
        "Add more tests to cover the changes introduced in this commit."
      ]
  ],
  "issues": [
    {
      "number": 1,
      "title": "Issue title",
      "body": "Issue description",
      "createdAt": "2023-01-02",
      "closedAt": "2023-01-03",
      "category": "bug",
      "score": 3,
      "suggestions": [
        "Provide more context about the issue.",
        "Add steps to reproduce the issue."
      ]
    }
  ],
  "pull_requests": [
    {
      "number": 1,
      "title": "PR title",
      "body": "PR description",
      "createdAt": "2023-01-04",
      "mergedAt": "2023-01-05",
      "category": "enhancement",
      "score": 4,
      "suggestions": [
        "Add more context about the changes introduced in this PR.",
        "Include links to related issues or discussions."
      ]
    }
  ]
}

An example of your response could be:

The contributor "Contributor One" has made significant contributions to the project.
Their work primarily focuses on enhancing the project's functionality and fixing bugs.
Notable achievements include improving code quality and addressing user-reported issues.

Now, please provide a summary of the contributor's activity based on the data provided:

{PROMPT_DATA}

Answer only with the summary of the contributor's activity in English.
"""

PROMPT_DATA = " "


def get_contributor_info(owner, repo, contributor) -> dict:
    """
    Fetch contributor information from the contributors.json file.
    """
    contributors_list = load_repo_data(owner, repo, "contributors.json")
    if isinstance(contributors_list, list):
        for c in contributors_list:
            if c.get("login") == contributor or c.get("name") == contributor:
                return c
        return {}
    return contributors_list.get(contributor, {})


def get_contributor_commits_summary(data) -> dict:
    """
    Fetch contributor commits summary from the provided data, filtering by the parameters of the list.
    """
    parameters = [
        "hash",
        "date",
        "message",
        "insertions",
        "deletions",
        "affected_extensions",
        "category",
        "score",
        "suggestions",
    ]
    for commit in data.get("commits", []):
        commit_summary = {
            param: commit.get(param) for param in parameters if param in commit
        }
        if commit_summary:
            yield commit_summary


def get_contributor_issues_summary(data) -> dict:
    """
    Fetch contributor issues summary from the provided data, filtering by the parameters of the list.
    """
    parameters = [
        "number",
        "title",
        "body",
        "createdAt",
        "closedAt",
        "category",
        "score",
        "suggestions",
    ]
    for issue in data.get("issues", []):
        issue_summary = {
            param: issue.get(param) for param in parameters if param in issue
        }
        if issue_summary:
            yield issue_summary


def get_contributor_pull_requests_summary(data) -> dict:
    """
    Fetch contributor pull requests summary from the provided data, filtering by the parameters of the list.
    """
    parameters = [
        "number",
        "title",
        "body",
        "createdAt",
        "mergedAt",
        "category",
        "score",
        "suggestions",
    ]
    for pr in data.get("pull_requests", []):
        pr_summary = {param: pr.get(param) for param in parameters if param in pr}
        if pr_summary:
            yield pr_summary


def prepare_prompt(owner, repo, contributor) -> str:
    """
    Prepare the prompt for the AI model using the contributor activity data.
    """
    contributor_name = get_contributor_info(owner, repo, contributor).get(
        "name", "Unknown Contributor"
    )
    data = merge_contributor_activity(owner, repo, contributor, contributor_name)
    commits_summary = list(get_contributor_commits_summary(data))
    issues_summary = list(get_contributor_issues_summary(data))
    pull_requests_summary = list(get_contributor_pull_requests_summary(data))

    prompt = PROMPT_TEMPLATE.replace(
        "{PROMPT_DATA}",
        json.dumps(
            {
                "contributor": contributor_name,
                "commits": commits_summary,
                "issues": issues_summary,
                "pull_requests": pull_requests_summary,
            },
            indent=2,
        ),
    )

    return prompt


def generate_contributor_activity_summary(
    owner, repo, contributor, model: str = "gpt-4.1-nano"
) -> str:
    """
    Generates a summary of contributor activity using AI and the data provided.
    """
    prompt = prepare_prompt(owner, repo, contributor)
    print("Prompt for AI classification:\n", prompt)
    print("Using model:", model)
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=5000,
        temperature=0.5,
    )
    content = response.choices[0].message.content
    return content.strip()
