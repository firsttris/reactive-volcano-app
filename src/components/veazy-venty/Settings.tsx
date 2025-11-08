import { Component, Show, createSignal } from "solid-js";
import { styled } from "solid-styled-components";
import { Switch } from "../Switch";
import { Slider } from "../Slider";
import { Button } from "../Button";
import { DarkModeSwitch } from "../DarkModeSwitch";
import { useBluetooth } from "../../provider/BluetoothProvider";
import { useDeviceStatusContext } from "../../provider/DeviceStatusProvider";
import { useBrightnessVibration } from "../../hooks/venty-veazy/useBrightnessVibration";
import { useSettings } from "../../hooks/venty-veazy/useSettings";
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
  const { deviceInfo } = useBluetooth();
  const {
    status,
    setIsCelsius,
    setChargeCurrentOptimization,
    setChargeVoltageLimit,
    setPermanentBluetooth,
  } = useDeviceStatusContext();
  const {
    data: brightnessData,
    setBrightness,
    setVibration,
    setBoostTimeout,
  } = useBrightnessVibration();

  const t = useTranslations();
  const { factoryReset, setBoostVisualization } = useSettings();

  const [showResetModal, setShowResetModal] = createSignal(false);
  const [localBrightness, setLocalBrightness] = createSignal(5);

  const isVeazy = () => deviceInfo().type === "VEAZY";

  const handleBrightnessChange = (value: number) => {
    setLocalBrightness(value);
    setBrightness(value);
  };

  const handleVibrationToggle = (enabled: boolean) => {
    // Vibration: 0 = disabled, 1 = enabled
    setVibration(enabled ? 1 : 0);
  };

  const handleBoostTimeoutToggle = (enabled: boolean) => {
    // BoostTimeout: 0 = disabled, 1 = enabled
    setBoostTimeout(enabled ? 1 : 0);
  };

  const handleFactoryReset = () => {
    factoryReset();
    setShowResetModal(false);
  };

  return (
    <SettingsContainer>
      <SettingsTitle>{t("settings")}</SettingsTitle>

      {/* LED Brightness - Common for both Venty & Veazy */}
      <SettingItem>
        <SettingLabel>{t("ledBrightness")}</SettingLabel>
        <Slider
          value={brightnessData()?.brightness ?? localBrightness()}
          onInput={handleBrightnessChange}
          min={1}
          max={9}
          step={1}
          label={
            <span>
              {t("brightness")}:{" "}
              {brightnessData()?.brightness ?? localBrightness()}
            </span>
          }
        />
      </SettingItem>

      {/* Vibration - Common for both Venty & Veazy */}
      <SettingItem>
        <SettingLabel>{t("vibration")}</SettingLabel>
        <Switch
          isOn={brightnessData()?.vibration === 1}
          onToggle={handleVibrationToggle}
          label={t("enableVibration")}
        />
      </SettingItem>

      {/* Permanent Bluetooth - Only Veazy */}
      <Show when={isVeazy()}>
        <SettingItem>
          <SettingLabel>{t("permanentBluetooth")}</SettingLabel>
          <Switch
            isOn={status()?.permanentBluetooth ?? false}
            onToggle={(enabled) => setPermanentBluetooth(enabled)}
            label={t("keepBluetoothAlwaysOn")}
          />
        </SettingItem>
      </Show>

      {/* Charge Current Optimization - Common but primarily Venty */}
      <SettingItem>
        <SettingLabel>{t("chargeCurrentOptimization")}</SettingLabel>
        <Switch
          isOn={status()?.chargeCurrentOptimization ?? false}
          onToggle={(enabled) => setChargeCurrentOptimization(enabled)}
          label={t("optimizeChargingCurrent")}
        />
      </SettingItem>

      {/* Charge Voltage Limit - Common but primarily Venty */}
      <SettingItem>
        <SettingLabel>{t("chargeVoltageLimit")}</SettingLabel>
        <Switch
          isOn={status()?.chargeVoltageLimit ?? false}
          onToggle={(enabled) => setChargeVoltageLimit(enabled)}
          label={t("limitChargingVoltage")}
        />
      </SettingItem>

      {/* Boost & Superboost Visualization - Common for both */}
      <SettingItem>
        <SettingLabel>{t("boostSuperboostVisualization")}</SettingLabel>
        <Switch
          isOn={status()?.boostVisualization ?? false}
          onToggle={(enabled) => setBoostVisualization(enabled)}
          label={t("enableBoostLedVisualization")}
        />
      </SettingItem>

      {/* Boost/Superboost Timeout - Both Venty (FW 8+) and Veazy */}

      <SettingItem>
        <SettingLabel>{t("permanentBoost")}</SettingLabel>
        <Switch
          isOn={brightnessData()?.boostTimeout === 1}
          onToggle={handleBoostTimeoutToggle}
          label={t("deactivateBoostTimeout")}
        />
      </SettingItem>

      {/* Temperature Unit - Common for both */}
      <SettingItem>
        <SettingLabel>{t("temperatureUnit")}</SettingLabel>
        <Switch
          isOn={status()?.isCelsius ?? true}
          onToggle={(enabled) => setIsCelsius(enabled)}
          label={status()?.isCelsius ? t("celsius") : t("fahrenheit")}
        />
      </SettingItem>

      {/* Dark Mode */}
      <SettingItem>
        <SettingLabel>{t("darkMode")}</SettingLabel>
        <DarkModeSwitch />
      </SettingItem>

      {/* Factory Reset Button */}
      <SettingItem>
        <SettingLabel>{t("factoryReset")}</SettingLabel>
        <ResetButtonContainer>
          <ResetButton onClick={() => setShowResetModal(true)}>
            {t("reset")}
          </ResetButton>
        </ResetButtonContainer>
      </SettingItem>

      {/* Factory Reset Confirmation Modal */}
      <Modal isOpen={showResetModal()}>
        <ModalContent>
          <ModalTitle>{t("factoryReset")}</ModalTitle>
          <ModalText>{t("factoryResetConfirm")}</ModalText>
          <ModalButtonGroup>
            <ModalButton
              variant="cancel"
              onClick={() => setShowResetModal(false)}
            >
              {t("cancel")}
            </ModalButton>
            <ModalButton variant="danger" onClick={handleFactoryReset}>
              {t("reset")}
            </ModalButton>
          </ModalButtonGroup>
        </ModalContent>
      </Modal>
    </SettingsContainer>
  );
};
