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
import { HeatingTimeDisplay } from "../components/volcano/HeatingTimeDisplay";
import { useTranslations } from "../i18n/utils";
import { useBluetooth } from "../provider/BluetoothProvider";
import { ConnectionState } from "../utils/uuids";
import { buildRoute } from "../routes";


const ImageBgTop = styled("div")`
  min-width: 800px;
  min-height: 150px;
  background-image: url('/background-1.png');
  background-position: center;
  background-size: 800px;
  background-repeat: no-repeat;
  padding: 20px;
  margin: 20px auto;

`;

const ImageBgLine = styled("div")`
  min-width: 800px;
  min-height: 75px;
  background-image: url('/background-2.png');
  background-position: center;
  background-size: 800px;
  background-repeat: no-repeat;
  padding: 20px;
  margin: 20px auto;
  border-radius: 16px;
  border: 1px solid var(--border-color);

`;

const ImageBgFooter = styled("div")`
  min-width: 800px;
  min-height: 150px;
  background-image: url('/background-3.png');
  background-position: center;
  background-size: 800px;
  background-repeat: no-repeat;
  padding: 20px;
  margin: 20px auto;

`;

const MainCard = styled("div")`
  border-radius: 16px;
  padding: 20px;
  margin: 20px auto;
  border: 1px solid var(--border-color);
  min-width: 800px;
`;

const SettingsContainer = styled("div")`
  min-width: 800px;
  margin: 20px auto;
  padding: 20px;
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
      <ImageBgTop />
      <ShutdownTime />
      <MainCard>
        <Temperature />
        <HeatAndPump />
        <HeatingTimeDisplay />
      </MainCard>
      <ImageBgLine />

      {/* Workflows */} 
      <WorkFlowSection />
      <ImageBgLine />

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
        <SettingItem>
        </SettingItem>
      </SettingsContainer>
      <ImageBgLine />
     <ImageBgFooter />
    </>
  );
};
