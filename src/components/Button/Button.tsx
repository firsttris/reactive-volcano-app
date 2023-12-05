import { styled } from "solid-styled-components";

interface ButtonProps {
  isActive?: boolean;
}

export const Button = styled("button")<ButtonProps>`
  line-height: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50px;
  width: 55px;
  background-color: #333;
  border: none;
  color: white;
  text-align: center;
  text-decoration: none;
  font-size: 16px;
  cursor: pointer;
  transition-duration: 0.4s;
  border-radius: 3px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  background-color: ${(props) => (props.isActive ? "#222" : "#333")};
  box-shadow: ${(props) => (props.isActive ? "0 5px 10px rgba(0, 0, 0, 0.3)" : "0 4px 8px rgba(0, 0, 0, 0.2)")};
  transform: ${(props) => (props.isActive ? "translateY(4px)" : "none")};
  color: ${(props) => (props.isActive ? "#f60" : "white")};
  &:hover {
    background-color: #444;
  }
  &:active {
    background-color: #222;
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.3);
    transform: translateY(4px);
  }
`;

export const ButtonWithOrangeAnimation = styled(Button)`
  &:active {
    background-color: #222;
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.3);
    transform: translateY(4px);
    color: #f60;
  }
`;