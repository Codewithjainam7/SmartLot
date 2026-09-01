# Granular Role Permissions Matrix

SmartLot enforces a hierarchical permission evaluation engine that checks:
1. **Global Platform Overrides**
2. **Scheme-Level Defaults**
3. **Individual Member Overrides**

| Feature / Action | Strata Admin | Strata Manager | Committee Member | Lot Owner | Resident | Tenant |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Team Access / Directory** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Submit Maintenance Ticket** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Triage & Approve Requests** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Cast Ballot / Vote** | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| **View Scheme Financials** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Add / Edit Occupants** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |


## Custom Individual Permissions

Strata Managers and Admins can toggle individual permission overrides on any member directly from the **Team Access** directory. Overrides are persisted in the `individual_permissions` table in Supabase and supersede role defaults.
