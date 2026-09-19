# SmartLot Vendor & Trades Management Database Schema Documentation

This document outlines the database tables, fields, relationships, and constraints designed for **Vendor Onboarding, Compliance Verification, Competitive Tenders, and Work Order Execution** in SmartLot.

It complies with Australian strata governance standards (**NSW SSMA 2015** & **VIC Owners Corporations Act 2006**) and adheres to Supabase PostgreSQL performance best practices.

---

## 1. Schema Architecture & Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    SCHEMES ||--o{ SCHEME_VENDORS : registers
    VENDORS ||--o{ SCHEME_VENDORS : preferred_in
    SCHEMES ||--o{ VENDOR_INVITATIONS : dispatches
    VENDORS ||--o{ WORK_ORDERS : assigned_to
    VENDORS ||--o{ VENDOR_QUOTES : submits
    VENDOR_QUOTES ||--o{ QUOTE_POLL_VOTES : receives
    RESIDENT_REQUESTS ||--o{ WORK_ORDERS : generates
    RESIDENT_REQUESTS ||--o{ VENDOR_QUOTES : receives

    VENDORS {
        text id PK "e.g. VND-001"
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
        timestamptz updated_at
    }

    SCHEME_VENDORS {
        uuid id PK
        text scheme_id FK "e.g. SP101, SP103"
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
        text invite_token UK "Secure encrypted URL token"
        text status "pending | submitted | approved | rejected | expired"
        text invited_by "Strata Manager"
        text submitted_vendor_id FK "Populated upon registration"
        timestamptz expires_at "Default 30 days"
        timestamptz created_at
    }

    WORK_ORDERS {
        text id PK "e.g. WO-10483"
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
        timestamptz updated_at
    }

    VENDOR_QUOTES {
        text id PK "e.g. QTE-001"
        text request_id "Maintenance ticket reference"
        text scheme_id "Building scheme"
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

## 2. Table Specifications & Column Details

### `public.vendors`
Stores directory of certified trades and contractors.
* **`id`** (`TEXT PRIMARY KEY`): Clean standardized ID (`VND-001` or `VND-` + 8 hex characters).
* **`name`** (`TEXT NOT NULL`): Legal business / trading name.
* **`category`** (`TEXT NOT NULL`): Primary trade (e.g. *Lift & Vertical Transport*, *Plumbing & Drainage*, *Electrical & Lighting*, *Acoustic Engineering*).
* **`abn`** (`TEXT NOT NULL`): 11-digit Australian Business Number.
* **`license_no`** (`TEXT NOT NULL`): State trade qualification / contractor license.
* **`phone`** & **`email`** (`TEXT NOT NULL`): Direct dispatch contacts.
* **`insurance_status`** (`TEXT NOT NULL`): Restricted to `'Active'`, `'Expired Ins.'`, `'Pending Verification'`.
* **`insurance_expiry`** (`DATE NOT NULL`): Expiry of Certificate of Currency.
* **`certificate_of_currency_url`** (`TEXT`): Storage URL of the policy document.
* **`onboarding_method`** (`TEXT NOT NULL`): `'manual'` (added directly by strata manager) or `'invite_portal'` (self-registered via trade onboarding link).
* **`rating`** (`NUMERIC(3, 2)`): 1.00 to 5.00 average vendor performance score.

### `public.scheme_vendors`
Many-to-many relationship establishing which vendors service which strata scheme, including preferred contractor designation.
* **`scheme_id`** (`TEXT NOT NULL`): ID of the strata plan (e.g. `SP101`, `SP103`).
* **`vendor_id`** (`TEXT NOT NULL REFERENCES vendors(id)`): Foreign key with cascade deletion.
* **`is_preferred`** (`BOOLEAN NOT NULL DEFAULT FALSE`): Designates preferred building trade for emergency dispatch.

### `public.work_orders`
Digital work order lifecycle tracking tasks from dispatch to completion and manager sign-off.
* **`id`** (`TEXT PRIMARY KEY`): Unique job ID (e.g. `WO-10483`).
* **`case_id`** (`TEXT NOT NULL`): Linked resident defect or maintenance case.
* **`vendor_id`** (`TEXT NOT NULL REFERENCES vendors(id)`): Assigned vendor.
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
* Enables side-by-side comparison.
* Enables Strata Committee voting (`quote_poll_votes`) directly inside the governance hub.

---

## 3. SQL Migration File Location
The runnable, production-ready SQL migration has been placed in:
- [`supabase/migrations/20260919_vendor_and_work_orders_schema.sql`](file:///c:/Users/91960/Documents/Jagrat_Projects/.vscode/Smart_Lot/supabase/migrations/20260919_vendor_and_work_orders_schema.sql)
- And merged into the master schema: [`supabase_schema.sql`](file:///c:/Users/91960/Documents/Jagrat_Projects/.vscode/Smart_Lot/supabase_schema.sql)
