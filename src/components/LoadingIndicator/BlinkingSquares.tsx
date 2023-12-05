import { styled } from "solid-styled-components";

const Square = styled("div")<{ delay: string }>`
  width: 50px;
  height: 50px;
  background-color: #f60;
  opacity: 1;
  animation: blink 2s ${props => props.delay} infinite;

  @keyframes blink {
    0% { opacity: 1; }
    50% { opacity: 0; }
    100% { opacity: 1; }
  }
`;

const Container = styled("div")`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
`;

export const BlinkingSquares = () => {
  return (
    <Container>
      <Square delay="0s" />
      <Square delay="1.5s" />
      <Square delay="1s" />
      <Square delay="0.5s" />
    </Container>
  );
};