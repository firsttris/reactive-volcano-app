import { styled } from "solid-styled-components";
import { TbBluetoothConnected } from "solid-icons/tb";
import { TbBluetoothX } from "solid-icons/tb";
import { ConnectionState, DeviceType } from "../utils/uuids";
import { useDarkMode } from "../provider/DarkModeProvider";
import { useTranslations } from "../i18n/utils";
import { VsLoading } from "solid-icons/vs";
import { Show } from "solid-js";
import { useBluetooth } from "../provider/BluetoothProvider";

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
      ? "linear-gradient(135deg, #2a2a2a 0%, #1e1e1e 100%)"
      : "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)"};
  border-bottom: 1px solid
    ${(props) => (props.isDarkMode ? "#404040" : "#e9ecef")};
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

const FirmwareVersion = styled("div")`
  font-size: 0.8rem;
  opacity: 0.7;
  color: #666;

  @media (max-width: 786px) {
    display: none;
  }
`;

const SerialNumber = styled("div")`
  font-size: 0.8rem;
  opacity: 0.7;
  color: #666;

  @media (max-width: 480px) {
    display: none;
  }
`;

const StatusText = styled("div")`
  font-size: 0.9rem;
  font-weight: 500;
  color: #666;
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
  color: #f60;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const DeviceTypeChip = styled("span")`
  background: linear-gradient(135deg, #f60 0%, #ff7f39 100%);
  color: white;
  padding: 1px 6px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  box-shadow: 0 1px 3px rgba(255, 102, 0, 0.2);
`;

const BluetoothIcon = styled("div")`
  transition: all 0.2s ease;
  border-radius: 50%;
  padding: 6px;

  &:hover {
    background: rgba(255, 102, 0, 0.1);
    transform: scale(1.05);
  }

  &.clickable {
    cursor: pointer;
  }
`;

export const ConnectionBar = () => {
  const { disconnect, connectionState, deviceInfo } = useBluetooth();
  const { isDarkMode } = useDarkMode();
  const t = useTranslations();

  const isAnyDeviceConnected = () =>
    connectionState() === ConnectionState.CONNECTED;
  const isConnecting = () => connectionState() === ConnectionState.CONNECTING;

  // Get device-specific information
  const getSerialNumber = () => {
    const device = deviceInfo();
    if (device.type === DeviceType.VOLCANO) {
      // For now, return empty string or the serial from device name parsing
      return device.name ? device.name.split(" ")[1] || "" : "";
    }
    // For Veazy/Venty, extract from device name (format: "S&B VY123456" or "S&B VZ123456")
    return device.name ? device.name.split(" ")[1] || "" : "";
  };

  const getFirmwareVersion = () => {
    // This would need device-specific implementation
    // For now, return empty to avoid errors
    return "";
  };

  const handleDisconnect = async () => {
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
            <TbBluetoothX size={22} color="#ccc" />
          </BluetoothIcon>
          <ConnectionDetails>
            <StatusText>{t("deviceNotConnected")}</StatusText>
          </ConnectionDetails>
        </ConnectionInfo>
      </Show>

      <Show when={isConnecting()}>
        <ConnectionInfo>
          <BluetoothIcon>
            <SpinningVsLoading size={22} color="#f60" />
          </BluetoothIcon>
          <ConnectionDetails>
            <StatusText>{t("connectingToDevice")}</StatusText>
          </ConnectionDetails>
        </ConnectionInfo>
      </Show>

      <Show when={isAnyDeviceConnected() && getDeviceInfo()}>
        <ConnectionInfo>
          <BluetoothIcon class="clickable" onClick={handleDisconnect}>
            <TbBluetoothConnected
              size={22}
              color="#f60"
              title="Click to disconnect"
            />
          </BluetoothIcon>
          <ConnectionDetails>
            <DeviceInfoRow>
              <DeviceName>
                {getDeviceInfo()?.name}
                {getDeviceInfo()?.type === DeviceType.VEAZY && (
                  <DeviceTypeChip>Veazy</DeviceTypeChip>
                )}
                {getDeviceInfo()?.type === DeviceType.VENTY && (
                  <DeviceTypeChip>Venty</DeviceTypeChip>
                )}
                {getDeviceInfo()?.type === DeviceType.VOLCANO && (
                  <DeviceTypeChip>Volcano</DeviceTypeChip>
                )}
              </DeviceName>
              <div style={{ display: "flex", gap: "12px" }}>
                <Show when={getSerialNumber() && getSerialNumber().length > 0}>
                  <SerialNumber>
                    {t("serialNumber")}: {getSerialNumber()}
                  </SerialNumber>
                </Show>
                <Show
                  when={getFirmwareVersion() && getFirmwareVersion().length > 0}
                >
                  <FirmwareVersion>
                    {t("bleFirmwareVersion")}: {getFirmwareVersion()}
                  </FirmwareVersion>
                </Show>
              </div>
            </DeviceInfoRow>
          </ConnectionDetails>
        </ConnectionInfo>
      </Show>
    </ConnectionBarContainer>
  );
};
