const events = [
  {
    title: "System initialized and ready",
    desc: "EverMind is online and learning about your goals",
  },
  {
    title: "AI team activated",
    desc: "12 agents are online and ready",
  },
  {
    title: "Waiting for your command",
    desc: "Tell me what you want to accomplish",
  },
];

export default function ActivityFeed() {
  return (
    <section className="ev-card h-full p-5">

      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-[18px] font-semibold text-white">
          EverMind Activity Feed
        </h3>

        <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-medium text-emerald-300">
          ● Live
        </span>
      </div>

      <div className="space-y-5">

        {events.map((item) => (
          <div key={item.title} className="flex gap-3">

            <div className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />

            <div>

              <div className="text-[15px] font-semibold text-white">
                {item.title}
              </div>

              <div className="mt-1 text-[13px] leading-5 text-white/45">
                {item.desc}
              </div>

            </div>

          </div>
        ))}

      </div>

    </section>
  );
}
