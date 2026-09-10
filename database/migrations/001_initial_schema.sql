-- CMRG Survey Data Collection Platform
-- Migration: 001_initial_schema.sql
-- Description: Production PostgreSQL relational database schema for CMRG Survey & CMRG Collect

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations
CREATE TABLE IF NOT EXISTS organizations (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(32) UNIQUE NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    country VARCHAR(100) DEFAULT 'Nigeria',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Roles
CREATE TABLE IF NOT EXISTS roles (
    role_name VARCHAR(32) PRIMARY KEY,
    description TEXT NOT NULL
);

INSERT INTO roles (role_name, description) VALUES
('ADMIN', 'Full system and institutional administrative control'),
('PROJECT_MANAGER', 'Can manage projects, design and publish forms, assign enumerators'),
('SUPERVISOR', 'Can monitor enumeration, review, approve, reject, or flag submissions'),
('ENUMERATOR', 'Field agent who downloads forms and collects data via CMRG Collect'),
('DATA_ANALYST', 'Read-only analyst access to explore data and export analytics')
ON CONFLICT (role_name) DO NOTHING;

-- 3. Users
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) REFERENCES organizations(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(32) NOT NULL REFERENCES roles(role_name),
    status VARCHAR(32) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    device_id VARCHAR(64),
    assigned_project_ids JSONB DEFAULT '[]'::jsonb,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 4. Projects
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) REFERENCES organizations(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    client VARCHAR(255) DEFAULT 'Internal',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(32) DEFAULT 'ACTIVE' CHECK (status IN ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED')),
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- 5. Forms (Survey Questionnaires)
CREATE TABLE IF NOT EXISTS forms (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(32) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    current_version_number INT DEFAULT 0,
    current_version_id VARCHAR(64),
    settings JSONB DEFAULT '{"allowDrafts": true, "requireGps": false}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_forms_project_id ON forms(project_id);
CREATE INDEX IF NOT EXISTS idx_forms_status ON forms(status);

-- 6. Form Versions (Immutable Snapshots)
CREATE TABLE IF NOT EXISTS form_versions (
    id VARCHAR(64) PRIMARY KEY,
    form_id VARCHAR(64) NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    version_tag VARCHAR(32) NOT NULL,
    questions_json JSONB NOT NULL,
    settings JSONB NOT NULL,
    notes TEXT,
    published_by VARCHAR(255) NOT NULL,
    published_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (form_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_form_versions_form ON form_versions(form_id);

-- 7. Choice Lists
CREATE TABLE IF NOT EXISTS choice_lists (
    id VARCHAR(64) PRIMARY KEY,
    form_id VARCHAR(64) REFERENCES forms(id) ON DELETE CASCADE,
    list_name VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. Choices
CREATE TABLE IF NOT EXISTS choices (
    id VARCHAR(64) PRIMARY KEY,
    choice_list_id VARCHAR(64) REFERENCES choice_lists(id) ON DELETE CASCADE,
    value VARCHAR(128) NOT NULL,
    label TEXT NOT NULL,
    filter_category VARCHAR(128),
    sort_order INT DEFAULT 0
);

-- 9. Questions (Normalized definitions for builder & catalog)
CREATE TABLE IF NOT EXISTS questions (
    id VARCHAR(64) PRIMARY KEY,
    form_id VARCHAR(64) NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    variable_name VARCHAR(64) NOT NULL,
    label TEXT NOT NULL,
    hint TEXT,
    question_type VARCHAR(32) NOT NULL,
    is_required BOOLEAN DEFAULT FALSE,
    is_readonly BOOLEAN DEFAULT FALSE,
    choice_list_name VARCHAR(64),
    relevance_expression TEXT,
    constraint_expression TEXT,
    constraint_message TEXT,
    calculation_expression TEXT,
    appearance VARCHAR(64),
    max_rating INT DEFAULT 5,
    sort_order INT NOT NULL,
    group_id VARCHAR(64),
    repeat_id VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_questions_form ON questions(form_id);

-- 10. Enumerator Assignments / Deployments
CREATE TABLE IF NOT EXISTS enumerator_assignments (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    form_id VARCHAR(64) NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    form_version_id VARCHAR(64) NOT NULL REFERENCES form_versions(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    target_type VARCHAR(32) DEFAULT 'ALL' CHECK (target_type IN ('ENUMERATOR', 'TEAM', 'ALL')),
    assigned_to_user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(32) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'EXPIRED')),
    deployed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_assignments_user ON enumerator_assignments(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_form ON enumerator_assignments(form_id);

-- 11. Devices (CMRG Collect Mobile Instances)
CREATE TABLE IF NOT EXISTS devices (
    id VARCHAR(64) PRIMARY KEY,
    device_id VARCHAR(64) UNIQUE NOT NULL,
    device_name VARCHAR(255) NOT NULL,
    assigned_user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    app_version VARCHAR(64) DEFAULT 'CMRG Collect v2.4.0',
    device_model VARCHAR(128),
    os_version VARCHAR(64),
    last_sync_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(32) DEFAULT 'ACTIVE'
);

CREATE INDEX IF NOT EXISTS idx_devices_device_id ON devices(device_id);

-- 12. Submissions (Main interview records with client idempotency key)
CREATE TABLE IF NOT EXISTS submissions (
    id VARCHAR(64) PRIMARY KEY,
    client_submission_id VARCHAR(128) UNIQUE NOT NULL, -- UUID generated by CMRG Collect for idempotency
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    form_id VARCHAR(64) NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    form_version_id VARCHAR(64) NOT NULL REFERENCES form_versions(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    enumerator_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    enumerator_name VARCHAR(255) NOT NULL,
    device_id VARCHAR(64) NOT NULL,
    status VARCHAR(32) DEFAULT 'COMPLETED' CHECK (status IN ('DRAFT', 'COMPLETED', 'QUEUED', 'SYNCING', 'SYNCED', 'FAILED', 'REVIEWED', 'APPROVED', 'REJECTED', 'FLAGGED')),
    sync_status VARCHAR(32) DEFAULT 'SYNCED' CHECK (sync_status IN ('OFFLINE_SAVED', 'QUEUED', 'SYNCED', 'SYNC_FAILED')),
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    repeat_data JSONB DEFAULT '{}'::jsonb,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    altitude DOUBLE PRECISION,
    accuracy DOUBLE PRECISION,
    location_timestamp TIMESTAMPTZ,
    review_status VARCHAR(32) CHECK (review_status IN ('APPROVED', 'REJECTED', 'FLAGGED')),
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_submissions_client_id ON submissions(client_submission_id);
CREATE INDEX IF NOT EXISTS idx_submissions_form_id ON submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_submissions_project_id ON submissions(project_id);
CREATE INDEX IF NOT EXISTS idx_submissions_enumerator ON submissions(enumerator_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);

-- 13. Submission Answers (Normalized tabular format for SQL analytics)
CREATE TABLE IF NOT EXISTS submission_answers (
    id VARCHAR(64) PRIMARY KEY,
    submission_id VARCHAR(64) NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    variable_name VARCHAR(64) NOT NULL,
    text_value TEXT,
    numeric_value DOUBLE PRECISION,
    boolean_value BOOLEAN,
    json_value JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_answers_submission ON submission_answers(submission_id);
CREATE INDEX IF NOT EXISTS idx_answers_variable ON submission_answers(variable_name);

-- 14. Submission Media / Attachments
CREATE TABLE IF NOT EXISTS submission_media (
    id VARCHAR(64) PRIMARY KEY,
    submission_id VARCHAR(64) NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    question_name VARCHAR(64) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(128) NOT NULL,
    file_size INT NOT NULL,
    storage_path TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_media_submission ON submission_media(submission_id);

-- 15. Sync Events (Audit trail for offline field sync batches)
CREATE TABLE IF NOT EXISTS sync_events (
    id VARCHAR(64) PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL,
    enumerator_id VARCHAR(64) NOT NULL,
    batch_size INT NOT NULL,
    synced_count INT NOT NULL,
    duplicate_count INT NOT NULL,
    client_timestamp TIMESTAMPTZ,
    server_timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(32) DEFAULT 'SUCCESS'
);

-- 16. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    action VARCHAR(64) NOT NULL,
    resource VARCHAR(255) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
