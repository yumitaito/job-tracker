import { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function TechnologyInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  const addTech = () => {
    const tech = draft.trim();
    if (tech.length === 0) return;
    if (value.includes(tech)) {
      setDraft("");
      return;
    }
    onChange([...value, tech]);
    setDraft("");
  };

  const removeTech = (tech: string) => {
    onChange(value.filter((t) => t !== tech));
  };

  return (
    <div className="space-y-2">
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTech();
          }
        }}
        onBlur={addTech}
        placeholder={placeholder ?? "例）React, TypeScript, AWS（Enterで追加）"}
      />
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tech) => (
            <Badge key={tech} variant="tech" className="pr-1">
              {tech}
              <button
                type="button"
                onClick={() => removeTech(tech)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-black/10"
                aria-label={`${tech}を削除`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
