import { type Component, createSignal, Show } from "solid-js";
import { styled } from "solid-styled-components";
import { useTranslations } from "../../i18n/utils";
import { useVentyVeazy } from "../../provider/VentyVeazyProvider";
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

const ResetButtonContainer = styled("div")`
  display: flex;
  justify-content: center;
  margin-top: 10px;
`;

const ActionButton = styled(Button)`
  width: 200px;
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
  const { state, actions, model } = useVentyVeazy();

  const t = useTranslations();

  const [showResetModal, setShowResetModal] = createSignal(false);
  const [localBrightness, setLocalBrightness] = createSignal(5);

  const isVeazy = () => model === "VEAZY";

  const handleBrightnessChange = (value: number) => {
    setLocalBrightness(value);
    actions.setBrightness(value);
  };

  const handleFactoryReset = () => {
    actions.factoryReset();
    setShowResetModal(false);
  };

  return (
    <CollapsibleCard title={t("settings")} storageKey="venty-veazy-settings">
      {/* LED Brightness - Common for both Venty & Veazy */}
      <SettingItem>
        <SettingLabel>{t("ledBrightness")}</SettingLabel>
        <Slider
          value={state.brightnessVibration?.brightness ?? localBrightness()}
          onInput={handleBrightnessChange}
          min={1}
          max={9}
          step={1}
          label={
            <span>
              {t("brightness")}:{" "}
              {state.brightnessVibration?.brightness ?? localBrightness()}
            </span>
          }
        />
      </SettingItem>

      {/* Vibration - Common for both Venty & Veazy */}
      <SettingItem>
        <SettingLabel>{t("vibration")}</SettingLabel>
        <Switch
          isOn={state.brightnessVibration?.vibration ?? false}
          onToggle={actions.setVibration}
          label={t("enableVibration")}
        />
      </SettingItem>

      {/* Permanent Bluetooth - Only Veazy */}
      <Show when={isVeazy()}>
        <SettingItem>
          <SettingLabel>{t("permanentBluetooth")}</SettingLabel>
          <Switch
            isOn={state.status?.permanentBluetooth ?? false}
            onToggle={actions.setPermanentBluetooth}
            label={t("keepBluetoothAlwaysOn")}
          />
        </SettingItem>
      </Show>

      {/* Charge Current Optimization - Common but primarily Venty */}
      <SettingItem>
        <SettingLabel>{t("chargeCurrentOptimization")}</SettingLabel>
        <Switch
          isOn={state.status?.chargeCurrentOptimization ?? false}
          onToggle={actions.setChargeCurrentOptimization}
          label={t("optimizeChargingCurrent")}
        />
      </SettingItem>

      {/* Charge Voltage Limit - Common but primarily Venty */}
      <SettingItem>
        <SettingLabel>{t("chargeVoltageLimit")}</SettingLabel>
        <Switch
          isOn={state.status?.chargeVoltageLimit ?? false}
          onToggle={actions.setChargeVoltageLimit}
          label={t("limitChargingVoltage")}
        />
      </SettingItem>

      {/* Boost & Superboost Visualization - Common for both */}
      <SettingItem>
        <SettingLabel>{t("boostSuperboostVisualization")}</SettingLabel>
        <Switch
          isOn={state.status?.boostVisualization ?? false}
          onToggle={actions.setBoostVisualization}
          label={t("enableBoostLedVisualization")}
        />
      </SettingItem>

      {/* Boost/Superboost Timeout - Both Venty (FW 8+) and Veazy */}

      <SettingItem>
        <SettingLabel>{t("permanentBoost")}</SettingLabel>
        <Switch
          isOn={state.brightnessVibration?.boostTimeoutDisabled ?? false}
          onToggle={actions.setBoostTimeoutDisabled}
          label={t("deactivateBoostTimeout")}
        />
      </SettingItem>

      {/* Temperature Unit - Common for both */}
      <SettingItem>
        <SettingLabel>{t("temperatureUnit")}</SettingLabel>
        <Switch
          isOn={state.status?.isCelsius ?? true}
          onToggle={actions.setIsCelsius}
          label={state.status?.isCelsius ? t("celsius") : t("fahrenheit")}
        />
      </SettingItem>

      {/* Find My Device - only Veazy (like the legacy app) */}
      <Show when={isVeazy()}>
        <SettingItem>
          <SettingLabel>{t("locateDevice")}</SettingLabel>
          <ResetButtonContainer>
            <ActionButton type="button" onClick={actions.triggerFindMyDevice}>
              {t("findMyDevice")}
            </ActionButton>
          </ResetButtonContainer>
        </SettingItem>
      </Show>

      {/* Analysis */}
      <SettingItem>
        <SettingLabel>{t("analysis")}</SettingLabel>
        <AnalysisSection run={actions.runAnalysis} />
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
    </CollapsibleCard>
  );
};
