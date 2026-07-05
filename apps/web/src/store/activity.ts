export type ActivityItem = {
  id: string;
  title: string;
  description?: string;
  time: string;
};

const activities: ActivityItem[] = [];

export function addActivity(
  title: string,
  description = ""
) {
  activities.unshift({
    id: crypto.randomUUID(),
    title,
    description,
    time: "Just now",
  });
}

export function getActivities() {
  return activities;
}
