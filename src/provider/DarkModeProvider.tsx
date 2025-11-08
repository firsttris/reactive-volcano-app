import {
  Component,
  createContext,
  createEffect,
  createSignal,
  onMount,
  useContext,
} from "solid-js";
import type { Accessor, JSX } from "solid-js";

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
    const isDarkMode = stored === null ? false : stored === "true";
    toggleDarkMode(isDarkMode);
  });

  createEffect(() => {
    localStorage.setItem("isDarkModeVReverse", isDarkMode() ? "true" : "false");
  });

  const toggleDarkMode = (iOn: boolean) => {
    setIsDarkMode(iOn);
    if (iOn) {
      document.documentElement.classList.add("dark-mode");
    } else {
      document.documentElement.classList.remove("dark-mode");
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
    throw new Error("useStore must be used within a StoreProvider");
  }
  return useContext(DarkModeContext);
};
