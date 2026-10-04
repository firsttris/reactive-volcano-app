import type { Component } from "solid-js";
import { HeatAndPump } from "../components/volcano/HeatAndPump";
import { ShutdownTime } from "../components/volcano/ShutdownTime";
import { Temperature } from "../components/volcano/Temperature";

export const VolcanoView: Component = () => {
  return (
    <>
      <ShutdownTime />
      <Temperature />
      <HeatAndPump />
    </>
  );
};
