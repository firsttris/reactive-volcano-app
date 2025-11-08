import { RouteSectionProps } from "@solidjs/router";
import { ConnectionBar } from "./ConnectionBar";
import { styled } from "solid-styled-components";

const ResponsiveContainer = styled("div")`
  display: flex;
  flex-direction: column;
  margin: 25px;
  max-width: 600px;
  width: 100%;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: 768px) {
    margin: 0px;
    max-width: unset;
  }
`;

export const Layout = (props: RouteSectionProps) => {
  return (
    <div style={{ display: "flex", "flex-direction": "column" }}>
      <ConnectionBar />
      <ResponsiveContainer>
        <div style={{ "margin-left": "20px", "margin-right": "20px" }}>
          {props.children}
        </div>
      </ResponsiveContainer>
    </div>
  );
};
