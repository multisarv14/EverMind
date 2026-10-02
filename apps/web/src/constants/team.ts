export const TEAM_SIZES = ["Just me", "2–10", "11–50", "51–200", "201–500", "500+"] as const;

export type Role = "owner" | "admin" | "member" | "viewer";

export const ROLE_LABEL: Record<Role, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
};

export type Action = "chat" | "createProject" | "manageTeam" | "manageBilling";

const MATRIX: Record<Role, Action[]> = {
  owner: ["chat", "createProject", "manageTeam", "manageBilling"],
  admin: ["chat", "createProject", "manageTeam"],
  member: ["chat", "createProject"],
  viewer: [],
};

export const can = (role: Role, action: Action) => MATRIX[role].includes(action);

/** Rows shown in the permissions table on the People screen. */
export const PERMISSION_ROWS: { action: Action; label: string }[] = [
  { action: "chat", label: "Chat with EverMind" },
  { action: "createProject", label: "Create and edit work (projects, tasks, decisions, knowledge)" },
  { action: "manageTeam", label: "Invite and manage team" },
  { action: "manageBilling", label: "Manage plan and billing" },
];
