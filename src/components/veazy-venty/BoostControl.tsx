import { styled } from "solid-styled-components";
import { SmallRoundButton } from "../Button";
import { FaSolidMinus, FaSolidPlus } from "solid-icons/fa";
import { TemperatureDisplay } from "../TemperatureDisplay";

const BoostCard = styled("div")<{ active?: boolean }>`
  background: ${(props) =>
    props.active ? "rgba(255, 102, 0, 0.1)" : "#1a1a1a"};
  border: 2px solid ${(props) => (props.active ? "#f60" : "#444")};
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: #f60;
    background: rgba(255, 102, 0, 0.05);
  }
`;

const BoostTitle = styled("h3")`
  margin: 0 0 12px 0;
  color: white;
  font-size: 1rem;
  font-weight: 600;
`;

const BoostTemp = styled("div")`
  font-size: 2rem;
  color: #f60;
`;

const BoostControls = styled("div")`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
`;

interface BoostControlProps {
  title: string;
  temp: number;
  isCelsius: boolean;
  active: boolean;
  onActivate: () => void;
  onAdjustTemp: (change: number) => void;
}

export const BoostControl = (props: BoostControlProps) => {
  return (
    <BoostCard active={props.active} onClick={props.onActivate}>
      <BoostTitle>{props.title}</BoostTitle>
      <BoostTemp>
        <TemperatureDisplay
          value={props.temp}
          unit={props.isCelsius ? "C" : "F"}
          isOffset={true}
        />
      </BoostTemp>
      <BoostControls>
        <SmallRoundButton
          onClick={(e: MouseEvent) => {
            e.stopPropagation();
            props.onAdjustTemp(-1);
          }}
        >
          <FaSolidMinus />
        </SmallRoundButton>
        <SmallRoundButton
          onClick={(e: MouseEvent) => {
            e.stopPropagation();
            props.onAdjustTemp(1);
          }}
        >
          <FaSolidPlus />
        </SmallRoundButton>
      </BoostControls>
    </BoostCard>
  );
};
