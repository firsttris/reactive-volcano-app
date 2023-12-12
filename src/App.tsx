import { BrightnessSlider } from "./components/Slider/BrightnessSlider";
import { AutoShutdownSlider } from "./components/Slider/AutoshutdownSlider";
import { Temperature } from "./components/Temperature";
import { HeatAndPump } from "./components/HeatAndPump";
import { ShutdownTime } from "./components/ShutdownTime";
import { VibrationSwitch } from "./components/Switch/VibrationSwitch";
import { DarkModeSwitch } from "./components/Switch/DarkModeSwitch";
import { StandbyDisplaySwitch } from "./components/Switch/StandbyDisplaySwitch";
import { ConnectionBar } from "./components/Connect/ConnectionBar";
import { styled } from "solid-styled-components";
import { useTranslations } from "./i18n/utils";
import { WorkFlowSection } from "./components/Workflow/WorkflowSection";

const ResponsiveContainer = styled("div")`
  display: flex;
  flex-direction: column;
  margin: 25px;
  max-width: 600px;
  width: 100%;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: 768px) {
    margin: 0px;
    max-width: unset;
  }
`;

const SwitchesContainer = styled("div")`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  margin-top: 50px;
  margin-bottom: 20px;
`;

const SwitchContainer = styled("div")`
  display: flex;
  flex-direction: row;
  width: 100%;
  justify-content: space-between;

  @media (max-width: 375px) {
    flex-direction: column;
    gap: 25px;
  }
`;

export const App = () => {
  const t = useTranslations();
  return (
    <div style={{ display: "flex", "flex-direction": "column" }}>
      <ConnectionBar />
      <ResponsiveContainer>
        <div style={{ "margin-left": "20px", "margin-right": "20px" }}>
          <div>
            <div style={{ "margin-top": "20px", "margin-bottom": "20px" }}>
              <ShutdownTime />
            </div>
            <div style={{ "margin-bottom": "30px" }}>
              <Temperature />
            </div>
            <HeatAndPump />
          </div>

          <WorkFlowSection />
          <div style={{ "margin-top": "50px" }}>
            <div style={{ "font-size": "30px" }}>{t("settings")}</div>

            <div style={{ "margin-bottom": "10px" }}>
              <AutoShutdownSlider />
            </div>
            <BrightnessSlider />

            <SwitchesContainer>
              <SwitchContainer>
                <VibrationSwitch />
                <StandbyDisplaySwitch />
              </SwitchContainer>
              <div
                style={{
                  display: "flex",
                  "flex-direction": "row",
                  width: "100%",
                  "justify-content": "space-between",
                  "margin-top": "25px",
                }}
              >
                <DarkModeSwitch />
              </div>
            </SwitchesContainer>
          </div>
        </div>
      </ResponsiveContainer>
    </div>
  );
};
