# SmartLot — Platform Access & Test Credentials

```text
================================================================================
🏢 SMARTLOT — PLATFORM ACCESS & TEST CREDENTIALS
================================================================================

🔗 Live Platform URL: https://smart-lot-five.vercel.app
📁 GitHub Repository: https://github.com/Codewithjainam7/SmartLot
🔑 Standard Password for all persona accounts: SmartLot2026!

================================================================================
📋 TEST PERSONAS & PORTAL EXPERIENCES
================================================================================

1️⃣ Self-Managed Duplex (SP101 — Sunset Duplex)
--------------------------------------------------------------------------------
• Sarah Jones (Lot Owner & Strata Admin — Unit 1)
  Email: sarah.jones@duplex.com
  Password: SmartLot2026!
  Experience: Scheme Dashboard, Team Access, My Requests, Bylaws Library

• David Miller (Tenant — Unit 2)
  Email: david.m@duplex.com
  Password: SmartLot2026!
  Experience: Clean Tenant Portal (Notice Board, My Requests, Emergency Contacts)


2️⃣ Small Scheme Committee (SP102 — Coronation Residences)
--------------------------------------------------------------------------------
• Michael Chen (Committee Member & Strata Admin — Unit 2)
  Email: michael.chen@coronation.com
  Password: SmartLot2026!
  Experience: Scheme Dashboard, Team Access, 4-Stream Triage Requests (Can Approve/Reject)

• Liam Hemsworth (Resident — Unit 5)
  Email: liam.h@coronation.com
  Password: SmartLot2026!
  Experience: Resident Portal (Has active noise ticket in triage queue)

• Chloe Bennett (Tenant — Unit 4)
  Email: chloe.b@coronation.com
  Password: SmartLot2026!
  Experience: Tenant Portal


3️⃣ Multi-Site Strata Manager (SP103 — Cavalier Grand Residences)
--------------------------------------------------------------------------------
• Emma Wilson (Strata Manager — Multi-Site)
  Email: emma.wilson@agency.com
  Password: SmartLot2026!
  Experience: Multi-Site Management Console, Scheme Creation & Triage Engine

• Oliver Vance (Resident — Unit 305)
  Email: oliver.v@cavalier.com
  Password: SmartLot2026!
  Experience: Resident Portal

• Jessica Taylor (Tenant — Unit 410)
  Email: jessica.t@cavalier.com
  Password: SmartLot2026!
  Experience: Tenant Portal


4️⃣ Agency Strata Manager (SP823 — Spear Empire)
--------------------------------------------------------------------------------
• Roman Joe (Strata Manager)
  Email: romanjoe@gmail.com
  Password: SmartLot2026!
  Experience: Dedicated Strata Management Console


5️⃣ Super Admin / Root System Console (Master Platform Control)
--------------------------------------------------------------------------------
• Super Admin
  Access Link: https://smart-lot-five.vercel.app/#/admin (or click "System Console" in header)
  Admin Identifier: admin
  Security Passkey: admin123  (or click the 1-click Auto-fill pill)
  Experience: Root Strata Governance, Scheme Portfolios, Global Role Permissions, Direct Ticket Triage, Cross-Building User Directory


6️⃣ Trade Contractor & Vendor Portal
--------------------------------------------------------------------------------
• Trade Contractor Onboarding
  Access Link: https://smart-lot-five.vercel.app/#trade-portal (or click "Trade Portal" in header)
  Experience: Contractor accreditation, insurance compliance upload, quote submission & work order dispatch

================================================================================
```

---

## 🎯 Step-by-Step Evaluator & Testing Guide

This guide walks through the top 5 core user journeys in SmartLot.

### Journey 1: The Multi-Site Strata Manager (Emma Wilson)
1. **Login**: Go to [smart-lot-five.vercel.app](https://smart-lot-five.vercel.app), enter `emma.wilson@agency.com` / `SmartLot2026!`.
2. **Switch Schemes**: Notice the topbar scheme selector. Emma manages both **Cavalier Grand (`SP103`)** and **Coronation Residences (`SP102`)**. Toggle between them — notice how the units, resident roster, and ticket queues update dynamically with zero page reloads.
3. **Review Tenders & Quotes**:
   * Navigate to **Vendor Management** or **Resident Requests**.
   * Open the burst irrigation pipe ticket (`SL-202`).
   * See the two competing quotes: **Sydney Apex Plumbing ($3,450)** vs **Citywide Hydraulics ($4,100)**.
   * View the committee votes, select the winning quote, and dispatch the official work order.

---

### Journey 2: Committee Governance & Triage (Michael Chen)
1. **Login**: Sign in as `michael.chen@coronation.com` / `SmartLot2026!`.
2. **Triage Stream**: Go to **Resident Requests**.
3. **Statutory Triage**:
   * Review Liam Hemsworth's late-night noise complaint (Stream 4: By-Law Breach).
   * Notice the statutory notice banner and the chronological event timeline.
   * Add an internal committee note or comment on the request.
4. **Cast Committee Vote**:
   * Click **Vote on Quotes** for the active plumbing tender.
   * Click your name to toggle your vote `YES`. Notice how the vote tally updates in real time.

---

### Journey 3: Self-Managed Duplex Administration (Sarah Jones)
1. **Login**: Sign in as `sarah.jones@duplex.com` / `SmartLot2026!`.
2. **Duplex Controls**: Sarah owns Unit 1 in Sunset Duplex (`SP101`) and manages the 2-lot scheme without an agency.
3. **Team & Permissions**:
   * Navigate to **Team Access**.
   * See David Miller (Tenant in Unit 2).
   * Toggle permissions for Noticeboard Access or Financial Viewing.
4. **Invite New Member**:
   * Click **+ Invite Member**.
   * Notice the auto-generated invite token, QR code preview, and role selector.

---

### Journey 4: The Super Admin Root Console (`/#/admin`)
1. **Access**: Go to [smart-lot-five.vercel.app/#/admin](https://smart-lot-five.vercel.app/#/admin) or click **System Console** in the top navigation bar.
2. **Authenticate**: Click the **Auto-fill Master Credentials** pill (`admin / admin123`) and click **Sign In**.
3. **Global Portfolio Audit**:
   * Inspect high-level statistics across all 4 strata schemes.
   * View the unified request triage table across all buildings simultaneously.
4. **Remote Inspection Session**:
   * Under any scheme (e.g. `SP103`), click **Inspect Scheme**.
   * You are immediately transported into that scheme's live dashboard as an auditor.
   * Notice the glowing top banner: *"Super Admin Remote Inspection Mode"*.
   * Click **Back to Super Admin** to cleanly exit the session.

---

### Journey 5: Clean Tenant & Resident Experience (David Miller & Liam Hemsworth)
1. **Login**: Sign in as `david.m@duplex.com` / `SmartLot2026!`.
2. **Restricted Tenant Scoping**:
   * Notice that financial statements and sensitive committee discussions are hidden.
   * David only sees the **Noticeboard**, **Emergency Contacts**, and **My Requests**.
3. **Log a Maintenance Request**:
   * Click **+ New Request**.
   * Fill in description, urgency, and upload photo.
   * Submit to observe instant ticket generation with reference ID (e.g., `#SL-10452`).
