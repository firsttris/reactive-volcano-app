import { styled } from "solid-styled-components";
import { RoundButton, WideButton } from "../Button";
import { FaSolidMinus, FaSolidPlus } from "solid-icons/fa";
import { TemperatureDisplay } from "../TemperatureDisplay";
import { useTranslations } from "../../i18n/utils";

const TemperatureCard = styled("div")`
  background: var(--secondary-bg);
  border-radius: 16px;
  padding: 32px 24px;
  margin-bottom: 24px;
  border: 1px solid var(--border-color);
`;

const DigitalText = styled("div")<{
  isHeating?: boolean;
  setpointReached?: boolean;
}>`
  font-size: 72px;
  line-height: 1;
  min-width: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(props) =>
    props.setpointReached
      ? "var(--reached-color)"
      : props.isHeating
        ? "var(--heating-color)"
        : "var(--text-color)"};
  margin-top: 20px;
  transition: all 0.3s ease;

  ${(props) =>
    props.setpointReached
      ? `
        text-shadow: 
          0 0 10px rgba(0, 255, 102, 0.8),
          0 0 20px rgba(0, 255, 102, 0.6),
          0 0 30px rgba(0, 255, 102, 0.4),
          0 0 40px rgba(0, 255, 102, 0.2);
        animation: reached-glow 2s ease-in-out infinite alternate;
        
        @keyframes reached-glow {
          from {
            text-shadow: 
              0 0 10px rgba(0, 255, 102, 0.8),
              0 0 20px rgba(0, 255, 102, 0.6),
              0 0 30px rgba(0, 255, 102, 0.4),
              0 0 40px rgba(0, 255, 102, 0.2);
          }
          to {
            text-shadow: 
              0 0 15px rgba(0, 255, 102, 1),
              0 0 25px rgba(0, 255, 102, 0.8),
              0 0 35px rgba(0, 255, 102, 0.6),
              0 0 45px rgba(0, 255, 102, 0.4);
          }
        }
      `
      : props.isHeating
        ? `
        text-shadow: 
          0 0 10px rgba(255, 102, 0, 0.8),
          0 0 20px rgba(255, 102, 0, 0.6),
          0 0 30px rgba(255, 102, 0, 0.4),
          0 0 40px rgba(255, 102, 0, 0.2);
        animation: heating-glow 2s ease-in-out infinite alternate;
        
        @keyframes heating-glow {
          from {
            text-shadow: 
              0 0 10px rgba(255, 102, 0, 0.8),
              0 0 20px rgba(255, 102, 0, 0.6),
              0 0 30px rgba(255, 102, 0, 0.4),
              0 0 40px rgba(255, 102, 0, 0.2);
          }
          to {
            text-shadow: 
              0 0 15px rgba(255, 102, 0, 1),
              0 0 25px rgba(255, 102, 0, 0.8),
              0 0 35px rgba(255, 102, 0, 0.6),
              0 0 45px rgba(255, 102, 0, 0.4);
          }
        }
      `
        : ""}
`;

const TempDisplay = styled("div")`
  text-align: center;
  margin-bottom: 32px;
`;

const TempLabel = styled("span")`
  display: block;
  font-size: 0.9rem;
  color: var(--secondary-text);
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const TempControls = styled("div")`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 45px;

  @media (max-width: 375px) {
    gap: 25px;
  }

  @media (max-width: 320px) {
    gap: 10px;
  }
`;

interface MainTemperatureControlProps {
  targetTemp: number;
  isCelsius: boolean;
  isHeating: boolean;
  setpointReached: boolean;
  onAdjustTemperature: (change: number) => void;
  onToggleHeater: () => void;
}

export const MainTemperatureControl = (props: MainTemperatureControlProps) => {
  const t = useTranslations();
  return (
    <TemperatureCard>
      <TempDisplay>
        <TempLabel>{t("targetTemperature")}</TempLabel>
        <DigitalText
          isHeating={props.isHeating}
          setpointReached={props.setpointReached}
        >
          <TemperatureDisplay
            value={props.targetTemp}
            unit={props.isCelsius ? "C" : "F"}
          />
        </DigitalText>
      </TempDisplay>

      <TempControls>
        <RoundButton onClick={() => props.onAdjustTemperature(-1)}>
          <FaSolidMinus />
        </RoundButton>

        <WideButton onClick={props.onToggleHeater} isHeating={props.isHeating}>
          <span class="icon">🔥</span>
          {props.isHeating ? "ON" : "OFF"}
        </WideButton>

        <RoundButton onClick={() => props.onAdjustTemperature(1)}>
          <FaSolidPlus />
        </RoundButton>
      </TempControls>
    </TemperatureCard>
  );
};
