
## Advanced Permissions Matrix
- Global roles are configured via Super Admin Portal.
- Site-specific roles are overridden in the Strata Manager console.


<!-- End of Readme -->

<!-- Section: Architecture Overview -->
<!-- Section: Authentication Modules -->
<!-- Section: Permission Cascading Hierarchy -->
<!-- Section: Supabase Integration -->
<!-- Section: Super Admin Portal -->
<!-- Feature: Cross-Scheme Multi-Tenancy Engine -->
<!-- Feature: Role-Based Strata Permissions -->
<!-- Feature: Real-Time Maintenance Request Pipeline -->
<!-- Feature: Individual User Override Security -->
<!-- Feature: Supabase Row-Level Security Rules -->
<!-- UI Design: Dual-Panel Authentication Specs -->
<!-- UI Design: Dynamic Tab Transition Engine -->
<!-- UI Design: Color Tokens and Glowing Gradients -->
<!-- UI Design: Responsive Mobile and Desktop Grid -->
<!-- UI Design: Micro-Interactions and Hover Elevations -->
# SmartLot - Next-Generation Strata Management Platform

SmartLot is an enterprise-grade, multi-tenant Strata Management & Community Operations platform built for Australian and international strata schemes, residential communities, and body corporate portfolios.

## 🚀 Key Features

- **Multi-Tenant Strata Portfolios**: Manage single duplexes, multi-townhouse schemes, and 30+ unit residential towers under one roof.
- **Dynamic Role-Based Access Control**: Strata Admins, Strata Managers, Committee Members, Lot Owners, Residents, and Tenants with custom overrides.
- **Multi-Site Strata Manager Workflows**: Seamless cross-scheme switching for professional management agencies.
- **Live Supabase Integration**: Real-time Postgres subscriptions, robust RLS policies, and automated invite linking triggers.
- **High-Speed UI with Shimmer Loading**: Sub-second parallel data fetching with `Promise.all` and graceful skeleton loaders.
- **Linear/Stripe-Inspired Design Language**: Dark & Light mode support, glowing status badges, and polished micro-interactions.


## 🛠️ Local Development Setup

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Getting Started

```bash
# Clone the repository
git clone https://github.com/Codewithjainam7/SmartLot.git
cd SmartLot

# Install dependencies
npm install

# Start development server
npm run dev

# Run TypeScript compilation check
npx tsc --noEmit
```


## 🔐 Supabase Configuration

Configure your environment variables in `.env.local`:

```env
VITE_SUPABASE_URL=https://pieplmpkognbdktezteb.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```
