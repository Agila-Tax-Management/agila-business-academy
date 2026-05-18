import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./src/generated/prisma/index.js";
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Simulate what BetterAuth's prismaAdapter does when creating a user
try {
  const result = await prisma.user.create({
    data: {
      id: "test-cuid-" + Date.now(),
      name: "Test User",
      email: "test-create-" + Date.now() + "@test.com",
      emailVerified: false,
      image: null,
      role: "EMPLOYEE",
      position: "IT",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  });
  console.log("SUCCESS:", result);
  // cleanup
  await prisma.user.delete({ where: { id: result.id } });
  console.log("Cleaned up");
} catch (e) {
  console.log("ERROR:", e.message);
  console.log("CODE:", e.code);
  console.log("META:", e.meta);
}

await prisma.$disconnect();
