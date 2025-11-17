import { Component, createEffect } from "solid-js";
import { styled } from "solid-styled-components";
import { useNavigate } from "@solidjs/router";
import { Temperature } from "../components/crafty/Temperature";
import { HeaterControl } from "../components/crafty/HeaterControl";
import { Settings } from "../components/crafty/Settings";
import { useBluetooth } from "../provider/BluetoothProvider";
import { ConnectionState } from "../utils/uuids";
import { buildRoute } from "../routes";
import { CraftyDeviceProvider } from "../provider/CraftyDeviceProvider";

const MainCard = styled("div")`
  background: var(--secondary-bg);
  border-radius: 16px;
  padding: 24px;
  margin: 20px auto;
  border: 1px solid var(--border-color);
  max-width: 600px;
`;

const CraftyViewContent: Component = () => {
  console.log("Crafty View: Rendering Crafty view");
  const navigate = useNavigate();
  const { connectionState } = useBluetooth();

  // Redirect to connect page if not connected
  createEffect(() => {
    const state = connectionState();
    if (
      state === ConnectionState.NOT_CONNECTED ||
      state === ConnectionState.CONNECTION_FAILED
    ) {
      navigate(buildRoute.root());
    }
  });

  return (
    <>
      {/* Main Controls */}
      <MainCard>
        <div style={{ "margin-bottom": "24px" }}>
          <Temperature />
        </div>
        <HeaterControl />
      </MainCard>

      {/* Settings */}
      <Settings />
    </>
  );
};

export const CraftyView: Component = () => {
  return (
    <CraftyDeviceProvider>
      <CraftyViewContent />
    </CraftyDeviceProvider>
  );
};
