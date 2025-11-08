import { styled } from "solid-styled-components";

// Base Button Props
interface ButtonProps {
  isActive?: boolean;
}

interface HeatingButtonProps {
  isHeating?: boolean;
}

// Modern Base Button Style (used by new buttons)
const BaseModernButton = styled("button")`
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 600;
  border-radius: 12px;
  background: linear-gradient(135deg, #333 0%, #444 100%);
  border: 2px solid #555;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: #ff6600;
    background: linear-gradient(135deg, #444 0%, #555 100%);
  }

  &:active {
    background-color: #222;
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.3);
    transform: translateY(2px);
    color: #f60;
  }
`;

// Legacy Button (keep for backward compatibility with old volcano components)
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
  box-shadow: ${(props) =>
    props.isActive
      ? "0 5px 10px rgba(0, 0, 0, 0.3)"
      : "0 4px 8px rgba(0, 0, 0, 0.2)"};
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

// Modern Round Button (for +/- buttons)
export const RoundButton = styled(BaseModernButton)`
  width: 50px;
  height: 50px;
  font-size: 1rem;
`;

// Active Round Button (for heat/pump buttons with active state)
export const ActiveRoundButton = styled(BaseModernButton)<ButtonProps>`
  width: 50px;
  height: 50px;
  font-size: 1rem;
  background: ${(props) =>
    props.isActive
      ? "linear-gradient(135deg, rgba(255, 102, 0, 0.2) 0%, rgba(255, 102, 0, 0.1) 100%)"
      : "linear-gradient(135deg, #333 0%, #444 100%)"};
  border: 2px solid ${(props) => (props.isActive ? "#ff6600" : "#555")};
  color: ${(props) => (props.isActive ? "#ff6600" : "white")};

  ${(props) =>
    props.isActive
      ? `
        box-shadow: 
          0 0 15px rgba(255, 102, 0, 0.3),
          inset 0 0 15px rgba(255, 102, 0, 0.1);
        animation: active-pulse 2s ease-in-out infinite alternate;
        
        @keyframes active-pulse {
          from {
            box-shadow: 
              0 0 15px rgba(255, 102, 0, 0.3),
              inset 0 0 15px rgba(255, 102, 0, 0.1);
          }
          to {
            box-shadow: 
              0 0 25px rgba(255, 102, 0, 0.5),
              inset 0 0 20px rgba(255, 102, 0, 0.2);
          }
        }
      `
      : ""}

  &:hover {
    border-color: #ff6600;
    background: ${(props) =>
      props.isActive
        ? "linear-gradient(135deg, rgba(255, 102, 0, 0.3) 0%, rgba(255, 102, 0, 0.2) 100%)"
        : "linear-gradient(135deg, #444 0%, #555 100%)"};
  }
`;

// Modern Small Round Button (for boost controls)
export const SmallRoundButton = styled(BaseModernButton)`
  width: 40px;
  height: 35px;
  font-size: 14px;
`;

// Modern Wide Button (for heater ON/OFF, etc.)
export const WideButton = styled(BaseModernButton)<HeatingButtonProps>`
  width: 120px;
  height: 50px;
  font-size: 1rem;
  background: ${(props) =>
    props.isHeating
      ? "linear-gradient(135deg, rgba(255, 102, 0, 0.2) 0%, rgba(255, 102, 0, 0.1) 100%)"
      : "linear-gradient(135deg, #333 0%, #444 100%)"};
  border: 2px solid ${(props) => (props.isHeating ? "#ff6600" : "#555")};
  color: ${(props) => (props.isHeating ? "#ff6600" : "white")};

  ${(props) =>
    props.isHeating
      ? `
        box-shadow: 
          0 0 15px rgba(255, 102, 0, 0.3),
          inset 0 0 15px rgba(255, 102, 0, 0.1);
        animation: heater-pulse 2s ease-in-out infinite alternate;
        
        @keyframes heater-pulse {
          from {
            box-shadow: 
              0 0 15px rgba(255, 102, 0, 0.3),
              inset 0 0 15px rgba(255, 102, 0, 0.1);
          }
          to {
            box-shadow: 
              0 0 25px rgba(255, 102, 0, 0.5),
              inset 0 0 20px rgba(255, 102, 0, 0.2);
          }
        }
      `
      : ""}

  &:hover {
    border-color: #ff6600;
    background: ${(props) =>
      props.isHeating
        ? "linear-gradient(135deg, rgba(255, 102, 0, 0.3) 0%, rgba(255, 102, 0, 0.2) 100%)"
        : "linear-gradient(135deg, #444 0%, #555 100%)"};
  }

  .icon {
    margin-right: 6px;
    font-size: 1.1rem;
  }
`;
