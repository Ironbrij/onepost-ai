import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Calls the n8n "Content Repurposing Engine" webhook server-side.
// Why server-side instead of fetching from the browser:
//   - No CORS configuration needed on the n8n Webhook node at all.
//   - The n8n webhook URL never ships in the client bundle (view-source
//     won't reveal your backend infrastructure to a prospective client).
// Set N8N_WEBHOOK_URL in Cloudflare Pages → Settings → Environment
// Variables (Production AND Preview). Do NOT prefix it with VITE_ —
// that prefix would expose it to the client bundle.

const inputSchema = z.object({
  title: z.string().min(1, "Content title is required"),
  content: z.string().min(1, "Long-form content is required"),
  audience: z.string().min(1, "Target audience is required"),
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
        "Content Title": data.title,
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
      tweets: [result.tweet_1, result.tweet_2, result.tweet_3].filter(
        (t): t is string => Boolean(t),
      ),
      videoScript: result.video_script ?? "",
    };
  });
