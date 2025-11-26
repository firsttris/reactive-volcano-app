import { RouteSectionProps } from "@solidjs/router";
import { ConnectionBar } from "./ConnectionBar";
import { styled } from "solid-styled-components";

const ResponsiveContainer = styled("div")`
  display: flex;
  flex-direction: column;
  margin: 25px;
  max-width: 800px;
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
    <div style={{ display: "flex", "flex-direction": "column", "background-image": "url('./background.png')", "background-position": "center", "background-size": "cover", "background-repeat": "no-repeat"}}>
      <ConnectionBar />
      <ResponsiveContainer>
        <div style={{ "margin-left": "20px", "margin-right": "20px" }}>
          {props.children}
        </div>
      </ResponsiveContainer>
    </div>
  );
};
