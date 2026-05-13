// prisma/seed.ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma";
import { randomBytes, scrypt as scryptCallback } from "crypto";

function scryptAsync(password: string, salt: string, keylen: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // Must match @better-auth/utils/password exactly: N=16384, r=16, p=1, dkLen=64
    scryptCallback(password, salt, keylen, { N: 16384, r: 16, p: 1, maxmem: 128 * 16384 * 16 * 2 }, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Password hashing — matches BetterAuth's @better-auth/utils hashPassword
// format: "<saltHex>:<hashHex>"  (scrypt N=16384 r=8 p=1 dkLen=64)
// ---------------------------------------------------------------------------
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = await scryptAsync(password.normalize("NFKC"), salt, 64);
  return `${salt}:${hash.toString("hex")}`;
}

// ---------------------------------------------------------------------------
// Seed data definitions
// ---------------------------------------------------------------------------

const USERS = [
  {
    name: "Genesis Superadmin",
    email: "superadmin@agila.ph",
    password: "SuperAdmin@123",
    role: "SUPER_ADMIN" as const,
  },
  {
    name: "HR Admin",
    email: "admin@agila.ph",
    password: "Admin@123",
    role: "ADMIN" as const,
  },
  {
    name: "Juan dela Cruz",
    email: "juan@agila.ph",
    password: "Employee@123",
    role: "EMPLOYEE" as const,
  },
  {
    name: "Maria Santos",
    email: "maria@agila.ph",
    password: "Employee@123",
    role: "EMPLOYEE" as const,
  },
  {
    name: "Carlo Reyes",
    email: "carlo@agila.ph",
    password: "Employee@123",
    role: "EMPLOYEE" as const,
  },
];

// ---------------------------------------------------------------------------
// Main seed
// ---------------------------------------------------------------------------
async function main() {
  console.log("🌱 Seeding database...\n");

  // ── Users ────────────────────────────────────────────────────────────────
  console.log("Creating users...");
  const createdUsers: Record<string, string> = {}; // email → id

  for (const u of USERS) {
    const hashed = await hashPassword(u.password);

    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, emailVerified: true },
      create: {
        name: u.name,
        email: u.email,
        emailVerified: true,
        role: u.role,
      },
    });

    // Create or update the credential Account record (BetterAuth email+password)
    await prisma.account.upsert({
      where: {
        // BetterAuth uniqueness: providerId + accountId
        providerId_accountId: {
          providerId: "credential",
          accountId: user.id,
        },
      },
      update: { password: hashed },
      create: {
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password: hashed,
      },
    });

    createdUsers[u.email] = user.id;
    console.log(`  ✔ ${u.role.padEnd(12)} ${u.email}`);
  }

  // ── Series ───────────────────────────────────────────────────────────────
  console.log("\nCreating content...");

  const onboarding = await prisma.series.upsert({
    where: { id: "seed-series-onboarding" },
    update: {},
    create: {
      id: "seed-series-onboarding",
      title: "New Employee Onboarding",
      description:
        "Everything a new Agila employee needs to know — company culture, policies, and tools.",
      isPublic: true,
      requiresCertificate: true,
      order: 1,
    },
  });

  const safety = await prisma.series.upsert({
    where: { id: "seed-series-safety" },
    update: {},
    create: {
      id: "seed-series-safety",
      title: "Safety & Compliance",
      description:
        "Workplace safety standards, emergency procedures, and regulatory compliance training.",
      isPublic: true,
      requiresCertificate: true,
      order: 2,
    },
  });

  const itBasics = await prisma.series.upsert({
    where: { id: "seed-series-it" },
    update: {},
    create: {
      id: "seed-series-it",
      title: "IT & Systems Basics",
      description:
        "Introduction to the tools and systems used across the organisation.",
      isPublic: false,
      requiresCertificate: false,
      order: 3,
    },
  });

  // ── Modules ──────────────────────────────────────────────────────────────

  const modOrientation = await prisma.module.upsert({
    where: { id: "seed-mod-orientation" },
    update: {},
    create: {
      id: "seed-mod-orientation",
      seriesId: onboarding.id,
      title: "Company Orientation",
      description: "Overview of Agila's history, mission, and organisational structure.",
      order: 1,
    },
  });

  const modHrPolicies = await prisma.module.upsert({
    where: { id: "seed-mod-hr" },
    update: {},
    create: {
      id: "seed-mod-hr",
      seriesId: onboarding.id,
      title: "HR Policies & Benefits",
      description: "Leave policies, benefits, code of conduct, and disciplinary guidelines.",
      order: 2,
    },
  });

  const modSafety = await prisma.module.upsert({
    where: { id: "seed-mod-safety" },
    update: {},
    create: {
      id: "seed-mod-safety",
      seriesId: safety.id,
      title: "Workplace Safety Basics",
      description: "Hazard identification, PPE usage, and emergency evacuation procedures.",
      order: 1,
    },
  });

  const modEmergency = await prisma.module.upsert({
    where: { id: "seed-mod-emergency" },
    update: {},
    create: {
      id: "seed-mod-emergency",
      seriesId: safety.id,
      title: "Emergency Response",
      description: "Fire drills, first aid essentials, and incident reporting.",
      order: 2,
    },
  });

  const modAtms = await prisma.module.upsert({
    where: { id: "seed-mod-atms" },
    update: {},
    create: {
      id: "seed-mod-atms",
      seriesId: itBasics.id,
      title: "ATMS Overview",
      description: "Introduction to the internal ERP system used at Agila.",
      order: 1,
    },
  });

  // ── Videos ───────────────────────────────────────────────────────────────

  const videos = [
    // Company Orientation
    {
      id: "seed-vid-welcome",
      moduleId: modOrientation.id,
      title: "Welcome to Agila",
      description: "A message from the CEO and an overview of what Agila does.",
      videoUrl: "https://example.com/videos/welcome-to-agila.mp4",
      durationSeconds: 420,
      order: 1,
    },
    {
      id: "seed-vid-orgchart",
      moduleId: modOrientation.id,
      title: "Organisational Structure",
      description: "Departments, reporting lines, and key contacts.",
      videoUrl: "https://example.com/videos/org-chart.mp4",
      durationSeconds: 310,
      order: 2,
    },
    // HR Policies
    {
      id: "seed-vid-leave",
      moduleId: modHrPolicies.id,
      title: "Leave & Attendance Policy",
      description: "How to file leave requests, attendance rules, and tardiness policies.",
      videoUrl: "https://example.com/videos/leave-policy.mp4",
      durationSeconds: 540,
      order: 1,
    },
    {
      id: "seed-vid-conduct",
      moduleId: modHrPolicies.id,
      title: "Code of Conduct",
      description: "Expected behaviour, anti-harassment policy, and grievance procedures.",
      videoUrl: "https://example.com/videos/code-of-conduct.mp4",
      durationSeconds: 480,
      order: 2,
    },
    // Workplace Safety
    {
      id: "seed-vid-hazards",
      moduleId: modSafety.id,
      title: "Identifying Workplace Hazards",
      description: "Common hazards in the workplace and how to report them.",
      videoUrl: "https://example.com/videos/hazard-identification.mp4",
      durationSeconds: 390,
      order: 1,
    },
    {
      id: "seed-vid-ppe",
      moduleId: modSafety.id,
      title: "Personal Protective Equipment",
      description: "Correct use and maintenance of PPE for various job roles.",
      videoUrl: "https://example.com/videos/ppe-usage.mp4",
      durationSeconds: 350,
      order: 2,
    },
    // Emergency Response
    {
      id: "seed-vid-fire",
      moduleId: modEmergency.id,
      title: "Fire Safety & Evacuation",
      description: "Fire drill procedures, exit routes, and assembly points.",
      videoUrl: "https://example.com/videos/fire-safety.mp4",
      durationSeconds: 460,
      order: 1,
    },
    {
      id: "seed-vid-firstaid",
      moduleId: modEmergency.id,
      title: "Basic First Aid",
      description: "CPR, wound care, and when to call emergency services.",
      videoUrl: "https://example.com/videos/first-aid.mp4",
      durationSeconds: 600,
      order: 2,
    },
    // ATMS
    {
      id: "seed-vid-atms-intro",
      moduleId: modAtms.id,
      title: "Navigating the ATMS Dashboard",
      description: "A guided tour of the main ATMS screens and key features.",
      videoUrl: "https://example.com/videos/atms-intro.mp4",
      durationSeconds: 520,
      order: 1,
    },
  ];

  for (const v of videos) {
    await prisma.video.upsert({
      where: { id: v.id },
      update: {},
      create: v,
    });
  }
  console.log(`  ✔ ${videos.length} videos`);

  // ── Exams ────────────────────────────────────────────────────────────────
  console.log("\nCreating exams...");

  // Video exam — Welcome to Agila
  const welcomeExam = await prisma.exam.upsert({
    where: { id: "seed-exam-welcome" },
    update: {},
    create: {
      id: "seed-exam-welcome",
      title: "Welcome to Agila — Quick Check",
      scope: "VIDEO",
      videoId: "seed-vid-welcome",
      passingScore: 75,
      maxAttempts: 3,
    },
  });

  const welcomeQ1 = await prisma.question.upsert({
    where: { id: "seed-q-wq1" },
    update: {},
    create: {
      id: "seed-q-wq1",
      examId: welcomeExam.id,
      text: "Where is Agila's main office located?",
      type: "MULTIPLE_CHOICE",
      order: 1,
    },
  });
  await prisma.choice.createMany({
    data: [
      { id: "seed-c-wq1-a", questionId: welcomeQ1.id, text: "Manila", isCorrect: false, order: 1 },
      { id: "seed-c-wq1-b", questionId: welcomeQ1.id, text: "Cebu City", isCorrect: true, order: 2 },
      { id: "seed-c-wq1-c", questionId: welcomeQ1.id, text: "Davao City", isCorrect: false, order: 3 },
      { id: "seed-c-wq1-d", questionId: welcomeQ1.id, text: "Makati", isCorrect: false, order: 4 },
    ],
    skipDuplicates: true,
  });

  const welcomeQ2 = await prisma.question.upsert({
    where: { id: "seed-q-wq2" },
    update: {},
    create: {
      id: "seed-q-wq2",
      examId: welcomeExam.id,
      text: "Agila is primarily a logistics and transport company.",
      type: "TRUE_FALSE",
      order: 2,
    },
  });
  await prisma.choice.createMany({
    data: [
      { id: "seed-c-wq2-t", questionId: welcomeQ2.id, text: "True", isCorrect: true, order: 1 },
      { id: "seed-c-wq2-f", questionId: welcomeQ2.id, text: "False", isCorrect: false, order: 2 },
    ],
    skipDuplicates: true,
  });

  const welcomeQ3 = await prisma.question.upsert({
    where: { id: "seed-q-wq3" },
    update: {},
    create: {
      id: "seed-q-wq3",
      examId: welcomeExam.id,
      text: "Which of the following best describes Agila's core values? (Select all that apply)",
      type: "MULTIPLE_CHOICE",
      order: 3,
    },
  });
  await prisma.choice.createMany({
    data: [
      { id: "seed-c-wq3-a", questionId: welcomeQ3.id, text: "Integrity", isCorrect: true, order: 1 },
      { id: "seed-c-wq3-b", questionId: welcomeQ3.id, text: "Excellence", isCorrect: true, order: 2 },
      { id: "seed-c-wq3-c", questionId: welcomeQ3.id, text: "Secrecy", isCorrect: false, order: 3 },
      { id: "seed-c-wq3-d", questionId: welcomeQ3.id, text: "Service", isCorrect: true, order: 4 },
    ],
    skipDuplicates: true,
  });

  console.log(`  ✔ Video exam — "${welcomeExam.title}"`);

  // Module exam — Workplace Safety Basics
  const safetyModExam = await prisma.exam.upsert({
    where: { id: "seed-exam-safety-mod" },
    update: {},
    create: {
      id: "seed-exam-safety-mod",
      title: "Workplace Safety — Module Assessment",
      scope: "MODULE",
      moduleId: modSafety.id,
      passingScore: 80,
      maxAttempts: 2,
      timeLimitMin: 15,
    },
  });

  const smQ1 = await prisma.question.upsert({
    where: { id: "seed-q-sm1" },
    update: {},
    create: {
      id: "seed-q-sm1",
      examId: safetyModExam.id,
      text: "What is the first step when you identify a workplace hazard?",
      type: "MULTIPLE_CHOICE",
      order: 1,
    },
  });
  await prisma.choice.createMany({
    data: [
      { id: "seed-c-sm1-a", questionId: smQ1.id, text: "Ignore it and continue working", isCorrect: false, order: 1 },
      { id: "seed-c-sm1-b", questionId: smQ1.id, text: "Report it to your supervisor immediately", isCorrect: true, order: 2 },
      { id: "seed-c-sm1-c", questionId: smQ1.id, text: "Fix it yourself without telling anyone", isCorrect: false, order: 3 },
      { id: "seed-c-sm1-d", questionId: smQ1.id, text: "Wait until the end of your shift", isCorrect: false, order: 4 },
    ],
    skipDuplicates: true,
  });

  const smQ2 = await prisma.question.upsert({
    where: { id: "seed-q-sm2" },
    update: {},
    create: {
      id: "seed-q-sm2",
      examId: safetyModExam.id,
      text: "PPE must be inspected before each use.",
      type: "TRUE_FALSE",
      order: 2,
    },
  });
  await prisma.choice.createMany({
    data: [
      { id: "seed-c-sm2-t", questionId: smQ2.id, text: "True", isCorrect: true, order: 1 },
      { id: "seed-c-sm2-f", questionId: smQ2.id, text: "False", isCorrect: false, order: 2 },
    ],
    skipDuplicates: true,
  });

  const smQ3 = await prisma.question.upsert({
    where: { id: "seed-q-sm3" },
    update: {},
    create: {
      id: "seed-q-sm3",
      examId: safetyModExam.id,
      text: "Which of the following are examples of physical hazards? (Select all that apply)",
      type: "MULTIPLE_CHOICE",
      order: 3,
    },
  });
  await prisma.choice.createMany({
    data: [
      { id: "seed-c-sm3-a", questionId: smQ3.id, text: "Wet floors", isCorrect: true, order: 1 },
      { id: "seed-c-sm3-b", questionId: smQ3.id, text: "Excessive noise", isCorrect: true, order: 2 },
      { id: "seed-c-sm3-c", questionId: smQ3.id, text: "Bad lighting", isCorrect: true, order: 3 },
      { id: "seed-c-sm3-d", questionId: smQ3.id, text: "Good teamwork", isCorrect: false, order: 4 },
    ],
    skipDuplicates: true,
  });

  const smQ4 = await prisma.question.upsert({
    where: { id: "seed-q-sm4" },
    update: {},
    create: {
      id: "seed-q-sm4",
      examId: safetyModExam.id,
      text: "Damaged PPE may still be used as long as the damage is minor.",
      type: "TRUE_FALSE",
      order: 4,
    },
  });
  await prisma.choice.createMany({
    data: [
      { id: "seed-c-sm4-t", questionId: smQ4.id, text: "True", isCorrect: false, order: 1 },
      { id: "seed-c-sm4-f", questionId: smQ4.id, text: "False", isCorrect: true, order: 2 },
    ],
    skipDuplicates: true,
  });

  console.log(`  ✔ Module exam  — "${safetyModExam.title}"`);

  // Series exam — New Employee Onboarding
  const onboardingExam = await prisma.exam.upsert({
    where: { id: "seed-exam-onboarding-series" },
    update: {},
    create: {
      id: "seed-exam-onboarding-series",
      title: "New Employee Onboarding — Final Assessment",
      scope: "SERIES",
      seriesId: onboarding.id,
      passingScore: 75,
      maxAttempts: 0, // unlimited retakes
      timeLimitMin: 30,
    },
  });

  const seQ1 = await prisma.question.upsert({
    where: { id: "seed-q-se1" },
    update: {},
    create: {
      id: "seed-q-se1",
      examId: onboardingExam.id,
      text: "How many days in advance must a leave request be submitted (for planned leaves)?",
      type: "MULTIPLE_CHOICE",
      order: 1,
    },
  });
  await prisma.choice.createMany({
    data: [
      { id: "seed-c-se1-a", questionId: seQ1.id, text: "Same day", isCorrect: false, order: 1 },
      { id: "seed-c-se1-b", questionId: seQ1.id, text: "At least 3 days prior", isCorrect: true, order: 2 },
      { id: "seed-c-se1-c", questionId: seQ1.id, text: "1 day prior", isCorrect: false, order: 3 },
      { id: "seed-c-se1-d", questionId: seQ1.id, text: "1 week prior", isCorrect: false, order: 4 },
    ],
    skipDuplicates: true,
  });

  const seQ2 = await prisma.question.upsert({
    where: { id: "seed-q-se2" },
    update: {},
    create: {
      id: "seed-q-se2",
      examId: onboardingExam.id,
      text: "An employee may be terminated for a first-time minor violation of the code of conduct.",
      type: "TRUE_FALSE",
      order: 2,
    },
  });
  await prisma.choice.createMany({
    data: [
      { id: "seed-c-se2-t", questionId: seQ2.id, text: "True", isCorrect: false, order: 1 },
      { id: "seed-c-se2-f", questionId: seQ2.id, text: "False", isCorrect: true, order: 2 },
    ],
    skipDuplicates: true,
  });

  const seQ3 = await prisma.question.upsert({
    where: { id: "seed-q-se3" },
    update: {},
    create: {
      id: "seed-q-se3",
      examId: onboardingExam.id,
      text: "Which department handles employee benefits and payroll at Agila?",
      type: "MULTIPLE_CHOICE",
      order: 3,
    },
  });
  await prisma.choice.createMany({
    data: [
      { id: "seed-c-se3-a", questionId: seQ3.id, text: "Operations", isCorrect: false, order: 1 },
      { id: "seed-c-se3-b", questionId: seQ3.id, text: "Finance", isCorrect: false, order: 2 },
      { id: "seed-c-se3-c", questionId: seQ3.id, text: "Human Resources", isCorrect: true, order: 3 },
      { id: "seed-c-se3-d", questionId: seQ3.id, text: "IT", isCorrect: false, order: 4 },
    ],
    skipDuplicates: true,
  });

  const seQ4 = await prisma.question.upsert({
    where: { id: "seed-q-se4" },
    update: {},
    create: {
      id: "seed-q-se4",
      examId: onboardingExam.id,
      text: "Which of the following actions violate Agila's code of conduct? (Select all that apply)",
      type: "MULTIPLE_CHOICE",
      order: 4,
    },
  });
  await prisma.choice.createMany({
    data: [
      { id: "seed-c-se4-a", questionId: seQ4.id, text: "Using company equipment for personal gain", isCorrect: true, order: 1 },
      { id: "seed-c-se4-b", questionId: seQ4.id, text: "Reporting a colleague's misconduct", isCorrect: false, order: 2 },
      { id: "seed-c-se4-c", questionId: seQ4.id, text: "Disclosing confidential client information", isCorrect: true, order: 3 },
      { id: "seed-c-se4-d", questionId: seQ4.id, text: "Arriving on time", isCorrect: false, order: 4 },
    ],
    skipDuplicates: true,
  });

  console.log(`  ✔ Series exam  — "${onboardingExam.title}"`);

  // ── Enrollments ──────────────────────────────────────────────────────────
  console.log("\nCreating enrollments...");

  const juanId = createdUsers["juan@agila.ph"];
  const mariaId = createdUsers["maria@agila.ph"];
  const carloId = createdUsers["carlo@agila.ph"];

  const enrollments = [
    // Juan — enrolled in all 3 series
    { userId: juanId, seriesId: onboarding.id },
    { userId: juanId, seriesId: safety.id },
    { userId: juanId, seriesId: itBasics.id },
    // Maria — onboarding + safety
    { userId: mariaId, seriesId: onboarding.id },
    { userId: mariaId, seriesId: safety.id },
    // Carlo — onboarding only
    { userId: carloId, seriesId: onboarding.id },
  ];

  for (const e of enrollments) {
    await prisma.enrollment.upsert({
      where: { userId_seriesId: { userId: e.userId, seriesId: e.seriesId } },
      update: {},
      create: e,
    });
  }
  console.log(`  ✔ ${enrollments.length} enrollments`);

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log("\n✅ Seed complete!\n");
  console.log("Accounts created:");
  console.log("  superadmin@agila.ph  /  SuperAdmin@123  (SUPER_ADMIN)");
  console.log("  admin@agila.ph       /  Admin@123       (ADMIN)");
  console.log("  juan@agila.ph        /  Employee@123    (EMPLOYEE)");
  console.log("  maria@agila.ph       /  Employee@123    (EMPLOYEE)");
  console.log("  carlo@agila.ph       /  Employee@123    (EMPLOYEE)");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
