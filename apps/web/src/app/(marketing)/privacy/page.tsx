import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="[date]"
      intro="This policy explains what information EverMind collects, why, who it is shared with and the choices you have. [Company name] is responsible for your information as described here."
      sections={[
        {
          title: "What we collect",
          body: [
            "Account information: your name, work email and a password (stored only as a one-way hash, never in readable form). Company information: company name, type, team size and the description you write.",
            "Content you add: conversations with EverMind, projects, tasks, decisions, company knowledge, reports, feedback ratings and the facts EverMind suggests and you approve.",
            "Usage information: how much AI you use (token counts), when you sign in, and technical data needed to keep the service secure, such as rate-limit counters.",
          ],
        },
        {
          title: "How we use it",
          body: [
            "To provide EverMind: to sign you in, answer your messages, remember your company, show your team’s work and enforce plan limits. To keep it safe and fix problems. To improve answers for your company, for example by suggesting facts to remember (you approve them first). We do not sell your information.",
          ],
        },
        {
          title: "Who we share it with",
          body: [
            "To generate answers, the messages you send, together with the company information, project instructions and knowledge needed to answer them, are sent to our AI provider, Anthropic. We rely on our providers to protect this information and use it only to provide the service to us.",
            "We also use providers for hosting, the database that stores your content, and (when enabled) sending emails such as invitations and password resets. We may share information if the law requires it.",
          ],
        },
        {
          title: "Cookies and local storage",
          body: [
            "EverMind uses one essential cookie to keep you signed in, and your browser’s local storage to remember choices like light or dark mode and Basic or Advanced answers. We do not use advertising cookies.",
          ],
        },
        {
          title: "How long we keep it",
          body: [
            "We keep your information while your account is active. If you ask us to delete your account, we delete your content and personal information, except what we must keep by law or for security. [Retention details to be confirmed.]",
          ],
        },
        {
          title: "Your choices and rights",
          body: [
            "You can view and edit your profile and company details in Settings, delete items you added, and ask us to give you a copy of your data or delete it. Under India’s Digital Personal Data Protection Act, 2023 and similar laws you may have additional rights, including to correct your data and to complain to the authority. Contact us at [support email] to use these rights.",
          ],
        },
        {
          title: "Security",
          body: [
            "We protect information with measures such as hashed passwords, encrypted connections (HTTPS), access controls between companies and limits on sign-in attempts. No system is perfectly secure, so please use a strong, unique password and tell us right away if you suspect a problem.",
          ],
        },
        {
          title: "Children",
          body: ["EverMind is for adults running a business. It is not meant for anyone under 18, and we do not knowingly collect their information."],
        },
        {
          title: "Changes and contact",
          body: ["We may update this policy and will tell you about important changes. Questions or requests: [support email], [postal address]."],
        },
      ]}
    />
  );
}
