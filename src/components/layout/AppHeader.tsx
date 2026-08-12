import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthProvider";
import scribbleGreen from "@/assets/decorations/shape_scribble_green.png";
import ovalPink from "@/assets/decorations/decor_oval_scribble_pink.png";

export function AppHeader({ leading }: { leading?: ReactNode }) {
  const { user } = useAuth();

  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-end gap-4">
        <Link to="/jobs" className="relative flex items-start">
          <span className="text-2xl leading-[1.05] font-black tracking-tight text-foreground">
            Job
            <br />
            Tracker
          </span>
          {!leading && (
            <>
              <img
                src={scribbleGreen}
                alt=""
                aria-hidden
                className="absolute -top-1 left-[52px] h-5 w-auto -rotate-6"
              />
              <img
                src={ovalPink}
                alt=""
                aria-hidden
                className="absolute top-1 -right-9 h-6 w-auto rotate-6"
              />
            </>
          )}
        </Link>
        {leading ? <div className="mb-0.5">{leading}</div> : null}
      </div>

      {user && (
        <Link
          to="/settings"
          aria-label="設定"
          title="設定"
          className="flex size-10 items-center justify-center rounded-full border border-border bg-white text-foreground transition-colors hover:bg-muted"
        >
          <Settings className="size-4" />
        </Link>
      )}
    </header>
  );
}
