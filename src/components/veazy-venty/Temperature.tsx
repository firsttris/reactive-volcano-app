import { Show } from "solid-js";
import { styled } from "solid-styled-components";
import { useDeviceStatusContext } from "../../provider/DeviceStatusProvider";
import { EffectiveTemperatureStatus } from "./EffectiveTemperatureStatus";
import { MainTemperatureControl } from "./MainTemperatureControl";
import { BoostControl } from "./BoostControl";
import { useTranslations } from "../../i18n/utils";

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
    color: white;
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
  color: ${(props) => (props.highlight ? "#f60" : "#ccc")};
  padding: 8px 16px;
  background: ${(props) =>
    props.highlight ? "rgba(255, 102, 0, 0.1)" : "#1a1a1a"};
  border-radius: 8px;
  border: 1px solid ${(props) => (props.highlight ? "#f60" : "#444")};
  font-weight: ${(props) => (props.highlight ? "600" : "normal")};
`;

export const Temperature = () => {
  const {
    status,
    setTargetTemp,
    setBoostTemp,
    setSuperBoostTemp,
    setHeaterMode,
    targetTemp,
    boostTemp,
    superBoostTemp,
    effectiveTemp,
  } = useDeviceStatusContext();

  // Verwende heaterMode vom Gerät anstatt lokalen State
  const getCurrentBoostMode = () => {
    const mode = status()?.heaterMode;
    if (mode === 2) return "boost";
    if (mode === 3) return "superboost";
    return "none";
  };

  const adjustTemperature = async (change: number) => {
    const currentTemp = status()?.targetTemp ?? 0;
    const newTemp = Math.max(40, Math.min(230, currentTemp + change));

    try {
      await setTargetTemp(newTemp);
    } catch (error) {
      console.error("Failed to set temperature:", error);
    }
  };

  const t = useTranslations();

  const adjustBoostTemp = async (change: number) => {
    const currentTemp = status()?.boostTemp;
    if (currentTemp === null || currentTemp === undefined) {
      console.warn(
        "Cannot adjust boost temperature: no current value available"
      );
      return;
    }

    const newTemp = currentTemp + change;
    try {
      await setBoostTemp(newTemp);
    } catch (error) {
      console.error("Failed to adjust boost temperature:", error);
    }
  };

  const adjustSuperBoostTemp = async (change: number) => {
    const currentTemp = status()?.superBoostTemp;
    if (currentTemp === null || currentTemp === undefined) {
      console.warn(
        "Cannot adjust superboost temperature: no current value available"
      );
      return;
    }

    const newTemp = currentTemp + change;
    try {
      await setSuperBoostTemp(newTemp);
    } catch (error) {
      console.error("Failed to adjust superboost temperature:", error);
    }
  };

  const toggleHeater = async () => {
    try {
      const currentMode = status()?.heaterMode ?? 0;
      // Toggle between off (0) and normal (1)
      await setHeaterMode(currentMode > 0 ? 0 : 1);
    } catch (error) {
      console.error("Failed to toggle heater:", error);
    }
  };

  const activateBoost = async (type: "boost" | "superboost") => {
    const currentMode = getCurrentBoostMode();

    try {
      if (currentMode === type) {
        // Deaktiviere aktuellen Boost → zurück zu normalem Heater-Modus
        await setHeaterMode(1); // Mode 1 = normal heater
      } else {
        // Aktiviere Boost-Modus direkt
        const targetMode = type === "boost" ? 2 : 3; // Mode 2 = boost, Mode 3 = superboost
        await setHeaterMode(targetMode);
      }
    } catch (error) {
      console.error(`Failed to change heater mode for ${type}:`, error);
    }
  };

  return (
    <Container>
      <Header>
        <h2>{t("ventyVeazyTemperatureControl")}</h2>
      </Header>

      <EffectiveTemperatureStatus
        effectiveTemp={effectiveTemp()}
        isCelsius={status()?.isCelsius ?? true}
      />

      <MainTemperatureControl
        targetTemp={targetTemp()}
        isCelsius={status()?.isCelsius ?? true}
        isHeating={status()?.isHeating ?? false}
        setpointReached={
          (status()?.isHeating && status()?.setpointReached) ?? false
        }
        onAdjustTemperature={adjustTemperature}
        onToggleHeater={toggleHeater}
      />

      {/* Boost Controls */}
      <BoostSection>
        <BoostControl
          title="Boost Temperature"
          temp={boostTemp()}
          isCelsius={status()?.isCelsius ?? true}
          active={getCurrentBoostMode() === "boost"}
          onActivate={() => activateBoost("boost")}
          onAdjustTemp={adjustBoostTemp}
        />

        <BoostControl
          title="Super Boost"
          temp={superBoostTemp()}
          isCelsius={status()?.isCelsius ?? true}
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
