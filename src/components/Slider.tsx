import { createEffect, createSignal, For, JSX } from "solid-js";
import { styled } from "solid-styled-components";

const SliderInput = styled("input")`
  width: 100%;
  height: 8px;
  -webkit-appearance: none;
  appearance: none;
  background: #444;
  outline: none;
  border-radius: 4px;
  transition: all 0.2s;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #f60;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(255, 102, 0, 0.5);
    transition: all 0.2s;

    &:hover {
      background: #ff7700;
      box-shadow: 0 2px 12px rgba(255, 102, 0, 0.7);
    }
  }

  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #f60;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 8px rgba(255, 102, 0, 0.5);
    transition: all 0.2s;

    &:hover {
      background: #ff7700;
      box-shadow: 0 2px 12px rgba(255, 102, 0, 0.7);
    }
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
  color: #999;
  font-size: 0.9rem;
`;

const VerticalLine = styled("div")<{ isVisible: boolean }>`
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: 8px;
  background: #555;
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
  margin-bottom: 15px;
  margin-left: 3px;
  display: flex;
  align-items: center;
  color: #ccc;
  font-size: 1rem;
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
