import { useNavigate } from "@solidjs/router";
import { BsBluetooth } from "solid-icons/bs";
import { createEffect, createSignal, Match, Show, Switch } from "solid-js";
import { styled } from "solid-styled-components";
import { m } from "../paraglide/messages";
import { useBluetooth } from "../provider/BluetoothProvider";
import { buildRoute } from "../routes";
import { ConnectionState, DeviceType } from "../utils/uuids";
import { BlinkingSquares } from "./volcano/BlinkingSquares";

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

  @media (hover: hover) {
    &:hover {
      background-color: var(--accent-color);
      color: #fff;
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(246, 96, 0, 0.3);
    }
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

const TROUBLESHOOTING_URL =
  "https://github.com/firsttris/reactive-volcano-app#-no-devices-found-troubleshooting-with-bluetooth-internals";

const Notice = styled("div")`
  max-width: 400px;
  width: 100%;
  box-sizing: border-box;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--accent-color);
  background: var(--secondary-bg);
  color: var(--text-color);
  line-height: 1.5;

  strong {
    display: block;
    margin-bottom: 4px;
  }

  ul {
    margin: 8px 0;
    padding-left: 20px;
    color: var(--secondary-text);
  }

  a {
    color: var(--accent-color);
  }
`;

// Browsers refuse to open chrome:// URLs from a web page, so we can only
// offer to copy it for pasting into the address bar.
const BLUETOOTH_FLAG_URL = "chrome://flags/#enable-web-bluetooth";

const isChromium = () =>
  typeof navigator !== "undefined" && /Chrome\//.test(navigator.userAgent);

const FlagHint = styled("div")`
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--secondary-text);

  code {
    word-break: break-all;
    color: var(--text-color);
  }
`;

const CopyButton = styled("button")`
  align-self: flex-start;
  padding: 8px 14px;
  border: 1px solid var(--accent-color);
  border-radius: 8px;
  background: transparent;
  color: var(--accent-color);
  font-weight: bold;
  cursor: pointer;
`;

const ErrorDetail = styled("div")`
  font-size: 0.85rem;
  color: var(--secondary-text);
  word-break: break-word;
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
  const { connect, connectionState, connectionError, deviceInfo } =
    useBluetooth();
  const navigate = useNavigate();

  const isConnecting = () => connectionState() === ConnectionState.CONNECTING;
  const isConnected = () => connectionState() === ConnectionState.CONNECTED;
  const isNotConnected = () => {
    return (
      connectionState() === ConnectionState.NOT_CONNECTED ||
      connectionState() === ConnectionState.CONNECTION_FAILED
    );
  };

  const isBluetoothSupported = () =>
    typeof navigator !== "undefined" && "bluetooth" in navigator;

  const [flagUrlCopied, setFlagUrlCopied] = createSignal(false);
  const copyFlagUrl = async () => {
    try {
      await navigator.clipboard.writeText(BLUETOOTH_FLAG_URL);
      setFlagUrlCopied(true);
    } catch (error) {
      console.error("Copying flag URL failed:", error);
    }
  };

  const errorMessage = () => {
    const error = connectionError();
    return error?.kind === "failed" ? error.message : undefined;
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
          <Title>{m.connect_title()}</Title>
          <Subtitle>{m.connect_intro()}</Subtitle>
          <Switch>
            <Match when={!isBluetoothSupported()}>
              <Notice role="alert">
                <strong>{m.connect_unsupported()}</strong>
                {m.connect_unsupportedHint()}
                <Show when={isChromium()}>
                  <FlagHint>
                    {m.connect_flagHint()}
                    <code>{BLUETOOTH_FLAG_URL}</code>
                    <CopyButton onClick={copyFlagUrl}>
                      {flagUrlCopied()
                        ? m.common_copied()
                        : m.connect_copyFlagUrl()}
                    </CopyButton>
                  </FlagHint>
                </Show>
              </Notice>
            </Match>
            <Match when={connectionError()}>
              {(error) => (
                <Notice role="alert">
                  <strong>
                    {error().kind === "lost"
                      ? m.connect_lost()
                      : m.connect_failed()}
                  </strong>
                  <Show when={errorMessage()}>
                    <ErrorDetail>{errorMessage()}</ErrorDetail>
                  </Show>
                  <ul>
                    <li>{m.connect_tips_deviceOn()}</li>
                    <li>{m.connect_tips_otherConnection()}</li>
                    <li>{m.connect_tips_bluetoothEnabled()}</li>
                  </ul>
                  <a href={TROUBLESHOOTING_URL} target="_blank" rel="noopener">
                    {m.connect_tips_more()}
                  </a>
                </Notice>
              )}
            </Match>
          </Switch>
          <ConnectButton onClick={connect}>
            <BsBluetooth size="64px" />
            {m.connect_button()}
          </ConnectButton>
        </Centered>
      </Show>

      <Show when={isConnecting()}>
        <Centered>
          <LoadingContainer>
            <BlinkingSquares />
            <LoadingSubtitle>
              {m.connect_connectingTo({ device: getDeviceTypeText() })}
            </LoadingSubtitle>
          </LoadingContainer>
        </Centered>
      </Show>
    </>
  );
};
