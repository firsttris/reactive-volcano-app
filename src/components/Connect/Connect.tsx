import { useBluetooth } from "../../provider/BluetoothProvider";
import { BsBluetooth } from "solid-icons/bs";
import { ConnectionState } from "../../utils/uuids";
import { App } from "../../App";
import { Show } from "solid-js";
import { BlinkingSquares } from "../LoadingIndicator/BlinkingSquares";
import { styled } from "solid-styled-components";

const Centered = styled("div")`
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(100vh - 72px);
`;

export const Connect = () => {
  const { connect, connectionState } = useBluetooth();

  return (
    <>
      <Show when={(connectionState() === ConnectionState.NOT_CONNECTED || connectionState() === ConnectionState.CONNECTION_FAILED)}>
        <Centered>
          <BsBluetooth
            onClick={connect}
            size="72px"
            style={{ cursor: "pointer", color: "#f60" }}
          />
        </Centered>
      </Show>
      <Show when={connectionState() === ConnectionState.CONNECTED}>
        <App />
      </Show>
      <Show when={connectionState() === ConnectionState.CONNECTING}>
        <Centered>
          <BlinkingSquares />
        </Centered>
      </Show>
    </>
  );
};
