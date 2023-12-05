import { Component, Show, createEffect, createSignal } from "solid-js";
import { styled } from "solid-styled-components";
import type { JSX } from "solid-js";

const Container = styled("div")`
  display: flex;
  align-items: center;
`;

interface SwitchButtonProps {
  isOn: boolean;
  darkMode?: boolean;
}

const SwitchWrapper = styled("div")`
  width: 72px; 
  height: 36px;
  background: #bbb;
  border-radius: 36px; 
  position: relative;
  cursor: pointer;
`;

const SwitchButton = styled("div")<SwitchButtonProps>`
  width: 33.6px; 
  height: 33.6px; 
  color: #000;
  background: ${(props) => (props.isOn ? "#f60" : "white")};
  position: absolute;
  top: 1.2px; 
  left: ${(props) => (props.isOn ? "36px" : "1.2px")}; 
  border-radius: 50%;
  transition: all 0.3s;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Label = styled("div")`
  margin-left: 10px;
`;

interface SwitchProps {
  onToggle: (isOn: boolean) => void;
  icon?: JSX.Element;
  label?: string;
  isOn?: boolean;
}

export const Switch: Component<SwitchProps> = (props) => {
  const [isOn, setIsOn] = createSignal(false);

  createEffect(() => {
    setIsOn(!!props.isOn);
  });

  const toggleSwitch = () => {
    setIsOn(!isOn());
    props.onToggle(isOn());
  };

  return (
    <Container>
      <SwitchWrapper onClick={toggleSwitch}>
        <SwitchButton isOn={isOn()}>{props.icon}</SwitchButton>
      </SwitchWrapper>
      <Show when={props.label}>
        <Label>{props.label}</Label>
      </Show>
    </Container>
  );
};
