import { type Component, createSignal, Show } from "solid-js";
import { styled } from "solid-styled-components";
import { m } from "../../paraglide/messages";
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
    <CollapsibleCard
      title={m.settings_title()}
      storageKey="venty-veazy-settings"
    >
      {/* LED Brightness - Common for both Venty & Veazy */}
      <SettingItem>
        <SettingLabel>{m.settings_ledBrightness()}</SettingLabel>
        <Slider
          value={state.brightnessVibration?.brightness ?? localBrightness()}
          onInput={handleBrightnessChange}
          min={1}
          max={9}
          step={1}
          label={
            <span>
              {m.settings_brightness()}:{" "}
              {state.brightnessVibration?.brightness ?? localBrightness()}
            </span>
          }
        />
      </SettingItem>

      {/* Vibration - Common for both Venty & Veazy */}
      <SettingItem>
        <SettingLabel>{m.settings_vibration()}</SettingLabel>
        <Switch
          isOn={state.brightnessVibration?.vibration ?? false}
          onToggle={actions.setVibration}
          label={m.settings_enableVibration()}
        />
      </SettingItem>

      {/* Permanent Bluetooth - Only Veazy */}
      <Show when={isVeazy()}>
        <SettingItem>
          <SettingLabel>{m.settings_permanentBluetooth()}</SettingLabel>
          <Switch
            isOn={state.status?.permanentBluetooth ?? false}
            onToggle={actions.setPermanentBluetooth}
            label={m.settings_keepBluetoothAlwaysOn()}
          />
        </SettingItem>
      </Show>

      {/* Charge Current Optimization - Common but primarily Venty */}
      <SettingItem>
        <SettingLabel>{m.settings_chargeCurrentOptimization()}</SettingLabel>
        <Switch
          isOn={state.status?.chargeCurrentOptimization ?? false}
          onToggle={actions.setChargeCurrentOptimization}
          label={m.settings_optimizeChargingCurrent()}
        />
      </SettingItem>

      {/* Charge Voltage Limit - Common but primarily Venty */}
      <SettingItem>
        <SettingLabel>{m.settings_chargeVoltageLimit()}</SettingLabel>
        <Switch
          isOn={state.status?.chargeVoltageLimit ?? false}
          onToggle={actions.setChargeVoltageLimit}
          label={m.settings_limitChargingVoltage()}
        />
      </SettingItem>

      {/* Boost & Superboost Visualization - Common for both */}
      <SettingItem>
        <SettingLabel>{m.settings_boostSuperboostVisualization()}</SettingLabel>
        <Switch
          isOn={state.status?.boostVisualization ?? false}
          onToggle={actions.setBoostVisualization}
          label={m.settings_enableBoostLedVisualization()}
        />
      </SettingItem>

      {/* Boost/Superboost Timeout - Both Venty (FW 8+) and Veazy */}

      <SettingItem>
        <SettingLabel>{m.settings_permanentBoost()}</SettingLabel>
        <Switch
          isOn={state.brightnessVibration?.boostTimeoutDisabled ?? false}
          onToggle={actions.setBoostTimeoutDisabled}
          label={m.settings_deactivateBoostTimeout()}
        />
      </SettingItem>

      {/* Temperature Unit - Common for both */}
      <SettingItem>
        <SettingLabel>{m.settings_temperatureUnit()}</SettingLabel>
        <Switch
          isOn={state.status?.isCelsius ?? true}
          onToggle={actions.setIsCelsius}
          label={
            state.status?.isCelsius
              ? m.settings_celsius()
              : m.settings_fahrenheit()
          }
        />
      </SettingItem>

      {/* Find My Device - only Veazy (like the legacy app) */}
      <Show when={isVeazy()}>
        <SettingItem>
          <SettingLabel>{m.settings_locateDevice()}</SettingLabel>
          <ResetButtonContainer>
            <ActionButton type="button" onClick={actions.triggerFindMyDevice}>
              {m.settings_findMyDevice()}
            </ActionButton>
          </ResetButtonContainer>
        </SettingItem>
      </Show>

      {/* Analysis */}
      <SettingItem>
        <SettingLabel>{m.analysis_title()}</SettingLabel>
        <AnalysisSection run={actions.runAnalysis} />
      </SettingItem>

      {/* Factory Reset Button */}
      <SettingItem>
        <SettingLabel>{m.settings_factoryReset()}</SettingLabel>
        <ResetButtonContainer>
          <ResetButton onClick={() => setShowResetModal(true)}>
            {m.common_reset()}
          </ResetButton>
        </ResetButtonContainer>
      </SettingItem>

      {/* Factory Reset Confirmation Modal */}
      <Modal isOpen={showResetModal()}>
        <ModalContent>
          <ModalTitle>{m.settings_factoryReset()}</ModalTitle>
          <ModalText>{m.settings_factoryResetConfirm()}</ModalText>
          <ModalButtonGroup>
            <ModalButton
              variant="cancel"
              onClick={() => setShowResetModal(false)}
            >
              {m.common_cancel()}
            </ModalButton>
            <ModalButton variant="danger" onClick={handleFactoryReset}>
              {m.common_reset()}
            </ModalButton>
          </ModalButtonGroup>
        </ModalContent>
      </Modal>
    </CollapsibleCard>
  );
};
