import Sidebar from "@/components/Sidebar";
import TopStatus from "@/components/TopStatus";
import Hero from "@/components/Hero";
import KPISection from "@/components/KPISection";
import CapabilitySection from "@/components/CapabilitySection";
import ActivityFeed from "@/components/ActivityFeed";
import AIPanel from "@/components/AIPanel";
import RecentObjectives from "@/components/RecentObjectives";
import PerformanceOverview from "@/components/PerformanceOverview";

export default function Home() {
  return (
    <main className="flex h-screen overflow-hidden bg-[#05060f] text-white">

      <Sidebar />

      <section className="flex-1 min-w-0 overflow-hidden p-3">

        <div className="flex h-full flex-col gap-3">

          <TopStatus />

          <Hero />

          <KPISection />

          <div className="min-h-0 overflow-y-auto pr-1">
            <div className="grid gap-3 pb-3">

              <div className="grid grid-cols-[1.05fr_0.95fr] gap-3">

                <div>
                  <CapabilitySection />
                </div>

                <div>
                  <ActivityFeed />
                </div>

              </div>

              <div className="grid grid-cols-[0.9fr_1.1fr] gap-3">

                <div>
                  <RecentObjectives />
                </div>

                <div>
                  <PerformanceOverview />
                </div>

              </div>

            </div>
          </div>

        </div>

      </section>

      <AIPanel />
    </main>
  );
}
