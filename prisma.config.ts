import { config } from "dotenv";
// Load .env.local first (highest priority for local dev), then .env as fallback
config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

import { defineConfig } from "prisma/config";

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
    },
    datasource: {
        url: process.env["DATABASE_URL"],
    },
});
