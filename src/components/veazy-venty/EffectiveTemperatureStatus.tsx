import { styled } from "solid-styled-components";
import { TemperatureDisplay } from "../TemperatureDisplay";
import { useTranslations } from "../../i18n/utils";

const StatusBar = styled("div")`
  display: flex;
  justify-content: center;
  gap: 24px;
  flex-wrap: wrap;
  margin-bottom: 24px;
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

const TempDisplayWrapper = styled("div")`
  margin-top: 5px;
`;

interface EffectiveTemperatureStatusProps {
  effectiveTemp: number;
  isCelsius: boolean;
}

export const EffectiveTemperatureStatus = (
  props: EffectiveTemperatureStatusProps
) => {
  const t = useTranslations();

  return (
    <StatusBar>
      <StatusItem highlight={true}>
        {t("effective")}:{" "}
        <TempDisplayWrapper>
          <TemperatureDisplay
            value={props.effectiveTemp}
            unit={props.isCelsius ? "C" : "F"}
          />
        </TempDisplayWrapper>
      </StatusItem>
    </StatusBar>
  );
};
