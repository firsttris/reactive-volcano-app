import { createEffect, createSignal, For, JSX } from "solid-js";
import { styled } from "solid-styled-components";

const SliderInput = styled("input")`
  width: 100%;
  height: 5px;
  -webkit-appearance: none;
  appearance: none;
  background: #ddd;
  outline: none;
  opacity: 0.7;
  transition: opacity 0.2s;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 25px;
    height: 25px;
    border-radius: 5px;
    background: #f60;
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: 25px;
    height: 25px;
    background: #f60;
    cursor: pointer;
  }
`;

interface SliderProps {
  value: number;
  onInput: (value: number) => void;
  min: number;
  max: number;
  step: number;
  label: JSX.Element;
}

interface SliderMarksProps {
  min?: number;
  max?: number;
  step?: number;
  value: number;
}

interface MarkProps {
  isFirst: boolean;
}

const Container = styled("div")`
  display: flex;
  justify-content: space-between;
`;

const Mark = styled("span")<MarkProps>`
  position: relative;
  margin-top: 15px;
  text-align: center;
  width: 1em;
  font-family: CustomFont;
  margin-left: ${(props) => (props.isFirst ? "5px" : "0px")};
`;

const VerticalLine = styled("div")<{ isVisible: boolean }>`
  position: absolute;
  top: -22px;
  left: 50%;
  transform: translateX(-50%);
  width: 5px;
  height: 5px;
  background: #333;
  visibility: ${(props) => (props.isVisible ? "visible" : "hidden")};
`;

const SliderMarks = (props: SliderMarksProps) => {
  const [marks, setMarks] = createSignal<number[]>([]);

  createEffect(() => {
    if (props.min === undefined || !props.max) return;
    const newMarks: number[] = [];
    for (let i = props.min; i <= props.max; i += props.step ?? 1) {
      newMarks.push(i);
    }
    setMarks(newMarks);
  });

  return (
    <Container>
      <For each={marks()}>
        {(mark, index) => (
          <Mark isFirst={index() === 0}>
            {mark}
            <VerticalLine isVisible={mark !== props.value} />
          </Mark>
        )}
      </For>
    </Container>
  );
};

const SliderContainer = styled("div")`
  margin-top: 20px;
  display: flex;
  align-items: start;
  flex-direction: column;
`;

const LabelContainer = styled("div")`
  margin-bottom: 20px;
  margin-left: 3px;
  display: flex;
  align-items: center;
`;

const SliderContent = styled("div")`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

export const Slider = (props: SliderProps) => {
  return (
    <SliderContainer>
      <LabelContainer>{props.label}</LabelContainer>
      <SliderContent>
        <SliderInput
          type="range"
          min={props.min}
          max={props.max}
          step={props.step}
          value={props.value}
          onInput={(e) => {
            const newValue = Number(e.currentTarget.value);
            props.onInput(newValue);
          }}
        />
        <SliderMarks
          min={props.min}
          max={props.max}
          step={props.step}
          value={props.value || props.min}
        />
      </SliderContent>
    </SliderContainer>
  );
};
