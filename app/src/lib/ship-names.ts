/**
 * Chinese display names for ships and vehicles.
 *
 * `ship-names.zh-CN.json` maps the DataCore entity class name, lowercased
 * (`aegs_gladius`), to the Chinese name used by the game's own community
 * translation (`圣盾 短剑`). The table is derived from the game's
 * `vehicle_Name<CLASS>` / `vehicle_Name<CLASS>_short` localization keys, so a
 * `_short` entry is the abbreviated in-game name when a class only has that.
 *
 * Only consulted while the UI language is Chinese; a class the table does not
 * know falls back to whatever name the backend resolved from the game's
 * English localization, so new ships keep working untranslated.
 */
import { getLanguage } from "../i18n";
import table from "../i18n/ship-names.zh-CN.json";

const shipNames = table as Record<string, string>;

/** Chinese name for a ship/vehicle class, or undefined when unknown/not Chinese. */
export function shipName(className: string | null | undefined): string | undefined {
  if (getLanguage() !== "zh-CN" || !className) return undefined;
  const lower = className.toLowerCase();
  return (
    shipNames[lower] ??
    // The source table is inconsistent about hyphens (`KRIG_L-22_Alpha_Wolf`
    // vs `krig_l22_alpha_wolf`), so retry without them.
    shipNames[lower.replace(/-/g, "")] ??
    shipNames[`${lower}_short`]
  );
}

/**
 * Label for an entity row: the Chinese ship name when known, else the game's
 * localized display name, else the raw class name.
 */
export function entityLabel(
  className: string,
  displayName: string | null | undefined,
): string {
  return shipName(className) ?? displayName ?? className;
}
