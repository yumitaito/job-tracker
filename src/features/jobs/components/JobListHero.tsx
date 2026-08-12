import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function JobListHero() {
  return (
    <section className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-start">
      <Button asChild size="lg" className="shrink-0">
        <Link to="/jobs/new">
          <Plus />
          求人を登録
        </Link>
      </Button>

      <div className="flex flex-col items-end gap-2 text-right">
        <h1 className="text-3xl leading-tight font-black text-foreground sm:text-4xl">
          チャンスを、逃さない
          <span className="relative inline-block text-secondary">
            自分
            <svg
              viewBox="0 0 100 16"
              className="absolute -bottom-1 left-0 h-3 w-full overflow-visible text-secondary"
              preserveAspectRatio="none"
              aria-hidden
            >
              <path
                d="M0 8 Q 10 3, 20 8 Q 30 13, 40 8 Q 50 3, 60 8 Q 70 13, 80 8 Q 90 3, 100 8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
          へ。
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          気になる求人を整理して、内定への一歩を着実に。
        </p>
      </div>
    </section>
  );
}
