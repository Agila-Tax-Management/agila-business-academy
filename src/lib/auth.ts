// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "EMPLOYEE",
        // Do not allow the client to set this field
        input: false,
      },
      position: {
        type: "string",
        required: false,
        defaultValue: null,
        input: true,
      },
      approvalStatus: {
        type: "string",
        required: false,
        defaultValue: "APPROVED",
        input: false,
      },
    },
  },

  databaseHooks: {
    user: {
      create: {
        after: async (_user) => {
          // reserved for future post-registration hooks
        },
      },
    },
  },

  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
});
