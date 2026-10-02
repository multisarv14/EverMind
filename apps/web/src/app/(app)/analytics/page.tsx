import PageShell, { EmptyState } from "@/components/PageShell";

export default function AnalyticsPage() {
  return (
    <PageShell title="Analytics" subtitle="Performance of your company and EverMind">
      <EmptyState title="No data yet" text="Analytics will appear here once there is activity to measure." />
    </PageShell>
  );
}
