import Link from "next/link";

import { AppMark } from "@/components/app-mark";
import { Button } from "@/components/ui/button";
import { APP_DESCRIPTION, APP_NAME } from "@/config/app-shell";
import { ROUTES } from "@/lib/constants/routes";

export default function Home() {
  return (
    <main className="flex min-h-svh flex-col bg-background">
      <header className="flex h-16 items-center justify-between border-b px-6">
        <div className="flex items-center gap-3">
          <AppMark />
          <span className="font-medium">{APP_NAME}</span>
        </div>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href={ROUTES.AUTH.SIGN_IN}>Sign in</Link>
          </Button>
          <Button asChild>
            <Link href={ROUTES.APP.ROOT}>Open app</Link>
          </Button>
        </nav>
      </header>
      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-8 px-6 py-16">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-semibold tracking-tight">{APP_NAME}</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            {APP_DESCRIPTION}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={ROUTES.AUTH.SIGN_UP}>Create account</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href={ROUTES.AUTH.SIGN_IN}>Sign in</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
