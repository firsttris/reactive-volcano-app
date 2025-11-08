import { render } from "solid-js/web";
import { BluetoothProvider } from "./provider/BluetoothProvider";
import { DarkModeProvider } from "./provider/DarkModeProvider";
import "./css/main.css";
import "@fontsource/roboto";
import { Routes } from "./Router";

const root = document.getElementById("root");

const dispose = render(
  () => (
    <DarkModeProvider>
      <BluetoothProvider>
        <Routes />
      </BluetoothProvider>
    </DarkModeProvider>
  ),
  root!
);
/** Hot Module Replacement */
if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(dispose);
}
