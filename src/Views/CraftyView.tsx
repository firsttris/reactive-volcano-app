import { Component, createEffect } from "solid-js";
import { styled } from "solid-styled-components";
import { useNavigate } from "@solidjs/router";
import { useBluetooth } from "../provider/BluetoothProvider";
import { ConnectionState } from "../utils/uuids";
import {
  CraftyDeviceProvider,
  useCraftyDevice,
} from "../provider/CraftyDeviceProvider";
import { buildRoute } from "../routes";

const MainCard = styled("div")`
  background: var(--secondary-bg);
  border-radius: 16px;
  padding: 24px;
  margin: 20px auto;
  border: 1px solid var(--border-color);
  max-width: 600px;
`;

const SettingsContainer = styled("div")`
  max-width: 600px;
  margin: 20px auto;
  padding: 20px;
  background: var(--secondary-bg);
  border-radius: 16px;
  border: 1px solid var(--border-color);
`;

const SettingsTitle = styled("h2")`
  color: var(--accent-color);
  font-size: 1.5rem;
  margin-bottom: 24px;
  text-align: center;
  font-family: CustomFont;
`;

const SettingItem = styled("div")`
  margin-bottom: 20px;
`;

const TemperatureDisplay = styled("div")`
  text-align: center;
  margin-bottom: 20px;
`;

const TempValue = styled("span")`
  font-size: 2rem;
  font-weight: bold;
  color: var(--accent-color);
`;

const TempLabel = styled("div")`
  font-size: 0.9rem;
  color: var(--text-color);
  margin-top: 8px;
`;

const Button = styled("button")`
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  margin: 5px;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Input = styled("input")`
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--input-bg);
  color: var(--text-color);
  font-size: 1rem;
  width: 80px;
  margin: 0 10px;
`;

const StatusIndicator = styled("div")<{ active: boolean }>`
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${(props) =>
    props.active ? "var(--accent-color)" : "var(--border-color)"};
  margin-right: 8px;
`;

const CraftyViewContent: Component = () => {
  const navigate = useNavigate();
  const { connectionState } = useBluetooth();
  const {
    temperature,
    deviceStatus,
    brightness,
    shutdowntime,
    deviceInformation,
    heatingTime,
  } = useCraftyDevice();

  // Redirect to connect page if not connected
  createEffect(() => {
    const state = connectionState();
    if (
      state === ConnectionState.NOT_CONNECTED ||
      state === ConnectionState.CONNECTION_FAILED
    ) {
      navigate(buildRoute.root());
    }
  });

  const status = deviceStatus.getDeviceStatus();
  const deviceInfo = deviceInformation.getDeviceInformation();

  return (
    <>
      {/* Main Controls */}
      <MainCard>
        <TemperatureDisplay>
          <TempValue>{temperature.getCurrentTemperature()}°C</TempValue>
          <TempLabel>Current Temperature</TempLabel>
        </TemperatureDisplay>

        <div style={{ "text-align": "center", "margin-bottom": "20px" }}>
          <TempLabel>Target: {temperature.getTargetTemperature()}°C</TempLabel>
          <br />
          <TempLabel>Boost: {temperature.getBoostTemperature()}°C</TempLabel>
        </div>

        <div style={{ "text-align": "center", "margin-bottom": "20px" }}>
          <Input
            type="number"
            placeholder="Set Temp"
            onInput={(e) => {
              const value = parseInt(e.currentTarget.value);
              if (!isNaN(value)) {
                temperature.setTemperature(value);
              }
            }}
          />
          <Button onClick={() => temperature.setTemperature(200)}>
            Set 200°C
          </Button>
        </div>

        <div style={{ "text-align": "center" }}>
          <StatusIndicator active={status.isHeating} />
          <span style={{ color: "var(--text-color)" }}>
            {status.isHeating ? "Heating" : "Not Heating"}
          </span>
        </div>
      </MainCard>

      {/* Device Status */}
      <MainCard>
        <h3 style={{ "text-align": "center", color: "var(--accent-color)" }}>
          Device Status
        </h3>
        <div
          style={{
            display: "flex",
            "justify-content": "space-around",
            "flex-wrap": "wrap",
          }}
        >
          <div>
            <StatusIndicator active={status.boostModeActive} />
            Boost Mode
          </div>
          <div>
            <StatusIndicator active={status.superBoostModeActive} />
            Super Boost Mode
          </div>
          <div>
            <StatusIndicator active={status.hasErrors} />
            Errors
          </div>
        </div>
      </MainCard>

      {/* Settings */}
      <SettingsContainer>
        <SettingsTitle>Crafty Settings</SettingsTitle>

        <SettingItem>
          <label>Brightness: {brightness.getBrightness()}</label>
          <br />
          <Input
            type="range"
            min="0"
            max="100"
            value={brightness.getBrightness()}
            onInput={(e) =>
              brightness.setBrightness(parseInt(e.currentTarget.value))
            }
          />
        </SettingItem>

        <SettingItem>
          <label>Shutdown Time: {shutdowntime.getShutdowntime()}s</label>
          <br />
          <Input
            type="number"
            value={shutdowntime.getShutdowntime()}
            onInput={(e) =>
              shutdowntime.setShutdowntime(parseInt(e.currentTarget.value))
            }
          />
        </SettingItem>

        <SettingItem>
          <label>
            Current Countdown: {shutdowntime.getCurrentShutdowntime()}s
          </label>
        </SettingItem>

        <SettingItem>
          <div>Serial: {deviceInfo.serialNumber}</div>
          <div>Firmware: {deviceInfo.firmwareVersion}</div>
          <div>BLE Firmware: {deviceInfo.firmwareBLEVersion}</div>
        </SettingItem>

        <SettingItem>
          <div>
            Heating Time: {heatingTime.getHeatingHours()}h{" "}
            {heatingTime.getHeatingMinutes()}min
          </div>
        </SettingItem>
      </SettingsContainer>
    </>
  );
};

export const CraftyView: Component = () => {
  return (
    <CraftyDeviceProvider>
      <CraftyViewContent />
    </CraftyDeviceProvider>
  );
};
