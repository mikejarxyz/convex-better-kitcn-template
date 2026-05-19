"use client";

import { Fragment } from "react";
import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
import { LayoutDashboardIcon } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const staticLabels: Record<string, string> = {
  account: "Account",
};

export function AppBreadcrumbs() {
  const segments = useSelectedLayoutSegments();
  const entries = buildBreadcrumbEntries(segments);

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="min-w-0 flex-nowrap">
        {entries.map((entry, index) => {
          const isCurrent = index === entries.length - 1;

          return (
            <Fragment key={entry.href}>
              {index > 0 ? <BreadcrumbSeparator /> : null}
              <BreadcrumbItem className="min-w-0">
                {isCurrent ? (
                  <BreadcrumbPage className="inline-flex min-w-0 items-center gap-1 truncate">
                    {entry.isDashboardRoot ? (
                      <LayoutDashboardIcon className="size-4 shrink-0 md:hidden" />
                    ) : null}
                    <span className="truncate">{entry.label}</span>
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={entry.href} className="inline-flex items-center gap-1">
                      {entry.isDashboardRoot ? (
                        <LayoutDashboardIcon className="size-4 shrink-0 md:hidden" />
                      ) : null}
                      <span className={entry.isDashboardRoot ? "hidden md:inline" : undefined}>
                        {entry.label}
                      </span>
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function buildBreadcrumbEntries(segments: string[]) {
  const entries = [
    {
      href: "/app",
      label: "Dashboard",
      isDashboardRoot: true,
    },
  ];

  let href = "/app";
  for (const segment of segments) {
    href = `${href}/${segment}`;
    entries.push({
      href,
      label: staticLabels[segment] ?? titleizeSegment(segment),
      isDashboardRoot: false,
    });
  }

  return entries;
}

function titleizeSegment(segment: string) {
  return decodeURIComponent(segment)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
