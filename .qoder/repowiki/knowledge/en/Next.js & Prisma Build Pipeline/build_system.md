The Dormitory Management Platform utilizes a standard **Next.js** build system powered by **npm** and **TypeScript**, with **Prisma** handling database schema management and client generation.

### Core Build Tools
- **Package Manager**: `npm` (evidenced by `package-lock.json`).
- **Framework**: Next.js 16.2.6 (App Router).
- **Language**: TypeScript 5.x with strict mode enabled.
- **Database ORM**: Prisma 7.8.0 with PostgreSQL adapter (`@prisma/adapter-pg`).
- **Styling**: Tailwind CSS 4 with PostCSS.
- **Linting**: ESLint 9 with `eslint-config-next`.

### Build & Development Scripts
Defined in `package.json`:
- `npm run dev`: Starts the Next.js development server.
- `npm run build`: Compiles the application for production using `next build`.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint checks.
- `postinstall`: Automatically runs `prisma generate` after dependency installation to ensure the Prisma Client is up-to-date.

### Database Management
- **Schema Definition**: Located in `prisma/schema.prisma`.
- **Migrations**: Managed via Prisma Migrations in `prisma/migrations/`.
- **Seeding**: 
  - Primary seed script: `prisma/seed.ts` (RBAC, default admin user).
  - Custom seed scripts: `scripts/seed-audit.ts` for specific permission updates.
  - Configuration: `prisma.config.ts` defines migration paths and seed commands.

### Configuration Files
- `next.config.ts`: Configures compression, image remote patterns (Cloudinary), and experimental stale times.
- `tsconfig.json`: Sets up path aliases (`@/*` -> `./src/*`), JSX transformation, and module resolution.
- `eslint.config.mjs`: Extends Next.js core web vitals and TypeScript rules, ignoring build artifacts and maintenance scripts.
- `postcss.config.mjs`: Integrates Tailwind CSS.

### Deployment & CI/CD
- **CI/CD**: No dedicated CI/CD configuration files (e.g., `.github/workflows`, `Jenkinsfile`) were found in the repository root. Deployment likely relies on manual processes or external platform configurations (e.g., Vercel, given the `vercel.svg` and Next.js nature).
- **Containerization**: No `Dockerfile` or `docker-compose.yml` is present in the repository.

### Developer Conventions
- **Path Aliases**: Use `@/` for imports from the `src` directory.
- **Environment Variables**: Managed via `.env` (see `.env.example` for template).
- **Code Quality**: ESLint is integrated into the build process; developers should run `npm run lint` before committing.
- **Database Changes**: All schema changes must be accompanied by Prisma migrations (`npx prisma migrate dev`).