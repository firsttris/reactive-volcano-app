import { styled } from "solid-styled-components";
import { useTranslations } from "../../i18n/utils";
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
  const t = useTranslations();

  return (
    <div>
      <Title>{t("analysis")}</Title>
      <AnalysisSection run={actions.runAnalysis} />
    </div>
  );
};
