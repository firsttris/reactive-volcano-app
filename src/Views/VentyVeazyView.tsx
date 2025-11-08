import { Component, createEffect } from "solid-js";
import { styled } from "solid-styled-components";
import { useNavigate } from "@solidjs/router";
import { Temperature } from "../components/veazy-venty/Temperature";
import { Settings } from "../components/veazy-venty/Settings";
import { useBluetooth } from "../provider/BluetoothProvider";
import { ConnectionState } from "../utils/uuids";
import {
  DeviceStatusProvider,
  useDeviceStatusContext,
} from "../provider/DeviceStatusProvider";
import { useTranslations } from "../i18n/utils";

const BatteryContainer = styled("div")`
  margin: 20px auto;
  max-width: 300px;
  padding: 16px;
`;

const BatteryLabel = styled("div")`
  color: var(--text-color);
  font-size: 0.9rem;
  margin-bottom: 8px;
  text-align: center;
`;

const BatteryBar = styled("div")<{ charging?: boolean }>`
  width: 100%;
  height: 20px;
  background: var(--secondary-bg);
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid ${(props) => (props.charging ? "var(--accent-color)" : "var(--border-color)")};
  box-shadow: ${(props) =>
    props.charging ? "0 0 8px rgba(255, 102, 0, 0.6)" : "none"};
  position: relative;

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 102, 0, 0.3),
      transparent
    );
    animation: ${(props) =>
      props.charging ? "charging-wave 2s ease-in-out infinite" : "none"};
  }

  @keyframes charging-wave {
    0% {
      left: -100%;
    }
    100% {
      left: 100%;
    }
  }
`;

const BatteryFill = styled("div")<{ level: number; charging?: boolean }>`
  height: 100%;
  width: ${(props) => props.level}%;
  background: ${(props) =>
    props.charging
      ? "var(--battery-charging)"
      : props.level > 50
        ? "var(--battery-good)"
        : props.level > 20
          ? "var(--battery-medium)"
          : "var(--battery-low)"};
  transition: width 0.3s ease;
  animation: ${(props) =>
    props.charging ? "charging-pulse 1.5s ease-in-out infinite" : "none"};

  @keyframes charging-pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }
`;

const VentyVeazyViewContent: Component = () => {
  const navigate = useNavigate();
  const { connectionState } = useBluetooth();
  const { status } = useDeviceStatusContext();
  const t = useTranslations();

  // Redirect to connect page if not connected
  createEffect(() => {
    const state = connectionState();
    if (
      state === ConnectionState.NOT_CONNECTED ||
      state === ConnectionState.CONNECTION_FAILED
    ) {
      navigate("/");
    }
  });

  return (
    <>
      {/* Main Controls */}
      <div>
        <div style={{ "margin-top": "20px", "margin-bottom": "20px" }}>
          <Temperature />
        </div>

        {/* Battery Level Display */}
        <BatteryContainer>
          <BatteryLabel>
            {t("battery")}: {status()?.batteryLevel ?? 0}%{" "}
            {status()?.isCharging ? "⚡ " + t("charging") : ""}
          </BatteryLabel>
          <BatteryBar charging={status()?.isCharging ?? false}>
            <BatteryFill
              level={status()?.batteryLevel ?? 0}
              charging={status()?.isCharging ?? false}
            />
          </BatteryBar>
        </BatteryContainer>

        {/* Settings */}
        <Settings />
      </div>
    </>
  );
};

export const VentyVeazyView: Component = () => {
  return (
    <DeviceStatusProvider>
      <VentyVeazyViewContent />
    </DeviceStatusProvider>
  );
};
