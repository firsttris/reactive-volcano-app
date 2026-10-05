import Download from "lucide-solid/icons/download";
import Ellipsis from "lucide-solid/icons/ellipsis";
import History from "lucide-solid/icons/rotate-ccw-clock";
import Trash from "lucide-solid/icons/trash";
import { createMemo, createSignal, For, type JSX, Show } from "solid-js";
import { PageTitle } from "../components/DeviceShell";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { m } from "../paraglide/messages";
import { getLocale } from "../paraglide/runtime";
import { useHistory } from "../provider/HistoryProvider";
import { useTemperatureFormat } from "../provider/LiveSessionProvider";
import {
  type Session,
  sessionsToCsv,
  summarize,
} from "../utils/sessionHistory";

/** "45 s", "12 min" or "1 h 05 min" */
const formatLength = (seconds: number) => {
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")} min`;
};

/** Short form for the stat tiles: "45 s", "12 min", "1:05 h" */
const formatCompact = (seconds: number) => {
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")} h`;
};

const dayKey = (time: number) => new Date(time).toDateString();

const dayLabel = (time: number) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (dayKey(time) === today.toDateString()) return m.history_today();
  if (dayKey(time) === yesterday.toDateString()) return m.history_yesterday();
  return new Intl.DateTimeFormat(getLocale(), {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(time);
};

const timeLabel = (time: number) =>
  new Intl.DateTimeFormat(getLocale(), {
    hour: "2-digit",
    minute: "2-digit",
  }).format(time);

const downloadCsv = (sessions: Session[]) => {
  const blob = new Blob([sessionsToCsv(sessions)], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `sessions_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

/** Small curve of one session, scaled to its own range */
const Sparkline = (props: { samples: [number, number][] }) => {
  const path = () => {
    const points = props.samples;
    if (points.length < 2) return "";
    const duration = points[points.length - 1][0] || 1;
    const temps = points.map(([, temp]) => temp);
    const min = Math.min(...temps);
    const span = Math.max(Math.max(...temps) - min, 10);
    return points
      .map(
        ([second, temp], i) =>
          `${i === 0 ? "M" : "L"}${((second / duration) * 76 + 2).toFixed(1)},${(26 - ((temp - min) / span) * 22).toFixed(1)}`
      )
      .join(" ");
  };
  return (
    <svg viewBox="0 0 80 28" class="h-7 w-20 shrink-0" aria-hidden="true">
      <path
        d={path()}
        fill="none"
        stroke="var(--primary)"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};

const StatTile = (props: { label: string; children: JSX.Element }) => (
  <Card class="flex flex-col gap-1 p-3.5">
    <span class="whitespace-nowrap font-semibold text-xl tabular-nums tracking-tight">
      {props.children}
    </span>
    <span class="text-[11px] text-muted-foreground leading-tight">
      {props.label}
    </span>
  </Card>
);

const SessionRow = (props: { session: Session }) => {
  const formatTemp = useTemperatureFormat();
  return (
    <li class="flex items-center gap-3 px-4 py-3">
      <div class="flex min-w-0 flex-1 flex-col gap-1">
        <div class="flex items-baseline gap-2">
          <span class="font-semibold text-sm tabular-nums">
            {timeLabel(props.session.startedAt)}
          </span>
          <span class="truncate text-muted-foreground text-xs">
            {props.session.device}
          </span>
        </div>
        <div class="text-sm tabular-nums">
          {formatLength(props.session.durationSeconds)} ·{" "}
          {formatTemp(props.session.maxTarget)}
        </div>
        <div class="flex flex-wrap gap-x-2 text-muted-foreground text-xs tabular-nums">
          <Show when={props.session.heatUpSeconds !== null}>
            <span>
              {m.history_heatUp({
                duration: formatLength(props.session.heatUpSeconds ?? 0),
              })}
            </span>
          </Show>
          <Show when={props.session.peakTemp}>
            {(peak) => (
              <span>{m.history_peak({ temperature: formatTemp(peak()) })}</span>
            )}
          </Show>
          <Show when={props.session.pumpCycles > 0}>
            <span>
              {m.history_pumpCycles({ count: props.session.pumpCycles })}
            </span>
          </Show>
        </div>
      </div>
      <Sparkline samples={props.session.samples} />
    </li>
  );
};

export const HistoryView = () => {
  const history = useHistory();
  const [confirmClear, setConfirmClear] = createSignal(false);

  const summary = createMemo(() => summarize(history.sessions(), Date.now()));

  const days = createMemo(() => {
    const groups: { key: string; label: string; sessions: Session[] }[] = [];
    for (const session of history.sessions()) {
      const key = dayKey(session.startedAt);
      const group = groups.find((g) => g.key === key);
      if (group) group.sessions.push(session);
      else
        groups.push({
          key,
          label: dayLabel(session.startedAt),
          sessions: [session],
        });
    }
    return groups;
  });

  return (
    <>
      <PageTitle
        actions={
          <Show when={history.sessions().length > 0}>
            <DropdownMenu placement="bottom-end">
              <DropdownMenuTrigger
                as={Button}
                variant="outline"
                size="icon"
                class="text-muted-foreground"
                aria-label={m.history_actions()}
              >
                <Ellipsis />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onSelect={() => downloadCsv(history.sessions())}
                >
                  <Download />
                  {m.history_export()}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  class="text-destructive data-[highlighted]:text-destructive [&_svg]:text-destructive"
                  onSelect={() => setConfirmClear(true)}
                >
                  <Trash />
                  {m.history_clear()}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Show>
        }
      >
        {m.nav_history()}
      </PageTitle>

      <section class="flex flex-col gap-2">
        <h2 class="mx-1 font-medium text-muted-foreground text-xs uppercase tracking-[0.08em]">
          {m.history_lastWeek()}
        </h2>
        <div class="grid grid-cols-3 gap-2.5">
          <StatTile label={m.history_sessions()}>
            {summary().sessionsLastWeek}
          </StatTile>
          <StatTile label={m.history_heatingTime()}>
            {formatCompact(summary().secondsLastWeek)}
          </StatTile>
          <StatTile label={m.history_averageHeatUp()}>
            {summary().averageHeatUpSeconds === null
              ? "–"
              : formatCompact(summary().averageHeatUpSeconds ?? 0)}
          </StatTile>
        </div>
      </section>

      <Show
        when={days().length > 0}
        fallback={
          <div class="flex flex-col items-center gap-3 rounded-card border border-dashed px-6 py-12 text-center text-muted-foreground text-sm">
            <History class="size-6" />
            {m.history_empty()}
          </div>
        }
      >
        <For each={days()}>
          {(day) => (
            <section class="flex flex-col gap-2">
              <h2 class="mx-1 font-medium text-muted-foreground text-xs uppercase tracking-[0.08em]">
                {day.label}
              </h2>
              <Card class="overflow-hidden">
                <ul class="divide-y">
                  <For each={day.sessions}>
                    {(session) => <SessionRow session={session} />}
                  </For>
                </ul>
              </Card>
            </section>
          )}
        </For>
      </Show>

      <AlertDialog open={confirmClear()} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{m.history_clear()}</AlertDialogTitle>
            <AlertDialogDescription>
              {m.history_clearConfirm()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose variant="outline">
              {m.common_cancel()}
            </AlertDialogClose>
            <AlertDialogClose
              variant="destructive"
              onClick={() => history.clear()}
            >
              <Trash />
              {m.history_clear()}
            </AlertDialogClose>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
