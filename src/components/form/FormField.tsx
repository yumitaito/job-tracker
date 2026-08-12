import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

/** ラベル・必須バッジ・エラーメッセージ付きのフォーム項目ラッパー（認証系フォーム共通） */
export function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && (
          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-bold text-destructive">
            必須
          </span>
        )}
      </Label>
      {children}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
