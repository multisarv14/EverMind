import type { Metadata } from "next";
import ResetForm from "@/components/ResetForm";

export const metadata: Metadata = { title: "Choose a new password" };

export default function ResetPage() {
  return <ResetForm />;
}
