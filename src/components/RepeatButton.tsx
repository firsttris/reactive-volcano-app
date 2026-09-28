import { createEffect, type JSX, onCleanup } from "solid-js";
import { styled } from "solid-styled-components";
import { RoundButton } from "./Button";

// Hold to repeat: wait a bit, then step faster the longer the button is held
const INITIAL_DELAY_MS = 400;
const START_INTERVAL_MS = 150;
const MIN_INTERVAL_MS = 40;
const ACCELERATION = 0.85;

interface RepeatButtonProps {
  onStep: () => void;
  disabled?: boolean;
  "aria-label": string;
  children: JSX.Element;
}

const HoldableRoundButton = styled(RoundButton)`
  touch-action: manipulation;
  -webkit-touch-callout: none;

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }
`;

export const RepeatButton = (props: RepeatButtonProps) => {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const stop = () => {
    clearTimeout(timer);
    timer = undefined;
  };

  const repeat = (interval: number) => {
    timer = setTimeout(() => {
      props.onStep();
      repeat(Math.max(MIN_INTERVAL_MS, interval * ACCELERATION));
    }, interval);
  };

  const start = (event: PointerEvent) => {
    if (event.button !== 0 || props.disabled) return;
    stop();
    props.onStep();
    timer = setTimeout(() => repeat(START_INTERVAL_MS), INITIAL_DELAY_MS);
  };

  createEffect(() => {
    if (props.disabled) stop();
  });
  onCleanup(stop);

  return (
    <HoldableRoundButton
      type="button"
      disabled={props.disabled}
      aria-label={props["aria-label"]}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(event) => event.preventDefault()}
      // Pointer presses are handled above; this only covers the keyboard
      onClick={(event) => {
        if (event.detail === 0) props.onStep();
      }}
    >
      {props.children}
    </HoldableRoundButton>
  );
};
