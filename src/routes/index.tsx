import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";

import { generateContent } from "@/lib/api/content.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OnePost — Write once. Publish everywhere." },
      {
        name: "description",
        content:
          "Paste your content, choose your audience, and get a LinkedIn post, tweets, email newsletter, and video script — in seconds.",
      },
      { property: "og:title", content: "OnePost — Write once. Publish everywhere." },
      {
        property: "og:description",
        content:
          "Turn one piece of long-form content into a LinkedIn post, tweets, newsletter and video script instantly.",
      },
    ],
  }),
  component: OnePost,
});

type Outputs = {
  linkedin: string;
  newsletter: string;
  tweets: string[];
  videoScript: string;
};

function OnePost() {
  const [dark, setDark] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [audience, setAudience] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [outputs, setOutputs] = useState<Outputs | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [dark]);

  useEffect(() => {
    if (!loading) return;
    setProgress(8);
    const id = setInterval(() => {
      setProgress((p) => (p < 90 ? p + Math.random() * 8 : p));
    }, 300);
    return () => clearInterval(id);
  }, [loading]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError(null);
    setOutputs(null);

    try {
      const data = await generateContent({ data: { title, content, audience } });
      setOutputs(normalize(data));
      setProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setTimeout(() => setLoading(false), 250);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <button
          type="button"
          onClick={() => setDark((d) => !d)}
          aria-label="Toggle dark mode"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:bg-accent"
        >
          {dark ? <SunIcon /> : <MoonIcon />}
        </button>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24">
        <section className="pt-10 pb-12 text-center md:pt-16 md:pb-16">
          <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
            Write once.
            <br />
            <span className="text-primary">Publish everywhere.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
            Paste your content, choose your audience, and get a LinkedIn post, tweets, email
            newsletter, and video script — in seconds.
          </p>
        </section>

        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8"
        >
          <div className="space-y-5">
            <Field label="Content Title">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. The future of remote work"
                className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </Field>
            <Field label="Long-form Content">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                placeholder="Paste your article, essay, or notes here..."
                className="w-full resize-y rounded-lg border border-input bg-background px-4 py-3 text-sm leading-relaxed outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                style={{ minHeight: 200 }}
              />
            </Field>
            <Field label="Target Audience">
              <input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                required
                placeholder="e.g. Startup founders and product designers"
                className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="relative w-full overflow-hidden rounded-lg bg-primary px-6 py-3.5 font-display text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-12px_color-mix(in_oklab,var(--color-primary)_70%,transparent)] transition hover:opacity-95 disabled:cursor-not-allowed"
            >
              <span className="relative z-10">
                {loading ? "Generating content…" : "Generate content"}
              </span>
              {loading && (
                <span
                  className="absolute inset-y-0 left-0 progress-stripe transition-[width] duration-300"
                  style={{ width: `${progress}%` }}
                  aria-hidden
                />
              )}
            </button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </form>

        {outputs && (
          <section className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2">
            <OutputCard
              title="LinkedIn Post"
              text={outputs.linkedin}
              delay={0}
            />
            <OutputCard
              title="Email Newsletter"
              text={outputs.newsletter}
              delay={150}
            />

            <div
              className="md:col-span-2 rounded-2xl border border-border bg-card p-6 opacity-0 animate-fade-in"
              style={{ animationDelay: "300ms", animationFillMode: "forwards" }}
            >
              <div className="mb-5 flex items-center justify-between">
                <Label>Tweets</Label>
                <CopyButton text={outputs.tweets.join("\n\n---\n\n")} label="Copy all" />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {outputs.tweets.map((t, i) => (
                  <div
                    key={i}
                    className="flex flex-col rounded-xl border border-border bg-background p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-display text-xs font-medium text-muted-foreground">
                        Tweet {i + 1}
                      </span>
                      <CopyButton text={t} small />
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                      {t}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <OutputCard
              title="Video Script"
              text={outputs.videoScript}
              delay={450}
              fullWidth
            />
          </section>
        )}
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} OnePost — Write once. Publish everywhere.
      </footer>
    </div>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <span className="font-display text-2xl font-bold tracking-tight">
        <span className="text-primary">One</span>
        <span className="text-foreground">Post</span>
      </span>
      <span className="rounded-md bg-primary/10 px-1.5 py-0.5 font-display text-[10px] font-semibold uppercase tracking-wider text-primary">
        AI
      </span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block font-display text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2 w-2 rounded-full bg-primary" />
      <span className="font-display text-sm font-semibold text-foreground">{children}</span>
    </div>
  );
}

function OutputCard({
  title,
  text,
  delay,
  fullWidth,
}: {
  title: string;
  text: string;
  delay: number;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-card p-6 opacity-0 animate-fade-in ${
        fullWidth ? "md:col-span-2" : ""
      }`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      <div className="mb-4 flex items-center justify-between">
        <Label>{title}</Label>
        <CopyButton text={text} />
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{text}</p>
    </div>
  );
}

function CopyButton({
  text,
  label = "Copy",
  small = false,
}: {
  text: string;
  label?: string;
  small?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex items-center gap-1.5 rounded-md border border-border bg-background font-display font-medium text-muted-foreground transition hover:border-primary hover:text-primary ${
        small ? "px-2 py-1 text-[11px]" : "px-3 py-1.5 text-xs"
      }`}
    >
      {copied ? "Copied" : label}
    </button>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function normalize(data: any): Outputs {
  return {
    linkedin: data.linkedin ?? data.linkedinPost ?? "",
    newsletter: data.newsletter ?? data.email ?? "",
    tweets: Array.isArray(data.tweets) ? data.tweets : [],
    videoScript: data.videoScript ?? data.video ?? data.script ?? "",
  };
}
