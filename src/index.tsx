import { render } from "solid-js/web";
import { BluetoothProvider } from "./provider/BluetoothProvider";
import { DarkModeProvider } from "./provider/DarkModeProvider";
import { ToastProvider } from "./provider/ToastProvider";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./css/main.css";
import { getLocale } from "./paraglide/runtime";
import { Routes } from "./Router";

const root = document.getElementById("root");
if (!root) throw new Error("Root element #root not found");
document.documentElement.lang = getLocale();

const dispose = render(
  () => (
    <DarkModeProvider>
      <ToastProvider>
        <BluetoothProvider>
          <Routes />
        </BluetoothProvider>
      </ToastProvider>
    </DarkModeProvider>
  ),
  root
);
/** Hot Module Replacement */
if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(dispose);
}
