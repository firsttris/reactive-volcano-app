import { Component } from "solid-js";
import { styled } from "solid-styled-components";
import { useHeatingTime } from "../../hooks/volcano/useHeatingTime";
import { useTranslations } from "../../i18n/utils";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled("h3")`
  color: gold;
  font-weight: bold;
  font-size: 1.2rem;
  margin-bottom: 8px;
  font-family: CustomFont;
`;

const TimeDisplay = styled("div")`
  font-family: "CustomFont";
  font-size: 1.5rem;
  color: #ffffff;
  display: flex;
  align-items: center;
`;

const TimeValue = styled("span")`
  margin: 0 4px;
`;

export const HeatingTimeDisplay: Component = () => {
  const { getHoursOfHeating, getMinutesOfHeating } = useHeatingTime();
  const t = useTranslations();

  return (
    <Container>
      <Title>{t("deviceRuntime")}</Title>
      <TimeDisplay>
        <TimeValue>{getHoursOfHeating()}</TimeValue>
        <span>h</span>
        <TimeValue>{getMinutesOfHeating()}</TimeValue>
        <span>m</span>
      </TimeDisplay>
    </Container>
  );
};
