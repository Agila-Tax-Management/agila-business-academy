// prisma.config.ts
import "dotenv/config";
import type { PrismaConfig } from "prisma";
import { PrismaPg } from "@prisma/adapter-pg";

export default {
  schema: "prisma",
  migrate: {
    adapter: () => new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  },
} satisfies PrismaConfig;
