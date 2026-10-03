import { Show } from "solid-js";
import { styled } from "solid-styled-components";
import { HeaterMode } from "../../devices/ventyVeazy/protocol";
import { useWakeLock } from "../../hooks/utils/useWakeLock";
import { m } from "../../paraglide/messages";
import { useVentyVeazy } from "../../provider/VentyVeazyProvider";
import { BoostControl } from "./BoostControl";
import { EffectiveTemperatureStatus } from "./EffectiveTemperatureStatus";
import { MainTemperatureControl } from "./MainTemperatureControl";

// Styled Components
const Container = styled("div")`
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
`;

const Header = styled("div")`
  text-align: center;
  margin-bottom: 32px;

  h2 {
    margin: 0 0 16px 0;
    color: var(--text-color);
    font-size: 1.5rem;
    font-weight: 700;
  }
`;

const BoostSection = styled("div")`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 20px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const StatusItem = styled("div")<{ highlight?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.95rem;
  color: ${(props) => (props.highlight ? "var(--accent-color)" : "var(--secondary-text)")};
  padding: 8px 16px;
  background: ${(props) =>
    props.highlight ? "rgba(255, 102, 0, 0.1)" : "#1a1a1a"};
  border-radius: 8px;
  border: 1px solid ${(props) => (props.highlight ? "var(--accent-color)" : "var(--border-color)")};
  font-weight: ${(props) => (props.highlight ? "600" : "normal")};
`;

export const Temperature = () => {
  const { state, actions, display } = useVentyVeazy();

  const isCelsius = () => state.status?.isCelsius ?? true;
  const isHeating = () =>
    (state.status?.heaterMode ?? HeaterMode.OFF) !== HeaterMode.OFF;

  // Keep the screen on while the device heats
  useWakeLock(isHeating);

  // Verwende heaterMode vom Gerät anstatt lokalen State
  const getCurrentBoostMode = () => {
    const mode = state.status?.heaterMode;
    if (mode === HeaterMode.BOOST) return "boost";
    if (mode === HeaterMode.SUPERBOOST) return "superboost";
    return "none";
  };

  // All adjustments are in °C; the store clamps to the device limits
  const adjustTemperature = (change: number) => {
    if (!state.status) return;
    actions.setTargetTemp(state.status.targetTemp + change);
  };

  const adjustBoostTemp = (change: number) => {
    if (!state.status) return;
    actions.setBoostTemp(state.status.boostTemp + change);
  };

  const adjustSuperBoostTemp = (change: number) => {
    if (!state.status) return;
    actions.setSuperBoostTemp(state.status.superBoostTemp + change);
  };

  const activateBoost = (type: "boost" | "superboost") => {
    if (getCurrentBoostMode() === type) {
      // Deaktiviere aktuellen Boost → zurück zu normalem Heater-Modus
      actions.setHeaterMode(HeaterMode.NORMAL);
    } else {
      actions.setHeaterMode(
        type === "boost" ? HeaterMode.BOOST : HeaterMode.SUPERBOOST
      );
    }
  };

  return (
    <Container>
      <Header>
        <h2>{m.temperature_ventyVeazyControl()}</h2>
      </Header>

      <EffectiveTemperatureStatus
        effectiveTemp={display.effectiveTemp()}
        isCelsius={isCelsius()}
      />

      <MainTemperatureControl
        targetTemp={display.targetTemp()}
        isCelsius={isCelsius()}
        isHeating={isHeating()}
        setpointReached={
          isHeating() && (state.status?.setpointReached ?? false)
        }
        onAdjustTemperature={adjustTemperature}
        onToggleHeater={actions.toggleHeater}
      />

      {/* Boost Controls */}
      <BoostSection>
        <BoostControl
          title="Boost Temperature"
          temp={display.boostTemp()}
          isCelsius={isCelsius()}
          active={getCurrentBoostMode() === "boost"}
          onActivate={() => activateBoost("boost")}
          onAdjustTemp={adjustBoostTemp}
        />

        <BoostControl
          title="Super Boost"
          temp={display.superBoostTemp()}
          isCelsius={isCelsius()}
          active={getCurrentBoostMode() === "superboost"}
          onActivate={() => activateBoost("superboost")}
          onAdjustTemp={adjustSuperBoostTemp}
        />
      </BoostSection>

      <Show when={getCurrentBoostMode() !== "none"}>
        <StatusItem
          highlight={true}
          style={{ "margin-top": "16px", "text-align": "center" }}
        >
          {getCurrentBoostMode() === "boost" ? "Boost" : "Super Boost"} Mode
          Active
        </StatusItem>
      </Show>
    </Container>
  );
};
