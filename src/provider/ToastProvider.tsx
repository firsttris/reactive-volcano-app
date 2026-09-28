import {
  createContext,
  createSignal,
  type JSX,
  onCleanup,
  Show,
  useContext,
} from "solid-js";
import { styled } from "solid-styled-components";

const TOAST_DURATION_MS = 5000;

interface ToastOptions {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

const ToastContext = createContext<(options: ToastOptions) => void>();

const ToastBox = styled("div")`
  position: fixed;
  left: 50%;
  bottom: calc(88px + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: calc(100vw - 32px);
  box-sizing: border-box;
  padding: 12px 16px;
  border-radius: 12px;
  background: #323232;
  color: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
`;

const ActionButton = styled("button")`
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: var(--accent-color);
  font-weight: 700;
  text-transform: uppercase;
  cursor: pointer;
  padding: 4px;
`;

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
          <ToastBox role="status">
            <span>{current().message}</span>
            <Show when={current().actionLabel}>
              <ActionButton type="button" onClick={runAction}>
                {current().actionLabel}
              </ActionButton>
            </Show>
          </ToastBox>
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
