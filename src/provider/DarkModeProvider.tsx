import type { Accessor, JSX } from "solid-js";
import {
  type Component,
  createContext,
  createEffect,
  createSignal,
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

export const DarkModeProvider: Component<DarkModeProviderProps> = (props) => {
  const [isDarkMode, setIsDarkMode] = createSignal(false);

  onMount(() => {
    const stored = localStorage.getItem("isDarkModeVReverse");
    // Without a stored choice, follow the system setting
    const isDarkMode =
      stored === null
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
        : stored === "true";
    toggleDarkMode(isDarkMode);
  });

  createEffect(() => {
    localStorage.setItem("isDarkModeVReverse", isDarkMode() ? "true" : "false");
  });

  const toggleDarkMode = (iOn: boolean) => {
    setIsDarkMode(iOn);
    document.documentElement.classList.toggle("dark", iOn);
    // Lets the browser chrome (address bar, status bar) match the page
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", iOn ? THEME_COLOR_DARK : THEME_COLOR_LIGHT);
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
    throw new Error("useStore must be used within a StoreProvider");
  }
  return useContext(DarkModeContext);
};
