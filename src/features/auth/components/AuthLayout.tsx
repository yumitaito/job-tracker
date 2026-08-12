import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function AuthLayout({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <span className="text-center text-2xl leading-[1.05] font-black tracking-tight text-foreground">
            Job
            <br />
            Tracker
          </span>
        </div>

        <Card>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-1 text-center">
              <h1 className="text-xl font-black text-foreground">{title}</h1>
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
