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
