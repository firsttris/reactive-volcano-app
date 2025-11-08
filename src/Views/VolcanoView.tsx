import { Component, createEffect } from "solid-js";
import { styled } from "solid-styled-components";
import { useNavigate } from "@solidjs/router";
import { Temperature } from "../components/volcano/Temperature";
import { HeatAndPump } from "../components/volcano/HeatAndPump";
import { ShutdownTime } from "../components/volcano/ShutdownTime";
import { BrightnessSlider } from "../components/volcano/BrightnessSlider";
import { AutoShutdownSlider } from "../components/volcano/AutoshutdownSlider";
import { VibrationSwitch } from "../components/volcano/VibrationSwitch";
import { DarkModeSwitch } from "../components/DarkModeSwitch";
import { StandbyDisplaySwitch } from "../components/volcano/StandbyDisplaySwitch";
import { WorkFlowSection } from "../components/volcano/Workflow/WorkflowSection";
import { useTranslations } from "../i18n/utils";
import { useBluetooth } from "../provider/BluetoothProvider";
import { ConnectionState } from "../utils/uuids";
import { buildRoute } from "../routes";

const MainCard = styled("div")`
  background: var(--secondary-bg);
  border-radius: 16px;
  padding: 24px;
  margin: 20px auto;
  border: 1px solid var(--border-color);
  max-width: 600px;
`;

const SettingsContainer = styled("div")`
  max-width: 600px;
  margin: 20px auto;
  padding: 20px;
  background: var(--secondary-bg);
  border-radius: 16px;
  border: 1px solid var(--border-color);
`;

const SettingsTitle = styled("h2")`
  color: var(--accent-color);
  font-size: 1.5rem;
  margin-bottom: 24px;
  text-align: center;
  font-family: CustomFont;
`;

const SettingItem = styled("div")`
  margin-bottom: 20px;
`;

const SwitchesContainer = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 20px;
`;

const SwitchContainer = styled("div")`
  display: flex;
  flex-direction: row;
  width: 100%;
  justify-content: space-between;
  gap: 15px;

  @media (max-width: 375px) {
    flex-direction: column;
    gap: 15px;
  }
`;

export const VolcanoView: Component = () => {
  const t = useTranslations();
  const navigate = useNavigate();
  const { connectionState } = useBluetooth();

  // Redirect to connect page if not connected
  createEffect(() => {
    const state = connectionState();
    if (
      state === ConnectionState.NOT_CONNECTED ||
      state === ConnectionState.CONNECTION_FAILED
    ) {
      navigate(buildRoute.root());
    }
  });

  return (
    <>
      {/* Main Controls */}
      <ShutdownTime />
      <MainCard>
        <div style={{ "margin-bottom": "24px" }}>
          <Temperature />
        </div>
        <HeatAndPump />
      </MainCard>

      {/* Workflows */}
      <WorkFlowSection />

      {/* Settings */}
      <SettingsContainer>
        <SettingsTitle>{t("settings")}</SettingsTitle>

        <SettingItem>
          <AutoShutdownSlider />
        </SettingItem>
        <SettingItem>
          <BrightnessSlider />
        </SettingItem>
        <SwitchesContainer>
          <SwitchContainer>
            <VibrationSwitch />
            <StandbyDisplaySwitch />
          </SwitchContainer>
          <SwitchContainer>
            <DarkModeSwitch />
          </SwitchContainer>
        </SwitchesContainer>
      </SettingsContainer>
    </>
  );
};
