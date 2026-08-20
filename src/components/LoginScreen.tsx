import { useState } from "react";

import { AuthPanel } from "@/components/AuthPanel";

const FEATURES = [
  "Paste any article, essay, or notes",
  "Get a LinkedIn post, tweets, newsletter, and video script",
  "Tailored to your target audience, every time",
];

export function LoginScreen({ loading }: { loading: boolean }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-primary px-10 py-12 text-primary-foreground md:flex lg:px-16">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 font-display text-lg font-bold">
              O
            </div>
            <span className="font-display text-xl font-bold">OnePost</span>
          </div>

          <h1 className="mt-16 font-display text-4xl font-semibold leading-tight tracking-tight lg:text-5xl">
            Write once.
            <br />
            Publish everywhere.
          </h1>
          <p className="mt-6 max-w-md text-base text-primary-foreground/80">
            Paste your content, choose your audience, and get a LinkedIn post, tweets, email
            newsletter, and video script — in seconds.
          </p>
        </div>

        <ul className="space-y-4">
          {FEATURES.map((feature) => (
            <li key={feature} className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15">
                <CheckIcon />
              </span>
              <span className="text-sm text-primary-foreground/90">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col items-center justify-center bg-background px-6 py-16">
        {loading ? (
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground shadow-sm">
            Loading…
          </div>
        ) : (
          <>
            <AuthPanel mode={mode} />
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
                className="font-medium text-primary hover:underline"
              >
                {mode === "signin" ? "Create one" : "Sign in"}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
