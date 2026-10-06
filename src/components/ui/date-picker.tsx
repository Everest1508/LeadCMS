import * as React from 'react';
import { CalendarDays, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar, type DateRange } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

const fmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
export const formatDate = (d: Date) => fmt.format(d);

const trigger =
  'group flex h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-left text-sm outline-none transition-[border,box-shadow] hover:border-muted-foreground/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-50 data-[state=open]:border-ring data-[state=open]:ring-3 data-[state=open]:ring-ring/15 aria-[invalid=true]:border-destructive';

interface PickerProps<V> {
  value?: V;
  onChange?: (value: V | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Return true for days that cannot be picked. */
  disabledDays?: (date: Date) => boolean;
  clearable?: boolean;
  className?: string;
  id?: string;
}

function Shell({
  label,
  empty,
  onClear,
  disabled,
  className,
  id,
  children,
  open,
  setOpen,
}: {
  label: string;
  empty: boolean;
  onClear?: () => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  children: React.ReactNode;
  open: boolean;
  setOpen: (o: boolean) => void;
}) {
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative">
        <PopoverTrigger asChild>
          <button id={id} type="button" disabled={disabled} className={cn(trigger, onClear && !empty && 'pr-9', className)}>
            <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
            <span className={cn('flex-1 truncate', empty && 'text-muted-foreground/70')}>{label}</span>
          </button>
        </PopoverTrigger>
        {onClear && !empty && (
          <button
            type="button"
            aria-label="Clear date"
            onClick={onClear}
            className="absolute right-2 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      <PopoverContent align="start" className="w-auto p-3">
        {children}
      </PopoverContent>
    </Popover>
  );
}

export function DatePicker({ value, onChange, placeholder = 'Pick a date', disabled, disabledDays, clearable, className, id }: PickerProps<Date>) {
  const [open, setOpen] = React.useState(false);
  return (
    <Shell
      open={open}
      setOpen={setOpen}
      id={id}
      disabled={disabled}
      className={className}
      empty={!value}
      label={value ? formatDate(value) : placeholder}
      onClear={clearable ? () => onChange?.(undefined) : undefined}
    >
      <Calendar
        selected={value}
        disabled={disabledDays}
        onSelect={(d) => {
          onChange?.(d);
          if (d) setOpen(false);
        }}
      />
    </Shell>
  );
}

export function DateRangePicker({ value, onChange, placeholder = 'Pick a date range', disabled, disabledDays, clearable, className, id }: PickerProps<DateRange>) {
  const [open, setOpen] = React.useState(false);
  const label = value?.from ? (value.to ? `${formatDate(value.from)} to ${formatDate(value.to)}` : `${formatDate(value.from)} to ...`) : placeholder;
  return (
    <Shell
      open={open}
      setOpen={setOpen}
      id={id}
      disabled={disabled}
      className={className}
      empty={!value?.from}
      label={label}
      onClear={clearable ? () => onChange?.(undefined) : undefined}
    >
      <Calendar
        mode="range"
        selected={value}
        disabled={disabledDays}
        onSelect={(r) => {
          onChange?.(r);
          if (r.from && r.to) setOpen(false);
        }}
      />
    </Shell>
  );
}
