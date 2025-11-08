import { styled } from "solid-styled-components";

const Square = styled("div")<{ delay: string }>`
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #ff6600 0%, #ff8833 100%);
  border-radius: 8px;
  opacity: 1;
  animation: blink-glow 2s ${(props) => props.delay} infinite ease-in-out;
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.3),
    inset 0 2px 4px rgba(255, 255, 255, 0.2);

  @keyframes blink-glow {
    0% {
      opacity: 1;
      box-shadow:
        0 4px 8px rgba(0, 0, 0, 0.3),
        0 0 20px rgba(255, 102, 0, 0.8),
        inset 0 2px 4px rgba(255, 255, 255, 0.2);
      transform: scale(1);
    }
    50% {
      opacity: 0.2;
      box-shadow:
        0 2px 4px rgba(0, 0, 0, 0.2),
        0 0 5px rgba(255, 102, 0, 0.2),
        inset 0 1px 2px rgba(255, 255, 255, 0.1);
      transform: scale(0.95);
    }
    100% {
      opacity: 1;
      box-shadow:
        0 4px 8px rgba(0, 0, 0, 0.3),
        0 0 20px rgba(255, 102, 0, 0.8),
        inset 0 2px 4px rgba(255, 255, 255, 0.2);
      transform: scale(1);
    }
  }
`;

const Container = styled("div")`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 4px;
`;

export const BlinkingSquares = () => {
  return (
    <Container>
      <Square delay="0s" />
      <Square delay="0.5s" />
      <Square delay="1.5s" />
      <Square delay="1s" />
    </Container>
  );
};
