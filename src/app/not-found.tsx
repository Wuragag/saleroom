import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4 max-w-md px-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Page not found
        </h1>
        <p className="text-muted-foreground">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
