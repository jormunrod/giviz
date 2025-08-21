import os
from openai import OpenAI
import json
from dotenv import load_dotenv

from api.utils.common.save import load_repo_data
from api.views import repo

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
BATCH_SIZE = os.getenv("AI_BATCH_SIZE", 20)

client = OpenAI(api_key=OPENAI_API_KEY)

PROMPT_TEMPLATE = """
        
        """

EXAMPLE_INPUT = "json.dumps()"

EXAMPLE_OUTPUT = "json.dumps()"


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


def generate_contributor_activity_summary(
    owner, repo, contributor, model: str = "gpt-4.1-nano"
) -> str:
    """
    Generates a summary of contributor activity using AI and the data provided.
    """
    contributor_info = get_contributor_info(owner, repo, contributor)

    contributor_name = contributor_info.get("name", "Unknown Contributor")
    contributor_avatar = contributor_info.get("avatarUrl", "Unknown Avatar")
    contributor_url = contributor_info.get("url", "Unknown URL")
    contributor_bio = contributor_info.get("bio", "Unknown Bio")
    contributor_company = contributor_info.get("company", "Unknown Company")
    contributor_location = contributor_info.get("location", "Unknown Location")
    contributor_email = contributor_info.get("email", "Unknown Email")
    contributor_created_at = contributor_info.get("createdAt", "Unknown Created At")

    return f"""
    Contributor Name: {contributor_name}
    Avatar: {contributor_avatar}
    Profile URL: {contributor_url}
    Bio: {contributor_bio}
    Company: {contributor_company}
    Location: {contributor_location}
    Email: {contributor_email}
    Created At: {contributor_created_at}
    """
