import { Component, createSignal } from "solid-js";
import { Slider } from "../Slider/Slider";
import { useTranslations } from "../../i18n/utils";
import { ButtonWithOrangeAnimation } from "../Button/Button";

type WorkflowFormProps = {
  onSubmit: (temperature: number, holdTime: number, pumpTime: number) => void;
};

export const WorkflowForm: Component<WorkflowFormProps> = (props) => {
  const [temperature, setTemperature] = createSignal(0);
  const [holdTime, setHoldTime] = createSignal(0);
  const [pumpTime, setPumpTime] = createSignal(0);
  const t = useTranslations();

  const handleSubmit = (event: Event) => {
    event.preventDefault();
    props.onSubmit(temperature(), holdTime(), pumpTime());
  };

  return (
    <form onSubmit={handleSubmit}>
      <Slider 
      value={temperature()}
      label={`${t('temperature')}: ${temperature()} C°`}
      min={130}
      step={1}
      max={230}
      onInput={(value) => setTemperature(value)} 
    />
    <Slider
        value={holdTime()}
        label={`${t('holdTime')}: ${holdTime()} min`}
        min={1}
        step={1}
        max={20}
        onInput={(value) => setHoldTime(value)}
        />
        <Slider
        value={pumpTime()}
        label={`${t('pumpTime')}: ${pumpTime()} min`}
        min={0}
        step={1}
        max={120}
        onInput={(value) => setPumpTime(value)}
        />
      <ButtonWithOrangeAnimation type="submit">Submit</ButtonWithOrangeAnimation>
    </form>
  );
};