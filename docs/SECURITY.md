# SmartLot Security Model

## Multi-Tenancy Scheme Isolation
Every database query strictly filters by `scheme_id` to guarantee tenant isolation.

## Role Hierarchy
1. Master Admin (Global)
2. Strata Manager (Assigned Scheme)
3. Committee Member (Governance)
4. Lot Owner (Voting & Levies)
5. Resident / Tenant (Maintenance & Amenities)
