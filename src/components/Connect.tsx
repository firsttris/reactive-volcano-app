import { BsBluetooth } from "solid-icons/bs";
import { ConnectionState, DeviceType } from "../utils/uuids";
import { Show, createEffect } from "solid-js";
import { BlinkingSquares } from "./volcano/BlinkingSquares";
import { styled } from "solid-styled-components";
import { useBluetooth } from "../provider/BluetoothProvider";
import { useNavigate } from "@solidjs/router";
import { buildRoute } from "../routes";
import { useTranslations } from "../i18n/utils";

const Centered = styled("div")`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding: 20px;
`;

const ConnectButton = styled("button")`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  padding: 30px;
  border: 3px solid var(--accent-color);
  background: transparent;
  border-radius: 20px;
  cursor: pointer;
  color: var(--accent-color);
  font-size: 18px;
  font-weight: bold;
  transition: all 0.3s ease;
  min-width: 200px;

  &:hover {
    background-color: var(--accent-color);
    color: var(--text-color);
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(246, 96, 0, 0.3);
  }
`;

const Title = styled("h2")`
  color: var(--text-color);
  margin-bottom: 10px;
  text-align: center;
`;

const Subtitle = styled("p")`
  color: var(--secondary-text);
  text-align: center;
  max-width: 400px;
  line-height: 1.5;
`;

const LoadingContainer = styled("div")`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 40px;
`;

const LoadingSubtitle = styled("p")`
  margin-top: 35px;
`;

export const Connect = () => {
  const { connect, connectionState, deviceInfo } = useBluetooth();
  const navigate = useNavigate();
  const t = useTranslations();

  const isConnecting = () => connectionState() === ConnectionState.CONNECTING;
  const isConnected = () => connectionState() === ConnectionState.CONNECTED;
  const isNotConnected = () => {
    return (
      connectionState() === ConnectionState.NOT_CONNECTED ||
      connectionState() === ConnectionState.CONNECTION_FAILED
    );
  };

  const getDeviceTypeText = () => {
    const device = deviceInfo();
    switch (device.type) {
      case DeviceType.VOLCANO:
        return "Volcano Hybrid";
      case DeviceType.VEAZY:
        return "Veazy";
      case DeviceType.VENTY:
        return "Venty";
      default:
        return "Storz & Bickel Device";
    }
  };

  // Navigate to device-specific route when connected
  createEffect(() => {
    if (isConnected()) {
      const device = deviceInfo();
      switch (device.type) {
        case DeviceType.VOLCANO:
          navigate(buildRoute.volcanoRoot());
          break;
        case DeviceType.VENTY:
        case DeviceType.VEAZY:
          navigate(buildRoute.ventyVeazyRoot());
          break;
        case DeviceType.CRAFTY:
          navigate(buildRoute.craftyRoot());
          break;
        default:
          // Stay on connect page if device type is unknown
          break;
      }
    }
  });

  return (
    <>
      <Show when={isNotConnected()}>
        <Centered>
          <Title>{t("connectYourDevice")}</Title>
          <Subtitle>{t("appSupportsDevices")}</Subtitle>
          <ConnectButton onClick={connect}>
            <BsBluetooth size="64px" />
            {t("connectDevice")}
          </ConnectButton>
        </Centered>
      </Show>

      <Show when={isConnecting()}>
        <Centered>
          <LoadingContainer>
            <BlinkingSquares />
            <LoadingSubtitle>
              {t("connectingTo")} {getDeviceTypeText()}...
            </LoadingSubtitle>
          </LoadingContainer>
        </Centered>
      </Show>
    </>
  );
};
