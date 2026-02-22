// ─────────────────────────────────────────────────────────────────────────────
// User & Auth enums
// ─────────────────────────────────────────────────────────────────────────────

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  FSP_OWNER = 'fsp_owner',
  KEY_INDIVIDUAL = 'key_individual',
  COMPLIANCE_OFFICER = 'compliance_officer',
  AGENT = 'agent',
  ASSISTANT = 'assistant',
}

// ─────────────────────────────────────────────────────────────────────────────
// FSP / Tenant enums
// ─────────────────────────────────────────────────────────────────────────────

export enum FspCategory {
  I = 'I',
  II = 'II',
  IIA = 'IIA',
  III = 'III',
  IV = 'IV',
}

export enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
}

// ─────────────────────────────────────────────────────────────────────────────
// Client enums
// ─────────────────────────────────────────────────────────────────────────────

export enum ClientType {
  INDIVIDUAL = 'individual',
  JURISTIC = 'juristic',
}

export enum MaritalStatus {
  SINGLE = 'single',
  MARRIED_COP = 'married_cop',
  MARRIED_ANC = 'married_anc',
  MARRIED_ANC_ACCRUAL = 'married_anc_accrual',
  DIVORCED = 'divorced',
  WIDOWED = 'widowed',
  LIFE_PARTNER = 'life_partner',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  NON_BINARY = 'non_binary',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

export enum FicaStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  PENDING_REVIEW = 'pending_review',
  VERIFIED = 'verified',
  LAPSED = 'lapsed',
  REFERRED_GOAML = 'referred_goaml',
}

export enum FicaRiskRating {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

// ─────────────────────────────────────────────────────────────────────────────
// Lead enums
// ─────────────────────────────────────────────────────────────────────────────

export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  PROPOSAL = 'proposal',
  WON = 'won',
  LOST = 'lost',
}

export enum LeadSource {
  REFERRAL = 'referral',
  WALK_IN = 'walk_in',
  SOCIAL_MEDIA = 'social_media',
  WEBSITE = 'website',
  COLD_CALL = 'cold_call',
  EVENT = 'event',
  OTHER = 'other',
}

// ─────────────────────────────────────────────────────────────────────────────
// Product / Policy enums
// ─────────────────────────────────────────────────────────────────────────────

export enum ProductCategory {
  LIFE = 'life',
  DISABILITY = 'disability',
  DREAD_DISEASE = 'dread_disease',
  INCOME_PROTECTION = 'income_protection',
  FUNERAL = 'funeral',
  MEDICAL_AID = 'medical_aid',
  SHORT_TERM_PERSONAL = 'short_term_personal',
  SHORT_TERM_COMMERCIAL = 'short_term_commercial',
  INVESTMENT = 'investment',
  RETIREMENT_ANNUITY = 'retirement_annuity',
  ENDOWMENT = 'endowment',
  UNIT_TRUST = 'unit_trust',
  PRESERVATION_FUND = 'preservation_fund',
  PENSION = 'pension',
  PROVIDENT = 'provident',
  GAP_COVER = 'gap_cover',
  LEGAL = 'legal',
  CREDIT_LIFE = 'credit_life',
}

export enum PolicyStatus {
  QUOTED = 'quoted',
  PENDING = 'pending',
  ON_RISK = 'on_risk',
  ACTIVE = 'active',
  LAPSED = 'lapsed',
  CANCELLED = 'cancelled',
  MATURED = 'matured',
  SURRENDERED = 'surrendered',
  CLAIMED = 'claimed',
  NOT_TAKEN_UP = 'not_taken_up',
}

export enum QuoteStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired',
}

export enum PremiumFrequency {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually',
  ONCE_OFF = 'once_off',
}

// ─────────────────────────────────────────────────────────────────────────────
// ROA enums
// ─────────────────────────────────────────────────────────────────────────────

export enum RoaStatus {
  DRAFT = 'draft',
  COMPLETE = 'complete',
  SIGNED_CLIENT = 'signed_client',
  SIGNED_AGENT = 'signed_agent',
  FILED = 'filed',
}

// ─────────────────────────────────────────────────────────────────────────────
// Claim enums
// ─────────────────────────────────────────────────────────────────────────────

export enum ClaimStatus {
  LODGED = 'lodged',
  UNDER_REVIEW = 'under_review',
  ADDITIONAL_INFO_REQUIRED = 'additional_info_required',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
  OMBUD_ESCALATED = 'ombud_escalated',
  WITHDRAWN = 'withdrawn',
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent enums
// ─────────────────────────────────────────────────────────────────────────────

export enum AgentStatus {
  RECRUITING = 'recruiting',
  ONBOARDING = 'onboarding',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DEBARRED = 'debarred',
  RESIGNED = 'resigned',
}

// ─────────────────────────────────────────────────────────────────────────────
// Document enums
// ─────────────────────────────────────────────────────────────────────────────

export enum DocumentCategory {
  ID_DOCUMENT = 'id_document',
  PROOF_OF_ADDRESS = 'proof_of_address',
  PROOF_OF_INCOME = 'proof_of_income',
  PAYSLIP = 'payslip',
  BANK_STATEMENT = 'bank_statement',
  POLICY_DOCUMENT = 'policy_document',
  ROA = 'roa',
  FNA = 'fna',
  RPAR = 'rpar',
  CLAIM_DOCUMENT = 'claim_document',
  SAPS_CLEARANCE = 'saps_clearance',
  RE_EXAM_CERTIFICATE = 're_exam_certificate',
  CPD_CERTIFICATE = 'cpd_certificate',
  APPOINTMENT_LETTER = 'appointment_letter',
  MANDATE = 'mandate',
  FICA_FORM = 'fica_form',
  OTHER = 'other',
}

// ─────────────────────────────────────────────────────────────────────────────
// Commission enums
// ─────────────────────────────────────────────────────────────────────────────

export enum CommissionType {
  INITIAL = 'initial',
  RENEWAL = 'renewal',
  BROKER_FEE = 'broker_fee',
  OVERRIDE = 'override',
  CLAWBACK = 'clawback',
}

// ─────────────────────────────────────────────────────────────────────────────
// CRM enums
// ─────────────────────────────────────────────────────────────────────────────

export enum CrmActivityType {
  CALL = 'call',
  EMAIL = 'email',
  MEETING = 'meeting',
  NOTE = 'note',
  TASK = 'task',
  WHATSAPP = 'whatsapp',
  SMS = 'sms',
}

export enum CrmAutomationTrigger {
  DEAL_CREATED = 'deal_created',
  STAGE_ENTERED = 'stage_entered',
  STAGE_EXITED = 'stage_exited',
  DEAL_WON = 'deal_won',
  DEAL_LOST = 'deal_lost',
  DEAL_IDLE = 'deal_idle',
}

export enum CrmAutomationAction {
  CREATE_TASK = 'create_task',
  SEND_EMAIL = 'send_email',
  SEND_SMS = 'send_sms',
  ASSIGN_USER = 'assign_user',
  UPDATE_FIELD = 'update_field',
}

// ─────────────────────────────────────────────────────────────────────────────
// Accounting enums
// ─────────────────────────────────────────────────────────────────────────────

export enum AccountType {
  ASSET = 'asset',
  LIABILITY = 'liability',
  EQUITY = 'equity',
  REVENUE = 'revenue',
  EXPENSE = 'expense',
}

export enum VatCategory {
  STANDARD_RATED = 'standard_rated',
  ZERO_RATED = 'zero_rated',
  EXEMPT = 'exempt',
  OUTSIDE_SCOPE = 'outside_scope',
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  OVERDUE = 'overdue',
  VOIDED = 'voided',
  CREDIT_NOTE = 'credit_note',
}

export enum ExpenseStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
}
