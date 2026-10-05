import type { Accessor, JSX } from "solid-js";
import {
  type Component,
  createContext,
  createSignal,
  onCleanup,
  onMount,
  useContext,
} from "solid-js";

const THEME_COLOR_LIGHT = "#fafafa";
const THEME_COLOR_DARK = "#09090b";

interface DarkModeContextType {
  isDarkMode: Accessor<boolean>;
  toggleDarkMode: (iOn: boolean) => void;
}

const DarkModeContext = createContext<DarkModeContextType>({
  isDarkMode: () => false,
  toggleDarkMode: () => {},
});

interface DarkModeProviderProps {
  children: JSX.Element;
}

const STORAGE_KEY = "isDarkModeVReverse";

const readStoredChoice = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? undefined : stored === "true";
  } catch {
    return undefined;
  }
};

/**
 * Follows the system setting until the user picks a theme with the toggle;
 * from then on their choice is kept. index.html applies it before the first
 * paint, so there is no flash.
 */
export const DarkModeProvider: Component<DarkModeProviderProps> = (props) => {
  const [isDarkMode, setIsDarkMode] = createSignal(
    document.documentElement.classList.contains("dark")
  );

  const apply = (iOn: boolean) => {
    setIsDarkMode(iOn);
    document.documentElement.classList.toggle("dark", iOn);
    // Lets the browser chrome (address bar, status bar) match the page
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", iOn ? THEME_COLOR_DARK : THEME_COLOR_LIGHT);
  };

  onMount(() => {
    const system = window.matchMedia("(prefers-color-scheme: dark)");
    apply(readStoredChoice() ?? system.matches);
    const followSystem = (event: MediaQueryListEvent) => {
      if (readStoredChoice() === undefined) apply(event.matches);
    };
    system.addEventListener("change", followSystem);
    onCleanup(() => system.removeEventListener("change", followSystem));
  });

  /** The user's choice, kept from now on */
  const toggleDarkMode = (iOn: boolean) => {
    apply(iOn);
    try {
      localStorage.setItem(STORAGE_KEY, iOn ? "true" : "false");
    } catch {
      // Without storage the choice lasts until the page is closed
    }
  };

  return (
    <DarkModeContext.Provider
      value={{ isDarkMode: isDarkMode, toggleDarkMode }}
    >
      {props.children}
    </DarkModeContext.Provider>
  );
};

export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (context === undefined) {
    throw new Error("useDarkMode must be used within a DarkModeProvider");
  }
  return useContext(DarkModeContext);
};
