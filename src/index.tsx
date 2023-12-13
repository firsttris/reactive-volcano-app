import { render } from "solid-js/web";
import { BluetoothProvider } from "./provider/BluetoothProvider";
import { CharacteristicsProvider } from "./provider/CharacteristicsProvider";
import { DarkModeProvider } from "./provider/DarkModeProvider";
import "./css/main.css";
import "@fontsource/roboto";
import { WorkflowProvider } from "./provider/WorkflowProvider";
import { Routes } from "./Router";

const root = document.getElementById("root");


render(
  () => (
    <DarkModeProvider>
      <BluetoothProvider>
        <CharacteristicsProvider>
          <WorkflowProvider>
            <Routes/>
          </WorkflowProvider>
        </CharacteristicsProvider>
      </BluetoothProvider>
    </DarkModeProvider>
  ),
  root!
);
