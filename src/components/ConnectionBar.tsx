import {
  TbOutlineBluetoothConnected,
  TbOutlineBluetoothX,
} from "solid-icons/tb";
import { VsColorMode, VsLoading } from "solid-icons/vs";
import { createSignal, onCleanup, Show } from "solid-js";
import { styled } from "solid-styled-components";
import { m } from "../paraglide/messages";
import { useBluetooth } from "../provider/BluetoothProvider";
import { useDarkMode } from "../provider/DarkModeProvider";
import { ConnectionState, DeviceType } from "../utils/uuids";

interface ConnectionBarContainerProps {
  isDarkMode: boolean;
}

const ConnectionBarContainer = styled("div")<ConnectionBarContainerProps>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: ${(props) =>
    props.isDarkMode
      ? "linear-gradient(135deg, var(--secondary-bg) 0%, var(--bg-color) 100%)"
      : "linear-gradient(135deg, var(--bg-color) 0%, var(--secondary-bg) 100%)"};
  border-bottom: 1px solid var(--border-color);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  min-height: 50px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
`;

const ConnectionInfo = styled("div")`
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
`;

const ConnectionDetails = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
`;

const DeviceInfoRow = styled("div")`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
`;

const DeviceDetails = styled("div")`
  display: flex;
  gap: 12px;
`;

const FirmwareVersion = styled("div")`
  font-size: 0.8rem;
  opacity: 0.7;
  color: var(--secondary-text);

  @media (max-width: 768px) {
    display: none;
  }
`;

const SerialNumber = styled("div")`
  font-size: 0.8rem;
  opacity: 0.7;
  color: var(--secondary-text);

  @media (max-width: 480px) {
    display: none;
  }
`;

const StatusText = styled("div")`
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--secondary-text);
`;

const SpinningVsLoading = styled(VsLoading)`
  animation: spin 2s linear infinite;
  filter: drop-shadow(0 0 4px rgba(255, 102, 0, 0.3));

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const DeviceName = styled("div")`
  font-weight: 600;
  font-size: 1rem;
  color: var(--accent-color);
  display: flex;
  align-items: center;
  gap: 6px;
`;

const DeviceTypeChip = styled("span")`
  background: linear-gradient(135deg, var(--accent-color) 0%, #ff7f39 100%);
  color: #fff;
  padding: 1px 6px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  box-shadow: 0 1px 3px rgba(255, 102, 0, 0.2);

  /* The device name already says which device it is */
  @media (max-width: 480px) {
    display: none;
  }
`;

const BluetoothIcon = styled("div")`
  transition: all 0.2s ease;
  border-radius: 50%;
  padding: 6px;

`;

const IconButton = styled("button")`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--secondary-text);
  cursor: pointer;
  transition: all 0.2s ease;

  @media (hover: hover) {
    &:hover {
      color: var(--accent-color);
      background: var(--secondary-bg);
    }
  }
`;

const DEVICE_TYPE_LABELS: Partial<Record<DeviceType, string>> = {
  [DeviceType.VOLCANO]: "Volcano",
  [DeviceType.VENTY]: "Venty",
  [DeviceType.VEAZY]: "Veazy",
  [DeviceType.CRAFTY]: "Crafty",
};

// Resets to the plain "disconnect" label if the second tap doesn't come
const CONFIRM_TIMEOUT_MS = 4000;

const DisconnectButton = styled("button")<{ confirming: boolean }>`
  flex-shrink: 0;
  white-space: nowrap;
  min-height: 36px;
  padding: 6px 14px;
  border-radius: 18px;
  border: 1px solid
    ${(props) =>
      props.confirming ? "var(--accent-color)" : "var(--border-color)"};
  background: ${(props) =>
    props.confirming ? "var(--accent-color)" : "transparent"};
  color: ${(props) => (props.confirming ? "#fff" : "var(--secondary-text)")};
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  @media (hover: hover) {
    &:hover {
      border-color: var(--accent-color);
      color: ${(props) => (props.confirming ? "#fff" : "var(--accent-color)")};
    }
  }
`;

export const ConnectionBar = () => {
  const { disconnect, connectionState, deviceInfo } = useBluetooth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  const isAnyDeviceConnected = () =>
    connectionState() === ConnectionState.CONNECTED;
  const isConnecting = () => connectionState() === ConnectionState.CONNECTING;

  // Get device-specific information
  const getSerialNumber = () => deviceInfo().serialNumber ?? "";

  const [confirming, setConfirming] = createSignal(false);
  let confirmTimer: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => clearTimeout(confirmTimer));

  const handleDisconnect = async () => {
    clearTimeout(confirmTimer);
    if (!confirming()) {
      setConfirming(true);
      confirmTimer = setTimeout(() => setConfirming(false), CONFIRM_TIMEOUT_MS);
      return;
    }
    setConfirming(false);
    await disconnect();
  };

  const getDeviceInfo = () => {
    if (isAnyDeviceConnected()) {
      return deviceInfo();
    }
    return null;
  };
  return (
    <ConnectionBarContainer isDarkMode={isDarkMode()}>
      <Show when={!isAnyDeviceConnected() && !isConnecting()}>
        <ConnectionInfo>
          <BluetoothIcon>
            <TbOutlineBluetoothX
              size={22}
              style={{ color: "var(--secondary-text)" }}
            />
          </BluetoothIcon>
          <ConnectionDetails>
            <StatusText>{m.connection_notConnected()}</StatusText>
          </ConnectionDetails>
        </ConnectionInfo>
      </Show>

      <Show when={isConnecting()}>
        <ConnectionInfo>
          <BluetoothIcon>
            <SpinningVsLoading
              size={22}
              style={{ color: "var(--accent-color)" }}
            />
          </BluetoothIcon>
          <ConnectionDetails>
            <StatusText>{m.connection_connecting()}</StatusText>
          </ConnectionDetails>
        </ConnectionInfo>
      </Show>

      <Show when={isAnyDeviceConnected() && getDeviceInfo()}>
        <ConnectionInfo>
          <BluetoothIcon>
            <TbOutlineBluetoothConnected
              size={22}
              style={{ color: "var(--accent-color)" }}
            />
          </BluetoothIcon>
          <ConnectionDetails>
            <DeviceInfoRow>
              <DeviceName>
                {getDeviceInfo()?.name}
                <Show when={DEVICE_TYPE_LABELS[deviceInfo().type]}>
                  {(label) => <DeviceTypeChip>{label()}</DeviceTypeChip>}
                </Show>
              </DeviceName>
              <DeviceDetails>
                <Show when={getSerialNumber()}>
                  <SerialNumber>
                    {m.device_serialNumber()}: {getSerialNumber()}
                  </SerialNumber>
                </Show>
                <Show when={deviceInfo().firmwareVersion}>
                  <FirmwareVersion>
                    {m.device_firmware()}: {deviceInfo().firmwareVersion}
                  </FirmwareVersion>
                </Show>
              </DeviceDetails>
            </DeviceInfoRow>
          </ConnectionDetails>
          <DisconnectButton
            type="button"
            confirming={confirming()}
            onClick={handleDisconnect}
          >
            {confirming()
              ? m.connection_confirmDisconnect()
              : m.connection_disconnect()}
          </DisconnectButton>
        </ConnectionInfo>
      </Show>

      <IconButton
        type="button"
        aria-label={m.settings_darkMode()}
        aria-pressed={isDarkMode()}
        onClick={() => toggleDarkMode(!isDarkMode())}
      >
        <VsColorMode size={20} />
      </IconButton>
    </ConnectionBarContainer>
  );
};
