import { styled } from "solid-styled-components";
import { m } from "../../paraglide/messages";
import { useVolcano } from "../../provider/VolcanoProvider";
import { AnalysisSection } from "../AnalysisSection";

const Title = styled("h3")`
  color: var(--accent-color);
  font-size: 1.2rem;
  margin-bottom: 12px;
  font-family: CustomFont;
  text-align: center;
`;

export const Analysis = () => {
  const { actions } = useVolcano();

  return (
    <div>
      <Title>{m.analysis_title()}</Title>
      <AnalysisSection run={actions.runAnalysis} />
    </div>
  );
};
