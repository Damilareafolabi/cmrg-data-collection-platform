-- CMRG Survey Data Collection Platform
-- Migration: 002_seed_data.sql
-- Description: Production seed data for Organization, Users with distinct Roles, Sample Project, Form, Questions, and Submissions

-- Organization
INSERT INTO organizations (id, name, code, contact_email, country) VALUES
('org_cmrg_hq', 'Centre for Management and Research Group', 'CMRG', 'research@cmrg.org', 'Nigeria')
ON CONFLICT (id) DO NOTHING;

-- Users (All 5 required roles)
INSERT INTO users (id, organization_id, name, email, role, status, device_id, assigned_project_ids) VALUES
('user_admin_1', 'org_cmrg_hq', 'Dr. Amina Bello', 'amina.bello@cmrg.org', 'ADMIN', 'ACTIVE', NULL, '["proj_cmrg_household"]'::jsonb),
('user_pm_1', 'org_cmrg_hq', 'Emeka Nwosu', 'emeka.nwosu@cmrg.org', 'PROJECT_MANAGER', 'ACTIVE', NULL, '["proj_cmrg_household"]'::jsonb),
('user_sup_1', 'org_cmrg_hq', 'Chidi Okafor', 'chidi.okafor@cmrg.org', 'SUPERVISOR', 'ACTIVE', NULL, '["proj_cmrg_household"]'::jsonb),
('user_enum_1', 'org_cmrg_hq', 'Tunde Adebayo', 'tunde.adebayo@cmrg.org', 'ENUMERATOR', 'ACTIVE', 'DEV-CMRG-8821', '["proj_cmrg_household"]'::jsonb),
('user_enum_2', 'org_cmrg_hq', 'Fatima Yusuf', 'fatima.yusuf@cmrg.org', 'ENUMERATOR', 'ACTIVE', 'DEV-CMRG-9943', '["proj_cmrg_household"]'::jsonb),
('user_analyst_1', 'org_cmrg_hq', 'Zainab Haruna', 'zainab.haruna@cmrg.org', 'DATA_ANALYST', 'ACTIVE', NULL, '["proj_cmrg_household"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Projects
INSERT INTO projects (id, organization_id, name, description, client, start_date, end_date, status, created_by) VALUES
('proj_cmrg_household', 'org_cmrg_hq', 'CMRG National Socioeconomic & Tech Survey 2026', 'A comprehensive national study assessing household living conditions, digital inclusion, and telecom adoption.', 'Federal Ministry of Communications & Digital Economy', '2026-02-01', '2026-11-30', 'ACTIVE', 'Dr. Amina Bello')
ON CONFLICT (id) DO NOTHING;

-- Forms
INSERT INTO forms (id, project_id, title, description, status, current_version_number, current_version_id, settings) VALUES
('form_household_survey', 'proj_cmrg_household', 'Household Living Standards & Digital Inclusion Survey', 'Captures household demographics, telecommunication asset ownership, broadband spend, and living standards.', 'PUBLISHED', 1, 'ver_household_v1', '{"allowDrafts": true, "requireGps": false, "formTitle": "Household Living Standards Survey", "defaultLanguage": "English"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Form Version 1
INSERT INTO form_versions (id, form_id, version_number, version_tag, questions_json, settings, notes, published_by) VALUES
('ver_household_v1', 'form_household_survey', 1, 'v1.0', '[
  {"id": "q_age", "name": "respondent_age", "label": "What is the respondent''s age in completed years?", "hint": "Must be between 0 and 120", "type": "integer", "required": true, "constraint": ". >= 0 and . <= 120", "constraintMessage": "Age must be between 0 and 120", "order": 1},
  {"id": "q_gender", "name": "respondent_gender", "label": "Gender of respondent", "type": "select_one", "required": true, "choices": [{"value": "male", "label": "Male"}, {"value": "female", "label": "Female"}], "order": 2},
  {"id": "q_state", "name": "state_residence", "label": "State of Residence", "type": "select_one", "required": true, "choices": [{"value": "lagos", "label": "Lagos"}, {"value": "abuja", "label": "Abuja FCT"}, {"value": "kano", "label": "Kano"}, {"value": "rivers", "label": "Rivers"}, {"value": "enugu", "label": "Enugu"}], "order": 3},
  {"id": "q_owns_phone", "name": "owns_smartphone", "label": "Does the respondent personally own an internet-enabled smartphone?", "type": "yes_no", "required": true, "order": 4},
  {"id": "q_data_spend", "name": "monthly_data_spend", "label": "Approximate monthly expenditure on mobile broadband / mobile data (NGN)", "hint": "Enter amount in Naira. E.g. 5000", "type": "decimal", "required": true, "relevant": "${owns_smartphone} = ''yes''", "constraint": ". >= 0 and . <= 500000", "constraintMessage": "Amount must be positive", "order": 5},
  {"id": "q_annual_spend", "name": "projected_annual_spend", "label": "Projected Annual Data Expenditure (NGN)", "type": "calculate", "required": false, "relevant": "${owns_smartphone} = ''yes''", "calculation": "${monthly_data_spend} * 12", "order": 6},
  {"id": "q_service_rating", "name": "service_satisfaction", "label": "Rate overall satisfaction with mobile network coverage in your community (1-5 stars)", "type": "rating", "required": true, "maxRating": 5, "order": 7},
  {"id": "q_location", "name": "interview_gps", "label": "Record Household GPS Coordinates", "hint": "Ensure device has clear sky view for precision under 10 meters", "type": "geopoint", "required": false, "order": 8}
]'::jsonb, '{"allowDrafts": true, "requireGps": false}'::jsonb, 'Initial production baseline for national pilot', 'Dr. Amina Bello')
ON CONFLICT (id) DO NOTHING;

-- Devices
INSERT INTO devices (id, device_id, device_name, assigned_user_id, app_version, last_sync_at, status) VALUES
('dev_1', 'DEV-CMRG-8821', 'Tecno Camon 20 Pro (Field Unit 1)', 'user_enum_1', 'CMRG Collect v2.4.0', CURRENT_TIMESTAMP, 'ACTIVE'),
('dev_2', 'DEV-CMRG-9943', 'Samsung Galaxy A15 (Field Unit 2)', 'user_enum_2', 'CMRG Collect v2.4.0', CURRENT_TIMESTAMP, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- Deployments
INSERT INTO enumerator_assignments (id, project_id, form_id, form_version_id, version_number, target_type, assigned_to_user_id, status) VALUES
('dep_1', 'proj_cmrg_household', 'form_household_survey', 'ver_household_v1', 1, 'ALL', NULL, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- Initial Submissions
INSERT INTO submissions (id, client_submission_id, project_id, form_id, form_version_id, version_number, enumerator_id, enumerator_name, device_id, status, sync_status, answers, latitude, longitude, accuracy, review_status, reviewed_by, review_notes) VALUES
('sub_srv_101', 'client_uuid_001', 'proj_cmrg_household', 'form_household_survey', 'ver_household_v1', 1, 'user_enum_1', 'Tunde Adebayo', 'DEV-CMRG-8821', 'APPROVED', 'SYNCED', '{"respondent_age": 34, "respondent_gender": "female", "state_residence": "lagos", "owns_smartphone": "yes", "monthly_data_spend": 6500, "projected_annual_spend": 78000, "service_satisfaction": 4}'::jsonb, 6.5244, 3.3792, 4.8, 'APPROVED', 'Chidi Okafor', 'Verified data spend and GPS coordinates match enumeration area.'),
('sub_srv_102', 'client_uuid_002', 'proj_cmrg_household', 'form_household_survey', 'ver_household_v1', 1, 'user_enum_2', 'Fatima Yusuf', 'DEV-CMRG-9943', 'COMPLETED', 'SYNCED', '{"respondent_age": 28, "respondent_gender": "male", "state_residence": "abuja", "owns_smartphone": "yes", "monthly_data_spend": 12000, "projected_annual_spend": 144000, "service_satisfaction": 5}'::jsonb, 9.0765, 7.3986, 6.2, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Audit Log
INSERT INTO audit_logs (id, user_id, user_name, action, resource, details) VALUES
('log_1', 'user_admin_1', 'Dr. Amina Bello', 'SYSTEM_INITIALIZED', 'CMRG Survey Platform', 'Database tables and enterprise seed data initialized successfully.')
ON CONFLICT (id) DO NOTHING;
