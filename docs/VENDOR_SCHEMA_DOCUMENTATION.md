# SmartLot Vendor & Trades Management Database Schema Documentation

This document outlines the database tables, fields, relationships, constraints, and security policies designed for **Vendor Onboarding, Compliance Verification, Competitive Tenders, and Work Order Execution** in SmartLot.

It complies with Australian strata governance standards (**NSW Strata Schemes Management Act 2015** & **VIC Owners Corporations Act 2006**) and adheres to Supabase PostgreSQL performance and security best practices.

---

## 1. Schema Architecture & Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    SCHEMES ||--o{ SCHEME_VENDORS : registers
    VENDORS ||--o{ SCHEME_VENDORS : preferred_in
    SCHEMES ||--o{ VENDOR_INVITATIONS : dispatches
    VENDORS ||--o{ WORK_ORDERS : assigned_to
    VENDORS ||--o{ VENDOR_QUOTES : submits
    MOTIONS ||--o{ VENDOR_QUOTES : quotes_evaluated_in
    VENDOR_QUOTES ||--o{ QUOTE_POLL_VOTES : receives
    RESIDENT_REQUESTS ||--o{ WORK_ORDERS : generates
    RESIDENT_REQUESTS ||--o{ VENDOR_QUOTES : receives

    VENDORS {
        text id PK "e.g. VND-01001 (Sequence backed)"
        text name "Company Trading Name"
        text category "Trade Specialization"
        text email "Dispatch Email"
        text phone "Office / Dispatch Phone"
        text website "Optional URL"
        text abn "Australian Business Number (11 digits)"
        text license_no "State Trade License"
        integer years_of_experience "Experience in years"
        text insurance_status "Active | Expired Ins. | Pending Verification"
        date insurance_expiry "Public Liability Expiry"
        text certificate_of_currency_url "Storage URL to policy PDF"
        numeric rating "1.00 to 5.00"
        text onboarding_method "manual | invite_portal"
        text verified_by "Strata Manager Name"
        timestamptz verified_at "Verification timestamp"
        text rejection_reason "Reason if rejected"
        timestamptz created_at
        timestamptz updated_at "Auto-updated via trigger"
    }

    SCHEME_VENDORS {
        uuid id PK
        text scheme_id FK "e.g. SP101, SP103, SP52042"
        text vendor_id FK "References vendors(id)"
        boolean is_preferred "Preferred Contractor Flag"
        text service_notes "Building specific notes"
        timestamptz created_at
    }

    VENDOR_INVITATIONS {
        uuid id PK
        text scheme_id FK "Target Building Scheme"
        text company_name "Invited Company"
        text category "Trade Category"
        text email "Recipient Email"
        text phone "Optional Phone"
        text invite_token UK "Secure single-use token"
        text status "pending | submitted | approved | rejected | expired"
        text invited_by "Strata Manager"
        text submitted_vendor_id FK "References vendors(id)"
        timestamptz expires_at "Default 30 days"
        timestamptz created_at
    }

    WORK_ORDERS {
        text id PK "e.g. WO-01001 (Sequence backed)"
        text case_id "Parent Resident Request reference"
        text scheme_id "Building scheme"
        text vendor_id FK "Assigned Vendor"
        text vendor_name "Denormalized for zero-join reporting"
        text vendor_email "Contact Email"
        text vendor_phone "Contact Phone"
        text scope_of_work "Detailed scope brief"
        numeric budget_cap "Authorized budget cap ex-GST"
        numeric final_cost "Actual billed invoice amount"
        text site_access_pin "Building key/lockbox PIN"
        text guest_magic_token UK "Tradie photo upload token"
        text status "issued | in_progress | completion_submitted | completed"
        text completion_photo "Proof of completion photo URL"
        text invoice_pdf "Uploaded tax invoice filename/URL"
        timestamptz submitted_at "When tradie completed work"
        timestamptz signed_off_at "When Strata Manager signed off"
        text signed_off_by "Strata Manager Name"
        text sign_off_notes "Inspection notes"
        timestamptz created_at
        timestamptz updated_at "Auto-updated via trigger"
    }

    VENDOR_QUOTES {
        text id PK "e.g. QTE-01001 (Sequence backed)"
        text request_id "Maintenance ticket reference"
        text scheme_id "Building scheme"
        text motion_id FK "Optional link to formal Motion"
        text vendor_id FK "Quoting Vendor"
        text vendor_name "Contractor Name"
        text contact_email "Email"
        text contact_phone "Phone"
        numeric amount "Total quoted amount"
        boolean gst_included "GST status flag"
        text scope_notes "Contractor scope explanation"
        boolean is_accredited "Accreditation flag"
        boolean is_selected "Winning quote flag"
        text insurance_status "Active | Expired Ins."
        date insurance_expiry "Policy expiry date at submission"
        text quote_doc_url "Uploaded PDF tender document"
        timestamptz created_at
    }

    QUOTE_POLL_VOTES {
        uuid id PK
        text request_id "Ticket reference"
        text quote_id FK "References vendor_quotes(id)"
        text voter_name "Committee Member Name"
        text voter_role "Committee Member / Office"
        timestamptz voted_at
    }
```

---

## 2. Table Specifications & Architectural Improvements

### `public.vendors`
Stores the master registry of verified building trades and contractors.
* **`id`** (`TEXT PRIMARY KEY`): Sequence-backed (`vendor_id_seq`) with deterministic padding (`VND-01001`), eliminating UUID-truncation collision vulnerabilities.
* **`name`** (`TEXT NOT NULL`): Legal business / trading name.
* **`category`** (`TEXT NOT NULL`): Primary trade (e.g. *Lift & Vertical Transport*, *Plumbing & Drainage*, *Electrical & Lighting*, *Acoustic Engineering*).
* **`abn`** (`TEXT NOT NULL`): 11-digit Australian Business Number.
* **`license_no`** (`TEXT NOT NULL`): State trade qualification / contractor license.
* **`phone`** & **`email`** (`TEXT NOT NULL`): Direct dispatch contacts.
* **`insurance_status`** (`TEXT NOT NULL`): Restricted to `'Active'`, `'Expired Ins.'`, `'Pending Verification'`.
* **`insurance_expiry`** (`DATE NOT NULL`): Expiry of Certificate of Currency ($20M minimum for strata compliance).
* **`certificate_of_currency_url`** (`TEXT`): Storage URL of the policy document.
* **`onboarding_method`** (`TEXT NOT NULL`): `'manual'` (added directly by manager) or `'invite_portal'` (self-registered via trade onboarding link).
* **`rating`** (`NUMERIC(3, 2)`): 1.00 to 5.00 average performance score.
* **`updated_at`**: Maintained automatically via the `handle_updated_at()` trigger.

### `public.scheme_vendors`
Many-to-many relationship establishing which vendors service which strata scheme, including preferred contractor designation.
* **`scheme_id`** (`TEXT NOT NULL`): ID of the strata plan (e.g. `SP101`, `SP103`, `SP52042`).
* **`vendor_id`** (`TEXT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE`): Foreign key with cascade deletion.
* **`is_preferred`** (`BOOLEAN NOT NULL DEFAULT FALSE`): Designates preferred building trade for emergency dispatch.

### `public.vendor_invitations`
Audit log of secure onboarding invitations dispatched to contractors.
* **`invite_token`** (`TEXT NOT NULL UNIQUE`): Cryptographically secure single-use link token.
* **`submitted_vendor_id`** (`TEXT REFERENCES vendors(id) ON DELETE SET NULL`): Indexed foreign key (`idx_vendor_invitations_submitted_vendor_id`) ensuring fast deletes and zero sequential scans.
* **`expires_at`**: 30-day auto-expiry window.

### `public.work_orders`
Digital work order lifecycle tracking tasks from dispatch to completion and manager sign-off.
* **`id`** (`TEXT PRIMARY KEY`): Sequence-backed (`work_order_id_seq`) deterministic identifier (`WO-01001`).
* **`case_id`** (`TEXT NOT NULL`): Linked resident defect or maintenance case.
* **`vendor_id`** (`TEXT NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT`): Prevents deleting active contractors with open work orders.
* **`scope_of_work`** (`TEXT NOT NULL`): Technical work instructions.
* **`budget_cap`** (`NUMERIC(12, 2)`): Spending cap approved by Strata Committee / Manager.
* **`final_cost`** (`NUMERIC(12, 2)`): Actual invoice amount submitted by tradesperson.
* **`site_access_pin`** (`TEXT NOT NULL`): 4-digit PIN for building entry / lockbox.
* **`guest_magic_token`** (`TEXT NOT NULL UNIQUE`): Secure token for zero-login trade portal upload.
* **`status`** (`TEXT NOT NULL`):
  * `'issued'`: Job dispatched; contractor notified with building PIN.
  * `'in_progress'`: Contractor on-site or parts ordered.
  * `'completion_submitted'`: Tradie uploaded completion photo & invoice (triggers **Needs Sign-Off** banner).
  * `'completed'`: Strata Manager reviewed evidence, verified within budget cap, and approved.

### `public.vendor_quotes` & `public.quote_poll_votes`
Australian strata compliance requires 2–3 quotes for works exceeding statutory spending thresholds.
* **`motion_id`** (`TEXT REFERENCES motions(id) ON DELETE SET NULL`): Unifies quotes across both Resident Request triage and formal Committee Motions, preventing redundant duplication.
* **`quote_poll_votes`**: Enforces strict committee voting integrity via `UNIQUE(request_id, voter_name)`.

---

## 3. Zero-Trust Security & RPC Architecture

### Row-Level Security (RLS) Lockdown
The initial prototype policies with `USING (TRUE)` on anonymous roles have been hardened:
1. **No Anonymous Table Snooping**: Unauthenticated users cannot read `work_orders` through PostgREST. This prevents public scraping of building access PINs, defect records, and financial figures.
2. **Restricted Registration**: Anonymous contractors can only `INSERT` into `vendors` with `insurance_status = 'Pending Verification'` and `onboarding_method = 'invite_portal'`.
3. **Exact Token Matching**: Invitations and work orders require exact cryptographic token verification.

### Secure Stored Procedures (RPCs)
Tradies on-site interact with the system without needing a user login via `SECURITY DEFINER` procedures:

```sql
-- 1. Securely fetch a single work order by magic token
SELECT * FROM public.get_work_order_by_guest_token('tok_sp103_wo10483_live');

-- 2. Securely submit work order completion evidence
SELECT public.submit_work_order_completion(
    'tok_sp103_wo10483_live',
    'https://storage.smartlot.internal/completion_photo.jpg',
    'Tax_Invoice_84920.pdf',
    3400.00
);
```

---

## 4. File Locations
* **Hardened Production Migration**: [`supabase/migrations/20260919_vendor_and_work_orders_schema.sql`](file:///f:/SmartLot/supabase/migrations/20260919_vendor_and_work_orders_schema.sql)
* **Master System Schema**: [`supabase_schema.sql`](file:///f:/SmartLot/supabase_schema.sql)
