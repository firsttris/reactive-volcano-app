/**
 * Device self-check. Each device module turns its status registers into
 * findings; the app shows an error report but never sends it anywhere.
 *
 * Findings are translation keys so the UI can show them directly.
 */

export type AnalysisFinding =
  | "analysis_finding_issueDetected"
  | "analysis_finding_coolDown"
  | "analysis_finding_chargeDevice"
  | "analysis_finding_useOtherCharger"
  | "analysis_finding_vibrationDisabled"
  | "analysis_finding_ledDisabled"
  | "analysis_finding_bluetoothAlwaysOn"
  | "analysis_finding_factoryResetNeeded"
  | "analysis_finding_lowBrightness"
  | "analysis_finding_displayOnCoolingDisabled"
  | "analysis_finding_chargeLimit"
  | "analysis_finding_chargeOptimization"
  | "analysis_finding_boostVisualizationDisabled"
  | "analysis_finding_boostTimeoutDisabled";

export interface AnalysisResult {
  /** Set when the device reports an error: send this to S&B support */
  errorReport: string | null;
  findings: AnalysisFinding[];
}

/** Hex without prefix, zero-padded to `digits` */
export const toHex = (value: number, digits: number) =>
  value.toString(16).padStart(digits, "0");

export const bytesToHex = (bytes: Uint8Array) =>
  [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");

/** Plain-text report with serial number and raw values for support */
export const formatErrorReport = (
  serialNumber: string,
  now: Date,
  values: [label: string, value: string][]
) =>
  [
    `SN   :   ${serialNumber}`,
    `date : 0x${toHex(Math.floor(now.getTime() / 1000), 8)}`,
    ...values.map(([label, value]) => `${label}: ${value}`),
  ].join("\n");
