import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Clock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — DriveLux" },
      {
        name: "description",
        content: "Get in touch with the DriveLux team. We're here to help.",
      },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().min(2, "Name required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  subject: z.string().min(1, "Please select a subject"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type FormVals = z.infer<typeof schema>;

const CONTACT_INFO = [
  {
    icon: Phone,
    title: "Call Us",
    lines: ["+1 (800) DRIVELUX", "+1 (800) 374-8358"],
    note: "Mon–Fri 8am–8pm ET",
  },
  {
    icon: Mail,
    title: "Email",
    lines: ["hello@drivelux.com", "support@drivelux.com"],
    note: "We reply within 4 hours",
  },
  {
    icon: MapPin,
    title: "Headquarters",
    lines: ["100 Market Street, Suite 1200", "San Francisco, CA 94105"],
    note: "By appointment only",
  },
  {
    icon: Clock,
    title: "Hours",
    lines: ["Mon–Fri: 8:00 AM – 8:00 PM", "Sat–Sun: 9:00 AM – 5:00 PM"],
    note: "All times Eastern",
  },
];

const FAQ_ITEMS = [
  {
    q: "How quickly can I pick up a vehicle after booking?",
    a: "Once your booking is confirmed (usually within 2–4 hours), you can arrange pickup at your chosen time. Same-day pickups are available for select vehicles.",
  },
  {
    q: "What documents do I need at pickup?",
    a: "Bring a valid driver's license, a government-issued photo ID, and the credit card used for the security deposit. International drivers also need an International Driving Permit.",
  },
  {
    q: "Can I modify or cancel my booking?",
    a: "Yes. Free cancellation up to 48 hours before pickup. Modifications can be made by contacting us — we'll do our best to accommodate changes.",
  },
];

function ContactPage() {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormVals>({ resolver: zodResolver(schema) });

  const onSubmit = (_data: FormVals) => {
    toast.success("Message sent! We'll get back to you within 4 hours.");
    reset();
  };

  return (
    <PublicLayout>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="border-b border-border bg-gradient-to-b from-accent/30 to-background py-16">
        <div className="container mx-auto px-4 text-center lg:px-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <MessageSquare className="h-7 w-7 text-primary" />
          </div>
          <h1 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Get in Touch
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Have a question or need help with a booking? Our team responds within 4 hours.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_440px]">

          {/* ── Contact info cards ──────────────────────────────────── */}
          <div className="space-y-8">
            <div>
              <h2 className="font-display text-2xl font-semibold">Contact Information</h2>
              <p className="mt-2 text-muted-foreground">
                Reach out through any of the channels below, or use the form to send us a
                direct message.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {CONTACT_INFO.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.title} className="p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="mt-3 font-display font-semibold">{item.title}</h3>
                    {item.lines.map((l) => (
                      <p key={l} className="mt-1 text-sm text-muted-foreground">
                        {l}
                      </p>
                    ))}
                    <p className="mt-2 text-xs text-muted-foreground/70">{item.note}</p>
                  </Card>
                );
              })}
            </div>

            {/* ── Quick FAQ ─────────────────────────────────────────── */}
            <div>
              <h2 className="font-display text-xl font-semibold">Quick Answers</h2>
              <div className="mt-4 space-y-4">
                {FAQ_ITEMS.map((item) => (
                  <div
                    key={item.q}
                    className="rounded-xl border border-border bg-card p-5"
                  >
                    <p className="font-medium">{item.q}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Contact form ─────────────────────────────────────────── */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Card className="p-6">
              <h2 className="font-display text-xl font-semibold">Send a Message</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                We'll respond to your email within 4 hours.
              </p>

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="mt-6 space-y-4"
                noValidate
              >
                <div>
                  <Label>Full Name *</Label>
                  <Input
                    className="mt-1"
                    placeholder="Jane Smith"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    className="mt-1"
                    placeholder="jane@example.com"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label>Phone (optional)</Label>
                  <Input
                    type="tel"
                    className="mt-1"
                    placeholder="+1 (555) 000-0000"
                    {...register("phone")}
                  />
                </div>

                <div>
                  <Label>Subject *</Label>
                  <Select onValueChange={(v) => setValue("subject", v)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a topic…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="booking">Booking inquiry</SelectItem>
                      <SelectItem value="modify">Modify / Cancel booking</SelectItem>
                      <SelectItem value="vehicle">Vehicle question</SelectItem>
                      <SelectItem value="billing">Billing & payments</SelectItem>
                      <SelectItem value="damage">Damage report</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.subject && (
                    <p className="mt-1 text-xs text-destructive">{errors.subject.message}</p>
                  )}
                </div>

                <div>
                  <Label>Message *</Label>
                  <Textarea
                    rows={5}
                    className="mt-1 resize-none"
                    placeholder="Tell us how we can help…"
                    {...register("message")}
                  />
                  {errors.message && (
                    <p className="mt-1 text-xs text-destructive">{errors.message.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full shadow-soft"
                  disabled={isSubmitting}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  By sending a message you agree to our Privacy Policy.
                </p>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
