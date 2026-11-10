import { useEffect, useState } from "react";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { useT } from "../i18n";

const canAutoUpdate =
  navigator.userAgent.includes("Windows") ||
  !!import.meta.env.APPIMAGE;

export function UpdateBanner() {
  const t = useT();
  const [update, setUpdate] = useState<Update | null>(null);
  const [status, setStatus] = useState<"idle" | "downloading" | "installing">(
    "idle",
  );
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    check()
      .then((u) => setUpdate(u))
      .catch((e) => console.warn("Update check failed:", e));
  }, []);

  if (!update || dismissed) return null;

  const handleUpdate = async () => {
    setStatus("downloading");
    try {
      await update.downloadAndInstall((e) => {
        if (e.event === "Started") setStatus("downloading");
        if (e.event === "Finished") setStatus("installing");
      });
      await relaunch();
    } catch (e) {
      console.error("Update failed:", e);
      setStatus("idle");
    }
  };

  return (
    <div className="flex items-center justify-between px-3 py-1.5 text-xs bg-info/10 border-b border-info/20 text-text-sub">
      <span>
        {t("v{version} available", { version: update.version })}
        {update.body ? ` — ${update.body.split("\n")[0]}` : ""}
      </span>
      <div className="flex items-center gap-2">
        {status === "idle" && (
          <>
            {canAutoUpdate ? (
              <button
                onClick={handleUpdate}
                className="px-2 py-0.5 rounded bg-info text-white font-medium hover:opacity-90 transition-opacity"
              >
                {t("Update")}
              </button>
            ) : (
              <a
                href={`https://github.com/diogotr7/StarBreaker/releases/tag/v${update.version}`}
                target="_blank"
                rel="noreferrer"
                className="px-2 py-0.5 rounded bg-info text-white font-medium hover:opacity-90 transition-opacity"
              >
                {t("View release")}
              </a>
            )}
            <button
              onClick={() => setDismissed(true)}
              className="text-text-dim hover:text-text transition-colors"
            >
              {t("Dismiss")}
            </button>
          </>
        )}
        {status === "downloading" && <span>{t("Downloading...")}</span>}
        {status === "installing" && <span>{t("Installing...")}</span>}
      </div>
    </div>
  );
}
