import { Component } from "solid-js";
import { styled } from "solid-styled-components";
import { useVolcano } from "../../provider/VolcanoProvider";
import { useTranslations } from "../../i18n/utils";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled("h3")`
  color: var(--accent-color);
  font-size: 1.2rem;
  margin-bottom: 8px;
  font-family: CustomFont;
`;

const TimeDisplay = styled("div")`
  font-family: "CustomFont";
  font-size: 1.5rem;
  color: var(--text-color);
  display: flex;
  align-items: center;
`;

const TimeValue = styled("span")`
  margin: 0 4px;
`;

export const HeatingTimeDisplay: Component = () => {
  const { state } = useVolcano();
  const t = useTranslations();

  return (
    <Container>
      <Title>{t("deviceRuntime")}</Title>
      <TimeDisplay>
        <TimeValue>{state.heatingHours}</TimeValue>
        <span>h</span>
        <TimeValue>{state.heatingMinutes}</TimeValue>
        <span>m</span>
      </TimeDisplay>
    </Container>
  );
};
