The Dormitory Management Platform utilizes a standard **Next.js environment variable configuration system** combined with **Prisma's schema-level environment integration**. 

### 1. Core Approach
- **Environment Variables**: Runtime configuration is managed exclusively through `.env` files, following the Next.js convention where `process.env` variables are automatically exposed to the server-side runtime. 
- **Prisma Integration**: The Prisma ORM reads the `DATABASE_URL` directly from the environment, as defined in `prisma/schema.prisma` and facilitated by the `prisma.config.ts` file which uses `dotenv` for local development support.
- **NextAuth Configuration**: Authentication secrets and base URLs are injected via `NEXTAUTH_SECRET` and `NEXTAUTH_URL` environment variables, consumed by the custom auth options in `src/lib/auth.ts`.

### 2. Key Configuration Files
- **`.env.example`**: Serves as the template for required environment variables, including `DATABASE_URL`, `NEXTAUTH_URL`, and `NEXTAUTH_SECRET`.
- **`next.config.ts`**: Handles framework-level configuration, such as image remote patterns (allowing `res.cloudinary.com`) and experimental stale-time settings. It does not currently use `publicRuntimeConfig` or `serverRuntimeConfig`, relying instead on direct `process.env` access.
- **`prisma.config.ts`**: Defines the Prisma CLI behavior, pointing to the schema location and migration paths, and explicitly loading `dotenv` to ensure the database client can connect during seed/migration operations.
- **`src/lib/prisma.ts`**: Implements a singleton pattern for the Prisma Client, initializing the PostgreSQL adapter using `process.env.DATABASE_URL`. It includes a check to prevent multiple instances in development hot-reloading scenarios.

### 3. Architecture and Conventions
- **Direct Injection**: The application avoids complex configuration objects or YAML/JSON config files. Instead, it relies on direct `process.env` access within library files (`auth.ts`, `prisma.ts`).
- **Security**: Secrets like `NEXTAUTH_SECRET` and database credentials are kept out of the codebase, with `.env` listed in `.gitignore` (implied by standard Next.js setup and presence of `.env.example`).
- **Database Adapter**: The system uses `@prisma/adapter-pg` with a `pg` Pool, configured with specific connection limits (`max: 1`) suitable for serverless or constrained environments, as seen in `src/lib/prisma.ts`.

### 4. Rules for Developers
- **Adding New Variables**: Any new runtime configuration should be added to `.env.example` first to document the requirement for other developers.
- **Client-Side Access**: If an environment variable needs to be accessed in the browser (client-side components), it must be prefixed with `NEXT_PUBLIC_` (e.g., `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`). Currently, all sensitive config remains server-side.
- **Prisma Schema**: Do not hardcode database connection strings in `schema.prisma`; always rely on the `env("DATABASE_URL")` function provided by Prisma's datasource block.