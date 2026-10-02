import TopStatus from "@/components/TopStatus";
import Hero from "@/components/Hero";
import KPISection from "@/components/KPISection";
import GetStarted from "@/components/GetStarted";
import ActivityFeed from "@/components/ActivityFeed";
import AgentDrawer from "@/components/AgentDrawer";

export default function Home() {
  return (
    <main className="h-full">
      <AgentDrawer>
        <div className="mx-auto flex max-w-[1040px] flex-col gap-6 px-8 py-5">
          <TopStatus />
          <Hero />
          <KPISection />
          <div className="grid gap-5 lg:grid-cols-2">
            <GetStarted />
            <ActivityFeed />
          </div>
        </div>
      </AgentDrawer>
    </main>
  );
}
