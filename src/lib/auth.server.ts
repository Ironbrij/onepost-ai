import { createRemoteJWKSet, jwtVerify } from "jose";

// Verifies Firebase ID tokens without the firebase-admin SDK, which needs
// Node APIs (net/crypto internals) that aren't available on Cloudflare
// Workers. Instead we verify the JWT signature directly against Google's
// published JWKS for Firebase's token-signing service — this only needs
// fetch + Web Crypto, both available on Workers. See:
// https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library

const JWKS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
const ISSUER_PREFIX = "https://securetoken.google.com/";

// Module-scope cache is safe (unlike process.env) — the Worker isolate
// persists this across requests, and createRemoteJWKSet has its own
// internal cache/cooldown for re-fetching keys.
let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

function getJwks() {
  jwks ??= createRemoteJWKSet(new URL(JWKS_URL));
  return jwks;
}

export type VerifiedUser = { uid: string; email?: string };

export async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedUser> {
  // Read inside the function, not at module scope — on Cloudflare Workers
  // env binds at request time (see config.server.ts).
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error(
      "FIREBASE_PROJECT_ID is not configured on the server. Set it alongside the VITE_FIREBASE_* variables, then redeploy.",
    );
  }

  const { payload } = await jwtVerify(idToken, getJwks(), {
    issuer: `${ISSUER_PREFIX}${projectId}`,
    audience: projectId,
  });

  if (typeof payload.sub !== "string" || !payload.sub) {
    throw new Error("Invalid Firebase ID token: missing subject.");
  }

  return {
    uid: payload.sub,
    email: typeof payload.email === "string" ? payload.email : undefined,
  };
}
