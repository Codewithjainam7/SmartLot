-- ============================================================================
-- DRAW SQL IMPORT SCHEMA (PostgreSQL)
-- Compatible with DrawSQL (https://drawsql.app)
-- 20 Tables, Full Columns, Primary & Foreign Keys Configured
-- ============================================================================

CREATE TABLE "schemes" (
    "id" VARCHAR(50) PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "address" TEXT NOT NULL,
    "lots" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT TRUE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "units" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "scheme_id" VARCHAR(50) NOT NULL REFERENCES "schemes"("id"),
    "unit_id" VARCHAR(50) NOT NULL,
    "lot_number" INTEGER NOT NULL,
    "entitlement" NUMERIC(6, 3) NOT NULL DEFAULT 0.000,
    "status" VARCHAR(50) NOT NULL DEFAULT 'Occupied',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "profiles" (
    "id" UUID PRIMARY KEY,
    "full_name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "phone_number" VARCHAR(50),
    "avatar_url" TEXT,
    "is_system_admin" BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "members" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "scheme_id" VARCHAR(50) NOT NULL REFERENCES "schemes"("id"),
    "user_id" UUID REFERENCES "profiles"("id"),
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "role" VARCHAR(50) NOT NULL,
    "committee_office" VARCHAR(50),
    "unit_id" UUID REFERENCES "units"("id"),
    "lot_number" INTEGER,
    "is_co_owner" BOOLEAN NOT NULL DEFAULT FALSE,
    "primary_member_id" UUID REFERENCES "members"("id"),
    "status" VARCHAR(50) NOT NULL DEFAULT 'Active',
    "joined_at" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "member_onboarding_verifications" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "member_id" UUID NOT NULL UNIQUE REFERENCES "members"("id"),
    "id_document_number" VARCHAR(100),
    "id_doc_url" TEXT,
    "ownership_doc_url" TEXT,
    "two_factor_verified" BOOLEAN NOT NULL DEFAULT FALSE,
    "verified_by" UUID REFERENCES "profiles"("id"),
    "verified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "resident_requests" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "reference_id" VARCHAR(50) NOT NULL UNIQUE,
    "scheme_id" VARCHAR(50) NOT NULL REFERENCES "schemes"("id"),
    "unit_id" VARCHAR(50),
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "request_type" VARCHAR(100) NOT NULL,
    "priority" VARCHAR(50) NOT NULL DEFAULT 'Normal',
    "location" VARCHAR(255),
    "contact_preference" VARCHAR(100),
    "due_date" DATE,
    "status" VARCHAR(50) NOT NULL DEFAULT 'new',
    "requestor_id" UUID REFERENCES "profiles"("id"),
    "rejection_reason" TEXT,
    "close_reason" TEXT,
    "closed_by" UUID REFERENCES "profiles"("id"),
    "closed_at" TIMESTAMPTZ,
    "assigned_to_id" UUID REFERENCES "profiles"("id"),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "request_comments" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "request_id" UUID NOT NULL REFERENCES "resident_requests"("id"),
    "author_id" UUID REFERENCES "profiles"("id"),
    "text" TEXT NOT NULL,
    "reply_to_id" UUID REFERENCES "request_comments"("id"),
    "is_email_reply" BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "activity_notes" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "request_id" UUID NOT NULL REFERENCES "resident_requests"("id"),
    "author_id" UUID REFERENCES "profiles"("id"),
    "text" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT TRUE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "activity_audit_log" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "request_id" UUID NOT NULL REFERENCES "resident_requests"("id"),
    "actor_id" UUID REFERENCES "profiles"("id"),
    "event_type" VARCHAR(100) NOT NULL,
    "note" TEXT,
    "from_status" VARCHAR(50),
    "to_status" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "motions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "request_id" UUID REFERENCES "resident_requests"("id"),
    "scheme_id" VARCHAR(50) NOT NULL REFERENCES "schemes"("id"),
    "motion_reference" VARCHAR(50) NOT NULL UNIQUE,
    "title" VARCHAR(255) NOT NULL,
    "heading" VARCHAR(255),
    "summary" TEXT NOT NULL,
    "voter_group" VARCHAR(50) NOT NULL DEFAULT 'committee_only',
    "result_criteria" VARCHAR(50) NOT NULL DEFAULT 'simple_majority',
    "committee_size" INTEGER NOT NULL DEFAULT 6,
    "quorum_target" INTEGER NOT NULL DEFAULT 4,
    "deadline" TIMESTAMPTZ NOT NULL,
    "original_deadline" TIMESTAMPTZ,
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "close_reason" TEXT,
    "closed_by" UUID REFERENCES "profiles"("id"),
    "closed_at" TIMESTAMPTZ,
    "created_by" UUID REFERENCES "profiles"("id"),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "motion_ballots" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "motion_id" UUID NOT NULL REFERENCES "motions"("id"),
    "member_id" UUID NOT NULL REFERENCES "members"("id"),
    "vote" VARCHAR(20) NOT NULL,
    "comment" TEXT,
    "voted_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "motion_rfis" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "motion_id" UUID NOT NULL REFERENCES "motions"("id"),
    "requested_by" UUID NOT NULL REFERENCES "members"("id"),
    "question" TEXT NOT NULL,
    "extended_days" INTEGER NOT NULL DEFAULT 7,
    "status" VARCHAR(50) NOT NULL DEFAULT 'open',
    "response_note" TEXT,
    "responded_by" UUID REFERENCES "profiles"("id"),
    "responded_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "motion_restarts" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "motion_id" UUID NOT NULL REFERENCES "motions"("id"),
    "restarted_by" UUID REFERENCES "profiles"("id"),
    "reason" TEXT NOT NULL,
    "previous_yes_count" INTEGER NOT NULL DEFAULT 0,
    "previous_no_count" INTEGER NOT NULL DEFAULT 0,
    "previous_abstain_count" INTEGER NOT NULL DEFAULT 0,
    "restarted_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "activity_attachments" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "request_id" UUID REFERENCES "resident_requests"("id"),
    "motion_id" UUID REFERENCES "motions"("id"),
    "file_name" VARCHAR(255) NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size_bytes" BIGINT,
    "content_type" VARCHAR(100),
    "version_type" VARCHAR(50) DEFAULT 'original',
    "note" TEXT,
    "uploaded_by" UUID REFERENCES "profiles"("id"),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "vendors" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50) NOT NULL,
    "website" VARCHAR(255),
    "abn" VARCHAR(50),
    "license_no" VARCHAR(100),
    "years_of_experience" INTEGER,
    "insurance_status" VARCHAR(50) NOT NULL DEFAULT 'Active',
    "insurance_expiry" DATE,
    "insurance_doc_url" TEXT,
    "onboarding_status" VARCHAR(50) NOT NULL DEFAULT 'approved',
    "onboarding_method" VARCHAR(50) NOT NULL DEFAULT 'manual',
    "rejection_reason" TEXT,
    "rating" NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "scheme_vendors" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "scheme_id" VARCHAR(50) NOT NULL REFERENCES "schemes"("id"),
    "vendor_id" UUID NOT NULL REFERENCES "vendors"("id"),
    "is_preferred" BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "vendor_quotes" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "motion_id" UUID REFERENCES "motions"("id"),
    "request_id" UUID REFERENCES "resident_requests"("id"),
    "vendor_id" UUID NOT NULL REFERENCES "vendors"("id"),
    "amount" NUMERIC(12, 2) NOT NULL,
    "gst_included" BOOLEAN NOT NULL DEFAULT TRUE,
    "is_recommended" BOOLEAN NOT NULL DEFAULT FALSE,
    "quote_doc_url" TEXT,
    "scope_summary" TEXT NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'submitted',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "quote_poll_votes" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "motion_id" UUID NOT NULL REFERENCES "motions"("id"),
    "quote_id" UUID NOT NULL REFERENCES "vendor_quotes"("id"),
    "member_id" UUID NOT NULL REFERENCES "members"("id"),
    "comment" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "work_orders" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "work_order_number" VARCHAR(50) NOT NULL UNIQUE,
    "request_id" UUID REFERENCES "resident_requests"("id"),
    "motion_id" UUID REFERENCES "motions"("id"),
    "scheme_id" VARCHAR(50) NOT NULL REFERENCES "schemes"("id"),
    "vendor_id" UUID NOT NULL REFERENCES "vendors"("id"),
    "title" VARCHAR(255) NOT NULL,
    "scope_of_work" TEXT NOT NULL,
    "frequency" VARCHAR(50) NOT NULL DEFAULT 'one_off',
    "priority" VARCHAR(50) NOT NULL DEFAULT 'Normal',
    "budget_cap" NUMERIC(12, 2) NOT NULL,
    "final_cost" NUMERIC(12, 2),
    "site_access_pin" VARCHAR(20) NOT NULL,
    "guest_magic_token" VARCHAR(255) NOT NULL UNIQUE,
    "due_date" DATE,
    "status" VARCHAR(50) NOT NULL DEFAULT 'issued',
    "completion_photo_url" TEXT,
    "invoice_pdf_url" TEXT,
    "completion_notes" TEXT,
    "submitted_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "created_by" UUID REFERENCES "profiles"("id"),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "work_order_items" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "work_order_id" UUID NOT NULL REFERENCES "work_orders"("id"),
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'todo',
    "sort_order" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
