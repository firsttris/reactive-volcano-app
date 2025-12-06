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
  background: var(--secondary-bg);
  border-radius: 36px;
  position: relative;
  cursor: pointer;
  transition: background 0.3s;
  border: 2px solid var(--border-color);

  &:hover {
    background: var(--bg-color);
    border-color: var(--text-color);
  }
`;

const SwitchButton = styled("div")<SwitchButtonProps>`
  width: 30px;
  height: 30px;
  color: var(--text-color);
  background: ${(props) => (props.isOn ? "#f60" : "var(--border-color)")};
  position: absolute;
  top: 3px;
  left: ${(props) => (props.isOn ? "39px" : "1px")};
  border-radius: 50%;
  transition: all 0.3s ease;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: ${(props) =>
    props.isOn
      ? "0 2px 8px rgba(255, 102, 0, 0.5)"
      : "0 2px 4px rgba(0, 0, 0, 0.3)"};
`;

const Label = styled("div")`
  margin-left: 10px;
  color: var(--text-color);
  font-size: 1rem;
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
