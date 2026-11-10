import { useCallback, useEffect, useRef } from "react";
import { useAudioStore } from "../stores/audio-store";
import { EntityList } from "../components/audio/entity-list";
import { TriggerList } from "../components/audio/trigger-list";
import { SoundList } from "../components/audio/sound-list";
import { AudioPlayer } from "../components/audio/audio-player";
import { useT } from "../i18n";

export function AudioView() {
  const t = useT();
  const isInitialized = useAudioStore((s) => s.isInitialized);
  const isInitializing = useAudioStore((s) => s.isInitializing);
  const init = useAudioStore((s) => s.init);
  const error = useAudioStore((s) => s.error);

  useEffect(() => {
    if (!isInitialized && !isInitializing) {
      init();
    }
  }, [isInitialized, isInitializing, init]);

  if (!isInitialized) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-dim">
        {isInitializing ? t("Building ATL index...") : error ?? t("Initializing...")}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <SearchBar />
      <ErrorBar />
      <div className="flex-1 flex overflow-hidden">
        <EntityList />
        <TriggerList />
        <SoundList />
      </div>
      <AudioPlayer />
    </div>
  );
}

const SEARCH_MODES = [
  { id: "bank", label: "Banks" },
  { id: "trigger", label: "Triggers" },
  { id: "external", label: "External" },
  { id: "entity", label: "Entities" },
] as const;

function SearchBar() {
  const t = useT();
  const searchQuery = useAudioStore((s) => s.searchQuery);
  const searchMode = useAudioStore((s) => s.searchMode);
  const setSearchMode = useAudioStore((s) => s.setSearchMode);
  const search = useAudioStore((s) => s.search);
  const isSearching = useAudioStore((s) => s.isSearching);
  const triggerCount = useAudioStore((s) => s.triggerCount);
  const externalSourceCount = useAudioStore((s) => s.externalSourceCount);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const placeholder =
    searchMode === "entity"
      ? t("Search entities...")
      : searchMode === "bank"
        ? t("Search banks...")
        : searchMode === "external"
          ? t("Search external sources...")
          : t("Search triggers...");

  const onInput = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => search(value), 250);
    },
    [search],
  );

  return (
    <div className="flex items-center gap-2 px-3 border-b border-border bg-bg-alt shrink-0" style={{ height: "var(--toolbar-height)" }}>
      <input
        key={searchMode}
        type="text"
        placeholder={placeholder}
        defaultValue={searchQuery}
        onChange={(e) => onInput(e.target.value)}
        className="flex-1 bg-surface rounded-md px-3 py-1.5 text-sm text-text placeholder:text-text-faint outline-none focus:ring-1 focus:ring-ring"
      />
      {isSearching && <span className="text-xs text-text-dim shrink-0">{t("Searching...")}</span>}
      <span className="text-xs text-text-faint shrink-0">
        {t("{triggers} triggers / {sources} external", {
          triggers: triggerCount.toLocaleString(),
          sources: externalSourceCount.toLocaleString(),
        })}
      </span>
      <div className="flex gap-1 shrink-0">
        {SEARCH_MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => setSearchMode(mode.id)}
            className={`px-3 py-1 text-xs rounded-md transition-colors capitalize ${
              searchMode === mode.id
                ? "bg-primary/15 text-text"
                : "bg-surface text-text-dim hover:bg-surface-hi hover:text-text"
            }`}
          >
            {t(mode.label)}
          </button>
        ))}
      </div>
    </div>
  );
}

function ErrorBar() {
  const error = useAudioStore((s) => s.error);
  if (!error) return null;
  return (
    <div className="px-3 py-1.5 text-xs text-danger bg-danger/10 border-b border-danger/20">
      {error}
    </div>
  );
}
