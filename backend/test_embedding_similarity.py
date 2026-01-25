"""Test raw embedding similarity between skill pairs."""
import asyncio
from openai import AsyncOpenAI
import numpy as np


async def test_similarity():
    client = AsyncOpenAI()

    pairs = [
        ('Quantitative Data Collection', 'Quantitative Research'),
        ('Vendor Risk Management', 'Risk Management'),
        ('Project Tracking and Reporting', 'Project Management'),
        ('Client Service Mindset', 'Client Relationship Management'),
        ('IT General Controls (ITGC)', 'Risk Management'),
        ('Access Management Controls', 'Risk Management'),
        ('Process Improvement', 'Project Management'),
    ]

    print('=== RAW EMBEDDING SIMILARITY (text-embedding-3-large) ===\n')

    for skill1, skill2 in pairs:
        response = await client.embeddings.create(
            model='text-embedding-3-large',
            input=[skill1, skill2]
        )

        vec1 = np.array(response.data[0].embedding)
        vec2 = np.array(response.data[1].embedding)

        similarity = np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))

        print(f'"{skill1}"')
        print(f'  vs "{skill2}"')
        print(f'  => Similarity: {similarity:.4f}')
        print()


if __name__ == '__main__':
    asyncio.run(test_similarity())
