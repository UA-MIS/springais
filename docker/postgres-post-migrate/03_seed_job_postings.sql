-- Corrected copy of data/seed_job_postings.sql.
--
-- The original lives in Git LFS and is left untouched. It targets the pre-013
-- schema (required_skills/preferred_skills as text[]) and fails to load against
-- migration head with:
--   ERROR: column "required_skills" is of type jsonb but expression is of type text[]
--
-- Run AFTER `alembic upgrade head`:
--   docker exec -i springais-postgres psql -U postgres -d springais \
--     < docker/postgres-post-migrate/03_seed_job_postings.sql

-- Seed job postings for local testing / unblock other blocks.
-- Updated 2026-09-01: required_skills/preferred_skills became JSONB in migration 013
-- ("Normalize job_postings types to match models"), so the original text[] ARRAY
-- literals no longer loaded. Wrapped in to_jsonb(...) to match the current schema.

INSERT INTO job_postings (
  id,
  external_id,
  title,
  service_line,
  location,
  description,
  required_skills,
  preferred_skills,
  experience_years_min,
  experience_years_max,
  posting_url,
  posted_date,
  scraped_at
)
VALUES
(
  '00000000-0000-0000-0000-000000000001',
  'SEED-001',
  'Senior Analyst - Assurance',
  'Assurance',
  'New York, NY',
  'Join our Assurance practice supporting audit engagements. You will perform audit procedures, work with GAAP financial statements, and collaborate with clients.',
  to_jsonb(ARRAY['Audit','Accounting','Excel','Communication']),
  to_jsonb(ARRAY['CPA']),
  3,
  5,
  'https://careers.ey.com/ey/job/seed/SEED-001/',
  now()::date,
  now()
),
(
  '00000000-0000-0000-0000-000000000002',
  'SEED-002',
  'Manager - Corporate Tax',
  'Tax',
  'Boston, MA',
  'Lead corporate tax engagements including tax provision and compliance. Provide guidance on tax planning and risk management.',
  to_jsonb(ARRAY['Tax','Compliance','Risk Management','Communication']),
  to_jsonb(ARRAY['CPA','CFA']),
  5,
  8,
  'https://careers.ey.com/ey/job/seed/SEED-002/',
  now()::date,
  now()
),
(
  '00000000-0000-0000-0000-000000000003',
  'SEED-003',
  'Consultant - Cloud & Infrastructure',
  'Consulting',
  'Remote',
  'Support cloud transformation projects. Build and operate infrastructure with AWS, Docker, Kubernetes and CI/CD pipelines.',
  to_jsonb(ARRAY['AWS','Docker','Kubernetes','DevOps']),
  to_jsonb(ARRAY['Terraform','Linux','Git']),
  4,
  6,
  'https://careers.ey.com/ey/job/seed/SEED-003/',
  now()::date,
  now()
),
(
  '00000000-0000-0000-0000-000000000004',
  'SEED-004',
  'Senior Consultant - Data Analytics',
  'Consulting',
  'Chicago, IL',
  'Deliver analytics solutions using Python, SQL and Tableau. Partner with stakeholders to define metrics and dashboards.',
  to_jsonb(ARRAY['Python','SQL','Data Analysis','Tableau']),
  to_jsonb(ARRAY['Power BI','Communication','Project Management']),
  4,
  7,
  'https://careers.ey.com/ey/job/seed/SEED-004/',
  now()::date,
  now()
),
(
  '00000000-0000-0000-0000-000000000005',
  'SEED-005',
  'Senior - Audit',
  'Assurance',
  'Dallas, TX',
  'Execute audit planning, fieldwork, and reporting. Work with IFRS/GAAP and collaborate across engagement teams.',
  to_jsonb(ARRAY['Audit','Accounting','Communication']),
  to_jsonb(ARRAY['CPA','Attention to Detail']),
  2,
  4,
  'https://careers.ey.com/ey/job/seed/SEED-005/',
  now()::date,
  now()
),
(
  '00000000-0000-0000-0000-000000000006',
  'SEED-006',
  'Senior Associate - International Tax',
  'Tax',
  'San Francisco, CA',
  'Assist with international tax advisory, transfer pricing coordination, and tax compliance. Draft memos and support client delivery.',
  to_jsonb(ARRAY['Tax','Business Analysis','Communication']),
  to_jsonb(ARRAY['CPA','CMA']),
  3,
  5,
  'https://careers.ey.com/ey/job/seed/SEED-006/',
  now()::date,
  now()
),
(
  '00000000-0000-0000-0000-000000000007',
  'SEED-007',
  'Manager - Technology Consulting',
  'Consulting',
  'Atlanta, GA',
  'Lead teams delivering system design and API integrations. Build services with Java, REST APIs, and cloud platforms.',
  to_jsonb(ARRAY['System Design','REST API','Java','Azure']),
  to_jsonb(ARRAY['Leadership','Agile','Jira']),
  7,
  10,
  'https://careers.ey.com/ey/job/seed/SEED-007/',
  now()::date,
  now()
),
(
  '00000000-0000-0000-0000-000000000008',
  'SEED-008',
  'Analyst - Risk & Compliance',
  'Other',
  'Washington, DC',
  'Support compliance assessments and risk reviews. Document controls, analyze findings, and communicate recommendations.',
  to_jsonb(ARRAY['Compliance','Risk Management','Communication','Attention to Detail']),
  to_jsonb(ARRAY['Project Management']),
  1,
  3,
  'https://careers.ey.com/ey/job/seed/SEED-008/',
  now()::date,
  now()
),
(
  '00000000-0000-0000-0000-000000000009',
  'SEED-009',
  'Senior Consultant - Cybersecurity',
  'Consulting',
  'New York, NY',
  'Perform security assessments and advise on security architecture. Experience with IAM, OAuth, and application security preferred.',
  to_jsonb(ARRAY['Security','OAuth','Problem Solving','Communication']),
  to_jsonb(ARRAY['CISSP','Linux']),
  4,
  8,
  'https://careers.ey.com/ey/job/seed/SEED-009/',
  now()::date,
  now()
),
(
  '00000000-0000-0000-0000-000000000010',
  'SEED-010',
  'Manager - Financial Reporting',
  'Assurance',
  'Los Angeles, CA',
  'Advise clients on financial reporting, accounting policy, and close processes. Strong Excel and accounting background required.',
  to_jsonb(ARRAY['Accounting','Financial Analysis','Excel','Communication']),
  to_jsonb(ARRAY['CPA','Leadership']),
  6,
  10,
  'https://careers.ey.com/ey/job/seed/SEED-010/',
  now()::date,
  now()
);

