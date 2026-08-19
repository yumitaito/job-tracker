import { useRef, useState, type ReactNode } from "react";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TechnologyInput } from "@/features/jobs/components/TechnologyInput";
import { useFetchJobMetadata } from "@/features/jobs/hooks/use-fetch-job-metadata";
import type { JobMetadata } from "@/features/jobs/api/job-metadata-api";
import { STATUS_GROUPS } from "@/features/jobs/lib/job-status-groups";
import {
  jobFormSchema,
  type JobFormOutput,
  type JobFormValues,
} from "@/features/jobs/schemas/job-schema";
import { JOB_STATUS_LABELS, DESIRE_LEVELS, DESIRE_LEVEL_LABELS } from "@/features/jobs/types/job";

const EMPLOYMENT_TYPES = ["正社員", "契約社員", "業務委託", "インターン", "その他"];

const isLikelyUrl = (value: string) => {
  if (!value.trim()) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const EMPTY_VALUES: JobFormValues = {
  company_name: "",
  position: "",
  employment_type: "",
  application_url: "",
  application_date: "",
  status: "",
  desire_level: "medium",
  casual_interview_at: "",
  first_interview_at: "",
  second_interview_at: "",
  final_interview_at: "",
  casual_interview_url: "",
  first_interview_url: "",
  second_interview_url: "",
  final_interview_url: "",
  location: "",
  technologies: [],
  notes: "",
  min_salary: "",
  max_salary: "",
};

type JobFormProps = {
  defaultValues?: JobFormValues;
  onSubmit: (values: JobFormOutput) => void;
  submitLabel: string;
  onCancel: () => void;
  isSubmitting: boolean;
  submitError?: string | null;
};

export function JobForm({
  defaultValues,
  onSubmit,
  submitLabel,
  onCancel,
  isSubmitting,
  submitError,
}: JobFormProps) {
  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<JobFormValues, unknown, JobFormOutput>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: defaultValues ?? EMPTY_VALUES,
  });

  const submit: SubmitHandler<JobFormOutput> = (values) => onSubmit(values);

  const fetchMetadata = useFetchJobMetadata();
  const lastFetchedUrlRef = useRef<string | null>(null);
  const [autoFillMessage, setAutoFillMessage] = useState<string | null>(null);

  const applyMetadata = (meta: JobMetadata) => {
    const current = getValues();
    let filledCount = 0;

    const fillText = (name: "company_name" | "position" | "location", value?: string) => {
      if (value && !current[name]?.trim()) {
        setValue(name, value, { shouldDirty: true, shouldValidate: true });
        filledCount++;
      }
    };
    fillText("company_name", meta.company_name);
    fillText("position", meta.position);
    fillText("location", meta.location);

    if (
      meta.employment_type &&
      !current.employment_type &&
      EMPLOYMENT_TYPES.includes(meta.employment_type)
    ) {
      setValue("employment_type", meta.employment_type, { shouldDirty: true });
      filledCount++;
    }

    if (meta.technologies && meta.technologies.length > 0 && (current.technologies ?? []).length === 0) {
      setValue("technologies", meta.technologies, { shouldDirty: true });
      filledCount++;
    }

    if (meta.min_salary !== undefined && !current.min_salary) {
      setValue("min_salary", meta.min_salary, { shouldDirty: true });
      filledCount++;
    }
    if (meta.max_salary !== undefined && !current.max_salary) {
      setValue("max_salary", meta.max_salary, { shouldDirty: true });
      filledCount++;
    }

    setAutoFillMessage(
      filledCount > 0
        ? `${filledCount}件の項目を自動入力しました。内容をご確認ください。`
        : "自動入力できる情報が見つかりませんでした。手動で入力してください。",
    );
  };

  const runAutoFill = (url: string) => {
    if (!isLikelyUrl(url) || fetchMetadata.isPending) return;
    lastFetchedUrlRef.current = url;
    setAutoFillMessage(null);
    fetchMetadata.mutate(url, {
      onSuccess: applyMetadata,
      onError: (error) => setAutoFillMessage(error.message || "求人情報の取得に失敗しました。"),
    });
  };

  const { onBlur: rhfUrlOnBlur, ...urlField } = register("application_url");

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-8">
      <section className="space-y-4">
        <SectionHeading>基本情報</SectionHeading>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="企業名" required error={errors.company_name?.message}>
            <Input
              placeholder="例）株式会社サンプル"
              aria-invalid={Boolean(errors.company_name)}
              {...register("company_name")}
            />
          </Field>

          <Field label="職種" required error={errors.position?.message}>
            <Input
              placeholder="例）フロントエンドエンジニア"
              aria-invalid={Boolean(errors.position)}
              {...register("position")}
            />
          </Field>

          <Field label="雇用形態" error={errors.employment_type?.message}>
            <Controller
              control={control}
              name="employment_type"
              render={({ field }) => (
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger aria-invalid={Boolean(errors.employment_type)}>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="応募先URL" error={errors.application_url?.message}>
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="例）https://example.com/recruit"
                aria-invalid={Boolean(errors.application_url)}
                {...urlField}
                onBlur={(e) => {
                  rhfUrlOnBlur(e);
                  const url = e.target.value.trim();
                  if (url && url !== lastFetchedUrlRef.current) runAutoFill(url);
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="URLから空欄の項目を自動入力"
                aria-label="URLから空欄の項目を自動入力"
                disabled={fetchMetadata.isPending || !isLikelyUrl(getValues("application_url") ?? "")}
                onClick={() => runAutoFill((getValues("application_url") ?? "").trim())}
              >
                {fetchMetadata.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Wand2 />
                )}
              </Button>
            </div>
            {autoFillMessage && (
              <p className="text-xs text-muted-foreground">{autoFillMessage}</p>
            )}
          </Field>

          <Field label="応募日" error={errors.application_date?.message}>
            <Input
              type="date"
              aria-invalid={Boolean(errors.application_date)}
              {...register("application_date")}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="選考ステータス" required error={errors.status?.message}>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger aria-invalid={Boolean(errors.status)}>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_GROUPS.map((group, index) => (
                      <SelectGroup key={group.label}>
                        {index > 0 && <SelectSeparator />}
                        <SelectLabel>{group.label}</SelectLabel>
                        {group.statuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {JOB_STATUS_LABELS[status]}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field label="志望度" required error={errors.desire_level?.message}>
            <Controller
              control={control}
              name="desire_level"
              render={({ field }) => (
                <Select value={field.value ?? "medium"} onValueChange={field.onChange}>
                  <SelectTrigger aria-invalid={Boolean(errors.desire_level)}>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {DESIRE_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {DESIRE_LEVEL_LABELS[level]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Field label="カジュアル面接日時" error={errors.casual_interview_at?.message}>
              <Input
                type="datetime-local"
                aria-invalid={Boolean(errors.casual_interview_at)}
                {...register("casual_interview_at")}
              />
            </Field>
            <Field label="カジュアル面接URL" error={errors.casual_interview_url?.message}>
              <Input
                type="url"
                placeholder="例）https://zoom.us/j/..."
                aria-invalid={Boolean(errors.casual_interview_url)}
                {...register("casual_interview_url")}
              />
            </Field>
          </div>

          <div className="space-y-4">
            <Field label="一次面接日時" error={errors.first_interview_at?.message}>
              <Input
                type="datetime-local"
                aria-invalid={Boolean(errors.first_interview_at)}
                {...register("first_interview_at")}
              />
            </Field>
            <Field label="一次面接URL" error={errors.first_interview_url?.message}>
              <Input
                type="url"
                placeholder="例）https://zoom.us/j/..."
                aria-invalid={Boolean(errors.first_interview_url)}
                {...register("first_interview_url")}
              />
            </Field>
          </div>

          <div className="space-y-4">
            <Field label="二次面接日時" error={errors.second_interview_at?.message}>
              <Input
                type="datetime-local"
                aria-invalid={Boolean(errors.second_interview_at)}
                {...register("second_interview_at")}
              />
            </Field>
            <Field label="二次面接URL" error={errors.second_interview_url?.message}>
              <Input
                type="url"
                placeholder="例）https://zoom.us/j/..."
                aria-invalid={Boolean(errors.second_interview_url)}
                {...register("second_interview_url")}
              />
            </Field>
          </div>

          <div className="space-y-4">
            <Field label="最終面接日時" error={errors.final_interview_at?.message}>
              <Input
                type="datetime-local"
                aria-invalid={Boolean(errors.final_interview_at)}
                {...register("final_interview_at")}
              />
            </Field>
            <Field label="最終面接URL" error={errors.final_interview_url?.message}>
              <Input
                type="url"
                placeholder="例）https://zoom.us/j/..."
                aria-invalid={Boolean(errors.final_interview_url)}
                {...register("final_interview_url")}
              />
            </Field>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading>詳細情報</SectionHeading>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="勤務地" error={errors.location?.message}>
            <Input placeholder="例）東京都渋谷区" {...register("location")} />
          </Field>

          <Field label="最低年収" error={errors.min_salary?.message}>
            <SalaryInput aria-invalid={Boolean(errors.min_salary)} {...register("min_salary")} />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="使用技術" error={errors.technologies?.message}>
            <Controller
              control={control}
              name="technologies"
              render={({ field }) => (
                <TechnologyInput
                  value={field.value ?? []}
                  onChange={field.onChange}
                />
              )}
            />
          </Field>

          <Field label="最高年収" error={errors.max_salary?.message}>
            <SalaryInput aria-invalid={Boolean(errors.max_salary)} {...register("max_salary")} />
          </Field>
        </div>

        <Field label="メモ" error={errors.notes?.message}>
          <Textarea placeholder="自由にメモを入力してください" {...register("notes")} />
        </Field>
      </section>

      {submitError && (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col-reverse items-center justify-center gap-3 border-t border-border pt-6 sm:flex-row">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          キャンセル
        </Button>
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? "処理中..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
      <span className="inline-block h-4 w-1 rounded-full bg-secondary" />
      {children}
    </h2>
  );
}

function Field({
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

function SalaryInput(props: React.ComponentProps<"input">) {
  return <Input type="number" min={0} {...props} />;
}
