import { useEffect, useRef, useState } from "react";
import { previewXml } from "../lib/commands";
import { useT } from "../i18n";

interface Props {
  path: string;
}

export function XmlPreview({ path }: Props) {
  const t = useT();
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const generationRef = useRef(0);

  useEffect(() => {
    const gen = ++generationRef.current;
    setLoading(true);
    setError(null);
    setContent(null);

    previewXml(path)
      .then((xml) => {
        if (gen !== generationRef.current) return;
        setContent(xml);
        setLoading(false);
      })
      .catch((err) => {
        if (gen !== generationRef.current) return;
        setError(String(err));
        setLoading(false);
      });
  }, [path]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-text-dim">
        <span className="text-xs">{t("Loading XML...")}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center px-8">
          <p className="text-danger text-sm font-medium">{t("Failed to load XML")}</p>
          <p className="text-text-dim text-xs mt-1 font-mono break-all">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <pre className="w-full h-full overflow-auto p-4 text-xs font-mono text-text whitespace-pre">
      {content}
    </pre>
  );
}
