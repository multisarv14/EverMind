/** Starting points shown when creating a project; picking one fills in the form. */
export interface ProjectTemplate {
  label: string;
  name: string;
  description: string;
  instructions: string;
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    label: "Product launch",
    name: "Product launch",
    description: "Plan and run the launch of a new product or feature.",
    instructions:
      "Goal: launch successfully with a clear plan, owners and dates.\nAudience: our target customers.\nTone: confident, clear and practical.\nAlways include risks and a simple checklist of next steps.",
  },
  {
    label: "Fundraising",
    name: "Fundraising round",
    description: "Prepare for and run an investor fundraising round.",
    instructions:
      "Goal: raise capital on good terms.\nAudience: investors.\nBe realistic about numbers. Flag anything that needs a lawyer or CA before it is shared.\nHelp with the pitch story, financial model, investor list and follow-ups.",
  },
  {
    label: "Hiring plan",
    name: "Hiring plan",
    description: "Hire the right people for the next stage of the company.",
    instructions:
      "Goal: hire the key roles on time and within budget.\nBe fair and avoid discriminatory criteria.\nHelp with role definitions, scorecards, interview questions, offers and onboarding.",
  },
  {
    label: "Marketing campaign",
    name: "Marketing campaign",
    description: "Plan and run a campaign that brings in customers.",
    instructions:
      "Goal: generate qualified leads at a sensible cost.\nAudience: our ideal customers.\nTie every idea to a measurable result. Never invent testimonials or statistics.",
  },
  {
    label: "Website redesign",
    name: "Website redesign",
    description: "Refresh the company website to convert more visitors.",
    instructions:
      "Goal: a clearer, faster website that turns visitors into leads.\nHelp with structure, copy, and a launch checklist. Keep the brand voice simple and trustworthy.",
  },
  {
    label: "Start from scratch",
    name: "",
    description: "",
    instructions: "",
  },
];
