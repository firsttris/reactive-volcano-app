import { Component, createSignal } from "solid-js";
import { styled } from "solid-styled-components";
import { Slider } from "../Slider";
import { Button } from "../Button";
import { DarkModeSwitch } from "../DarkModeSwitch";
import { useCraftyDeviceContext } from "../../provider/CraftyDeviceProvider";
import { useTranslations } from "../../i18n/utils";

const SettingsContainer = styled("div")`
  max-width: 600px;
  margin: 20px auto;
  padding: 20px;
  background: var(--secondary-bg);
  border-radius: 8px;
`;

const SettingsTitle = styled("h2")`
  color: var(--accent-color);
  font-size: 1.5rem;
  margin-bottom: 20px;
  text-align: center;
  font-family: CustomFont;
`;

const SettingItem = styled("div")`
  margin-bottom: 25px;
  padding: 15px;
  background: var(--bg-color);
  border-radius: 5px;
`;

const SettingLabel = styled("label")`
  display: block;
  color: var(--text-color);
  font-size: 1rem;
  margin-bottom: 10px;
  font-family: CustomFont;
`;

const InfoDisplay = styled("div")`
  color: var(--text-color);
  font-size: 1.2rem;
  font-family: "CustomFont";
  text-align: center;
  padding: 10px;
  background: var(--secondary-bg);
  border-radius: 5px;
  margin-top: 5px;
`;

const StatusContainer = styled("div")`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-top: 10px;
`;

const StatusItem = styled("div")`
  text-align: center;
  padding: 10px;
  background: var(--secondary-bg);
  border-radius: 5px;
`;

const StatusLabel = styled("div")`
  color: var(--secondary-text);
  font-size: 0.9rem;
  margin-bottom: 5px;
`;

const StatusValue = styled("div")`
  color: var(--text-color);
  font-size: 1.1rem;
  font-family: "CustomFont";
`;

const ResetButtonContainer = styled("div")`
  display: flex;
  justify-content: center;
  margin-top: 10px;
`;

const ResetButton = styled(Button)`
  background-color: #d32f2f;
  width: 200px;
  height: 50px;

  &:hover {
    background-color: #b71c1c;
  }

  &:active {
    background-color: #8b0000;
  }
`;

const Modal = styled("div")<{ isOpen: boolean }>`
  display: ${(props) => (props.isOpen ? "flex" : "none")};
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgba(0, 0, 0, 0.7);
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled("div")`
  background-color: #2a2a2a;
  padding: 30px;
  border-radius: 8px;
  max-width: 400px;
  text-align: center;
  border: 2px solid #f60;
`;

const ModalTitle = styled("h3")`
  color: var(--accent-color);
  margin-bottom: 15px;
  font-family: CustomFont;
`;

const ModalText = styled("p")`
  color: var(--secondary-text);
  margin-bottom: 25px;
  font-family: CustomFont;
`;

const ModalButtonGroup = styled("div")`
  display: flex;
  justify-content: space-around;
  gap: 15px;
`;

const ModalButton = styled(Button)<{ variant?: "danger" | "cancel" }>`
  width: 120px;
  background-color: ${(props) =>
    props.variant === "danger" ? "#d32f2f" : "#666"};

  &:hover {
    background-color: ${(props) =>
      props.variant === "danger" ? "#b71c1c" : "#555"};
  }
`;

export const Settings: Component = () => {
  const { settings, temperature, firmware, systemStatus, usageTime, power } =
    useCraftyDeviceContext();
  const {
    getLedBrightness,
    getAutoOffCountdown,
    getAutoOffCurrentValue,
    setLedBrightness,
    setAutoOffCountdown,
  } = settings;
  const { getBoostTemperature, setBoostTemp } = temperature;
  const { getBatteryPercent } = power;
  const {
    getFirmwareVersion,
    getFirmwareBLEVersion,
    getStatusRegister2,
    isOldCrafty,
  } = firmware;
  const { getSystemStatus, getAkkuStatus, getAkkuStatus2, factoryReset } =
    systemStatus;
  const { getUseHours, getUseMinutes } = usageTime;

  const t = useTranslations();
  const [showResetModal, setShowResetModal] = createSignal(false);

  const handleFactoryReset = () => {
    factoryReset();
    setShowResetModal(false);
  };

  return (
    <>
      <SettingsContainer>
        <SettingsTitle>{t("settings")}</SettingsTitle>

        {/* Boost Temperature */}
        <SettingItem>
          <SettingLabel>Boost Temperature</SettingLabel>
          <Slider
            min={0}
            max={30}
            step={1}
            value={getBoostTemperature()}
            label={`Boost Temperature: ${getBoostTemperature()}`}
            onInput={setBoostTemp}
          />
        </SettingItem>

        {/* LED Brightness */}
        <SettingItem>
          <SettingLabel>{t("deviceBrightness")}</SettingLabel>
          <Slider
            min={0}
            max={100}
            step={10}
            value={getLedBrightness()}
            label={`${t("deviceBrightness")}: ${getLedBrightness()} %`}
            onInput={setLedBrightness}
          />
        </SettingItem>

        {/* Auto Shutdown Time - only on Crafty+ */}
        {!isOldCrafty() && (
          <>
            <SettingItem>
              <SettingLabel>{t("autoMaticShutdownTime")}</SettingLabel>
              <Slider
                min={0}
                max={600}
                step={60}
                value={getAutoOffCountdown()}
                label={`${t("autoMaticShutdownTime")}: ${Math.floor(getAutoOffCountdown() / 60)} min`}
                onInput={setAutoOffCountdown}
              />
            </SettingItem>

            {/* Current Auto-Off Time */}
            <SettingItem>
              <SettingLabel>Current Auto-Off Time</SettingLabel>
              <InfoDisplay>
                {Math.floor(getAutoOffCurrentValue() / 60)}:
                {(getAutoOffCurrentValue() % 60).toString().padStart(2, "0")} min
                remaining
              </InfoDisplay>
            </SettingItem>
          </>
        )}

        {/* Firmware Information */}
        <SettingItem>
          <SettingLabel>Firmware Information</SettingLabel>
          <StatusContainer>
            <StatusItem>
              <StatusLabel>Firmware Version</StatusLabel>
              <StatusValue>{getFirmwareVersion()}</StatusValue>
            </StatusItem>
            {!isOldCrafty() && (
              <StatusItem>
                <StatusLabel>BLE Firmware Version</StatusLabel>
                <StatusValue>{getFirmwareBLEVersion()}</StatusValue>
              </StatusItem>
            )}
            <StatusItem>
              <StatusLabel>Status Register 2</StatusLabel>
              <StatusValue>{getStatusRegister2()}</StatusValue>
            </StatusItem>
          </StatusContainer>
          {isOldCrafty() && (
            <InfoDisplay style="margin-top: 10px; font-size: 0.9rem; color: var(--secondary-text);">
              ⚠️ Old Crafty detected. Some features are not available.
            </InfoDisplay>
          )}
        </SettingItem>

        {/* Battery Status - available on all Crafty devices */}
        <SettingItem>
          <SettingLabel>Battery Status</SettingLabel>
          <StatusContainer>
            <StatusItem>
              <StatusLabel>Battery Level</StatusLabel>
              <StatusValue>{getBatteryPercent()} %</StatusValue>
            </StatusItem>
          </StatusContainer>
        </SettingItem>

        {/* System Status - only on Crafty+ */}
        {!isOldCrafty() && (
          <SettingItem>
            <SettingLabel>System Status (Crafty+ only)</SettingLabel>
            <StatusContainer>
              <StatusItem>
                <StatusLabel>System Status</StatusLabel>
                <StatusValue>{getSystemStatus()}</StatusValue>
              </StatusItem>
              <StatusItem>
                <StatusLabel>Akku Status 1</StatusLabel>
                <StatusValue>{getAkkuStatus()}</StatusValue>
              </StatusItem>
              <StatusItem>
                <StatusLabel>Akku Status 2</StatusLabel>
                <StatusValue>{getAkkuStatus2()}</StatusValue>
              </StatusItem>
            </StatusContainer>
          </SettingItem>
        )}

        {/* Usage Time */}
        <SettingItem>
          <SettingLabel>Usage Time</SettingLabel>
          <InfoDisplay>
            {getUseHours()} hours {!isOldCrafty() && `${getUseMinutes()} minutes`}
          </InfoDisplay>
        </SettingItem>

        {/* Factory Reset - only on Crafty+ */}
        {!isOldCrafty() && (
          <SettingItem>
            <SettingLabel>Factory Reset</SettingLabel>
            <ResetButtonContainer>
              <ResetButton onClick={() => setShowResetModal(true)}>
                Factory Reset
              </ResetButton>
            </ResetButtonContainer>
          </SettingItem>
        )}

        {/* Dark Mode */}
        <SettingItem>
          <DarkModeSwitch />
        </SettingItem>
      </SettingsContainer>

      {/* Factory Reset Modal */}
      <Modal isOpen={showResetModal()}>
        <ModalContent>
          <ModalTitle>Factory Reset</ModalTitle>
          <ModalText>
            Are you sure you want to reset all settings to factory defaults?
            This action cannot be undone.
          </ModalText>
          <ModalButtonGroup>
            <ModalButton
              variant="cancel"
              onClick={() => setShowResetModal(false)}
            >
              Cancel
            </ModalButton>
            <ModalButton variant="danger" onClick={handleFactoryReset}>
              Reset
            </ModalButton>
          </ModalButtonGroup>
        </ModalContent>
      </Modal>
    </>
  );
};
