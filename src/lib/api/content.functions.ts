import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { verifyFirebaseIdToken } from "../auth.server";
import { checkRateLimit, peekRateLimit } from "../rate-limit.server";

// Calls the n8n "Content Repurposing Engine" webhook server-side.
// Why server-side instead of fetching from the browser:
//   - No CORS configuration needed on the n8n Webhook node at all.
//   - The n8n webhook URL never ships in the client bundle (view-source
//     won't reveal your backend infrastructure to a prospective client).
// Set N8N_WEBHOOK_URL in Cloudflare Pages → Settings → Environment
// Variables (Production AND Preview). Do NOT prefix it with VITE_ —
// that prefix would expose it to the client bundle.

export const GENERATE_LIMIT = 5;
const GENERATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const inputSchema = z.object({
  content: z.string().min(1, "Long-form content is required"),
  audience: z.string().min(1, "Target audience is required"),
  idToken: z.string().min(1, "Sign in is required"),
});

const statusInputSchema = z.object({
  idToken: z.string().min(1, "Sign in is required"),
});

// Read-only status check so the UI can show the user's true current
// standing (e.g. right after sign-in) without consuming a generation.
export const getGenerationStatus = createServerFn({ method: "POST" })
  .inputValidator(statusInputSchema)
  .handler(async ({ data }) => {
    let user: { uid: string };
    try {
      user = await verifyFirebaseIdToken(data.idToken);
    } catch {
      throw new Error("Your session has expired. Please sign in again.");
    }

    const rateLimit = peekRateLimit(user.uid, {
      limit: GENERATE_LIMIT,
      windowMs: GENERATE_WINDOW_MS,
    });
    return { remaining: rateLimit.remaining, limit: GENERATE_LIMIT };
  });

type N8nResponse = {
  linkedin_post?: string;
  tweet_1?: string;
  tweet_2?: string;
  tweet_3?: string;
  email_newsletter?: string;
  video_script?: string;
  generated_at?: string;
};

export const generateContent = createServerFn({ method: "POST" })
  .inputValidator(inputSchema)
  .handler(async ({ data }) => {
    let user: { uid: string };
    try {
      user = await verifyFirebaseIdToken(data.idToken);
    } catch {
      throw new Error("Your session has expired. Please sign in again.");
    }

    const rateLimit = checkRateLimit(user.uid, {
      limit: GENERATE_LIMIT,
      windowMs: GENERATE_WINDOW_MS,
    });
    if (!rateLimit.allowed) {
      const retryMinutes = Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 60_000));
      throw new Error(
        `You've reached the limit of ${GENERATE_LIMIT} generations per hour. Try again in ${retryMinutes} minute${retryMinutes === 1 ? "" : "s"}.`,
      );
    }

    // Per config.server.ts: on Cloudflare Workers, env binds at request
    // time, so this read must happen inside the handler, not at module
    // scope.
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!webhookUrl) {
      throw new Error(
        "N8N_WEBHOOK_URL is not configured on the server. Set it in Cloudflare Pages \u2192 Settings \u2192 Environment Variables, then redeploy.",
      );
    }

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        "Target Audience": data.audience,
        "Long-form Content": data.content,
      }),
    });

    if (!res.ok) {
      throw new Error(`n8n workflow request failed (${res.status})`);
    }

    const result: N8nResponse = await res.json();

    // Reshape n8n's field names into what the frontend's Outputs type
    // expects. n8n returns linkedin_post / tweet_1..3 / email_newsletter
    // / video_script — none of which match the frontend's keys directly.
    return {
      linkedin: result.linkedin_post ?? "",
      newsletter: result.email_newsletter ?? "",
      tweets: [result.tweet_1, result.tweet_2, result.tweet_3].filter((t): t is string =>
        Boolean(t),
      ),
      videoScript: result.video_script ?? "",
      rateLimit: { remaining: rateLimit.remaining, limit: GENERATE_LIMIT },
    };
  });
