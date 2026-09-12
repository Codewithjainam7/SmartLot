# SmartLot - Next-Generation Strata Management Platform

SmartLot is an enterprise-grade, multi-tenant Strata Management & Community Operations platform built for Australian and international strata schemes, residential communities, and body corporate portfolios.

## 🚀 Key Features

- **Multi-Tenant Strata Portfolios**: Manage single duplexes, multi-townhouse schemes, and 30+ unit residential towers under one roof.
- **Dynamic Role-Based Access Control**: Strata Admins, Strata Managers, Committee Members, Lot Owners, Residents, and Tenants with custom overrides.
- **Multi-Site Strata Manager Workflows**: Seamless cross-scheme switching for professional management agencies.
- **Live Supabase Integration**: Real-time Postgres subscriptions, robust RLS policies, and automated invite linking triggers.
- **High-Speed UI with Shimmer Loading**: Sub-second parallel data fetching with `Promise.all` and graceful skeleton loaders.
- **Linear/Stripe-Inspired Design Language**: Dark & Light mode support, glowing status badges, and polished micro-interactions.
- **Accessibility (WCAG 2.1 AA Compliant)**: Full keyboard navigation, descriptive `aria-label` tags, `role="checkbox"` controls, and high-contrast color tokens.


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


## 🧪 Testing Personas

Login to the platform using any of the pre-configured test personas:

| Persona | Role | Scheme | Email | Password |
| :--- | :--- | :--- | :--- | :--- |
| **Sarah Jones** | Owner / Resident | Duplex (`SP101`) | `sarah.jones@duplex.com` | `SmartLot2026!` |
| **Michael Chen** | Committee Member | Coronation (`SP102`) | `michael.chen@coronation.com` | `SmartLot2026!` |
| **Emma Wilson** | Strata Manager | Cavaller (`SP103`) & Coronation (`SP102`) | `emma.wilson@agency.com` | `SmartLot2026!` |
| **Roman Joe** | Strata Manager | Spear Empire (`SP823`) | `romanjoe@gmail.com` | `SmartLot2026!` |


## 📄 License & Attribution

Copyright © 2026 SmartLot Strata Management. Built with Google Antigravity. Author: Jainam Jain <jainjainam412@gmail.com>.

### Latest Updates (v1.2.0)
- Strict scheme privacy: Users only see schemes they belong to.
- Interactive Topbar: Dropdown with "+ Add New Strata Site" quick action.
- Clean member rosters: Management staff properly segregated from unit occupants.

<!-- SmartLot 2026 Production Ready -->

<!-- Sprint 1.2: Activity Management verified & deployed -->


### 🚀 Jira-Style In-Page Request Review
- Replaced modal and drawer popups with a focused, in-page 2-column ticket review layout matching standard Jira service management patterns.

- Included top back navigation (`← Back to Requests`), 3-column attribute bar, statutory triage banner, timeline event track, and quick action controls.
