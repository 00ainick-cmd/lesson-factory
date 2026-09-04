import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "@/server/auth/rbac";
import { OpError } from "@/server/lesson/ops";
import { logger } from "@/server/log";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

/** Wrap a route handler: maps domain errors to HTTP responses and logs unexpected failures. */
export function handle<T extends unknown[]>(fn: (...args: T) => Promise<Response>) {
  return async (...args: T): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof AuthError) return json({ error: e.message }, { status: e.status });
      if (e instanceof ApiError) return json({ error: e.message, details: e.details }, { status: e.status });
      if (e instanceof ZodError) return json({ error: "Invalid request", details: e.issues }, { status: 400 });
      if (e instanceof OpError) return json({ error: e.message }, { status: 422 });
      const message = e instanceof Error ? e.message : String(e);
      logger.error("api_unhandled", { message, stack: e instanceof Error ? e.stack : undefined });
      return json({ error: "Internal error" }, { status: 500 });
    }
  };
}

export async function readJson<T>(req: Request, schema: { parse: (v: unknown) => T }): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError(400, "Body must be JSON");
  }
  return schema.parse(body);
}

export type Params<K extends string> = { params: Promise<Record<K, string>> };
