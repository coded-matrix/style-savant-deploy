"use client";

import type { ReactNode } from "react";
import { Construction } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ComingSoonPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Construction className="h-5 w-5 text-mid-grey dark:text-white/60" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-mid-grey dark:text-white/60">
          This feature is being wired to the new Express backend. The previous
          local prototype endpoints have been retired; the replacement
          endpoints (vendor analytics, tokens) are queued for the next phase.
        </p>
        {children ? <div className="mt-4">{children}</div> : null}
      </CardContent>
    </Card>
  );
}