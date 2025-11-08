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
  background: var(--secondary-bg);
  border: 2px solid var(--border-color);
  color: var(--text-color);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--accent-color);
    background: var(--bg-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  &:active {
    background-color: var(--bg-color);
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.3);
    transform: translateY(2px);
    color: var(--accent-color);
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
  background-color: var(--secondary-bg);
  border: none;
  color: var(--text-color);
  text-align: center;
  text-decoration: none;
  font-size: 16px;
  cursor: pointer;
  transition-duration: 0.4s;
  border-radius: 3px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  background-color: ${(props) =>
    props.isActive ? "var(--bg-color)" : "var(--secondary-bg)"};
  box-shadow: ${(props) =>
    props.isActive
      ? "0 5px 10px rgba(0, 0, 0, 0.3)"
      : "0 4px 8px rgba(0, 0, 0, 0.2)"};
  transform: ${(props) => (props.isActive ? "translateY(4px)" : "none")};
  color: ${(props) =>
    props.isActive ? "var(--accent-color)" : "var(--text-color)"};
  &:hover {
    background-color: var(--border-color);
  }
  &:active {
    background-color: var(--bg-color);
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.3);
    transform: translateY(4px);
  }
`;

export const ButtonWithOrangeAnimation = styled(Button)`
  &:active {
    background-color: var(--bg-color);
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.3);
    transform: translateY(4px);
    color: var(--accent-color);
  }
`;

// Modern Round Button (for +/- buttons)
export const RoundButton = styled(BaseModernButton)`
  width: 50px;
  height: 50px;
  font-size: 1rem;

  &:hover {
    border-color: var(--accent-color);
    background: var(--bg-color);
    color: var(--accent-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

// Active Round Button (for heat/pump buttons with active state)
export const ActiveRoundButton = styled(BaseModernButton)<ButtonProps>`
  width: 50px;
  height: 50px;
  font-size: 1rem;
  background: ${(props) =>
    props.isActive
      ? "linear-gradient(135deg, rgba(255, 102, 0, 0.2) 0%, rgba(255, 102, 0, 0.1) 100%)"
      : "var(--secondary-bg)"};
  border: 2px solid
    ${(props) => (props.isActive ? "#ff6600" : "var(--border-color)")};
  color: ${(props) => (props.isActive ? "#ff6600" : "var(--text-color)")};

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
    border-color: var(--accent-color);
    background: ${(props) =>
      props.isActive
        ? "linear-gradient(135deg, rgba(255, 102, 0, 0.3) 0%, rgba(255, 102, 0, 0.2) 100%)"
        : "var(--bg-color)"};
    color: var(--accent-color);
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
      : "var(--secondary-bg)"};
  border: 2px solid
    ${(props) =>
      props.isHeating ? "var(--accent-color)" : "var(--border-color)"};
  color: ${(props) =>
    props.isHeating ? "var(--accent-color)" : "var(--text-color)"};

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
    border-color: var(--accent-color);
    background: ${(props) =>
      props.isHeating
        ? "linear-gradient(135deg, rgba(255, 102, 0, 0.3) 0%, rgba(255, 102, 0, 0.2) 100%)"
        : "var(--bg-color)"};
    color: var(--accent-color);
  }

  .icon {
    margin-right: 6px;
    font-size: 1.1rem;
  }
`;
