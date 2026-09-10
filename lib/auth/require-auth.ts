import { cookies } from "next/headers";
import { SESSION_COOKIE, getUserFromToken } from "./session";

/**
 * Fixed version:
 * - Does NOT use redirect() in API routes (redirect throws NEXT_REDIRECT and causes 500)
 * - Returns user or null, letting API routes return 401 JSON
 * - For pages, caller can redirect if null
 */
export async function requireAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const user = await getUserFromToken(token);
  return user;
}

/**
 * Helper for API routes to get token from NextRequest cookies
 */
export async function requireAuthFromRequest(req: Request) {
  // Parse cookie header manually for NextRequest compatibility
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  const token = match ? decodeURIComponent(match[1]) : null;
  if (!token) return null;
  const user = await getUserFromToken(token);
  return user;
}
