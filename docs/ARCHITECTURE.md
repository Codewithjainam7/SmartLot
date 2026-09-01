# System Architecture & Multi-Tenancy Engine

## Core Architectural Layers

1. **Presentation Layer (React 18 + Vite + Tailwind CSS)**:
   - Client-side routing with hash and view states.
   - Persistent Zustand state management with localStorage synchronizers.
   - Responsive layout grid with collapsible navigation and quick-switch topbar.

2. **Data & Synchronization Layer (Supabase + Postgres)**:
   - High-performance parallelized data fetching.
   - Real-time channel subscriptions for live ticket updates.
   - Foreign key relationships linking `auth.users` to `public.profiles` and `public.members`.
