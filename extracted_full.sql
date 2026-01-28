-- Extracted SQL from corrupted dump file
-- Note: Some statements may be incomplete

CREATE DATABASE springais WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

CREATE TABLE public.career_paths (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    current_position_node_id character varying,
    target_position_node_id character varying,
    graph_data jsonb NOT NULL,
    progression_status jsonb NOT NULL,
    last_updated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.employees (
    id character varying NOT NULL,
    service_line character varying NOT NULL,
    "current_role" character varying NOT NULL,
    role_level integer NOT NULL,
    years_experience numeric NOT NULL,
    skills jsonb NOT NULL,
    performance_metrics jsonb NOT NULL,
    feedback_themes character varying[] NOT NULL,
    notable_achievement text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.job_postings (
    id character varying NOT NULL,
    external_id character varying NOT NULL,
    title character varying NOT NULL,
    service_line character varying NOT NULL,
    location character varying NOT NULL,
    description text NOT NULL,
    required_skills jsonb NOT NULL,
    preferred_skills jsonb NOT NULL,
    tags jsonb NOT NULL,
    experience_years_min integer,
    experience_years_max integer,
    posting_url character varying,
    source_locale character varying,
    posted_date date,
    scraped_at timestamp with time zone,
    responsibilities_text text,
    requirements_text text,
    preferred_text text,
    last_seen_at timestamp with time zone,
    closed_at timestamp with time zone,
    is_active boolean NOT NULL,
    search_vector tsvector,
    llm_required_skills jsonb,
    llm_inferred_skills jsonb,
    llm_experience_years_min integer,
    llm_experience_years_max integer,
    llm_primary_domain character varying(100),
    skill_extraction_hash character varying(64),
    skills_extracted_at timestamp with time zone,
    description_embedding public.vector(1536),
    title_embedding public.vector(1536),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.matches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id character varying,
    job_posting_id character varying NOT NULL,
    user_id uuid,
    match_mode character varying NOT NULL,
    overall_score numeric NOT NULL,
    skill_match_score numeric NOT NULL,
    experience_score numeric NOT NULL,
    growth_potential_score numeric NOT NULL,
    skill_gaps jsonb NOT NULL,
    matched_skills jsonb NOT NULL,
    explanation text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.roadmap_edits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    roadmap_id uuid NOT NULL,
    edit_type character varying(20) NOT NULL,
    change_description text NOT NULL,
    affected_elements jsonb NOT NULL,
    original_values jsonb NOT NULL,
    new_values jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.roadmap_extras (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    roadmap_id uuid NOT NULL,
    phase_id character varying(100) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    category character varying(50) NOT NULL,
    completed_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.roadmap_milestone_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    roadmap_id uuid NOT NULL,
    milestone_id character varying(100) NOT NULL,
    phase_id character varying(100) NOT NULL,
    status character varying(20) NOT NULL,
    completed_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.saved_roadmaps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    target_role_titles jsonb NOT NULL,
    total_phases integer NOT NULL,
    total_milestones integer NOT NULL,
    total_estimated_months integer NOT NULL,
    emphasis character varying(50) NOT NULL,
    executive_summary text,
    roadmap_data jsonb NOT NULL,
    generated_at timestamp with time zone NOT NULL,
    edit_mode character varying(20) NOT NULL,
    has_manual_edits boolean NOT NULL,
    current_phase_id character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.skill_embeddings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    skill_text character varying NOT NULL,
    normalized_text character varying NOT NULL,
    embedding public.vector(1536) NOT NULL,
    source_type character varying NOT NULL,
    source_id character varying NOT NULL,
    embedding_model character varying NOT NULL,
    token_count integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.skill_modules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    skill_name character varying(255) NOT NULL,
    module_number integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    sequence_order integer NOT NULL,
    estimated_hours integer,
    resources jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.skill_taxonomy (
    id integer NOT NULL,
    canonical_name character varying(255) NOT NULL,
    category character varying(50) NOT NULL,
    aliases json,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);

CREATE SEQUENCE public.skill_taxonomy_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE public.user_module_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_skill_id uuid NOT NULL,
    module_id uuid NOT NULL,
    status character varying(20) NOT NULL,
    progress_percentage integer NOT NULL,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    notes text,
    extra_data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.user_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying NOT NULL,
    hashed_password character varying NOT NULL,
    full_name character varying,
    "current_role" character varying,
    years_experience numeric,
    target_service_line character varying,
    skills jsonb NOT NULL,
    employee_id character varying,
    resume_text text,
    resume_file_url character varying,
    skill_assessment_scores jsonb NOT NULL,
    onboarding_complete boolean NOT NULL,
    last_login_at timestamp with time zone,
    llm_listed_skills jsonb,
    llm_inferred_skills jsonb,
    skill_groupings jsonb,
    resume_embedding public.vector(1536),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.user_skill_recommendations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    skill_name character varying NOT NULL,
    category character varying,
    priority_score numeric NOT NULL,
    source character varying NOT NULL,
    related_job_ids jsonb NOT NULL,
    status character varying NOT NULL,
    user_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.user_skills (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    skill_name character varying(255) NOT NULL,
    category character varying(50) NOT NULL,
    status character varying(20) NOT NULL,
    proficiency_level integer NOT NULL,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX idx_career_path_user_id ON public.career_paths USING btree (user_id);

CREATE INDEX idx_employee_current_role ON public.employees USING btree ("current_role");

CREATE INDEX idx_employee_role_level ON public.employees USING btree (role_level);

CREATE INDEX idx_employee_service_line ON public.employees USING btree (service_line);

CREATE INDEX idx_employee_skills ON public.employees USING gin (skills);

CREATE INDEX idx_job_posting_created_at ON public.job_postings USING brin (created_at);

CREATE UNIQUE INDEX idx_job_posting_external_id ON public.job_postings USING btree (external_id);

CREATE INDEX idx_job_posting_is_active ON public.job_postings USING btree (is_active);

CREATE INDEX idx_job_posting_posted_date ON public.job_postings USING btree (posted_date);

CREATE INDEX idx_job_posting_required_skills ON public.job_postings USING gin (required_skills);

CREATE INDEX idx_job_posting_search_vector ON public.job_postings USING gin (search_vector);

CREATE INDEX idx_job_posting_service_line ON public.job_postings USING btree (service_line);

CREATE INDEX idx_job_posting_tags ON public.job_postings USING gin (tags);

CREATE INDEX idx_match_employee_id ON public.matches USING btree (employee_id);

CREATE INDEX idx_match_job_posting_id ON public.matches USING btree (job_posting_id);

CREATE INDEX idx_match_mode ON public.matches USING btree (match_mode);

CREATE INDEX idx_match_user_score ON public.matches USING btree (user_id, overall_score DESC);

CREATE INDEX idx_skill_embedding_normalized ON public.skill_embeddings USING btree (normalized_text);

CREATE INDEX idx_skill_embedding_source ON public.skill_embeddings USING btree (source_type, source_id);

CREATE INDEX idx_skill_embedding_vector ON public.skill_embeddings USING hnsw (embedding public.vector_cosine_ops);

CREATE INDEX idx_skill_module_name ON public.skill_modules USING btree (skill_name);

CREATE UNIQUE INDEX idx_skill_module_order ON public.skill_modules USING btree (skill_name, sequence_order);

CREATE INDEX idx_skill_rec_priority ON public.user_skill_recommendations USING btree (user_id, priority_score);

CREATE INDEX idx_skill_rec_user_id ON public.user_skill_recommendations USING btree (user_id);

CREATE INDEX idx_skill_taxonomy_category ON public.skill_taxonomy USING btree (category);

CREATE INDEX idx_user_module_skill ON public.user_module_progress USING btree (user_skill_id);

CREATE UNIQUE INDEX idx_user_module_unique ON public.user_module_progress USING btree (user_skill_id, module_id);

CREATE UNIQUE INDEX idx_user_profile_email ON public.user_profiles USING btree (email);

CREATE INDEX idx_user_profile_skills ON public.user_profiles USING gin (skills);

CREATE INDEX idx_user_profile_target_service_line ON public.user_profiles USING btree (target_service_line);

CREATE UNIQUE INDEX idx_user_skill_name ON public.user_skills USING btree (user_id, skill_name);

CREATE INDEX idx_user_skill_user_id ON public.user_skills USING btree (user_id);

CREATE INDEX ix_roadmap_edits_roadmap_id ON public.roadmap_edits USING btree (roadmap_id);

CREATE INDEX ix_roadmap_extras_roadmap_id ON public.roadmap_extras USING btree (roadmap_id);

CREATE INDEX ix_roadmap_milestone_progress_roadmap_id ON public.roadmap_milestone_progress USING btree (roadmap_id);

CREATE UNIQUE INDEX ix_skill_taxonomy_canonical_name ON public.skill_taxonomy USING btree (canonical_name);

CREATE INDEX ix_skill_taxonomy_category ON public.skill_taxonomy USING btree (category);

CREATE INDEX ix_skill_taxonomy_id ON public.skill_taxonomy USING btree (id);

COPY public.career_paths (id, user_id, current_position_node_id, target_position_node_id, graph_data, progression_status, last_updated_at, created_at, updated_at) FROM stdin;

COPY public.employees (id, service_line, "current_role", role_level, years_experience, skills, performance_metrics, feedback_themes, notable_achievement, created_at, updated_at) FROM stdin;

COPY public.job_postings (id, external_id, title, service_line, location, description, required_skills, preferred_skills, tags, experience_years_min, experience_years_max, posting_url, source_locale, posted_date, scraped_at, responsibilities_text, requirements_text, preferred_text, last_seen_at, closed_at, is_active, search_vector, llm_required_skills, llm_inferred_skills, llm_experience_years_min, llm_experience_years_max, llm_primary_domain, skill_extraction_hash, skills_extracted_at, description_embedding, title_embedding, created_at, updated_at) FROM stdin;

COPY public.matches (id, employee_id, job_posting_id, user_id, match_mode, overall_score, skill_match_score, experience_score, growth_potential_score, skill_gaps, matched_skills, explanation, created_at, updated_at) FROM stdin;

COPY public.roadmap_edits (id, roadmap_id, edit_type, change_description, affected_elements, original_values, new_values, created_at, updated_at) FROM stdin;

COPY public.roadmap_extras (id, roadmap_id, phase_id, title, description, category, completed_at, created_at, updated_at) FROM stdin;

COPY public.roadmap_milestone_progress (id, roadmap_id, milestone_id, phase_id, status, completed_at, notes, created_at, updated_at) FROM stdin;

COPY public.saved_roadmaps (id, user_id, title, target_role_titles, total_phases, total_milestones, total_estimated_months, emphasis, executive_summary, roadmap_data, generated_at, edit_mode, has_manual_edits, current_phase_id, created_at, updated_at) FROM stdin;

COPY public.skill_embeddings (id, skill_text, normalized_text, embedding, source_type, source_id, embedding_model, token_count, created_at, updated_at) FROM stdin;

COPY public.skill_modules (id, skill_name, module_number, title, description, sequence_order, estimated_hours, resources, created_at, updated_at) FROM stdin;

COPY public.skill_taxonomy (id, canonical_name, category, aliases, created_at, updated_at) FROM stdin;

COPY public.user_module_progress (id, user_skill_id, module_id, status, progress_percentage, started_at, completed_at, notes, extra_data, created_at, updated_at) FROM stdin;

COPY public.user_profiles (id, email, hashed_password, full_name, "current_role", years_experience, target_service_line, skills, employee_id, resume_text, resume_file_url, skill_assessment_scores, onboarding_complete, last_login_at, llm_listed_skills, llm_inferred_skills, skill_groupings, resume_embedding, created_at, updated_at) FROM stdin;

COPY public.user_skill_recommendations (id, user_id, skill_name, category, priority_score, source, related_job_ids, status, user_notes, created_at, updated_at) FROM stdin;

COPY public.user_skills (id, user_id, skill_name, category, status, proficiency_level, started_at, completed_at, created_at, updated_at) FROM stdin;

ALTER SEQUENCE public.skill_taxonomy_id_seq OWNED BY public.skill_taxonomy.id;

ALTER TABLE ONLY public.skill_taxonomy ALTER COLUMN id SET DEFAULT nextval('public.skill_taxonomy_id_seq'::regclass);

ALTER TABLE public.skill_taxonomy ALTER COLUMN id DROP DEFAULT;

ALTER TABLE ONLY public.career_paths
    ADD CONSTRAINT career_paths_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.career_paths DROP CONSTRAINT career_paths_pkey;

ALTER TABLE ONLY public.career_paths
    ADD CONSTRAINT career_paths_user_id_key UNIQUE (user_id);

ALTER TABLE ONLY public.career_paths DROP CONSTRAINT career_paths_user_id_key;

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.employees DROP CONSTRAINT employees_pkey;

ALTER TABLE ONLY public.job_postings
    ADD CONSTRAINT job_postings_external_id_key UNIQUE (external_id);

ALTER TABLE ONLY public.job_postings DROP CONSTRAINT job_postings_external_id_key;

ALTER TABLE ONLY public.job_postings
    ADD CONSTRAINT job_postings_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.job_postings DROP CONSTRAINT job_postings_pkey;

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.matches DROP CONSTRAINT matches_pkey;

ALTER TABLE ONLY public.roadmap_edits
    ADD CONSTRAINT roadmap_edits_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.roadmap_edits DROP CONSTRAINT roadmap_edits_pkey;

ALTER TABLE ONLY public.roadmap_extras
    ADD CONSTRAINT roadmap_extras_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.roadmap_extras DROP CONSTRAINT roadmap_extras_pkey;

ALTER TABLE ONLY public.roadmap_milestone_progress
    ADD CONSTRAINT roadmap_milestone_progress_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.roadmap_milestone_progress DROP CONSTRAINT roadmap_milestone_progress_pkey;

ALTER TABLE ONLY public.saved_roadmaps
    ADD CONSTRAINT saved_roadmaps_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.saved_roadmaps DROP CONSTRAINT saved_roadmaps_pkey;

ALTER TABLE ONLY public.skill_embeddings
    ADD CONSTRAINT skill_embeddings_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.skill_embeddings DROP CONSTRAINT skill_embeddings_pkey;

ALTER TABLE ONLY public.skill_modules
    ADD CONSTRAINT skill_modules_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.skill_modules DROP CONSTRAINT skill_modules_pkey;

ALTER TABLE ONLY public.skill_taxonomy
    ADD CONSTRAINT skill_taxonomy_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.skill_taxonomy DROP CONSTRAINT skill_taxonomy_pkey;

ALTER TABLE ONLY public.user_module_progress
    ADD CONSTRAINT user_module_progress_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.user_module_progress DROP CONSTRAINT user_module_progress_pkey;

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_email_key UNIQUE (email);

ALTER TABLE ONLY public.user_profiles DROP CONSTRAINT user_profiles_email_key;

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.user_profiles DROP CONSTRAINT user_profiles_pkey;

ALTER TABLE ONLY public.user_skill_recommendations
    ADD CONSTRAINT user_skill_recommendations_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.user_skill_recommendations DROP CONSTRAINT user_skill_recommendations_pkey;

ALTER TABLE ONLY public.user_skills
    ADD CONSTRAINT user_skills_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.user_skills DROP CONSTRAINT user_skills_pkey;

ALTER TABLE ONLY public.career_paths
    ADD CONSTRAINT career_paths_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.career_paths DROP CONSTRAINT career_paths_user_id_fkey;

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.matches DROP CONSTRAINT matches_employee_id_fkey;

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_job_posting_id_fkey FOREIGN KEY (job_posting_id) REFERENCES public.job_postings(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.matches DROP CONSTRAINT matches_job_posting_id_fkey;

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.matches DROP CONSTRAINT matches_user_id_fkey;

ALTER TABLE ONLY public.roadmap_edits
    ADD CONSTRAINT roadmap_edits_roadmap_id_fkey FOREIGN KEY (roadmap_id) REFERENCES public.saved_roadmaps(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.roadmap_edits DROP CONSTRAINT roadmap_edits_roadmap_id_fkey;

ALTER TABLE ONLY public.roadmap_extras
    ADD CONSTRAINT roadmap_extras_roadmap_id_fkey FOREIGN KEY (roadmap_id) REFERENCES public.saved_roadmaps(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.roadmap_extras DROP CONSTRAINT roadmap_extras_roadmap_id_fkey;

ALTER TABLE ONLY public.roadmap_milestone_progress
    ADD CONSTRAINT roadmap_milestone_progress_roadmap_id_fkey FOREIGN KEY (roadmap_id) REFERENCES public.saved_roadmaps(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.roadmap_milestone_progress DROP CONSTRAINT roadmap_milestone_progress_roadmap_id_fkey;

ALTER TABLE ONLY public.saved_roadmaps
    ADD CONSTRAINT saved_roadmaps_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.saved_roadmaps DROP CONSTRAINT saved_roadmaps_user_id_fkey;

ALTER TABLE ONLY public.user_module_progress
    ADD CONSTRAINT user_module_progress_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.skill_modules(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.user_module_progress DROP CONSTRAINT user_module_progress_module_id_fkey;

ALTER TABLE ONLY public.user_module_progress
    ADD CONSTRAINT user_module_progress_user_skill_id_fkey FOREIGN KEY (user_skill_id) REFERENCES public.user_skills(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.user_module_progress DROP CONSTRAINT user_module_progress_user_skill_id_fkey;

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);

ALTER TABLE ONLY public.user_profiles DROP CONSTRAINT user_profiles_employee_id_fkey;

ALTER TABLE ONLY public.user_skill_recommendations
    ADD CONSTRAINT user_skill_recommendations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.user_skill_recommendations DROP CONSTRAINT user_skill_recommendations_user_id_fkey;

ALTER TABLE ONLY public.user_skills
    ADD CONSTRAINT user_skills_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.user_skills DROP CONSTRAINT user_skills_user_id_fkey;

SET client_encoding = 'UTF8';

SET standard_conforming_strings = 'on';

SET DEFAULT nextval('public.skill_taxonomy_id_seq'::regclass);

SELECT pg_catalog.set_config('search_path', '', false);

SELECT pg_catalog.setval('public.skill_taxonomy_id_seq', 1, false);

