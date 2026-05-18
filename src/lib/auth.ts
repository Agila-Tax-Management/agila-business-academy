// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db";
import { Role, NotificationType, NotificationPriority } from "@/generated/prisma";

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
    },
  },

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const position = (user as Record<string, unknown>).position as string | null | undefined;

          // Auto-enroll in Onboarding + position-matching series
          try {
            const orConditions: Array<{ title: { contains: string; mode: "insensitive" } }> = [
              { title: { contains: "Onboarding", mode: "insensitive" } },
            ];
            if (position) {
              orConditions.push({ title: { contains: position, mode: "insensitive" } });
            }
            const autoSeries = await prisma.series.findMany({
              where: { OR: orConditions },
              select: { id: true },
            });
            for (const s of autoSeries) {
              await prisma.enrollment.upsert({
                where: { userId_seriesId: { userId: user.id, seriesId: s.id } },
                create: { userId: user.id, seriesId: s.id },
                update: {},
              });
            }
          } catch {
            // Never fail sign-up due to enrollment errors
          }

          // Notify admins of the new registrant
          try {
            const admins = await prisma.user.findMany({
              where: { role: { in: [Role.ADMIN, Role.SUPER_ADMIN] } },
              select: { id: true },
            });
            if (admins.length > 0) {
              await prisma.internalNotification.createMany({
                data: admins.map((admin) => ({
                  recipientId: admin.id,
                  type: NotificationType.ACTION_REQUIRED,
                  priority: NotificationPriority.HIGH,
                  title: "New employee registered",
                  message: `${user.name} (${position ?? "No position specified"}) has registered and is awaiting class assignment.`,
                  entity: "User",
                  entityId: user.id,
                  actionUrl: "/admin/employees",
                })),
              });
            }
          } catch {
            // Never fail sign-up due to notification errors
          }
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
