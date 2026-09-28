import type { Component } from "solid-js";
import { styled } from "solid-styled-components";
import { useTranslations } from "../../i18n/utils";
import { useVentyVeazy } from "../../provider/VentyVeazyProvider";
import { CollapsibleCard } from "../Card";

const InfoGrid = styled("div")`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
`;

const InfoItem = styled("div")`
  text-align: center;
  padding: 10px;
  background: var(--bg-color);
  border-radius: 5px;
`;

const InfoLabel = styled("div")`
  color: var(--secondary-text);
  font-size: 0.9rem;
  margin-bottom: 5px;
`;

const InfoValue = styled("div")`
  color: var(--text-color);
  font-size: 1.1rem;
  font-family: "CustomFont";
`;

const formatMinutes = (minutes: number | undefined) =>
  minutes === undefined ? "-" : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

/** Serial number, firmware and usage times, like the legacy info tab */
export const DeviceInfo: Component = () => {
  const { state } = useVentyVeazy();
  const t = useTranslations();

  return (
    <CollapsibleCard title={t("deviceInfo")} storageKey="venty-veazy-info">
      <InfoGrid>
        <InfoItem>
          <InfoLabel>{t("serialNumber")}</InfoLabel>
          <InfoValue>{state.deviceData?.serialNumber ?? "-"}</InfoValue>
        </InfoItem>
        <InfoItem>
          <InfoLabel>{t("deviceRuntime")}</InfoLabel>
          <InfoValue>
            {formatMinutes(state.extendedData?.heaterRuntimeMinutes)}
          </InfoValue>
        </InfoItem>
        <InfoItem>
          <InfoLabel>{t("firmwareVersion")}</InfoLabel>
          <InfoValue>{state.firmware?.firmwareVersion ?? "-"}</InfoValue>
        </InfoItem>
        <InfoItem>
          <InfoLabel>{t("bootloaderVersion")}</InfoLabel>
          <InfoValue>{state.firmware?.bootloaderVersion ?? "-"}</InfoValue>
        </InfoItem>
        <InfoItem>
          <InfoLabel>{t("batteryChargingTime")}</InfoLabel>
          <InfoValue>
            {formatMinutes(state.extendedData?.batteryChargingTimeMinutes)}
          </InfoValue>
        </InfoItem>
      </InfoGrid>
    </CollapsibleCard>
  );
};
