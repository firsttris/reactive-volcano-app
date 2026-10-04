import {
  type Accessor,
  createContext,
  createEffect,
  createSignal,
  type JSX,
  useContext,
} from "solid-js";

/**
 * How much glow and motion the app shows. Set per device in the settings:
 * an old phone may want less than a desktop.
 */
export type EffectsLevel = "off" | "subtle" | "strong";

export const EFFECTS_LEVELS: EffectsLevel[] = ["off", "subtle", "strong"];

const STORAGE_KEY = "effects";

const readLevel = (): EffectsLevel => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return EFFECTS_LEVELS.includes(stored as EffectsLevel)
      ? (stored as EffectsLevel)
      : "subtle";
  } catch {
    return "subtle";
  }
};

interface EffectsContextType {
  level: Accessor<EffectsLevel>;
  setLevel: (level: EffectsLevel) => void;
}

const EffectsContext = createContext<EffectsContextType>();

/** Mirrors the level to <html data-effects>, which the fx: variants read */
export const EffectsProvider = (props: { children: JSX.Element }) => {
  const [level, setLevel] = createSignal(readLevel());

  createEffect(() => {
    document.documentElement.dataset.effects = level();
    try {
      localStorage.setItem(STORAGE_KEY, level());
    } catch {
      // Storage can be unavailable (private mode); the level is then lost
    }
  });

  return (
    <EffectsContext.Provider value={{ level, setLevel }}>
      {props.children}
    </EffectsContext.Provider>
  );
};

export const useEffects = () => {
  const context = useContext(EffectsContext);
  if (!context)
    throw new Error("useEffects must be used within EffectsProvider");
  return context;
};
