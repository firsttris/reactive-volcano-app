import { styled } from "solid-styled-components";
import { useBluetooth } from "../../provider/BluetoothProvider";
import { useCharacteristics } from "../../provider/CharacteristicsProvider";
import { TbBluetoothConnected } from "solid-icons/tb";
import { TbBluetoothX } from "solid-icons/tb";
import { ConnectionState } from "../../utils/uuids";
import { useDarkMode } from "../../provider/DarkModeProvider";
import { useTranslations } from "../../i18n/utils";
import { VsLoading } from "solid-icons/vs";
import { Show } from "solid-js";

interface ConnectionBarContainerProps {
  isDarkMode: boolean;
}

const ConnectionBarContainer = styled("div")<ConnectionBarContainerProps>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  background-color: ${(props) => (props.isDarkMode ? "#333" : "#f5f5f5")};
  border-bottom: 1px solid #ddd;
  height: 60px;
`;

const ConnectionInfo = styled("div")`
  display: flex;
  align-items: center;
  width: 100%;
`;

const ConnectionDetails = styled("div")`
  display: flex;
  justify-content: space-between;
  width: 100%;
  gap: 30px;
  margin-left: 10px;
`;

const FirmwareVersion = styled("div")`
  @media (max-width: 786px) {
    display: none;
  }
`;

const SpinningVsLoading = styled(VsLoading)`
  animation: spin 2s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export const ConnectionBar = () => {
  const { connectionState, connect, disconnect } = useBluetooth();
  const t = useTranslations();

  const { isDarkMode } = useDarkMode();

  const {
    getters: {
      getSerialNumber,
      getHoursOfHeating,
      getMinutesOfHeating,
      getBleFirmwareVersion,
    },
  } = useCharacteristics();

  return (
    <ConnectionBarContainer isDarkMode={isDarkMode()}>
      <ConnectionInfo>
        <Show when={connectionState() === ConnectionState.CONNECTING}>
          <SpinningVsLoading size="30px" />
        </Show>
        <Show
          when={
            connectionState() === ConnectionState.NOT_CONNECTED ||
            connectionState() === ConnectionState.CONNECTION_FAILED
          }
        >
          <TbBluetoothX
            size="30px"
            onClick={() => connect()}
            style={{ cursor: "pointer" }}
          />
        </Show>
        <Show when={connectionState() === ConnectionState.CONNECTED}>
          <TbBluetoothConnected
            size="30px"
            style={{ cursor: "pointer", color: "#007BFF" }}
            onClick={() => disconnect()}
          />
        </Show>
        <ConnectionDetails>
          <div>
            {t("serialNumber")}: {getSerialNumber()}
          </div>
          <div>
            {t("deviceRuntime")}: {getHoursOfHeating()}:
            {getMinutesOfHeating().toString().padStart(2, "0")} {t("hours")}
          </div>
          <FirmwareVersion>
            {t("bleFirmwareVersion")}: {getBleFirmwareVersion()}
          </FirmwareVersion>
        </ConnectionDetails>
      </ConnectionInfo>
    </ConnectionBarContainer>
  );
};
