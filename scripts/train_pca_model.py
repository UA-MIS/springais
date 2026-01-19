"""
Train PCA Model for Dimensionality Reduction

This script trains a PCA model on diverse skill embeddings to reduce
dimensionality from 3072 (OpenAI text-embedding-3-large) to 1536
(pgvector HNSW-compatible).

Goal: Preserve 95%+ variance while enabling fast pgvector indexing.

Usage:
    python scripts/train_pca_model.py

Requirements:
    - OpenAI API key in .env
    - Diverse skill samples for training
"""

import asyncio
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
import numpy as np
from sklearn.decomposition import PCA
from dotenv import load_dotenv

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.app.config import get_openai_client
from backend.app.utils.pca_loader import save_pca_model, PCAMetadata


# Diverse skill samples for training (covers multiple domains)
DIVERSE_SKILLS = [
    # Programming Languages
    "Python Programming", "JavaScript", "Java", "C++", "C#", "Ruby", "Go", "Rust",
    "TypeScript", "PHP", "Swift", "Kotlin", "Scala", "R Programming", "MATLAB",

    # Web Development
    "React", "Angular", "Vue.js", "Node.js", "Express.js", "Django", "Flask",
    "HTML", "CSS", "Sass", "Bootstrap", "Tailwind CSS", "jQuery", "Redux",
    "Next.js", "Nuxt.js", "GraphQL", "REST API", "Web Development",

    # Cloud & DevOps
    "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "Terraform", "Ansible",
    "Jenkins", "GitLab CI/CD", "GitHub Actions", "Cloud Architecture", "DevOps",
    "Infrastructure as Code", "Continuous Integration", "Continuous Deployment",

    # Databases
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "SQLite",
    "Oracle Database", "SQL Server", "Cassandra", "DynamoDB", "Neo4j",
    "Database Design", "SQL", "NoSQL", "Data Modeling",

    # Data Science & ML
    "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Scikit-learn",
    "Data Analysis", "Data Science", "Pandas", "NumPy", "Jupyter", "Statistics",
    "Natural Language Processing", "Computer Vision", "Neural Networks",
    "Data Visualization", "Tableau", "Power BI", "Matplotlib", "Seaborn",

    # Mobile Development
    "iOS Development", "Android Development", "React Native", "Flutter",
    "Mobile App Development", "SwiftUI", "Jetpack Compose",

    # AI & Specialized
    "Artificial Intelligence", "ChatGPT", "OpenAI", "Large Language Models",
    "Prompt Engineering", "Retrieval Augmented Generation", "Vector Databases",
    "Semantic Search", "Embedding Models", "Fine-tuning",

    # Software Engineering
    "Software Development", "Software Architecture", "System Design",
    "Microservices", "Design Patterns", "Object-Oriented Programming",
    "Functional Programming", "Test Driven Development", "Unit Testing",
    "Integration Testing", "Agile", "Scrum", "Code Review", "Git", "Version Control",

    # Security
    "Cybersecurity", "Network Security", "Application Security", "Penetration Testing",
    "Cryptography", "OAuth", "JWT", "HTTPS", "SSL/TLS", "Security Auditing",

    # Frontend
    "Frontend Development", "UI Development", "Responsive Design", "Cross-Browser Compatibility",
    "Web Performance Optimization", "Accessibility", "User Interface Design",

    # Backend
    "Backend Development", "API Development", "Server-Side Programming",
    "Database Management", "Authentication", "Authorization", "Caching",

    # Soft Skills
    "Leadership", "Communication", "Teamwork", "Problem Solving",
    "Project Management", "Time Management", "Critical Thinking",
    "Presentation Skills", "Mentoring", "Collaboration",

    # Business & Finance
    "Business Analysis", "Financial Analysis", "Accounting", "Budgeting",
    "Financial Modeling", "Excel", "QuickBooks", "SAP", "Salesforce",

    # Healthcare
    "Healthcare Management", "Medical Coding", "Patient Care", "HIPAA Compliance",
    "Electronic Health Records", "Clinical Research",

    # Legal
    "Legal Research", "Contract Law", "Intellectual Property", "Compliance",
    "Regulatory Affairs", "Corporate Law",

    # Marketing
    "Digital Marketing", "SEO", "Content Marketing", "Social Media Marketing",
    "Email Marketing", "Google Analytics", "Marketing Strategy",

    # Design
    "Graphic Design", "UX Design", "UI Design", "Adobe Photoshop", "Figma",
    "User Experience", "Wireframing", "Prototyping", "Design Thinking",

    # Other Technical
    "Linux", "Windows Server", "Networking", "TCP/IP", "DNS", "Load Balancing",
    "Monitoring", "Logging", "Performance Tuning", "Troubleshooting",

    # Industry-Specific
    "E-commerce", "Fintech", "Healthcare IT", "EdTech", "Gaming",
    "IoT", "Blockchain", "Web3", "Cryptocurrency",

    # Additional Programming Concepts
    "Algorithm Design", "Data Structures", "Big O Notation", "Recursion",
    "Dynamic Programming", "Graph Algorithms", "Sorting Algorithms",

    # More Cloud Services
    "EC2", "S3", "Lambda", "RDS", "CloudFormation", "CloudWatch",
    "Azure Functions", "Azure DevOps", "Google BigQuery", "Cloud Storage",

    # More Frameworks
    "Spring Boot", "Laravel", "Ruby on Rails", "ASP.NET", "FastAPI",
    "Strapi", "Nest.js", "Svelte", "Gatsby", "Remix",

    # Testing
    "Selenium", "Cypress", "Jest", "Pytest", "JUnit", "TestNG",
    "Mocha", "Chai", "End-to-End Testing", "Load Testing", "API Testing",

    # Tools
    "Jira", "Confluence", "Slack", "Trello", "Asana", "GitHub",
    "Bitbucket", "VS Code", "IntelliJ IDEA", "PyCharm",

    # Networking & Infrastructure
    "VPN", "Firewall Configuration", "Network Administration", "Cloud Networking",
    "CDN", "API Gateway", "Reverse Proxy", "NGINX", "Apache",

    # Methodologies
    "Agile Methodology", "Scrum Framework", "Kanban", "Lean", "Six Sigma",
    "Waterfall", "DevOps Culture", "Site Reliability Engineering",
]


async def generate_embeddings(skills: list[str]) -> np.ndarray:
    """
    Generate embeddings for a list of skills using OpenAI API.

    Args:
        skills: List of skill texts

    Returns:
        NumPy array of shape (n_skills, 3072)
    """
    print(f"\n[*] Generating embeddings for {len(skills)} skills...")
    print(f"    (This will cost ~${len(skills) * 3 * 0.13 / 1_000_000:.4f})")

    # Load OpenAI client
    load_dotenv()
    client = get_openai_client()

    embeddings = []
    batch_size = 100

    # Process in batches
    for i in range(0, len(skills), batch_size):
        batch = skills[i:i + batch_size]
        print(f"   Processing batch {i // batch_size + 1}/{(len(skills) - 1) // batch_size + 1}...")

        try:
            # Call OpenAI API
            response = await client.embeddings.create(
                model="text-embedding-3-large",
                input=batch
            )

            # Extract embeddings
            batch_embeddings = [data.embedding for data in response.data]
            embeddings.extend(batch_embeddings)

            # Small delay to avoid rate limits
            if i + batch_size < len(skills):
                await asyncio.sleep(0.5)

        except Exception as e:
            print(f"    [ERROR] Error processing batch: {e}")
            raise

    # Convert to NumPy array
    embeddings_array = np.array(embeddings)

    print(f"    [OK] Generated {embeddings_array.shape[0]} embeddings")
    print(f"    [OK] Shape: {embeddings_array.shape} (samples, dimensions)")

    return embeddings_array


def train_pca_model(embeddings: np.ndarray, n_components: int = 1536, random_state: int = 42) -> PCA:
    """
    Train PCA model on embeddings.

    Args:
        embeddings: NumPy array of shape (n_samples, 3072)
        n_components: Number of components to keep (default: 1536)
        random_state: Random seed for reproducibility

    Returns:
        Trained PCA model
    """
    print(f"\n[*] Training PCA model...")
    print(f"    Input dimensions: {embeddings.shape[1]}")
    print(f"    Output dimensions: {n_components}")
    print(f"    Training samples: {embeddings.shape[0]}")

    # Train PCA
    pca = PCA(n_components=n_components, random_state=random_state)
    pca.fit(embeddings)

    # Calculate explained variance
    explained_variance = pca.explained_variance_ratio_.sum()

    print(f"    [OK] PCA training complete")
    print(f"    [OK] Explained variance: {explained_variance:.4f} ({explained_variance * 100:.2f}%)")

    # Validate variance threshold
    if explained_variance < 0.95:
        print(f"    [WARNING] Explained variance is below 95% threshold!")
        print(f"    Consider increasing n_components or using more training data.")
    else:
        print(f"    [OK] Variance preservation meets 95%+ threshold")

    return pca


def validate_pca_model(pca: PCA, original_embeddings: np.ndarray) -> None:
    """
    Validate PCA model by testing transformation and similarity preservation.

    Args:
        pca: Trained PCA model
        original_embeddings: Original embeddings for validation
    """
    print(f"\n[*] Validating PCA model...")

    # Transform a sample embedding
    sample_original = original_embeddings[0:1]  # Shape (1, 3072)
    sample_reduced = pca.transform(sample_original)  # Shape (1, 1536)

    print(f"    [OK] Transformation test:")
    print(f"         Original dimensions: {sample_original.shape[1]}")
    print(f"         Reduced dimensions: {sample_reduced.shape[1]}")

    # Test similarity preservation
    # Compare cosine similarity before and after PCA
    if len(original_embeddings) >= 2:
        # Transform first 2 samples
        samples_original = original_embeddings[0:2]
        samples_reduced = pca.transform(samples_original)

        # Calculate cosine similarities
        def cosine_similarity(a, b):
            return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

        sim_original = cosine_similarity(samples_original[0], samples_original[1])
        sim_reduced = cosine_similarity(samples_reduced[0], samples_reduced[1])

        print(f"    [OK] Similarity preservation test:")
        print(f"         Original similarity: {sim_original:.4f}")
        print(f"         Reduced similarity: {sim_reduced:.4f}")
        print(f"         Difference: {abs(sim_original - sim_reduced):.4f}")

        if abs(sim_original - sim_reduced) < 0.05:
            print(f"    [OK] Similarity well preserved (<0.05 difference)")
        else:
            print(f"    [WARNING] Similarity difference is significant (>0.05)")

    print(f"    [OK] Validation complete")


def expand_skills_with_variations(base_skills: list[str]) -> list[str]:
    """
    Expand base skills with semantic variations to reach 1536+ samples.

    This creates variations by adding common modifiers and synonyms.
    """
    expanded = list(base_skills)  # Start with base skills

    # Common skill variations
    variations = [
        "{skill}",
        "{skill} Development",
        "{skill} Programming",
        "{skill} Engineering",
        "Advanced {skill}",
        "Senior {skill}",
        "{skill} Expert",
        "{skill} Specialist",
    ]

    # Add variations for each base skill
    for skill in base_skills:
        for variation in variations:
            variant = variation.format(skill=skill)
            if variant != skill and variant not in expanded:
                expanded.append(variant)
                if len(expanded) >= 2000:  # More than enough
                    return expanded[:1600]  # Trim to reasonable size

    return expanded


async def main():
    """Main training pipeline."""
    print("=" * 80)
    print("PCA Model Training for SpringAIS Embeddings")
    print("=" * 80)

    # Configuration
    n_components = 1536
    random_state = 42
    version = "v1"

    # Expand skills to reach minimum sample size
    base_skills = DIVERSE_SKILLS
    training_skills = expand_skills_with_variations(base_skills)

    print(f"\n[*] Expanded {len(base_skills)} base skills to {len(training_skills)} variations")

    # Option to limit for testing (uncomment to use limited set)
    # training_skills = training_skills[:500]  # Test with 500 skills

    print(f"\n[*] Configuration:")
    print(f"   Training samples: {len(training_skills)}")
    print(f"   Input dimensions: 3072 (text-embedding-3-large)")
    print(f"   Output dimensions: {n_components}")
    print(f"   Random state: {random_state}")
    print(f"   Version: {version}")

    # Step 1: Generate embeddings
    embeddings = await generate_embeddings(training_skills)

    # Step 2: Train PCA model
    pca = train_pca_model(embeddings, n_components=n_components, random_state=random_state)

    # Step 3: Validate model
    validate_pca_model(pca, embeddings)

    # Step 4: Save model and metadata
    print(f"\n[*] Saving PCA model...")

    explained_variance = float(pca.explained_variance_ratio_.sum())

    metadata = PCAMetadata(
        version=version,
        n_components=n_components,
        input_dimensions=3072,
        explained_variance_ratio=explained_variance,
        training_samples=len(training_skills),
        random_state=random_state,
        openai_model="text-embedding-3-large",
        created_at=datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    )

    save_pca_model(pca, metadata, version=version)

    print(f"\n" + "=" * 80)
    print(f"[SUCCESS] PCA MODEL TRAINING COMPLETE")
    print(f"=" * 80)
    print(f"\nModel ready for use in EmbeddingService!")
    print(f"Variance preserved: {explained_variance:.2%}")
    print(f"\nNext steps:")
    print(f"  1. Run tests: pytest tests/services/test_pca.py")
    print(f"  2. Integrate into EmbeddingService (Task 8)")
    print(f"  3. Generate embeddings for employee/job skills (Task 13-14)")


if __name__ == "__main__":
    # Check for OpenAI API key
    load_dotenv()
    if not os.getenv("OPENAI_API_KEY"):
        print("[ERROR] OPENAI_API_KEY not found in .env file")
        print("   Please add your OpenAI API key to .env:")
        print("   OPENAI_API_KEY=sk-...")
        sys.exit(1)

    # Run async main
    asyncio.run(main())
