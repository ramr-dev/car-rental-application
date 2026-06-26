import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MessageCircle, FileText, Phone, HelpCircle } from "lucide-react";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help Center & FAQs — DriveLux" },
      {
        name: "description",
        content: "Find answers to frequently asked questions about DriveLux car rentals, payments, and compliance.",
      },
    ],
  }),
  component: HelpPage,
});

const FAQS = [
  {
    category: "KYC & Verification",
    items: [
      {
        q: "What is KYC and why do I need it?",
        a: "KYC stands for Know Your Customer. Since we rent out premium luxury vehicles, our compliance team must verify your identity and driver eligibility using your driver's license scans before you can take custody of any vehicle.",
      },
      {
        q: "How long does document verification take?",
        a: "Most submissions are verified within 2 to 4 hours. However, in some cases it may take up to 24 hours. You will receive an email and in-dashboard notification once your status updates.",
      },
    ],
  },
  {
    category: "Bookings & Payments",
    items: [
      {
        q: "What payment gateways are supported?",
        a: "We support Stripe (for global credit/debit card processing), Razorpay (for UPI, wallets, and domestic banking), and Braintree (for PayPal, Venmo, and credit card transactions).",
      },
      {
        q: "Is there a security deposit?",
        a: "Yes, a security deposit is held at the time of booking to cover any incidental costs. It is fully refunded within 48 hours of vehicle return, provided there is no damage.",
      },
    ],
  },
  {
    category: "Vehicles & Rentals",
    items: [
      {
        q: "Are the vehicles equipped with GPS?",
        a: "Yes. For security and roadside assistance, all platform vehicles are monitored using GPS trackers during your rental period.",
      },
      {
        q: "Can I list my own vehicle on DriveLux?",
        a: "Absolutely! You can register as a Partner Host. Visit our 'Become a Host' page, register your account, list your vehicle specs and photos, and start earning.",
      },
    ],
  },
];

function HelpPage() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Help Center
          </h1>
          <p className="mt-4 text-base text-muted-foreground">
            Have questions? We're here to guide you every step of the way.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          <Card className="p-6 bg-card border-border flex flex-col items-center text-center">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
              <MessageCircle className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-foreground">AI Chatbot</h3>
            <p className="mt-2 text-xs text-muted-foreground">Ask our 24/7 AI assistant at the bottom right corner of the page.</p>
          </Card>
          <Card className="p-6 bg-card border-border flex flex-col items-center text-center">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-foreground">Docs & Policy</h3>
            <p className="mt-2 text-xs text-muted-foreground">Read our Terms of Service and Privacy Policy for guidelines.</p>
          </Card>
          <a href="/contact" className="w-full">
            <Card className="p-6 bg-card border-border flex flex-col items-center text-center hover:border-primary transition-colors h-full">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Phone className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground">Contact Support</h3>
              <p className="mt-2 text-xs text-muted-foreground">Reach our support team directly via email or our contact page.</p>
            </Card>
          </a>
        </div>

        <div className="mt-16 space-y-12">
          {FAQS.map((category) => (
            <div key={category.category} className="space-y-4">
              <h2 className="text-xl font-bold text-foreground border-b border-border pb-2">
                {category.category}
              </h2>
              <Accordion type="single" collapsible className="w-full">
                {category.items.map((faq, idx) => (
                  <AccordionItem key={idx} value={`item-${idx}`} className="border-border">
                    <AccordionTrigger className="text-sm font-medium text-left hover:text-primary transition-colors py-4">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
