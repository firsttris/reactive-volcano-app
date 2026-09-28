import { type Component, createSignal, Show } from "solid-js";
import { styled } from "solid-styled-components";
import { Limits } from "../../devices/crafty/protocol";
import { useTranslations } from "../../i18n/utils";
import { useCrafty } from "../../provider/CraftyProvider";
import { AnalysisSection } from "../AnalysisSection";
import { Button } from "../Button";
import { CollapsibleCard } from "../Card";
import { Slider } from "../Slider";
import { Switch } from "../Switch";

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

const HintText = styled("div")`
  color: var(--secondary-text);
  font-size: 0.9rem;
  text-align: center;
  margin-top: 10px;
`;

const ResetButtonContainer = styled("div")`
  display: flex;
  justify-content: center;
  margin-top: 10px;
`;

const ActionButton = styled(Button)`
  width: 200px;

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
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
  border: 2px solid var(--accent-color);
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
  const {
    state,
    actions,
    derived,
    firmwareVersion,
    isOldFirmware,
    isCraftyPlus,
  } = useCrafty();

  const t = useTranslations();
  const [showResetModal, setShowResetModal] = createSignal(false);

  const handleFactoryReset = () => {
    actions.factoryReset();
    setShowResetModal(false);
  };

  return (
    <>
      <CollapsibleCard title={t("settings")} storageKey="crafty-settings">
        {/* Boost Temperature */}
        <SettingItem>
          <SettingLabel>Boost Temperature</SettingLabel>
          <Slider
            min={Limits.MIN_BOOST}
            max={Limits.MAX_BOOST}
            step={1}
            value={state.boostTemp}
            label={`Boost Temperature: ${state.boostTemp}`}
            onInput={actions.setBoostTemp}
          />
        </SettingItem>

        {/* LED Brightness */}
        <SettingItem>
          <SettingLabel>{t("deviceBrightness")}</SettingLabel>
          <Slider
            min={Limits.MIN_BRIGHTNESS}
            max={Limits.MAX_BRIGHTNESS}
            step={10}
            value={state.ledBrightness}
            label={`${t("deviceBrightness")}: ${state.ledBrightness} %`}
            onInput={actions.setLedBrightness}
          />
        </SettingItem>

        {/* Vibration */}
        <SettingItem>
          <SettingLabel>{t("vibration")}</SettingLabel>
          <Switch
            isOn={derived.isVibrationOn()}
            onToggle={actions.setVibration}
            label={t("enableVibration")}
          />
        </SettingItem>

        {/* Charge Indicator LED */}
        <SettingItem>
          <SettingLabel>{t("chargeIndicatorLamp")}</SettingLabel>
          <Switch
            isOn={derived.isChargeLedOn()}
            onToggle={actions.setChargeLed}
            label={t("enableChargeLed")}
          />
        </SettingItem>

        {/* Permanent Bluetooth - not on old firmware */}
        <Show when={!isOldFirmware}>
          <SettingItem>
            <SettingLabel>{t("permanentBluetooth")}</SettingLabel>
            <Switch
              isOn={derived.isPermanentBluetooth()}
              onToggle={actions.setPermanentBluetooth}
              label={t("keepBluetoothAlwaysOn")}
            />
          </SettingItem>
        </Show>

        {/* Find My Device - only Crafty+ */}
        <Show when={isCraftyPlus}>
          <SettingItem>
            <SettingLabel>{t("locateDevice")}</SettingLabel>
            <ResetButtonContainer>
              <ActionButton
                type="button"
                disabled={derived.isFindMyActive()}
                onClick={actions.findMyDevice}
              >
                {t("findMyDevice")}
              </ActionButton>
            </ResetButtonContainer>
            <Show when={derived.isFindMyActive()}>
              <HintText>{t("findMyDeviceRunning")}</HintText>
            </Show>
          </SettingItem>
        </Show>

        {/* Auto Shutdown Time - only on Crafty+ */}
        {!isOldFirmware && (
          <>
            <SettingItem>
              <SettingLabel>{t("autoMaticShutdownTime")}</SettingLabel>
              <Slider
                min={Limits.MIN_AUTO_OFF}
                max={Limits.MAX_AUTO_OFF}
                step={30}
                value={state.autoOffCountdown ?? Limits.MIN_AUTO_OFF}
                label={`${t("autoMaticShutdownTime")}: ${state.autoOffCountdown ?? "-"} s`}
                onInput={actions.setAutoOffCountdown}
              />
            </SettingItem>

            {/* Current Auto-Off Time */}
            <SettingItem>
              <SettingLabel>Current Auto-Off Time</SettingLabel>
              <InfoDisplay>
                {Math.floor((state.autoOffRemaining ?? 0) / 60)}:
                {((state.autoOffRemaining ?? 0) % 60)
                  .toString()
                  .padStart(2, "0")}{" "}
                min remaining
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
              <StatusValue>{firmwareVersion}</StatusValue>
            </StatusItem>
            {!isOldFirmware && (
              <StatusItem>
                <StatusLabel>BLE Firmware Version</StatusLabel>
                <StatusValue>{state.bleFirmwareVersion ?? "-"}</StatusValue>
              </StatusItem>
            )}
            <StatusItem>
              <StatusLabel>Status Register 2</StatusLabel>
              <StatusValue>{state.statusRegister2}</StatusValue>
            </StatusItem>
          </StatusContainer>
          {isOldFirmware && (
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
              <StatusValue>{state.batteryLevel} %</StatusValue>
            </StatusItem>
          </StatusContainer>
        </SettingItem>

        {/* System Status - only on Crafty+ */}
        {!isOldFirmware && (
          <SettingItem>
            <SettingLabel>System Status (Crafty+ only)</SettingLabel>
            <StatusContainer>
              <StatusItem>
                <StatusLabel>System Status</StatusLabel>
                <StatusValue>{state.systemStatus ?? "-"}</StatusValue>
              </StatusItem>
              <StatusItem>
                <StatusLabel>Akku Status 1</StatusLabel>
                <StatusValue>{state.akkuStatus ?? "-"}</StatusValue>
              </StatusItem>
              <StatusItem>
                <StatusLabel>Akku Status 2</StatusLabel>
                <StatusValue>{state.akkuStatus2 ?? "-"}</StatusValue>
              </StatusItem>
            </StatusContainer>
          </SettingItem>
        )}

        {/* Usage Time */}
        <SettingItem>
          <SettingLabel>Usage Time</SettingLabel>
          <InfoDisplay>
            {state.useHours} hours{" "}
            {!isOldFirmware && `${state.useMinutes ?? 0} minutes`}
          </InfoDisplay>
        </SettingItem>

        {/* Analysis - not on old firmware */}
        <Show when={!isOldFirmware}>
          <SettingItem>
            <SettingLabel>{t("analysis")}</SettingLabel>
            <AnalysisSection run={actions.runAnalysis} />
          </SettingItem>
        </Show>

        {/* Factory Reset - only on Crafty+ */}
        {!isOldFirmware && (
          <SettingItem>
            <SettingLabel>Factory Reset</SettingLabel>
            <ResetButtonContainer>
              <ResetButton onClick={() => setShowResetModal(true)}>
                Factory Reset
              </ResetButton>
            </ResetButtonContainer>
          </SettingItem>
        )}
      </CollapsibleCard>

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
