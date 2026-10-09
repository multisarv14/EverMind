import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="[date]"
      intro="These terms explain how you may use EverMind, the AI Executive service operated by [company name] (“we”, “us”). By creating an account or using EverMind you agree to them. If you use EverMind for a company, you confirm you are allowed to accept these terms on its behalf."
      sections={[
        {
          title: "What EverMind is",
          body: [
            "EverMind is a tool that helps you plan, decide and draft work. It uses artificial intelligence to produce text, plans, analyses and suggestions based on what you and your team write and store.",
            "EverMind cannot take actions outside the service, such as sending emails, filing documents or spending money, unless a feature clearly says it can.",
          ],
        },
        {
          title: "Your account and team",
          body: [
            "You must give accurate information and keep your password secret. You are responsible for activity on your account and for the people you invite. The company owner controls who joins and what each person may do.",
            "You must be at least 18 years old to use EverMind.",
          ],
        },
        {
          title: "AI answers are not professional advice",
          body: [
            "AI output can be wrong, incomplete or out of date. EverMind does not provide legal, tax, accounting, medical, financial or other regulated professional advice. Always check important answers and confirm legal, tax and compliance matters with a qualified professional before acting on them.",
            "You are responsible for how you use the output and for decisions you make.",
          ],
        },
        {
          title: "Your content",
          body: [
            "You keep ownership of what you add to EverMind (your conversations, projects, tasks, decisions, knowledge and reports) and of the output generated for you. You give us permission to store and process that content only to run and improve the service for you, as described in our Privacy Policy.",
            "Do not add anything unlawful, anything you do not have the right to share, or sensitive personal data you do not need (such as passwords, bank card numbers or health records).",
          ],
        },
        {
          title: "Acceptable use",
          body: [
            "Do not misuse EverMind: do not try to break or probe its security, overload it, resell it without permission, use it to deceive or harm others, generate unlawful content, or attempt to extract the underlying AI systems.",
            "We may limit or suspend accounts that put the service or other users at risk.",
          ],
        },
        {
          title: "Plans, limits and payment",
          body: [
            "The Free plan includes a monthly allowance of AI credits and a limited number of team members. Pro and Business plans are paid monthly or yearly in advance and renew automatically until cancelled. Prices are shown on the pricing page in Indian rupees and exclude GST, which is added at checkout.",
            "AI credits measure AI usage. The monthly allowance resets each month and does not carry over. Credit packs can be bought on paid plans; they are used after the monthly allowance and expire 12 months after purchase.",
            "You can cancel anytime from Settings. The plan keeps working until the end of the period already paid for, then the company moves to the Free plan; your data is kept. If a renewal payment fails, the plan keeps working for 7 days while you fix the payment.",
            "Payments are processed by Razorpay. Except where the law requires otherwise, payments are not refundable; contact [support email] within [7] days if you were charged by mistake. Prices and allowances may change with at least [30] days' notice by email.",
            "EverMind plans are sold by [company name]. They are not Anthropic or Claude subscriptions.",
          ],
        },
        {
          title: "Availability and changes",
          body: [
            "We work to keep EverMind running but do not promise it will always be available or error-free. We may change or discontinue features, and we will give reasonable notice of changes that significantly affect you.",
          ],
        },
        {
          title: "Ending your use",
          body: [
            "You can stop using EverMind at any time and ask us to delete your account and data. We may end or suspend access if these terms are broken. Sections that by their nature should continue (such as ownership and liability) will continue after you leave.",
          ],
        },
        {
          title: "Liability",
          body: [
            "EverMind is provided “as is”. To the extent the law allows, we are not liable for indirect or consequential loss, lost profits or lost data, and our total liability for any claim is limited to the amount you paid us in the 12 months before the claim. Nothing in these terms limits liability that cannot legally be limited.",
          ],
        },
        {
          title: "Governing law and changes to these terms",
          body: [
            "These terms are governed by the laws of India, and the courts of [city] will have jurisdiction, unless the law gives you other rights. We may update these terms and will tell you about important changes; continuing to use EverMind after a change means you accept it.",
          ],
        },
      ]}
    />
  );
}
