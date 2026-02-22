-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('super_admin', 'fsp_owner', 'key_individual', 'compliance_officer', 'agent', 'assistant');

-- CreateEnum
CREATE TYPE "FspCategory" AS ENUM ('I', 'II', 'IIA', 'III', 'IV');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('trialing', 'active', 'suspended', 'cancelled');

-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('recruiting', 'background_checks', 'training', 're5_pending', 're5_passed', 'appointing', 'supervised', 'active', 'resigned', 'debarred', 'transferred');

-- CreateEnum
CREATE TYPE "ClientIdType" AS ENUM ('rsa_id', 'passport', 'asylum_permit');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('employed', 'self_employed', 'unemployed', 'pensioner', 'student');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('new', 'contacted', 'qualified', 'fna_scheduled', 'quoted', 'proposal_submitted', 'awaiting_decision', 'won', 'lost', 'dormant');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('referral', 'cold_call', 'networking', 'social_media', 'insurer_lead', 'aggregator', 'walk_in', 'bancassurance', 'website', 'existing_client', 'other');

-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('life', 'disability_lump', 'income_protection', 'critical_illness', 'funeral', 'short_term_personal', 'short_term_commercial', 'medical_aid', 'gap_cover', 'retrenchment', 'investment', 'key_person');

-- CreateEnum
CREATE TYPE "PolicyStatus" AS ENUM ('draft', 'submitted', 'underwriting', 'active', 'amended', 'lapsed', 'reinstated', 'cancelled');

-- CreateEnum
CREATE TYPE "PremiumFrequency" AS ENUM ('monthly', 'quarterly', 'bi_annual', 'annual', 'once_off');

-- CreateEnum
CREATE TYPE "CollectionMethod" AS ENUM ('debit_order', 'eft', 'stop_order', 'credit_card', 'cash');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('draft', 'presented', 'accepted', 'declined', 'expired');

-- CreateEnum
CREATE TYPE "RoaStatus" AS ENUM ('draft', 'complete', 'signed_client', 'signed_agent', 'filed');

-- CreateEnum
CREATE TYPE "FicaStatus" AS ENUM ('pending', 'in_progress', 'verified', 'enhanced_due_diligence', 'failed');

-- CreateEnum
CREATE TYPE "FicaRiskRating" AS ENUM ('standard', 'high');

-- CreateEnum
CREATE TYPE "ClaimType" AS ENUM ('death', 'disability', 'retrenchment', 'critical_illness', 'vehicle', 'property', 'contents', 'funeral', 'liability', 'marine', 'other');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('filed', 'documents_pending', 'under_assessment', 'approved', 'paid', 'repudiated', 'ombud_escalated', 'ombud_determination', 'withdrawn');

-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('initial', 'renewal', 'binder_fee', 'broker_fee', 'override', 'clawback', 'other');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('roa', 'rpar', 'fica_id', 'fica_poa', 'consent', 'cpd_cert', 're5_cert', 're1_cert', 'saps_clearance', 'qualification', 'appointment_letter', 'fsca_licence', 'claim_document', 'policy_schedule', 'complaint', 'other');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('asset', 'liability', 'equity', 'revenue', 'expense');

-- CreateEnum
CREATE TYPE "VatCategory" AS ENUM ('standard_rated', 'zero_rated', 'exempt', 'outside_scope');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('draft', 'sent', 'partially_paid', 'paid', 'overdue', 'voided', 'credit_note');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'paid');

-- CreateEnum
CREATE TYPE "CrmActivityType" AS ENUM ('call', 'email', 'meeting', 'note', 'sms', 'whatsapp', 'task');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('email', 'sms', 'in_app');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "trading_name" VARCHAR(200),
    "fsca_licence_number" VARCHAR(50),
    "fsp_category" "FspCategory" NOT NULL DEFAULT 'I',
    "registration_number" VARCHAR(20),
    "vat_number" VARCHAR(10),
    "licence_expires_at" TIMESTAMPTZ,
    "phone" VARCHAR(20),
    "email" VARCHAR(255) NOT NULL,
    "website" VARCHAR(255),
    "physical_address" TEXT,
    "postal_address" TEXT,
    "logo_url" TEXT,
    "brand_colour" VARCHAR(7),
    "stripe_customer_id" VARCHAR(100),
    "subscription_status" VARCHAR(30) NOT NULL DEFAULT 'trialing',
    "subscription_plan" VARCHAR(30) NOT NULL DEFAULT 'starter',
    "subscription_expires" TIMESTAMPTZ,
    "status" "TenantStatus" NOT NULL DEFAULT 'trialing',
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255),
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "role" "UserRole" NOT NULL,
    "phone" VARCHAR(20),
    "avatar_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verify_token" VARCHAR(128),
    "last_login_at" TIMESTAMPTZ,
    "password_reset_token" VARCHAR(128),
    "password_reset_expiry" TIMESTAMPTZ,
    "invited_by" UUID,
    "invited_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "token_hash" VARCHAR(128) NOT NULL,
    "user_agent" VARCHAR(500),
    "ip_address" VARCHAR(45),
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "actor_id" UUID,
    "action" VARCHAR(10) NOT NULL,
    "table_name" VARCHAR(100) NOT NULL,
    "record_id" UUID NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "ip_address" VARCHAR(45),
    "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agents" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "id_number" VARCHAR(13),
    "date_of_birth" DATE,
    "gender" VARCHAR(20),
    "physical_address" TEXT,
    "postal_address" TEXT,
    "nqf_level" INTEGER,
    "qualification_description" TEXT,
    "qualification_institution" TEXT,
    "re5_passed" BOOLEAN NOT NULL DEFAULT false,
    "re5_pass_date" DATE,
    "re1_required" BOOLEAN NOT NULL DEFAULT false,
    "re1_passed" BOOLEAN NOT NULL DEFAULT false,
    "re1_pass_date" DATE,
    "debarment_check_date" DATE,
    "debarment_status" VARCHAR(30) NOT NULL DEFAULT 'not_checked',
    "saps_check_date" DATE,
    "saps_check_expiry" DATE,
    "credit_check_date" DATE,
    "credit_check_outcome" VARCHAR(50),
    "status" "AgentStatus" NOT NULL DEFAULT 'recruiting',
    "appointment_date" DATE,
    "appointing_fsp_number" VARCHAR(50),
    "authorised_products" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "supervised_period_months" INTEGER DEFAULT 12,
    "supervisor_id" UUID,
    "supervision_end_date" DATE,
    "roa_reviews_completed" INTEGER NOT NULL DEFAULT 0,
    "cpd_target_hours" DECIMAL(5,1) NOT NULL DEFAULT 6.0,
    "cpd_year_start" DATE,
    "debarment_initiated_at" TIMESTAMPTZ,
    "debarment_reason" TEXT,
    "debarment_effective_date" DATE,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cpd_activities" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,
    "activity_date" DATE NOT NULL,
    "activity_type" VARCHAR(50) NOT NULL,
    "provider" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "hours" DECIMAL(4,1) NOT NULL,
    "cpd_year" INTEGER NOT NULL,
    "certificate_document_id" UUID,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_by" UUID,
    "verified_at" TIMESTAMPTZ,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "cpd_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "agent_id" UUID,
    "id_type" "ClientIdType" NOT NULL DEFAULT 'rsa_id',
    "id_number" VARCHAR(13),
    "passport_number" VARCHAR(30),
    "passport_country" VARCHAR(2),
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "preferred_name" VARCHAR(100),
    "title_salutation" VARCHAR(20),
    "date_of_birth" DATE,
    "gender" VARCHAR(20),
    "marital_status" VARCHAR(30),
    "nationality" VARCHAR(2) NOT NULL DEFAULT 'ZA',
    "home_language" VARCHAR(30),
    "mobile_phone" VARCHAR(20),
    "work_phone" VARCHAR(20),
    "home_phone" VARCHAR(20),
    "email" VARCHAR(255),
    "physical_address_line1" TEXT,
    "physical_address_line2" TEXT,
    "physical_city" VARCHAR(100),
    "physical_province" VARCHAR(50),
    "physical_postal_code" VARCHAR(10),
    "postal_same_as_physical" BOOLEAN NOT NULL DEFAULT true,
    "postal_address_line1" TEXT,
    "postal_address_line2" TEXT,
    "postal_city" VARCHAR(100),
    "postal_province" VARCHAR(50),
    "postal_postal_code" VARCHAR(10),
    "employment_status" "EmploymentStatus",
    "employer_name" VARCHAR(200),
    "occupation" VARCHAR(100),
    "industry" VARCHAR(100),
    "monthly_gross_income" DECIMAL(15,2),
    "monthly_net_income" DECIMAL(15,2),
    "marketing_consent" BOOLEAN NOT NULL DEFAULT false,
    "marketing_consent_at" TIMESTAMPTZ,
    "data_processing_consent" BOOLEAN NOT NULL DEFAULT false,
    "data_processing_consent_at" TIMESTAMPTZ,
    "consent_version" VARCHAR(20),
    "risk_profile" VARCHAR(20),
    "risk_profile_date" DATE,
    "fica_status" "FicaStatus" NOT NULL DEFAULT 'pending',
    "fica_risk_rating" "FicaRiskRating" NOT NULL DEFAULT 'standard',
    "fica_verified_at" TIMESTAMPTZ,
    "fica_expires_at" TIMESTAMPTZ,
    "fica_verified_by_id" UUID,
    "lead_id" UUID,
    "client_since" DATE,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dependants" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "relationship" VARCHAR(50) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "date_of_birth" DATE,
    "id_number" VARCHAR(13),
    "gender" VARCHAR(20),
    "is_dependent" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "dependants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "agent_id" UUID,
    "client_id" UUID,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "company" VARCHAR(200),
    "status" "LeadStatus" NOT NULL DEFAULT 'new',
    "source" "LeadSource" NOT NULL DEFAULT 'other',
    "source_detail" VARCHAR(200),
    "product_interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "converted_at" TIMESTAMPTZ,
    "converted_by_id" UUID,
    "next_follow_up_at" TIMESTAMPTZ,
    "lost_reason" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_activities" (
    "id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "activity_type" "CrmActivityType" NOT NULL,
    "note" TEXT NOT NULL,
    "outcome" VARCHAR(200),
    "duration_mins" INTEGER,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "needs_analyses" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,
    "monthly_gross_income" DECIMAL(15,2) NOT NULL,
    "monthly_net_income" DECIMAL(15,2) NOT NULL,
    "total_assets" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_liabilities" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "monthly_expenses" DECIMAL(15,2) NOT NULL,
    "insurance_objectives" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "risk_tolerance" VARCHAR(20) NOT NULL,
    "health_status" VARCHAR(20) NOT NULL,
    "smoker" BOOLEAN NOT NULL DEFAULT false,
    "chronic_conditions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "existing_life_cover" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "existing_income_protection" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "existing_funeral_cover" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "existing_disability_cover" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "gap_analysis_notes" TEXT,
    "recommended_cover" JSONB,
    "completed_at" TIMESTAMPTZ,
    "pdf_url" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "needs_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,
    "fna_id" UUID,
    "quote_number" VARCHAR(30) NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'draft',
    "insurer_name" VARCHAR(200) NOT NULL,
    "product_category" "ProductCategory" NOT NULL,
    "product_name" VARCHAR(200) NOT NULL,
    "cover_amount" DECIMAL(15,2) NOT NULL,
    "monthly_premium" DECIMAL(15,2) NOT NULL,
    "premium_frequency" "PremiumFrequency" NOT NULL DEFAULT 'monthly',
    "escalation_rate" DECIMAL(5,4),
    "loadings" JSON,
    "exclusions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "waiting_periods" JSON,
    "valid_from" TIMESTAMPTZ NOT NULL,
    "valid_until" TIMESTAMPTZ NOT NULL,
    "sent_at" TIMESTAMPTZ,
    "accepted_at" TIMESTAMPTZ,
    "declined_at" TIMESTAMPTZ,
    "decline_reason" TEXT,
    "pdf_url" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policies" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,
    "quote_id" UUID,
    "policy_number" VARCHAR(50) NOT NULL,
    "status" "PolicyStatus" NOT NULL DEFAULT 'draft',
    "product_category" "ProductCategory" NOT NULL,
    "product_name" VARCHAR(200) NOT NULL,
    "insurer_name" VARCHAR(200) NOT NULL,
    "insurer_policy_ref" VARCHAR(100),
    "sum_assured" DECIMAL(15,2) NOT NULL,
    "monthly_premium" DECIMAL(15,2) NOT NULL,
    "annual_premium" DECIMAL(15,2),
    "premium_frequency" "PremiumFrequency" NOT NULL DEFAULT 'monthly',
    "collection_method" "CollectionMethod" NOT NULL DEFAULT 'debit_order',
    "escalation_rate" DECIMAL(5,4),
    "loading_amount" DECIMAL(15,2),
    "inception_date" DATE NOT NULL,
    "expiry_date" DATE,
    "lapse_date" DATE,
    "cancellation_date" DATE,
    "cancellation_reason" TEXT,
    "initial_commission_pct" DECIMAL(5,4),
    "renewal_commission_pct" DECIMAL(5,4),
    "clawback_watch_until" DATE,
    "policy_schedule_url" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roas" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,
    "policy_id" UUID,
    "status" "RoaStatus" NOT NULL DEFAULT 'draft',
    "roa_type" VARCHAR(30) NOT NULL,
    "client_needs" JSONB,
    "recommendations" JSONB,
    "disclosures" JSONB,
    "alternatives_considered" JSONB,
    "roa_date" DATE NOT NULL,
    "client_signed_at" TIMESTAMPTZ,
    "agent_signed_at" TIMESTAMPTZ,
    "filed_at" TIMESTAMPTZ,
    "client_signature_url" TEXT,
    "agent_signature_url" TEXT,
    "pdf_url" TEXT,
    "pdf_hash" VARCHAR(64),
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "roas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claims" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "policy_id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,
    "claim_number" VARCHAR(50) NOT NULL,
    "claim_type" "ClaimType" NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'filed',
    "event_date" DATE NOT NULL,
    "event_description" TEXT NOT NULL,
    "claim_amount" DECIMAL(15,2),
    "approved_amount" DECIMAL(15,2),
    "paid_amount" DECIMAL(15,2),
    "paid_at" TIMESTAMPTZ,
    "repudiation_reason" TEXT,
    "ombud_escalated_at" TIMESTAMPTZ,
    "ombud_reference_number" VARCHAR(50),
    "insurer_claim_ref" VARCHAR(100),
    "insurer_assessor" VARCHAR(200),
    "filed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "client_id" UUID,
    "agent_id" UUID,
    "policy_id" UUID,
    "claim_id" UUID,
    "category" "DocumentCategory" NOT NULL,
    "filename" VARCHAR(500) NOT NULL,
    "content_type" VARCHAR(100) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "r2_key" VARCHAR(500) NOT NULL,
    "r2_url" VARCHAR(1000),
    "sha256" VARCHAR(64),
    "retention_until" DATE,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMPTZ,
    "uploaded_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_records" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "policy_id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,
    "commission_type" "CommissionType" NOT NULL,
    "gross_amount" DECIMAL(15,2) NOT NULL,
    "vat_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "net_amount" DECIMAL(15,2) NOT NULL,
    "commission_rate" DECIMAL(5,4),
    "is_clawback" BOOLEAN NOT NULL DEFAULT false,
    "clawback_pct" DECIMAL(5,4),
    "clawback_of_id" UUID,
    "clawback_reason" TEXT,
    "statement_date" DATE NOT NULL,
    "payment_date" DATE,
    "paid_to_bank_ref" VARCHAR(100),
    "memo" VARCHAR(500),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "commission_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_activities" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,
    "client_id" UUID,
    "lead_id" UUID,
    "activity_type" "CrmActivityType" NOT NULL,
    "subject" VARCHAR(300) NOT NULL,
    "note" TEXT,
    "outcome" VARCHAR(200),
    "duration_mins" INTEGER,
    "scheduled_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "crm_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "account_type" "AccountType" NOT NULL,
    "vat_category" "VatCategory" NOT NULL DEFAULT 'standard_rated',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "parent_id" UUID,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "reference" VARCHAR(50) NOT NULL,
    "entry_date" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "is_reversing" BOOLEAN NOT NULL DEFAULT false,
    "reverses_id" UUID,
    "posted_at" TIMESTAMPTZ,
    "posted_by" UUID,
    "total_debit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_credit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_lines" (
    "id" UUID NOT NULL,
    "journal_entry_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "debit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "description" VARCHAR(500),

    CONSTRAINT "journal_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "invoice_number" VARCHAR(30) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'draft',
    "party_type" VARCHAR(20) NOT NULL,
    "party_name" VARCHAR(200) NOT NULL,
    "party_vat_no" VARCHAR(10),
    "party_email" VARCHAR(255),
    "issue_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "paid_date" DATE,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "vat_amount" DECIMAL(15,2) NOT NULL,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "amount_paid" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(15,2) NOT NULL,
    "notes" TEXT,
    "pdf_url" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_lines" (
    "id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "account_id" UUID,
    "description" VARCHAR(500) NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "vat_category" "VatCategory" NOT NULL DEFAULT 'standard_rated',
    "vat_rate" DECIMAL(5,4) NOT NULL DEFAULT 0.15,
    "vat_amount" DECIMAL(15,2) NOT NULL,
    "line_total" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "invoice_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenant_id_email_key" ON "users"("tenant_id", "email");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_hash_idx" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_table_name_record_id_idx" ON "audit_logs"("tenant_id", "table_name", "record_id");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_occurred_at_idx" ON "audit_logs"("tenant_id", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "agents_user_id_key" ON "agents"("user_id");

-- CreateIndex
CREATE INDEX "agents_tenant_id_idx" ON "agents"("tenant_id");

-- CreateIndex
CREATE INDEX "agents_tenant_id_status_idx" ON "agents"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "cpd_activities_tenant_id_agent_id_cpd_year_idx" ON "cpd_activities"("tenant_id", "agent_id", "cpd_year");

-- CreateIndex
CREATE INDEX "clients_tenant_id_idx" ON "clients"("tenant_id");

-- CreateIndex
CREATE INDEX "clients_tenant_id_agent_id_idx" ON "clients"("tenant_id", "agent_id");

-- CreateIndex
CREATE INDEX "clients_tenant_id_fica_status_idx" ON "clients"("tenant_id", "fica_status");

-- CreateIndex
CREATE INDEX "dependants_client_id_idx" ON "dependants"("client_id");

-- CreateIndex
CREATE INDEX "leads_tenant_id_idx" ON "leads"("tenant_id");

-- CreateIndex
CREATE INDEX "leads_tenant_id_agent_id_status_idx" ON "leads"("tenant_id", "agent_id", "status");

-- CreateIndex
CREATE INDEX "lead_activities_lead_id_idx" ON "lead_activities"("lead_id");

-- CreateIndex
CREATE INDEX "needs_analyses_tenant_id_client_id_idx" ON "needs_analyses"("tenant_id", "client_id");

-- CreateIndex
CREATE INDEX "quotes_tenant_id_client_id_idx" ON "quotes"("tenant_id", "client_id");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_tenant_id_quote_number_key" ON "quotes"("tenant_id", "quote_number");

-- CreateIndex
CREATE UNIQUE INDEX "policies_quote_id_key" ON "policies"("quote_id");

-- CreateIndex
CREATE INDEX "policies_tenant_id_client_id_idx" ON "policies"("tenant_id", "client_id");

-- CreateIndex
CREATE INDEX "policies_tenant_id_agent_id_idx" ON "policies"("tenant_id", "agent_id");

-- CreateIndex
CREATE INDEX "policies_tenant_id_status_idx" ON "policies"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "policies_tenant_id_policy_number_key" ON "policies"("tenant_id", "policy_number");

-- CreateIndex
CREATE INDEX "roas_tenant_id_client_id_idx" ON "roas"("tenant_id", "client_id");

-- CreateIndex
CREATE INDEX "roas_tenant_id_status_idx" ON "roas"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "claims_tenant_id_client_id_idx" ON "claims"("tenant_id", "client_id");

-- CreateIndex
CREATE INDEX "claims_tenant_id_status_idx" ON "claims"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "claims_tenant_id_claim_number_key" ON "claims"("tenant_id", "claim_number");

-- CreateIndex
CREATE INDEX "documents_tenant_id_client_id_idx" ON "documents"("tenant_id", "client_id");

-- CreateIndex
CREATE INDEX "documents_tenant_id_category_idx" ON "documents"("tenant_id", "category");

-- CreateIndex
CREATE INDEX "commission_records_tenant_id_agent_id_idx" ON "commission_records"("tenant_id", "agent_id");

-- CreateIndex
CREATE INDEX "commission_records_tenant_id_statement_date_idx" ON "commission_records"("tenant_id", "statement_date");

-- CreateIndex
CREATE INDEX "crm_activities_tenant_id_agent_id_idx" ON "crm_activities"("tenant_id", "agent_id");

-- CreateIndex
CREATE INDEX "crm_activities_tenant_id_client_id_idx" ON "crm_activities"("tenant_id", "client_id");

-- CreateIndex
CREATE INDEX "accounts_tenant_id_idx" ON "accounts"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_tenant_id_code_key" ON "accounts"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "journal_entries_tenant_id_entry_date_idx" ON "journal_entries"("tenant_id", "entry_date");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_tenant_id_reference_key" ON "journal_entries"("tenant_id", "reference");

-- CreateIndex
CREATE INDEX "journal_lines_journal_entry_id_idx" ON "journal_lines"("journal_entry_id");

-- CreateIndex
CREATE INDEX "journal_lines_account_id_idx" ON "journal_lines"("account_id");

-- CreateIndex
CREATE INDEX "invoices_tenant_id_status_idx" ON "invoices"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_tenant_id_invoice_number_key" ON "invoices"("tenant_id", "invoice_number");

-- CreateIndex
CREATE INDEX "invoice_lines_invoice_id_idx" ON "invoice_lines"("invoice_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cpd_activities" ADD CONSTRAINT "cpd_activities_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dependants" ADD CONSTRAINT "dependants_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_fna_id_fkey" FOREIGN KEY ("fna_id") REFERENCES "needs_analyses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policies" ADD CONSTRAINT "policies_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policies" ADD CONSTRAINT "policies_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policies" ADD CONSTRAINT "policies_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roas" ADD CONSTRAINT "roas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roas" ADD CONSTRAINT "roas_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roas" ADD CONSTRAINT "roas_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "claims"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_records" ADD CONSTRAINT "commission_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_records" ADD CONSTRAINT "commission_records_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
