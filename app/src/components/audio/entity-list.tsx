import { useAudioStore } from "../../stores/audio-store";
import { useT } from "../../i18n";
import { shipName } from "../../lib/ship-names";

export function EntityList() {
  const searchMode = useAudioStore((s) => s.searchMode);

  if (searchMode === "trigger") return null;
  if (searchMode === "external") return null;
  if (searchMode === "bank") return <BankList />;
  return <EntityListInner />;
}

function EntityListInner() {
  const t = useT();
  const entities = useAudioStore((s) => s.entities);
  const selectedEntity = useAudioStore((s) => s.selectedEntity);
  const selectEntity = useAudioStore((s) => s.selectEntity);

  return (
    <div className="w-[28%] min-w-[180px] flex flex-col border-r border-border overflow-hidden">
      <div className="px-3 py-1.5 text-xs font-medium text-text-dim border-b border-border bg-bg-alt">
        {t("Entities")} {entities.length > 0 && `(${entities.length})`}
      </div>
      <div className="flex-1 overflow-y-auto">
        {entities.map((entity) => (
          <button
            key={entity.name}
            type="button"
            onClick={() => selectEntity(entity.name)}
            className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
              selectedEntity === entity.name
                ? "bg-primary/15 text-text"
                : "text-text-sub hover:bg-surface/50 hover:text-text"
            }`}
          >
            <div className="truncate">{shipName(entity.name) ?? entity.name}</div>
            <div className="text-xs text-text-faint">
              {t("{count} triggers", { count: entity.trigger_count })}
            </div>
          </button>
        ))}
        {entities.length === 0 && (
          <div className="px-3 py-4 text-xs text-text-faint text-center">
            {t("Search for an entity to see results")}
          </div>
        )}
      </div>
    </div>
  );
}

function BankList() {
  const t = useT();
  const banks = useAudioStore((s) => s.banks);
  const selectedBank = useAudioStore((s) => s.selectedBank);
  const selectBank = useAudioStore((s) => s.selectBank);

  return (
    <div className="w-[28%] min-w-[180px] flex flex-col border-r border-border overflow-hidden">
      <div className="px-3 py-1.5 text-xs font-medium text-text-dim border-b border-border bg-bg-alt">
        {t("Banks")} {banks.length > 0 && `(${banks.length})`}
      </div>
      <div className="flex-1 overflow-y-auto">
        {banks.map((bank) => (
          <button
            key={bank.name}
            type="button"
            onClick={() => selectBank(bank.name)}
            className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
              selectedBank === bank.name
                ? "bg-primary/15 text-text"
                : "text-text-sub hover:bg-surface/50 hover:text-text"
            }`}
          >
            <div className="truncate font-mono text-xs">{bank.name}</div>
            <div className="text-xs text-text-faint">
              {t("{count} triggers", { count: bank.trigger_count })}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
