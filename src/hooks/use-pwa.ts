import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "sonner";

/**
 * Registers the PWA service worker and shows a toast when a new version
 * of the app is available. Tapping "Update" triggers a hard refresh
 * so the new SW activates immediately.
 */
export function usePWA() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      // Poll for SW updates every hour while the tab is open
      if (registration) {
        setInterval(
          () => {
            if (!(!registration.installing && navigator.onLine)) return;
            if (registration.waiting) {
              updateServiceWorker(true);
              return;
            }
            registration.update().catch(() => {
              /* silent */
            });
          },
          60 * 60 * 1000,
        );
      }
      console.log(`[PWA] Service worker registered: ${swUrl}`);
    },
    onRegisterError(error) {
      console.warn("[PWA] Service worker registration failed:", error);
    },
  });

  useEffect(() => {
    if (!needRefresh) return;
    toast.info("🚀 New version available!", {
      description: "Tap Update to get the latest ParkPulse experience.",
      duration: Infinity,
      action: {
        label: "Update",
        onClick: () => updateServiceWorker(true),
      },
      onDismiss: () => {
        /* user dismissed — will be prompted again next visit */
      },
    });
  }, [needRefresh, updateServiceWorker]);
}
