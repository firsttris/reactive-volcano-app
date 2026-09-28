import { useNavigate } from "@solidjs/router";
import { type Component, createEffect, Show } from "solid-js";
import { styled } from "solid-styled-components";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { DeviceInfo } from "../components/veazy-venty/DeviceInfo";
import { Settings } from "../components/veazy-venty/Settings";
import { Temperature } from "../components/veazy-venty/Temperature";
import { useTranslations } from "../i18n/utils";
import { useBluetooth } from "../provider/BluetoothProvider";
import {
  useVentyVeazy,
  VentyVeazyProvider,
} from "../provider/VentyVeazyProvider";
import { ConnectionState } from "../utils/uuids";

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
  border: 1px solid
    ${(props) =>
      props.charging ? "var(--accent-color)" : "var(--border-color)"};
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

const FindMyContainer = styled("div")`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px 0;
  text-align: center;
  color: var(--text-color);
`;

const FindMyTitle = styled("h3")`
  color: var(--accent-color);
  font-family: CustomFont;
  margin: 0;
`;

const FindMyHint = styled("div")`
  color: var(--secondary-text);
  font-size: 0.9rem;
  max-width: 320px;
`;

const FindMyButton = styled(Button)`
  width: 200px;
`;

/**
 * Shown while the device is switched off in find-my mode: it can only be
 * made to beep until it is switched on again (like the legacy app).
 */
const FindMyDeviceBanner: Component = () => {
  const { actions } = useVentyVeazy();
  const t = useTranslations();

  return (
    <Card>
      <FindMyContainer>
        <FindMyTitle>{t("findMyDeviceEnabled")}</FindMyTitle>
        <FindMyButton type="button" onClick={actions.triggerFindMyDevice}>
          {t("findMyDevice")}
        </FindMyButton>
        <FindMyHint>{t("findMyDeviceSwitchOnHint")}</FindMyHint>
      </FindMyContainer>
    </Card>
  );
};

const VentyVeazyViewContent: Component = () => {
  const { state } = useVentyVeazy();
  const t = useTranslations();

  return (
    <Show when={!state.findMyDeviceActive} fallback={<FindMyDeviceBanner />}>
      {/* Main Controls */}
      <div>
        <div style={{ "margin-top": "20px", "margin-bottom": "20px" }}>
          <Temperature />
        </div>

        {/* Battery Level Display */}
        <BatteryContainer>
          <BatteryLabel>
            {t("battery")}: {state.status?.batteryLevel ?? 0}%{" "}
            {state.status?.isCharging ? t("charging") : ""}
          </BatteryLabel>
          <BatteryBar charging={state.status?.isCharging ?? false}>
            <BatteryFill
              level={state.status?.batteryLevel ?? 0}
              charging={state.status?.isCharging ?? false}
            />
          </BatteryBar>
        </BatteryContainer>

        {/* Settings */}
        <Settings />
        <DeviceInfo />
      </div>
    </Show>
  );
};

export const VentyVeazyView: Component = () => {
  const navigate = useNavigate();
  const { connectionState } = useBluetooth();

  // Redirect to connect page if not connected (the provider renders nothing
  // without a connected device, so this must live outside of it)
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
    <VentyVeazyProvider>
      <VentyVeazyViewContent />
    </VentyVeazyProvider>
  );
};
