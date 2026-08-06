import Image from "next/image";
import Link from "next/link";
import { Sparkles, ShieldCheck, FileText, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Tax Assistant",
    desc: "A scoped, cited assistant that drafts working papers and answers engagement questions grounded in your firm's own data.",
  },
  {
    icon: FileText,
    title: "Document Intelligence",
    desc: "Upload salary certificates, bank statements, and withholding certificates — Taxus extracts and structures the data for review.",
  },
  {
    icon: Workflow,
    title: "Practice Management",
    desc: "Clients, engagements, deadlines, and team workload in one system of record built for accounting firms.",
  },
  {
    icon: ShieldCheck,
    title: "Built for Compliance",
    desc: "Tenant-isolated by design, full audit trail, and role-based access control on every record.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 md:px-12">
        <div className="flex items-center gap-2">
          <Image src="/logo-taxus.png" alt="Taxus" width={36} height={36} />
          <span className="font-heading text-lg font-bold text-primary-900">Taxus</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-neutral-700 hover:text-primary-900">
            Log in
          </Link>
          <Link href="/signup">
            <Button size="sm">Start free</Button>
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <span className="mb-4 inline-block rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-900">
          AI-Powered Tax Practice Management
        </span>
        <h1 className="font-heading text-4xl font-bold leading-tight text-neutral-900 md:text-5xl">
          Run your tax practice with an AI assistant that actually knows your engagements.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-neutral-700">
          Taxus brings client management, document intelligence, and an AI Tax Assistant into one
          platform built for Pakistani chartered accountants and tax consultants.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/signup">
            <Button size="md">Create your firm&apos;s workspace</Button>
          </Link>
          <Link href="/login">
            <Button size="md" variant="secondary">
              Log in
            </Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-6 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-lg border border-neutral-200 p-6">
              <f.icon className="mb-3 h-6 w-6 text-primary-700" />
              <h3 className="font-heading font-semibold text-neutral-900">{f.title}</h3>
              <p className="mt-1 text-sm text-neutral-700">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-neutral-200 px-6 py-8 text-center">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 text-sm text-neutral-700 sm:flex-row sm:justify-between">
          <span>&copy; {new Date().getFullYear()} Taxus. All rights reserved.</span>
          <span className="flex items-center gap-2">
            A product by
            <Image src="/logo-halool.png" alt="HALOOL (Private) Limited" width={80} height={20} />
          </span>
        </div>
      </footer>
    </div>
  );
}
