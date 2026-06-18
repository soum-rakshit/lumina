# Lumina Planner - GATE Tracker

Lumina Planner is a modern, comprehensive tracking and planning application designed specifically for GATE (Graduate Aptitude Test in Engineering) aspirants. It helps students organize their preparation, track their progress, and stay consistent with their study goals.

## Core Features
- **Dashboard & Analytics:** Visual representations of your study progress using interactive charts.
- **Task Management:** Add, update, and organize daily or weekly study tasks.
- **Secure Authentication:** User accounts and secure access managed seamlessly via Clerk.
- **Responsive UI:** Beautiful, modern interface.
- **Robust Backend:** Persistent data storage.
- **Fast & Fluid State Management:** Ensures a smooth user experience across the app.

## Planned AI Integration (Coming Soon)
We are currently working on a powerful **AI-driven Planning Assistant**. 
This upcoming feature will enable the **automated creation of personalized study planners** according to each user's unique requirements, strengths, weaknesses, and target GATE score. The AI will analyze your timeline and syllabus, dynamically generating the optimal path for your preparation.

## Technologies, Tools, and Concepts Used

### Technologies & Frameworks
- **[Next.js (App Router)](https://nextjs.org/):** React framework for server-side rendering, static site generation, and routing.
- **[React 19](https://react.dev/):** Library for building user interfaces.
- **[TypeScript](https://www.typescriptlang.org/):** Strongly typed programming language that builds on JavaScript for robust code.
- **[Tailwind CSS](https://tailwindcss.com/):** Utility-first CSS framework for rapid UI development.
- **[Prisma ORM](https://www.prisma.io/):** Next-generation Node.js and TypeScript ORM.
- **[PostgreSQL](https://www.postgresql.org/):** Powerful, open source object-relational database system.

### Libraries & Tools
- **[Clerk](https://clerk.com/):** Complete user authentication and identity management.
- **[shadcn/ui](https://ui.shadcn.com/):** Beautifully designed components built with Radix UI and Tailwind CSS.
- **[Zustand](https://zustand-demo.pmnd.rs/):** A small, fast and scalable bearbones state-management solution.
- **[Framer Motion](https://www.framer.com/motion/):** A production-ready motion library for React.
- **[Recharts](https://recharts.org/):** A composable charting library built on React components.
- **[Lucide React](https://lucide.dev/):** Beautiful and consistent icons.
- **[Date-fns](https://date-fns.org/):** Modern JavaScript date utility library.

### Concepts
- **Server Components & Client Components:** Utilizing Next.js rendering strategies for optimized performance.
- **Responsive Web Design:** Ensuring the application works flawlessly across mobile, tablet, and desktop devices.
- **Relational Database Modeling:** Structuring user, task, and planner data efficiently in PostgreSQL.
- **Authentication & Authorization:** Securing user data and routes.

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm, yarn, pnpm, or bun
- PostgreSQL database

### Installation

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Set up your `.env` file with your database connection strings and Clerk API keys:
   ```env
   DATABASE_URL="your-postgresql-url"
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-key"
   CLERK_SECRET_KEY="your-clerk-secret"
   ```

3. Generate the Prisma client and push the schema to your database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.
