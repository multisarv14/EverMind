import { redirect } from "next/navigation";
import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";
import { currentSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignupPage() {
  if (await currentSession()) redirect("/dashboard");
  return <AuthForm mode="signup" />;
}
