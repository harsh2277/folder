-- Performance indexes for LightLab.
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- I cannot execute DDL myself — the service role key only reaches PostgREST,
-- not a raw Postgres connection, so this needs to be run manually once.

-- Projects: every admin/architect/designer list page filters/sorts by these.
create index if not exists idx_projects_status on projects (status);
create index if not exists idx_projects_architect_id on projects (architect_id);
create index if not exists idx_projects_assigned_designer_id on projects (assigned_designer_id);
create index if not exists idx_projects_created_at on projects (created_at desc);
create index if not exists idx_projects_payment_status on projects (payment_status);

-- Payments: invoice ledger filters by status and joins on project_id.
create index if not exists idx_payments_project_id on payments (project_id);
create index if not exists idx_payments_status on payments (status);
create index if not exists idx_payments_created_at on payments (created_at desc);

-- Revision requests: filtered by project and status constantly.
create index if not exists idx_revision_requests_project_id on revision_requests (project_id);
create index if not exists idx_revision_requests_status on revision_requests (status);
create index if not exists idx_revision_requests_architect_id on revision_requests (architect_id);

-- Project child tables: always looked up by project_id.
create index if not exists idx_project_files_project_id on project_files (project_id);
create index if not exists idx_project_remarks_project_id on project_remarks (project_id);
create index if not exists idx_project_lighting_preferences_project_id on project_lighting_preferences (project_id);

-- Profiles: role lookups happen on every single authenticated API request.
create index if not exists idx_profiles_role on profiles (role);
