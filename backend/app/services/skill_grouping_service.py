"""
AI-Powered Skill Grouping Service.

Uses GPT-5.2-chat-latest to intelligently group user skills into categories
with learning modules for progress tracking.

Optimized with:
- Singleton async OpenAI client (reuses connections)
- Async API calls for non-blocking operation
"""

import json
import logging
from typing import List, Dict, Any, Optional

from app.config import get_openai_client, OPENAI_CHAT_MODEL

logger = logging.getLogger(__name__)

GROUPING_SYSTEM_PROMPT = """You are an expert career coach and skills analyst. Given a list of skills extracted from a resume, group them into logical categories that make sense for career development.

For each category:
1. Create a meaningful name that reflects the skill theme
2. Provide an emoji that represents the category
3. Define 2-6 learning modules that represent progression in that skill area
4. Modules should go from foundational to advanced

Rules:
- Don't force skills into categories that don't fit
- A skill can only belong to one category
- Categories should have at least 2 skills to be meaningful
- IMPORTANT: Programming languages and frameworks (C#, .NET, Python, JavaScript, React, Java, TypeScript, etc.) MUST go in a "Programming & Development" category, never in "Other Skills"
- Only use "Other Skills" as an absolute last resort for truly obscure skills that don't fit any logical category
- If a skill involves writing code, configuring systems, or technical work, it belongs in a technical category
- Module names should be actionable learning objectives
- Keep category names concise (2-4 words)

Return JSON in this exact format:
{
  "categories": [
    {
      "id": "unique_id_snake_case",
      "name": "Category Name",
      "emoji": "emoji_character",
      "description": "Brief description of this skill area",
      "skills": ["skill1", "skill2"],
      "modules": [
        {"id": "mod_1", "name": "Module Name", "description": "What you'll learn", "order": 1},
        {"id": "mod_2", "name": "Module Name", "description": "What you'll learn", "order": 2}
      ]
    }
  ]
}"""

ENHANCE_SYSTEM_PROMPT = """You are an expert career coach helping someone enhance their skill profile. Given:
1. Their current skill categories with existing skills and modules
2. New skills from job postings they're interested in

Your task is to intelligently merge the new skills into the existing structure:
- If a new skill fits an existing category, add it there
- If new skills form a new logical category, create one
- Don't duplicate skills
- Update or add modules if the new skills require new learning paths

Return the complete updated structure in the same JSON format as the input."""


async def generate_skill_groupings(
    skills: List[str],
    context: Optional[str] = None
) -> Dict[str, Any]:
    """
    Use GPT-5.2-chat-latest to generate intelligent skill groupings.

    Args:
        skills: List of skill names from resume
        context: Optional context about the user's career goals

    Returns:
        Dict with categories, each containing skills and learning modules
    """
    if not skills:
        return {"categories": []}

    user_prompt = f"""Group these skills into logical categories with learning modules:

Skills: {json.dumps(skills)}

{f"Additional context: {context}" if context else ""}

Return the JSON grouping."""

    try:
        # Use singleton async client (reuses connections)
        client = get_openai_client()
        response = await client.chat.completions.create(
            model=OPENAI_CHAT_MODEL,
            messages=[
                {"role": "system", "content": GROUPING_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"},
            max_completion_tokens=2000,
        )

        result = json.loads(response.choices[0].message.content)
        logger.info(f"Generated {len(result.get('categories', []))} skill categories")
        return result

    except Exception as e:
        logger.error(f"Skill grouping failed: {e}")
        # Fallback: create a simple grouping
        return _create_fallback_grouping(skills)


async def enhance_skill_groupings(
    existing_groupings: Dict[str, Any],
    new_skills: List[str]
) -> Dict[str, Any]:
    """
    Enhance existing skill groupings with new skills from saved roles.

    Args:
        existing_groupings: Current skill categories and modules
        new_skills: New skills to integrate

    Returns:
        Updated groupings with new skills merged in
    """
    if not new_skills:
        return existing_groupings

    user_prompt = f"""Current skill structure:
{json.dumps(existing_groupings, indent=2)}

New skills to integrate:
{json.dumps(new_skills)}

Merge the new skills into the existing structure. Return the complete updated JSON."""

    try:
        # Use singleton async client (reuses connections)
        client = get_openai_client()
        response = await client.chat.completions.create(
            model=OPENAI_CHAT_MODEL,
            messages=[
                {"role": "system", "content": ENHANCE_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"},
            max_completion_tokens=3000,
        )

        result = json.loads(response.choices[0].message.content)
        logger.info(f"Enhanced groupings: now {len(result.get('categories', []))} categories")
        return result

    except Exception as e:
        logger.error(f"Skill enhancement failed: {e}")
        # Fallback: add new skills to a "New Skills" category
        return _add_skills_to_new_category(existing_groupings, new_skills)


def _create_fallback_grouping(skills: List[str]) -> Dict[str, Any]:
    """Create a simple fallback grouping when AI is unavailable."""
    # Simple keyword-based categorization
    categories = {
        "programming": {
            "name": "Programming & Development",
            "emoji": "code",
            "keywords": ["python", "java", "javascript", "react", "node", "sql", "html", "css", "api", "code", "develop", "c#", "csharp", "c++", ".net", "asp.net", "typescript", "angular", "vue", "django", "flask", "spring", "ruby", "php", "go", "golang", "rust", "kotlin", "swift", "scala", "programming", "software", "backend", "frontend", "fullstack"],
        },
        "cloud": {
            "name": "Cloud & Infrastructure",
            "emoji": "cloud",
            "keywords": ["aws", "azure", "gcp", "cloud", "docker", "kubernetes", "devops", "terraform", "jenkins", "ci/cd", "cicd", "ansible", "puppet", "chef", "infrastructure", "serverless", "lambda", "ec2", "s3"],
        },
        "data": {
            "name": "Data & Analytics",
            "emoji": "chart",
            "keywords": ["data", "analytics", "machine learning", "ml", "ai", "tableau", "power bi", "statistics", "pandas", "numpy", "scikit", "tensorflow", "pytorch", "deep learning", "nlp", "etl", "spark", "hadoop", "snowflake", "databricks"],
        },
        "leadership": {
            "name": "Leadership & Management",
            "emoji": "users",
            "keywords": ["leadership", "management", "team", "project", "agile", "scrum", "strategy"],
        },
        "communication": {
            "name": "Communication & Soft Skills",
            "emoji": "chat",
            "keywords": ["communication", "presentation", "writing", "collaboration", "teamwork"],
        },
    }

    result_categories = []
    categorized_skills = set()

    for cat_id, cat_info in categories.items():
        matching_skills = []
        for skill in skills:
            skill_lower = skill.lower()
            if any(kw in skill_lower for kw in cat_info["keywords"]):
                matching_skills.append(skill)
                categorized_skills.add(skill)

        if matching_skills:
            result_categories.append({
                "id": cat_id,
                "name": cat_info["name"],
                "emoji": cat_info["emoji"],
                "description": f"Skills related to {cat_info['name'].lower()}",
                "skills": matching_skills,
                "modules": [
                    {"id": f"{cat_id}_fundamentals", "name": "Fundamentals", "description": "Core concepts and basics", "order": 1},
                    {"id": f"{cat_id}_intermediate", "name": "Intermediate", "description": "Building practical expertise", "order": 2},
                    {"id": f"{cat_id}_advanced", "name": "Advanced", "description": "Advanced techniques and best practices", "order": 3},
                    {"id": f"{cat_id}_mastery", "name": "Mastery", "description": "Expert level and teaching others", "order": 4},
                ]
            })

    # Add uncategorized skills
    uncategorized = [s for s in skills if s not in categorized_skills]
    if uncategorized:
        result_categories.append({
            "id": "other_skills",
            "name": "Other Skills",
            "emoji": "star",
            "description": "Additional professional skills",
            "skills": uncategorized,
            "modules": [
                {"id": "other_fundamentals", "name": "Fundamentals", "description": "Core concepts", "order": 1},
                {"id": "other_intermediate", "name": "Intermediate", "description": "Building expertise", "order": 2},
                {"id": "other_advanced", "name": "Advanced", "description": "Advanced level", "order": 3},
                {"id": "other_mastery", "name": "Mastery", "description": "Expert level", "order": 4},
            ]
        })

    return {"categories": result_categories}


def _add_skills_to_new_category(existing: Dict[str, Any], new_skills: List[str]) -> Dict[str, Any]:
    """Fallback: add new skills to a 'New Skills' category."""
    result = dict(existing)
    categories = list(result.get("categories", []))

    # Find or create "New Skills" category
    new_cat_idx = next((i for i, c in enumerate(categories) if c.get("id") == "new_skills"), None)

    if new_cat_idx is not None:
        categories[new_cat_idx]["skills"].extend(new_skills)
    else:
        categories.append({
            "id": "new_skills",
            "name": "Skills to Develop",
            "emoji": "target",
            "description": "Skills from your target roles",
            "skills": new_skills,
            "modules": [
                {"id": "new_explore", "name": "Explore", "description": "Learn what this skill involves", "order": 1},
                {"id": "new_learn", "name": "Learn", "description": "Build foundational knowledge", "order": 2},
                {"id": "new_practice", "name": "Practice", "description": "Apply in projects", "order": 3},
                {"id": "new_demonstrate", "name": "Demonstrate", "description": "Show proficiency", "order": 4},
            ]
        })

    result["categories"] = categories
    return result
