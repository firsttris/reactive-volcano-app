import {
  createContext,
  createSignal,
  type JSX,
  onCleanup,
  Show,
  useContext,
} from "solid-js";

const TOAST_DURATION_MS = 5000;

interface ToastOptions {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

const ToastContext = createContext<(options: ToastOptions) => void>();

/** Shows one short message at a time, optionally with an action (e.g. undo) */
export const ToastProvider = (props: { children: JSX.Element }) => {
  const [toast, setToast] = createSignal<ToastOptions>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => clearTimeout(timer));

  const show = (options: ToastOptions) => {
    clearTimeout(timer);
    setToast(options);
    timer = setTimeout(() => setToast(undefined), TOAST_DURATION_MS);
  };

  const runAction = () => {
    const current = toast();
    clearTimeout(timer);
    setToast(undefined);
    current?.onAction?.();
  };

  return (
    <ToastContext.Provider value={show}>
      {props.children}
      <Show when={toast()}>
        {(current) => (
          <div
            role="status"
            class="fade-in-0 slide-in-from-bottom-4 fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] left-1/2 z-40 flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 animate-in items-center gap-4 rounded-2xl border bg-popover py-3 pr-3 pl-4 text-popover-foreground text-sm shadow-2xl"
          >
            <span>{current().message}</span>
            <Show when={current().actionLabel}>
              <button
                type="button"
                class="h-8 shrink-0 rounded-lg px-3 font-semibold text-primary transition-colors hover:bg-primary-soft"
                onClick={runAction}
              >
                {current().actionLabel}
              </button>
            </Show>
          </div>
        )}
      </Show>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
};
