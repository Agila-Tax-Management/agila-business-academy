// src/app/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function RootPage(): Promise<never> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    const role = (session.user as Record<string, unknown>).role as string | undefined;
    redirect(role === "ADMIN" || role === "SUPER_ADMIN" ? "/admin" : "/dashboard");
  }
  redirect("/sign-in");
}
