"""
AI-Powered Learning Content Generation Service.

Generates personalized learning guides and curates external resources
for skill modules using GPT-5.2. Integrates EY-specific resources
(Credly badges, Virtual Academy, Tech MBA).
"""

import json
import logging
from typing import Dict, Any, List, Optional

from app.config import get_openai_client, OPENAI_CHAT_MODEL

logger = logging.getLogger(__name__)

# EY-specific resource URLs
EY_RESOURCES = {
    "badges": "https://www.credly.com/organizations/ey/badges",
    "virtual_academy": "https://eyvirtualacademy.com/",
    "tech_mba": "https://www.ey.com/en_gl/tech-mba",
    "learning_on_demand": "https://www.ey.com/en_mt/careers/ey-learning-on-demand",
    "career_path_accelerator": "https://www.ey.com/en_us/careers/ey-career-path-accelerator",
}

LEARNING_CONTENT_PROMPT = """You are a senior learning & development specialist at EY creating personalized learning content.

Generate comprehensive learning content for a skill module.

## SKILL INFORMATION:
Skill Name: {skill_name}
Module Number: {module_number} of {total_modules}
Module Title: {module_title}
Module Description: {module_description}
Skill Type: {skill_type}
User's Current Proficiency: {current_proficiency}/5

## EY CONTEXT:
- This is for EY employees developing professional skills
- EY Virtual Academy: {ey_virtual_academy}
- EY Badges (Credly): {ey_badges}
- EY Tech MBA: {ey_tech_mba}

## YOUR TASK:
Create learning content that is:
1. Specific to this module (not generic)
2. Actionable with concrete steps
3. Appropriate for the user's proficiency level
4. Includes EY-specific resources where relevant

Return ONLY valid JSON:
{{
    "learning_guide": "A 3-5 paragraph learning guide covering:\\n- Key concepts to master\\n- Practical exercises to try\\n- Common pitfalls to avoid\\n- How this connects to EY work\\n- Tips for demonstrating this skill",

    "external_resources": [
        {{
            "title": "Resource Title",
            "url": "https://...",
            "type": "course|video|documentation|article|certification",
            "provider": "YouTube|Coursera|Udemy|Official Docs|etc",
            "estimated_time": "2 hours|30 min|etc",
            "description": "Why this resource is valuable"
        }}
    ],

    "ey_resources": [
        {{
            "title": "EY Resource Name",
            "url": "https://...",
            "type": "badge|course|program",
            "badge_available": true,
            "description": "How this EY resource helps"
        }}
    ],

    "practice_exercises": [
        "Exercise 1: Specific hands-on task",
        "Exercise 2: Another practical exercise"
    ],

    "success_criteria": [
        "You can do X without assistance",
        "You can explain Y to a colleague"
    ]
}}

GUIDELINES:
1. Include 3-5 external resources with REAL, working URLs
2. Include EY resources if applicable to this skill
3. Make exercises specific and actionable
4. Success criteria should be measurable
5. For technical skills, include official documentation
6. For soft skills, include TED talks or leadership content"""


async def generate_module_learning_content(
    skill_name: str,
    module_number: int,
    total_modules: int,
    module_title: str,
    module_description: str,
    skill_type: str = "technical",
    current_proficiency: int = 0,
) -> Dict[str, Any]:
    """
    Generate AI-powered learning content for a skill module.

    Args:
        skill_name: Name of the skill
        module_number: Which module (1-indexed)
        total_modules: Total modules for this skill
        module_title: Title of the module
        module_description: Description of what the module covers
        skill_type: technical, soft, or tool
        current_proficiency: User's current proficiency (0-5)

    Returns:
        Dict with learning_guide, external_resources, ey_resources, etc.
    """
    prompt = LEARNING_CONTENT_PROMPT.format(
        skill_name=skill_name,
        module_number=module_number,
        total_modules=total_modules,
        module_title=module_title,
        module_description=module_description,
        skill_type=skill_type,
        current_proficiency=current_proficiency,
        ey_virtual_academy=EY_RESOURCES["virtual_academy"],
        ey_badges=EY_RESOURCES["badges"],
        ey_tech_mba=EY_RESOURCES["tech_mba"],
    )

    try:
        client = get_openai_client()
        response = await client.chat.completions.create(
            model=OPENAI_CHAT_MODEL,
            messages=[
                {"role": "system", "content": "You are an expert learning content creator. Always return valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            max_completion_tokens=2000,
        )

        result = json.loads(response.choices[0].message.content)
        logger.info(f"Generated learning content for {skill_name} - Module {module_number}")
        return result

    except Exception as e:
        logger.error(f"Learning content generation failed: {e}")
        return _generate_fallback_content(skill_name, module_title, skill_type)


def _generate_fallback_content(
    skill_name: str,
    module_title: str,
    skill_type: str,
) -> Dict[str, Any]:
    """Generate basic fallback content when AI is unavailable."""

    # URL-safe skill name
    skill_encoded = skill_name.replace(" ", "+").replace("#", "%23")

    resources = [
        {
            "title": f"{skill_name} - Official Documentation",
            "url": f"https://www.google.com/search?q={skill_encoded}+documentation",
            "type": "documentation",
            "provider": "Various",
            "estimated_time": "Varies",
            "description": "Official documentation and guides"
        },
        {
            "title": f"Learn {skill_name} - YouTube",
            "url": f"https://www.youtube.com/results?search_query={skill_encoded}+tutorial",
            "type": "video",
            "provider": "YouTube",
            "estimated_time": "2-4 hours",
            "description": "Video tutorials and walkthroughs"
        },
    ]

    if skill_type == "technical":
        resources.append({
            "title": f"{skill_name} Courses - Coursera",
            "url": f"https://www.coursera.org/search?query={skill_encoded}",
            "type": "course",
            "provider": "Coursera",
            "estimated_time": "10-40 hours",
            "description": "Structured courses with certificates"
        })

    return {
        "learning_guide": f"""## {module_title}

This module focuses on developing your {skill_name} skills. Here's how to approach this learning:

**Key Areas to Focus On:**
- Understand the fundamental concepts
- Practice with hands-on exercises
- Apply learning to real EY projects

**Recommended Approach:**
1. Start with the official documentation
2. Watch tutorial videos for visual learning
3. Complete practice exercises
4. Build a small project to demonstrate skills

**EY Application:**
Consider how this skill applies to your current EY engagement. Discuss with your counselor about opportunities to apply this skill.""",

        "external_resources": resources,

        "ey_resources": [
            {
                "title": f"EY Badges for {skill_name}",
                "url": f"https://www.credly.com/organizations/ey/badges?search={skill_encoded}",
                "type": "badge",
                "badge_available": True,
                "description": f"Search EY badges related to {skill_name}"
            },
            {
                "title": "EY Virtual Academy",
                "url": EY_RESOURCES["virtual_academy"],
                "type": "course",
                "badge_available": False,
                "description": "Search for related courses on EY Virtual Academy"
            }
        ],

        "practice_exercises": [
            f"Complete a basic {skill_name} tutorial",
            f"Build a small project using {skill_name}",
            f"Explain {skill_name} concepts to a colleague"
        ],

        "success_criteria": [
            f"Can complete basic {skill_name} tasks independently",
            f"Can explain core {skill_name} concepts clearly",
            f"Have applied {skill_name} in at least one project"
        ]
    }


async def review_proof_submission(
    skill_name: str,
    module_title: str,
    proof_description: str,
    proof_link: Optional[str] = None,
) -> str:
    """
    AI review of a user's proof submission.

    Args:
        skill_name: Name of the skill
        module_title: Title of the module completed
        proof_description: User's description of their proof
        proof_link: Optional link to proof (project, certificate, etc.)

    Returns:
        AI feedback string (2-3 constructive sentences)
    """
    prompt = f"""Review this proof of completion for a skill module.

Skill: {skill_name}
Module: {module_title}
User's Description: {proof_description}
Link Provided: {proof_link or "None"}

Provide constructive feedback in 2-3 sentences:
1. Acknowledge what they've accomplished
2. Suggest how they could further demonstrate or apply this skill
3. Be encouraging and professional (EY tone)

Keep response under 150 words."""

    try:
        client = get_openai_client()
        response = await client.chat.completions.create(
            model=OPENAI_CHAT_MODEL,
            messages=[
                {"role": "system", "content": "You are a supportive EY career coach providing feedback on skill development."},
                {"role": "user", "content": prompt}
            ],
            max_completion_tokens=200,
        )

        return response.choices[0].message.content.strip()

    except Exception as e:
        logger.error(f"Proof review failed: {e}")
        return "Great work on completing this module! Consider how you can apply these skills in your current projects to further solidify your learning."


async def generate_skill_modules(
    skill_name: str,
    skill_type: str = "technical",
    min_modules: int = 3,
    max_modules: int = 6,
) -> List[Dict[str, Any]]:
    """
    Generate dynamic modules for a skill using AI.

    Args:
        skill_name: Name of the skill
        skill_type: technical, soft, or tool
        min_modules: Minimum number of modules
        max_modules: Maximum number of modules

    Returns:
        List of module dicts with name, description, order
    """
    prompt = f"""Generate {min_modules}-{max_modules} learning modules for the skill: {skill_name}

Skill type: {skill_type}

Return JSON with a "modules" array:
{{
    "modules": [
        {{"name": "Module Name", "description": "What you'll learn", "order": 1}},
        ...
    ]
}}

RULES:
- Module names should be specific to {skill_name}, not generic like "Fundamentals"
- For technical skills: cover concepts, practical application, advanced patterns, real-world projects
- For soft skills: cover awareness, practice, application, mastery
- For tools: cover basics, intermediate features, advanced usage
- Each module should build on the previous
- Use action-oriented names (e.g., "Building REST APIs with Python" not "Python APIs")"""

    try:
        client = get_openai_client()
        response = await client.chat.completions.create(
            model=OPENAI_CHAT_MODEL,
            messages=[
                {"role": "system", "content": "You are a curriculum designer. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            max_completion_tokens=800,
        )

        result = json.loads(response.choices[0].message.content)
        modules = result.get("modules", [])

        if modules and len(modules) >= min_modules:
            logger.info(f"Generated {len(modules)} modules for {skill_name}")
            return modules

    except Exception as e:
        logger.warning(f"Module generation failed for {skill_name}: {e}")

    # Fallback
    return _get_fallback_modules(skill_name, skill_type)


def _get_fallback_modules(skill_name: str, skill_type: str) -> List[Dict[str, Any]]:
    """Generate fallback modules based on skill type."""

    if skill_type == "technical":
        return [
            {"name": f"{skill_name} Fundamentals", "description": "Core concepts and syntax", "order": 1},
            {"name": f"Building with {skill_name}", "description": "Practical project development", "order": 2},
            {"name": f"Advanced {skill_name} Patterns", "description": "Best practices and optimization", "order": 3},
            {"name": f"{skill_name} in Production", "description": "Real-world deployment and maintenance", "order": 4},
        ]
    elif skill_type == "soft":
        return [
            {"name": "Understanding & Awareness", "description": "Foundations and self-assessment", "order": 1},
            {"name": "Developing the Skill", "description": "Techniques and practice", "order": 2},
            {"name": "Applying in Practice", "description": "Real situations and feedback", "order": 3},
        ]
    else:  # tool
        return [
            {"name": "Getting Started", "description": "Setup and basic features", "order": 1},
            {"name": "Core Features", "description": "Essential functionality", "order": 2},
            {"name": "Advanced Usage", "description": "Power features and integrations", "order": 3},
        ]
