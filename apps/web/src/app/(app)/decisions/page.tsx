import PageShell, { EmptyState } from "@/components/PageShell";

export default function DecisionsPage() {
  return (
    <PageShell title="Decisions" subtitle="Every decision EverMind makes, with the reasoning">
      <EmptyState title="No decisions yet" text="Decisions will appear here once the Decision Engine is connected." />
    </PageShell>
  );
}
