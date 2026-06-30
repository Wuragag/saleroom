import { NextResponse } from "next/server";
import { PlanLimitError } from "@/lib/plan-limits";

// ---- Types ----

interface ApiErrorResponse {
  error: string;
  code?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteHandler = (...args: any[]) => Promise<NextResponse>;

// ---- Prisma error detection (duck-typing to avoid build-time import issues) ----

interface PrismaKnownError {
  name: string;
  code: string;
  meta?: unknown;
}

function isPrismaKnownError(err: unknown): err is PrismaKnownError {
  return (
    err instanceof Error &&
    err.name === "PrismaClientKnownRequestError" &&
    "code" in err &&
    typeof (err as PrismaKnownError).code === "string"
  );
}

function isPrismaValidationError(err: unknown): boolean {
  return err instanceof Error && err.name === "PrismaClientValidationError";
}

// ---- Prisma error mapping ----

function mapPrismaError(
  err: unknown
): { status: number; message: string; code?: string } | null {
  if (isPrismaKnownError(err)) {
    switch (err.code) {
      case "P2002":
        return {
          status: 409,
          message: "A record with this value already exists",
          code: "UNIQUE_VIOLATION",
        };
      case "P2025":
        return { status: 404, message: "Record not found", code: "NOT_FOUND" };
      case "P2003":
        return {
          status: 409,
          message: "Related record not found",
          code: "FK_VIOLATION",
        };
      case "P2014":
        return {
          status: 400,
          message: "Required relation violation",
          code: "RELATION_VIOLATION",
        };
      default:
        return {
          status: 500,
          message: "Database error",
          code: `PRISMA_${err.code}`,
        };
    }
  }
  if (isPrismaValidationError(err)) {
    return {
      status: 400,
      message: "Invalid data provided",
      code: "VALIDATION_ERROR",
    };
  }
  return null;
}

// ---- The wrapper ----

export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (request: Request, ...rest: unknown[]) => {
    try {
      return await handler(request, ...rest);
    } catch (err) {
      const pathname = new URL(request.url).pathname;

      // 0. Plan-limit violations thrown by the atomic *Tx asserts
      if (err instanceof PlanLimitError) {
        return NextResponse.json(
          {
            error: err.message,
            code: err.code,
            current: err.current,
            limit: err.limit,
          },
          { status: 403 }
        );
      }

      // 1. Prisma errors
      const prismaError = mapPrismaError(err);
      if (prismaError) {
        console.error(
          `[API ${request.method} ${pathname}] Prisma ${prismaError.code}:`,
          err
        );
        return NextResponse.json(
          {
            error: prismaError.message,
            code: prismaError.code,
          } satisfies ApiErrorResponse,
          { status: prismaError.status }
        );
      }

      // 2. JSON parse errors (from request.json())
      if (err instanceof SyntaxError && err.message.includes("JSON")) {
        return NextResponse.json(
          {
            error: "Invalid JSON in request body",
          } satisfies ApiErrorResponse,
          { status: 400 }
        );
      }

      // 3. Everything else
      console.error(`[API ${request.method} ${pathname}] Unhandled:`, err);
      return NextResponse.json(
        {
          error: "Something went wrong. Please try again.",
        } satisfies ApiErrorResponse,
        { status: 500 }
      );
    }
  };
}

// ---- Safe JSON parser ----

export async function safeJson<T = unknown>(
  request: Request
): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
