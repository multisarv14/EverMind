import PageShell, { EmptyState } from "@/components/PageShell";

export default function ReportsPage() {
  return (
    <PageShell title="Reports" subtitle="Reports EverMind prepares for you">
      <EmptyState title="No reports yet" text="Generated reports will appear here once reporting is connected." />
    </PageShell>
  );
}
