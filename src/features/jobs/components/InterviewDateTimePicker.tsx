import { useMemo, useState } from "react";
import { CalendarIcon, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  buildTimeSelectOptions,
  combineDateTimeLocalParts,
  formatDateDisplay,
  formatLocalDateString,
  parseLocalDateString,
  splitDateTimeLocalValue,
} from "@/features/jobs/lib/datetime";
import { cn } from "@/lib/utils";

type InterviewDateTimePickerProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  /** 一覧向け: 1ボタン + Popover 内で日付・時間を選択 */
  variant?: "default" | "inline";
  compact?: boolean;
  showLabels?: boolean;
  className?: string;
  triggerClassName?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
};

function formatInlineDisplay(datePart: string, timePart: string): string {
  if (datePart && timePart) {
    return `${formatDateDisplay(datePart)} ${timePart}`;
  }
  if (datePart) {
    return formatDateDisplay(datePart);
  }
  return "日時を選択";
}

type PickerPanelProps = {
  selectedDate: Date | undefined;
  datePart: string;
  timePart: string;
  timeOptions: string[];
  timeTriggerId?: string;
  showTimeSelect?: boolean;
  onDateSelect: (date: Date | undefined) => void;
  onTimeChange: (time: string) => void;
  onClear: () => void;
};

function PickerPanel({
  selectedDate,
  datePart,
  timePart,
  timeOptions,
  timeTriggerId,
  showTimeSelect = false,
  onDateSelect,
  onTimeChange,
  onClear,
}: PickerPanelProps) {
  return (
    <div className="w-auto">
      <Calendar mode="single" selected={selectedDate} onSelect={onDateSelect} initialFocus />
      {showTimeSelect ? (
        <div className="space-y-3 border-t border-border px-3 py-3">
          <div className="space-y-1.5">
            <Label htmlFor={timeTriggerId}>時間</Label>
            <Select
              value={timePart || undefined}
              onValueChange={onTimeChange}
              disabled={!datePart}
            >
              <SelectTrigger id={timeTriggerId} className="h-9 rounded-xl">
                <span className="flex items-center gap-2">
                  <Clock3 className="size-4 text-muted-foreground" />
                  <SelectValue placeholder="時間を選択" />
                </span>
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {timeOptions.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(datePart || timePart) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-full text-xs text-muted-foreground"
              onClick={onClear}
            >
              日時をクリア
            </Button>
          )}
        </div>
      ) : (
        (datePart || timePart) && (
          <div className="border-t border-border px-3 py-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-full text-xs text-muted-foreground"
              onClick={onClear}
            >
              日時をクリア
            </Button>
          </div>
        )
      )}
    </div>
  );
}

export function InterviewDateTimePicker({
  id,
  value,
  onChange,
  onBlur,
  disabled,
  variant = "default",
  compact = false,
  showLabels = true,
  className,
  triggerClassName,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
}: InterviewDateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const syncKey = value;
  const initialParts = splitDateTimeLocalValue(value);
  const [datePart, setDatePart] = useState(initialParts.date);
  const [timePart, setTimePart] = useState(initialParts.time);
  const [prevSyncKey, setPrevSyncKey] = useState(syncKey);

  if (prevSyncKey !== syncKey) {
    setPrevSyncKey(syncKey);
    const nextParts = splitDateTimeLocalValue(value);
    setDatePart(nextParts.date);
    setTimePart(nextParts.time);
  }

  const selectedDate = parseLocalDateString(datePart);
  const timeOptions = useMemo(() => buildTimeSelectOptions(timePart), [timePart]);
  const isInline = variant === "inline";

  const emitChange = (nextDate: string, nextTime: string) => {
    onChange(combineDateTimeLocalParts(nextDate, nextTime));
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    const nextDate = formatLocalDateString(date);
    setDatePart(nextDate);
    emitChange(nextDate, timePart);
    if (!isInline) {
      setOpen(false);
      onBlur?.();
    }
  };

  const handleTimeChange = (nextTime: string) => {
    setTimePart(nextTime);
    emitChange(datePart, nextTime);
    if (isInline) {
      setOpen(false);
    }
    onBlur?.();
  };

  const handleClear = () => {
    setDatePart("");
    setTimePart("");
    onChange("");
    setOpen(false);
    onBlur?.();
  };

  const dateTriggerId = id ? `${id}-date` : undefined;
  const timeTriggerId = id ? `${id}-time` : undefined;
  const inlineTriggerId = id;
  const controlHeight = compact ? "h-8 text-xs" : isInline ? "h-9 text-sm" : "h-11 text-sm";
  const iconSize = compact || isInline ? "size-3.5" : "size-4";

  if (isInline) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={inlineTriggerId}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-label={ariaLabel}
            aria-invalid={ariaInvalid}
            className={cn(
              "w-full min-w-[9.5rem] justify-start rounded-xl border-input bg-white font-normal shadow-xs hover:bg-white",
              controlHeight,
              "px-3",
              !datePart && !timePart && "text-muted-foreground",
              triggerClassName,
              className,
            )}
          >
            <CalendarIcon className={cn(iconSize, "shrink-0 text-muted-foreground")} />
            <span className="truncate">{formatInlineDisplay(datePart, timePart)}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <PickerPanel
            selectedDate={selectedDate}
            datePart={datePart}
            timePart={timePart}
            timeOptions={timeOptions}
            timeTriggerId={timeTriggerId}
            showTimeSelect
            onDateSelect={handleDateSelect}
            onTimeChange={handleTimeChange}
            onClear={handleClear}
          />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", className)}>
      <div className={cn(showLabels && "space-y-1.5")}>
        {showLabels ? <Label htmlFor={dateTriggerId}>日付</Label> : null}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id={dateTriggerId}
              type="button"
              variant="outline"
              disabled={disabled}
              aria-label={ariaLabel ? `${ariaLabel}の日付` : undefined}
              aria-invalid={ariaInvalid}
              className={cn(
                "w-full justify-start rounded-xl border-input bg-white font-normal shadow-xs hover:bg-white",
                controlHeight,
                "px-3.5",
                !datePart && "text-muted-foreground",
                triggerClassName,
              )}
            >
              <CalendarIcon className={cn(iconSize, "text-muted-foreground")} />
              <span className="truncate">
                {datePart ? formatDateDisplay(datePart) : "日付を選択"}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <PickerPanel
              selectedDate={selectedDate}
              datePart={datePart}
              timePart={timePart}
              timeOptions={timeOptions}
              onDateSelect={handleDateSelect}
              onTimeChange={handleTimeChange}
              onClear={handleClear}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className={cn(showLabels && "space-y-1.5")}>
        {showLabels ? <Label htmlFor={timeTriggerId}>時間</Label> : null}
        <Select
          value={timePart || undefined}
          onValueChange={handleTimeChange}
          disabled={disabled || !datePart}
        >
          <SelectTrigger
            id={timeTriggerId}
            aria-label={ariaLabel ? `${ariaLabel}の時間` : undefined}
            aria-invalid={ariaInvalid}
            className={cn("rounded-xl", controlHeight, compact && "px-2.5")}
          >
            <span className="flex min-w-0 items-center gap-1.5">
              <Clock3 className={cn(iconSize, "shrink-0 text-muted-foreground")} />
              <SelectValue placeholder="時間を選択" />
            </span>
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {timeOptions.map((time) => (
              <SelectItem key={time} value={time}>
                {time}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
