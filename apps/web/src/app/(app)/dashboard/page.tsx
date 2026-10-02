import TopStatus from "@/components/TopStatus";
import Hero from "@/components/Hero";
import KPISection from "@/components/KPISection";
import CapabilitySection from "@/components/CapabilitySection";
import ActivityFeed from "@/components/ActivityFeed";
import AIPanel from "@/components/AIPanel";

export default function Home() {
  return (
    <main className="h-full">
      <section className="flex h-full min-w-0 flex-col gap-3 overflow-y-auto px-7 py-5">
        <TopStatus />

        <div className="grid flex-1 grid-cols-[minmax(0,1fr)_340px] gap-5 2xl:grid-cols-[minmax(0,1fr)_410px]">
          <div className="flex flex-col justify-between gap-3">
            <Hero />
            <KPISection />
          </div>
          <AIPanel />
        </div>

        <div className="grid h-[236px] shrink-0 grid-cols-[1.15fr_1fr] gap-4">
          <CapabilitySection />
          <ActivityFeed />
        </div>

        <p className="text-center text-[13px] leading-snug text-violet-300/90">
          &ldquo;You focus on the vision. I&apos;ll handle everything else.&rdquo;
          <br />
          <span className="text-white/60">— EverMind, Your AI Executive</span>
        </p>
      </section>
    </main>
  );
}
