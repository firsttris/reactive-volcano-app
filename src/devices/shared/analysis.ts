/**
 * Device self-check, like the "Analysis" entry of the legacy app. Each device
 * module turns its status registers into findings; sharing the result with
 * STORZ & BICKEL is not supported (their server only accepts its own origin).
 *
 * Findings are translation keys so the UI can show them directly.
 */

export type AnalysisFinding =
  | "analysisIssueDetected"
  | "analysisCoolDown"
  | "analysisChargeDevice"
  | "analysisUseOtherCharger"
  | "analysisVibrationDisabled"
  | "analysisLedDisabled"
  | "analysisBluetoothAlwaysOn"
  | "analysisFactoryResetNeeded"
  | "analysisLowBrightness"
  | "analysisDisplayOnCoolingDisabled"
  | "analysisChargeLimit"
  | "analysisChargeOptimization"
  | "analysisBoostVisualizationDisabled"
  | "analysisBoostTimeoutDisabled";

export interface AnalysisResult {
  /** Set when the device reports an error: send this to S&B support */
  errorReport: string | null;
  findings: AnalysisFinding[];
}

/** Hex without prefix, padded like the legacy app's numHex */
export const toHex = (value: number, digits: number) =>
  value.toString(16).padStart(digits, "0");

export const bytesToHex = (bytes: Uint8Array) =>
  [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");

/** Same layout as the legacy support message */
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
