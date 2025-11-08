import { Component } from "solid-js";
import { styled } from "solid-styled-components";

interface TemperatureDisplayProps {
  value: number;
  unit: "C" | "F";
  isOffset?: boolean;
}

const TempContainer = styled("div")`
  font-family: "CustomFont";
  display: flex;
  line-height: 1;
  justify-content: center;
`;

const TempValue = styled("div")``;

const UnitContainer = styled("div")`
  display: flex;
  align-self: flex-start;
  margin-left: 0.05em;
  margin-top: 0.03em;
`;

const Unit = styled("div")`
  font-size: 0.5em;
`;

const DegreeSymbol = styled("div")`
  font-size: 0.3em;
  margin-right: 0.1em;
`;

const PlusSign = styled("div")`
  display: flex;
  align-items: center;
  font-size: 0.8em;
  margin-right: 0.1em;
`;

export const TemperatureDisplay: Component<TemperatureDisplayProps> = (
  props
) => {
  return (
    <TempContainer>
      {props.isOffset && <PlusSign>+</PlusSign>}
      <TempValue>{props.value}</TempValue>
      <UnitContainer>
        <DegreeSymbol>°</DegreeSymbol>
        <Unit>{props.unit}</Unit>
      </UnitContainer>
    </TempContainer>
  );
};
