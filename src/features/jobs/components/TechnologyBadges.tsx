import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function TechnologyBadges({
  technologies,
  className,
}: {
  technologies: string[] | null;
  className?: string;
}) {
  if (!technologies || technologies.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {technologies.map((tech) => (
        <Badge key={tech} variant="tech">
          {tech}
        </Badge>
      ))}
    </div>
  );
}
