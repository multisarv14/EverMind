import Sidebar from "@/components/Sidebar";
import TopStatus from "@/components/TopStatus";
import Hero from "@/components/Hero";
import KPISection from "@/components/KPISection";
import CapabilitySection from "@/components/CapabilitySection";
import ActivityFeed from "@/components/ActivityFeed";
import AIPanel from "@/components/AIPanel";

export default function Home() {
  return (
    <main className="flex h-screen overflow-hidden bg-[#05060f] text-white">

      <Sidebar />

      <section className="flex-1 min-w-0 p-4">

        <div
          className="
            grid
            h-full
            gap-3
            grid-rows-[72px_auto_auto_minmax(0,1fr)]
          "
        >

          <TopStatus />

          <Hero />

          <KPISection />

          <div className="grid min-h-0 grid-cols-[1.05fr_0.95fr] gap-3">

            <div className="min-h-0">
              <CapabilitySection />
            </div>

            <div className="min-h-0">
              <ActivityFeed />
            </div>

          </div>

        </div>

      </section>

      <AIPanel />

    </main>
  );
}
