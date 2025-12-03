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

const ZenStudioTitle = styled("div")`
  color: white;
  font-size: 1.5rem;
  margin-bottom: 24px;
  text-align: center;
  font-family: CustomFont;
`;

const ZenStudio = styled("div")`
  min-width: 800px;
  margin: 20px auto;
  padding: 20px;
  border-radius: 16px;
  border: 1px solid var(--border-color);
`;

const YTVideo = styled("div")`
  min-width: 700px;
  min-height: 450px;
  padding: 20px;
  margin: 20px auto;
  display: flex;
  align: center;
  justify-content: center; /* center the audio player */

`;

const FishTank = styled("div")`
  min-width: 800px;
  min-height: 450px;
  padding: 20px;
  margin: 20px auto;
  display: flex;
  align: center;
  justify-content: center; /* center the audio player */
  border-radius: 16px;
  border: 1px solid var(--border-color);

`;

const AudioCard1 = styled("div")`
  min-width: 750px;
  min-height: 30px;
  padding: 20px;
  display: flex;
  align: center;
  justify-content: center; /* center the audio player */
  background-color: var(--card-bg-color, transparent); /* optional background */

  audio {
    width: 800px;       /* fixed width */
    max-width: 100%;    /* responsive fallback */
    background-color: black;
    color: white;
    border-radius: 8px;
  }
`;

const AudioCard = styled("div")`
  min-width: 750px;
  min-height: 30px;
  padding: 20px;
  display: flex;
  align: center;
  justify-content: center; /* center the audio player */
  background-color: var(--card-bg-color, transparent); /* optional background */

  audio {
    width: 800px;       /* fixed width */
    max-width: 100%;    /* responsive fallback */
    background-color: black;
    color: white;
    border-radius: 8px;
  }
`;

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
  min-height: 10px;
  background-image: url('/background-2.png');
  background-position: center;
  background-size: 800px;
  background-repeat: no-repeat;
  padding: 20px;
  margin: 20px auto;
  border-radius: 16px;

`;

const ImageBgFooter = styled("div")`
  min-width: 800px;
  min-height: 150px;
  background-image: url('/background-3.png');
  background-position: center;
  background-size: 800px;
  background-repeat: no-repeat;
  padding: 20px;

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
  color: #ffffff;
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
        <SettingItem>
        </SettingItem>
      </SettingsContainer>
      <ImageBgLine />
      <ZenStudio>
       <ZenStudioTitle>{t("zenstudio")}</ZenStudioTitle>
       <YTVideo>
         <iframe width="800" height="480" src="https://www.youtube.com/embed/2wYtJwDkKIk?si=oNif7cIBLopPzclP?autoplay=1&loop=1" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>      
       </YTVideo>
       <AudioCard1>
        <div style="align: center, min-width: 800px"><audio controls src="/sound-1.mp3" loop /></div>
       </AudioCard1>
       <AudioCard>
        <div style="align: center, min-width: 800px"><audio controls src="/sound.mp3" loop /></div>
       </AudioCard>
      </ZenStudio>


      <FishTank>
	<iframe width="800" height="480" src="https://www.youtube.com/embed/1zcIUk66HX4?si=_CRmoZZ-756DNcyJ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
      </FishTank>
      <ImageBgFooter />
    </>
  );
};
