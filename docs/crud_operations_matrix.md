# SmartLot Platform — Complete CRUD Operations Audit Matrix

This document provides a comprehensive audit of all domain entities and operational workflows across SmartLot, evaluating their Create, Read, Update, and Delete (CRUD) coverage.

---

## Executive Summary Matrix

| Entity / Domain Area | Create (C) | Read (R) | Update (U) | Delete (D) | Status & Implementation Details |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Strata Schemes** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | Full CRUD via `addScheme`, `updateScheme`, `deleteScheme` in Admin Console |
| **Scheme Members (Roster)** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | Full Admin CRUD via `addMember`, `updateMember`, `updateMemberStatus`, `deleteMember` |
| **User Account Settings** | ✅ Yes | ✅ Yes | ✅ **NEW** | ⚠️ Partial | Self-service profile editor added in `SettingsView.tsx` (Name, Email, Phone, Password) |
| **Maintenance Requests** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ **NEW** | Created via portal, triaged/updated, now purgeable via `deleteResidentRequest` |
| **Request Comments & Notes**| ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | Full thread CRUD with edit and delete handlers |
| **Units & Physical Lots** | ✅ **NEW** | ✅ Yes | ✅ Yes | ✅ **NEW** | Mapped actors, occupancy metadata, added `addUnit` and `deleteUnit` |
| **Contractors & Vendors** | ✅ **NEW** | ✅ Yes | ⚠️ Partial | ✅ **NEW** | Mini-CRM with `addVendor`, directory display, `deleteVendor` |
| **Work Orders** | ✅ **NEW** | ✅ Yes | ✅ Yes | ✅ **NEW** | Dispatched via `createWorkOrder`, contractor guest upload, `deleteWorkOrder` |
| **Committee Motions & Voting**| ✅ **NEW**| ✅ Yes | ✅ Yes | ✅ **NEW** | Motion submission, quote comparison, `castBallot`, `deleteMotion` |
| **Noticeboard / Broadcasts**| ❌ Needs UI | ❌ Needs UI | ❌ Needs UI | ❌ Needs UI | Data models added to `types.ts`; requires notice feed component |
| **Document Repository** | ❌ Needs UI | ❌ Needs UI | ❌ Needs UI | ❌ Needs UI | Data models added to `types.ts`; requires cloud storage upload view |
| **Role Permissions Matrix** | ❌ Fixed | ✅ Yes | ✅ Yes | ❌ Fixed | Matrix toggling supported per scheme/role; custom roles immutable |

---

## Detailed Entity Breakdown

### 1. User Self-Service Account & Profile Settings
- **Previous State**: Read-only display of session initials and theme toggle.
- **Current State**: 
  - **Create**: Automatic upon login/invite onboarding.
  - **Read**: Viewable in Settings and Topbar.
  - **Update**: Fully editable in `SettingsView.tsx` (Legal Name, Registered Email, Mobile Phone, Optional Password Change) with discard option and feedback alerts.
  - **Delete**: Handled via Strata Admin deprovisioning.

### 2. Resident Requests & Maintenance Cases
- **Create**: `submitResidentRequest` & `createMasterRequest` with image attachment support.
- **Read**: Live search, priority filtering, and card views across Resident and Admin views.
- **Update**: Priority escalation, status progression (`in_progress`, `in_voting`, `resolved`), assignment, and triage actions.
- **Delete**: `deleteResidentRequest` removes invalid, spam, or duplicate tickets and syncs with Supabase.

### 3. Units & Occupant Directory
- **Create**: `addUnit` allows adding new strata lots with custom entitlement shares.
- **Read**: Comprehensive unit roster in `UnitsView` with 3-actor slot mapping.
- **Update**: `updateUnitMetadata` modifies entitlement weighting and vacancy status.
- **Delete**: `deleteUnit` removes retired lots from building scheme records.

### 4. Verified Trade Contractors (Mini-CRM)
- **Create**: `addVendor` registers certified contractors with ABN, license, and insurance dates.
- **Read**: Grid of verified trades with insurance compliance badges and ratings.
- **Update**: Vendor rating and insurance verification status.
- **Delete**: `deleteVendor` purges deregistered contractors.

### 5. Strata Work Orders & Guest Contractor Portal
- **Create**: `createWorkOrder` issues digital dispatch with 4-digit PIN and secure token.
- **Read**: Work order tracking view and standalone guest submission portal.
- **Update**: Contractor photo/invoice upload and strata manager verification.
- **Delete**: `deleteWorkOrder` cancels unfulfilled job orders.

### 6. Strata Committee Voting Engine
- **Create**: `createMotion` links requests with multi-contractor quote tenders.
- **Read**: Voting deck displaying live quorum progression percentage.
- **Update**: `castBallot` records YES/NO/ABSTAIN votes and auto-passes on quorum.
- **Delete**: `deleteMotion` withdraws retracted resolutions.

### 7. Noticeboard & Document Storage (Identified Roadmap Additions)
- **Status**: Data models defined in `src/types.ts` (`SchemeNotice`, `SchemeDocument`). 
- **Next Steps**: Dedicated UI tabs for building notice broadcasts and PDF document archive.
