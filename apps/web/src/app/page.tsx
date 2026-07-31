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

      <section className="flex-1 overflow-hidden">

        <div className="mx-auto flex h-full max-w-[1700px] gap-4 p-4">

          <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden">

            <TopStatus />

            <Hero />

            <KPISection />

            <div className="grid min-h-0 flex-1 grid-cols-[1.1fr_0.9fr] gap-4">

              <CapabilitySection />

              <ActivityFeed />

            </div>

          </div>

          <AIPanel />

        </div>

      </section>

    </main>
  );
}
