import { useNavigate } from "@solidjs/router";
import { type Component, createEffect } from "solid-js";
import { styled } from "solid-styled-components";
import { Card, CollapsibleCard } from "../components/Card";
import { Analysis } from "../components/volcano/Analysis";
import { AutoShutdownSlider } from "../components/volcano/AutoshutdownSlider";
import { BrightnessSlider } from "../components/volcano/BrightnessSlider";
import { HeatAndPump } from "../components/volcano/HeatAndPump";
import { HeatingTimeDisplay } from "../components/volcano/HeatingTimeDisplay";
import { ShutdownTime } from "../components/volcano/ShutdownTime";
import { StandbyDisplaySwitch } from "../components/volcano/StandbyDisplaySwitch";
import { Temperature } from "../components/volcano/Temperature";
import { TemperatureUnitSwitch } from "../components/volcano/TemperatureUnitSwitch";
import { VibrationSwitch } from "../components/volcano/VibrationSwitch";
import { WorkFlowSection } from "../components/volcano/Workflow/WorkflowSection";
import { useTranslations } from "../i18n/utils";
import { useBluetooth } from "../provider/BluetoothProvider";
import { buildRoute } from "../routes";
import { ConnectionState } from "../utils/uuids";

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
      <Card>
        <div style={{ "margin-bottom": "24px" }}>
          <Temperature />
        </div>
        <HeatAndPump />
      </Card>

      {/* Workflows */}
      <WorkFlowSection />

      {/* Settings */}
      <CollapsibleCard title={t("settings")} storageKey="volcano-settings">
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
            <TemperatureUnitSwitch />
          </SwitchContainer>
        </SwitchesContainer>
        <SettingItem>
          <HeatingTimeDisplay />
        </SettingItem>
        <SettingItem>
          <Analysis />
        </SettingItem>
      </CollapsibleCard>
    </>
  );
};
