# Pocket

Pocket is a personal financial ledger and cash flow tracking application built with Next.js, React, Tailwind CSS, PostgreSQL, and Drizzle ORM.

The application follows an editorial, typographic design language with strict adherence to human interface guidelines, responsive layout scaling, and high-density financial data visualization.

## Key Features

- Ledger and Transactions: Double-entry cash flow records supporting standard expenses, income, debt management, savings allocations, and inter-account transfers.
- Visual Overview: Apple Health and Apple Watch inspired charts including multi-ring budget completion, daily spending distributions, and interactive running cash trend sparklines.
- Monthly Budgeting: Target setting across spending groups, savings funds, and income channels with progress monitoring.
- Multi-Account Reconciliation: Real-time validation between physical account balances and ledger entries to detect unassigned cash variations.
- Yearly Summary: Twelve-month performance tables and cash flow statements detailing income, expenditure, and cumulative net cash positions.
- Multi-Currency Support: Configurable currency codes and currency symbols applied universally across all views and metrics.
- Privacy and Security: Salted PBKDF2 password hashing, HTTP-only signed session tokens, and strict per-user data isolation.

## Tech Stack

- Framework: Next.js 16 (App Router, Turbopack, Partial Prerendering)
- UI Library: React 19, React Icons
- Styling: Tailwind CSS 4
- Database: PostgreSQL
- ORM and Query Layer: Drizzle ORM, node-postgres (`pg`)
- Language: TypeScript 5
- Testing: Node.js Test Runner, tsx, Testing Library, JSDOM, Playwright

## Getting Started

### Prerequisites

- Node.js 20 or higher
- PostgreSQL 14 or higher
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/pocket.git
   cd pocket
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env.local` and configure your database connection string and session secret:
   ```bash
   cp .env.example .env.local
   ```

   Required environment variables:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/pocket_ledger"
   SESSION_SECRET="your-32-byte-base64-or-hex-secret"
   ```

4. Run database migrations:
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

   The application will be accessible at `http://localhost:3000`.

## Available Scripts

- `npm run dev`: Runs Next.js development server with Turbopack.
- `npm run build`: Compiles production build and validates TypeScript types.
- `npm run start`: Starts the production build server.
- `npm run lint`: Runs ESLint across the codebase.
- `npm test`: Runs backend integration and frontend unit test suites using the Node.js native test runner.
- `npm run db:push`: Synchronizes database schema with Drizzle definitions.
- `npm run db:studio`: Opens Drizzle Studio for database inspection.

## Architecture and Project Structure

```text
src/
├── actions/             # Next.js Server Actions for mutations
├── app/                 # Next.js App Router routes and page layouts
├── components/
│   ├── account/         # Profile management components
│   ├── accounts/        # Account list, balances, and transfer forms
│   ├── auth/            # Sign in and registration forms
│   ├── budget/          # Budget targets and progress components
│   ├── dashboard/       # Overview charts, activity rings, and metrics
│   ├── layout/          # PageShell, sticky headers, and navigation
│   ├── settings/        # Categories, budget groups, and preferences
│   ├── summary/         # Annual summary and monthly breakdown
│   ├── transactions/    # Ledger entries, filtering, and search
│   └── ui/              # Reusable design primitives (combobox, charts, dialogs)
├── db/
│   ├── queries/         # Database query helpers and transaction executors
│   └── schema/          # PostgreSQL table schemas and views
├── hooks/               # Custom React hooks
├── lib/                 # Core logic, formatting, session, and validation helpers
└── types/               # TypeScript interfaces and shared ledger models
```

## Testing

The project uses the Node.js native test runner with TypeScript execution:

```bash
npm test
```

Test suites cover:
- PostgreSQL views and constraint enforcement
- Password hashing and session token verification
- Input validation and UUID parsing
- Cash flow calculations and aggregation utilities
- Component rendering, keyboard navigation, and interactive chart behaviors

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
