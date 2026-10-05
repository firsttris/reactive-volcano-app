import { registerSW } from "virtual:pwa-register";
import { onCleanup } from "solid-js";
import { m } from "../paraglide/messages";
import { useBluetooth } from "../provider/BluetoothProvider";
import { useToast } from "../provider/ToastProvider";
import { ConnectionState } from "../utils/uuids";

// An installed app can stay open for days; look for a new version regularly
const UPDATE_CHECK_INTERVAL_MS = 60 * 60_000;

/**
 * Activates a new app version. Without a device connected it reloads right
 * away; otherwise it asks first, since reloading ends the connection.
 */
export const UpdatePrompt = () => {
  const { connectionState } = useBluetooth();
  const showToast = useToast();
  let registration: ServiceWorkerRegistration | undefined;

  const checkForUpdate = () => {
    if (document.visibilityState === "visible") registration?.update();
  };

  const updateSW = registerSW({
    onNeedRefresh() {
      if (connectionState() === ConnectionState.NOT_CONNECTED) {
        updateSW(true);
        return;
      }
      showToast({
        message: m.app_updateAvailable(),
        actionLabel: m.app_reload(),
        onAction: () => updateSW(true),
        persistent: true,
      });
    },
    onRegisteredSW(_url, swRegistration) {
      registration = swRegistration;
    },
  });

  const interval = setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS);
  document.addEventListener("visibilitychange", checkForUpdate);
  onCleanup(() => {
    clearInterval(interval);
    document.removeEventListener("visibilitychange", checkForUpdate);
  });

  return null;
};
