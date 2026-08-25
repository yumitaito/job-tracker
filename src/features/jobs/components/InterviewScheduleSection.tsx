import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Controller, useFieldArray, type Control, type FieldErrors, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InterviewDateTimePicker } from "@/features/jobs/components/InterviewDateTimePicker";
import { fromDateTimeLocalInputValue } from "@/features/jobs/lib/datetime";
import {
  canAddInterviewScheduleKind,
  createEmptyInterviewSchedule,
  getAvailableInterviewScheduleKinds,
  getInterviewScheduleLabel,
} from "@/features/jobs/lib/interview-schedules";
import type { JobFormValues } from "@/features/jobs/schemas/job-schema";
import {
  INTERVIEW_SCHEDULE_KIND_LABELS,
  type InterviewScheduleKind,
} from "@/features/jobs/types/interview-schedule";
import { formatDateTime } from "@/lib/format";

type InterviewScheduleSectionProps = {
  control: Control<JobFormValues>;
  errors: FieldErrors<JobFormValues>;
};

function formatSchedulePreview(scheduledAt: string): string {
  const iso = fromDateTimeLocalInputValue(scheduledAt) ?? scheduledAt;
  return formatDateTime(iso);
}

export function InterviewScheduleSection({ control, errors }: InterviewScheduleSectionProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "interview_schedules",
    keyName: "fieldKey",
  });
  const watchedValue = useWatch({ control, name: "interview_schedules" });
  const watchedSchedules = useMemo(() => watchedValue ?? [], [watchedValue]);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedKind, setSelectedKind] = useState<InterviewScheduleKind | "">("");

  const normalizedSchedules = useMemo(
    () =>
      watchedSchedules.map((schedule) => ({
        id: schedule.id,
        kind: schedule.kind as InterviewScheduleKind,
        custom_label: schedule.custom_label ?? null,
        scheduled_at: schedule.scheduled_at ?? null,
        url: schedule.url ?? null,
      })),
    [watchedSchedules],
  );

  const availableKinds = useMemo(
    () => getAvailableInterviewScheduleKinds(normalizedSchedules),
    [normalizedSchedules],
  );

  const handleAdd = () => {
    if (!selectedKind || !canAddInterviewScheduleKind(normalizedSchedules, selectedKind)) {
      return;
    }

    const schedule = createEmptyInterviewSchedule(selectedKind);
    append({
      id: schedule.id,
      kind: schedule.kind,
      custom_label: schedule.custom_label ?? "",
      scheduled_at: "",
      url: "",
    });
    setSelectedKind("");
    setIsAdding(false);
  };

  const scheduleErrors = errors.interview_schedules;

  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
        <span className="inline-block h-4 w-1 rounded-full bg-secondary" />
        選考スケジュール
      </h2>

      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          選考が決まったら「選考を追加」から登録してください。
        </p>
      ) : (
        <div className="space-y-4">
          {fields.map((field, index) => {
            const scheduleValue = watchedSchedules[index];
            const schedule = {
              id: scheduleValue?.id ?? field.id,
              kind: (scheduleValue?.kind ?? field.kind) as InterviewScheduleKind,
              custom_label: scheduleValue?.custom_label ?? null,
              scheduled_at: scheduleValue?.scheduled_at ?? null,
              url: scheduleValue?.url ?? null,
            };
            const label = getInterviewScheduleLabel(schedule);
            const itemErrors = Array.isArray(scheduleErrors)
              ? scheduleErrors[index]
              : undefined;

            return (
              <article
                key={field.fieldKey}
                className="rounded-xl border border-border bg-white p-4 shadow-xs"
              >
                <input type="hidden" {...control.register(`interview_schedules.${index}.id`)} />
                <input type="hidden" {...control.register(`interview_schedules.${index}.kind`)} />

                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-foreground">{label}</p>
                    {scheduleValue?.scheduled_at ? (
                      <p className="text-xs text-muted-foreground">
                        {formatSchedulePreview(scheduleValue.scheduled_at)}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label={`${label}を削除`}
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {schedule.kind === "other" ? (
                    <div className="space-y-1.5 md:col-span-2">
                      <Label htmlFor={`interview_schedules.${index}.custom_label`}>選考名</Label>
                      <Input
                        id={`interview_schedules.${index}.custom_label`}
                        placeholder="例）技術面接"
                        aria-invalid={Boolean(itemErrors?.custom_label)}
                        {...control.register(`interview_schedules.${index}.custom_label`)}
                      />
                      {itemErrors?.custom_label?.message ? (
                        <p className="text-xs font-medium text-destructive">
                          {itemErrors.custom_label.message}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor={`interview_schedules.${index}.scheduled_at`}>面接日時</Label>
                    <Controller
                      control={control}
                      name={`interview_schedules.${index}.scheduled_at`}
                      render={({ field }) => (
                        <InterviewDateTimePicker
                          id={`interview_schedules.${index}.scheduled_at`}
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          aria-invalid={Boolean(itemErrors?.scheduled_at)}
                        />
                      )}
                    />
                    {itemErrors?.scheduled_at?.message ? (
                      <p className="text-xs font-medium text-destructive">
                        {itemErrors.scheduled_at.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor={`interview_schedules.${index}.url`}>面接URL</Label>
                    <Input
                      id={`interview_schedules.${index}.url`}
                      type="url"
                      placeholder="例）https://zoom.us/j/..."
                      aria-invalid={Boolean(itemErrors?.url)}
                      {...control.register(`interview_schedules.${index}.url`)}
                    />
                    {itemErrors?.url?.message ? (
                      <p className="text-xs font-medium text-destructive">
                        {itemErrors.url.message}
                      </p>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {isAdding ? (
        <div className="flex w-fit max-w-full flex-col gap-2 rounded-lg border border-dashed border-border bg-muted/20 p-3 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
            <Label
              htmlFor="add-interview-kind"
              className="shrink-0 text-xs font-semibold text-muted-foreground"
            >
              追加する選考
            </Label>
            <Select
              value={selectedKind}
              onValueChange={(value) => setSelectedKind(value as InterviewScheduleKind)}
            >
              <SelectTrigger id="add-interview-kind" className="h-9 w-44">
                <SelectValue placeholder="選考を選択" />
              </SelectTrigger>
              <SelectContent>
                {availableKinds.map((kind) => (
                  <SelectItem key={kind} value={kind}>
                    {INTERVIEW_SCHEDULE_KIND_LABELS[kind]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsAdding(false)}>
              キャンセル
            </Button>
            <Button type="button" size="sm" disabled={!selectedKind} onClick={handleAdd}>
              追加
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          disabled={availableKinds.length === 0}
          onClick={() => setIsAdding(true)}
        >
          <Plus className="size-4" />
          選考を追加
        </Button>
      )}
    </section>
  );
}
