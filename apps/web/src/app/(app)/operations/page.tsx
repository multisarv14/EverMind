import PageShell, { EmptyState } from "@/components/PageShell";

export default function OperationsPage() {
  return (
    <PageShell title="Operations" subtitle="Workflows and processes EverMind runs for you">
      <EmptyState title="No operations yet" text="Running workflows will appear here once execution is connected." />
    </PageShell>
  );
}
