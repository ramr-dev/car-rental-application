import * as React from "react";
import { useState } from "react";
import { DayButton, type DayPickerProps } from "react-day-picker";
import { format } from "date-fns";
import { CalendarDays, ChevronDown, Clock } from "lucide-react";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────

export interface BookedRange {
  startDate: string; // YYYY-MM-DD
  endDate:   string; // YYYY-MM-DD
}

interface Props {
  startDate:           string;  // YYYY-MM-DD or ""
  startTime:           string;  // HH:MM or ""
  endDate:             string;  // YYYY-MM-DD or ""
  endTime:             string;  // HH:MM or ""
  onStartDateChange:   (date: string) => void;
  onStartTimeChange:   (time: string) => void;
  onEndDateChange:     (date: string) => void;
  onEndTimeChange:     (time: string) => void;
  bookedRanges:        BookedRange[];
  startDateError?:     string;
  endDateError?:       string;
  startTimeError?:     string;
  endTimeError?:       string;
  rangeConflictError?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function toLocalDate(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toDateStr(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function isDateInRange(date: Date, ranges: BookedRange[]): boolean {
  return ranges.some((r) => {
    const s = toLocalDate(r.startDate);
    const e = toLocalDate(r.endDate);
    return date >= s && date <= e;
  });
}

function getMaxSelectableEndDate(
  startDate: Date,
  bookedRanges: BookedRange[],
): Date | undefined {
  let min: Date | undefined;
  for (const r of bookedRanges) {
    const rs = toLocalDate(r.startDate);
    if (rs > startDate) {
      if (!min || rs < min) min = rs;
    }
    const re = toLocalDate(r.endDate);
    if (startDate >= rs && startDate <= re && (!min || rs < min)) min = rs;
  }
  if (!min) return undefined;
  const cap = new Date(min);
  cap.setDate(cap.getDate() - 1);
  return cap;
}

// ─── Time slots ───────────────────────────────────────────────────────────

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

function formatTime12(t: string): string {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h < 12 ? "AM" : "PM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

// ─── Duration display ─────────────────────────────────────────────────────

function calcDurationLabel(
  startDate: string, startTime: string,
  endDate: string, endTime: string,
): string | null {
  if (!startDate || !startTime || !endDate || !endTime) return null;
  const start = new Date(`${startDate}T${startTime}`);
  const end   = new Date(`${endDate}T${endTime}`);
  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return null;
  const totalHours = diffMs / 3_600_000;
  const days  = Math.floor(totalHours / 24);
  const hours = Math.round(totalHours % 24);
  if (days === 0) return `${Math.round(totalHours)} hour${Math.round(totalHours) !== 1 ? "s" : ""}`;
  if (hours === 0) return `${days} day${days !== 1 ? "s" : ""}`;
  return `${days} day${days !== 1 ? "s" : ""} ${hours} hour${hours !== 1 ? "s" : ""}`;
}

// ─── Booked-day custom DayButton ──────────────────────────────────────────

type DayButtonProps = React.ComponentProps<typeof DayButton>;

function BookedAwareDayButton({
  className,
  day,
  modifiers,
  ...props
}: DayButtonProps) {
  if ((modifiers as Record<string, boolean>).booked) {
    return (
      <TooltipProvider delayDuration={80}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              role="button"
              aria-label={`${format(day.date, "MMMM d, yyyy")} — vehicle is booked`}
              aria-disabled="true"
              className="inline-flex aspect-square h-full w-full min-w-[var(--cell-size,2rem)] cursor-not-allowed items-center justify-center"
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md text-xs",
                  "bg-rose-50 text-rose-400 line-through",
                  "dark:bg-rose-950/60 dark:text-rose-500",
                )}
              >
                {day.date.getDate()}
              </span>
            </span>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-[160px] text-center text-[11px] leading-tight"
          >
            This vehicle is already booked for this date
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <CalendarDayButton
      className={className}
      day={day}
      modifiers={modifiers}
      {...props}
    />
  );
}

// ─── DateField ────────────────────────────────────────────────────────────

interface DateFieldProps {
  label:           string;
  value:           string;
  onChange:        (date: string) => void;
  error?:          string;
  bookedRanges:    BookedRange[];
  disabledAfter?:  Date;
  disabledBefore?: Date;
  defaultMonth?:   Date;
}

function DateField({
  label,
  value,
  onChange,
  error,
  bookedRanges,
  disabledAfter,
  disabledBefore,
  defaultMonth,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);

  const selected = value ? toLocalDate(value) : undefined;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const floor = disabledBefore ?? today;

  const bookedModifier = (date: Date) => isDateInRange(date, bookedRanges);

  const disabledMatcher: DayPickerProps["disabled"] = [
    { before: floor },
    ...(disabledAfter ? [{ after: disabledAfter }] : []),
    bookedModifier,
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-2 rounded-lg border bg-background px-3 py-2.5 text-left text-sm transition-colors",
            "hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            error
              ? "border-destructive text-destructive"
              : selected
              ? "border-border text-foreground"
              : "border-border text-muted-foreground",
          )}
        >
          <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate">
            {selected ? format(selected, "EEE, MMM d, yyyy") : label}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={defaultMonth ?? selected ?? floor}
          onSelect={(date) => {
            if (!date) return;
            onChange(toDateStr(date));
            setOpen(false);
          }}
          disabled={disabledMatcher}
          modifiers={{ booked: bookedModifier }}
          components={{ DayButton: BookedAwareDayButton }}
          initialFocus
        />
        <div className="flex items-center gap-3 border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded bg-rose-100 dark:bg-rose-950/60" />
            Already booked
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded bg-primary/20" />
            Selected
          </span>
        </div>
      </PopoverContent>

      {error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}
    </Popover>
  );
}

// ─── TimeField ────────────────────────────────────────────────────────────

interface TimeFieldProps {
  label:     string;
  value:     string;  // HH:MM
  onChange:  (time: string) => void;
  error?:    string;
  disabled?: boolean;
}

function TimeField({ label, value, onChange, error, disabled }: TimeFieldProps) {
  return (
    <div>
      <Select value={value || ""} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          className={cn(
            "w-full",
            error ? "border-destructive" : "",
          )}
        >
          <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {TIME_SLOTS.map((t) => (
            <SelectItem key={t} value={t}>
              {formatTime12(t)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ─── Exported component ───────────────────────────────────────────────────

export function BookingDatePicker({
  startDate,
  startTime,
  endDate,
  endTime,
  onStartDateChange,
  onStartTimeChange,
  onEndDateChange,
  onEndTimeChange,
  bookedRanges,
  startDateError,
  endDateError,
  startTimeError,
  endTimeError,
  rangeConflictError,
}: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parsedStart = startDate ? toLocalDate(startDate) : undefined;

  const endDateCap = parsedStart
    ? getMaxSelectableEndDate(parsedStart, bookedRanges)
    : undefined;

  // Same-day returns are allowed; the 6-hour minimum is enforced by time validation.
  const endDateFloor = parsedStart ?? today;

  const durationLabel = calcDurationLabel(startDate, startTime, endDate, endTime);

  return (
    <div className="space-y-3">
      {/* ── Pickup ──────────────────────────────────────────────────── */}
      <div>
        <p className="mb-1.5 text-sm font-medium">Pickup Date & Time *</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <DateField
            label="Select pickup date"
            value={startDate}
            onChange={(date) => {
              onStartDateChange(date);
              if (endDate && toLocalDate(endDate) < toLocalDate(date)) {
                onEndDateChange("");
              }
            }}
            error={startDateError}
            bookedRanges={bookedRanges}
          />
          <TimeField
            label="Pickup time"
            value={startTime}
            onChange={onStartTimeChange}
            error={startTimeError}
            disabled={!startDate}
          />
        </div>
      </div>

      {/* ── Return ──────────────────────────────────────────────────── */}
      <div>
        <p className="mb-1.5 text-sm font-medium">Return Date & Time *</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <DateField
            label="Select return date"
            value={endDate}
            onChange={onEndDateChange}
            error={endDateError}
            bookedRanges={bookedRanges}
            disabledBefore={endDateFloor}
            disabledAfter={endDateCap}
            defaultMonth={parsedStart ?? undefined}
          />
          <TimeField
            label="Return time"
            value={endTime}
            onChange={onEndTimeChange}
            error={endTimeError}
            disabled={!endDate}
          />
        </div>
      </div>

      {rangeConflictError && (
        <p className="text-xs text-destructive">{rangeConflictError}</p>
      )}

      <p className="text-xs text-muted-foreground">
        {durationLabel
          ? `${durationLabel} selected · minimum rental is 6 hours`
          : "Minimum rental period is 6 hours · same-day returns allowed"}
      </p>
    </div>
  );
}
