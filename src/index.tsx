import { render } from "solid-js/web";
import { BluetoothProvider } from "./provider/BluetoothProvider";
import { CharacteristicsProvider } from "./provider/CharacteristicsProvider";
import { DarkModeProvider } from "./provider/DarkModeProvider";
import { Connect } from "./components/Connect/Connect";
import { App } from "./App";
import "./css/main.css";
import "@fontsource/roboto";

const root = document.getElementById("root");

const isProd = import.meta.env.MODE === "production";
render(
  () => (
    <DarkModeProvider>
      <BluetoothProvider>
        <CharacteristicsProvider>
          {isProd ? <Connect /> : <App />}
        </CharacteristicsProvider>
      </BluetoothProvider>
    </DarkModeProvider>
  ),
  root!
);
