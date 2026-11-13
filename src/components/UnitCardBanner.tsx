import { useEffect, useState } from "react";
import { Icon } from "../icons";
import { fileToImageDataUrl } from "./Avatar";

export function UnitCardBanner({ src, alt, referenceHeader, code, title, caption, editable, disabled, onUpload, onBusyChange }: {
  src?: string; alt: string; referenceHeader?: boolean; code: string; title: string; caption: string;
  editable: boolean; disabled: boolean; onUpload: (image: string) => void; onBusyChange: (busy: boolean) => void;
}) {
  const [failed, setFailed] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { setFailed(false); }, [src]);
  const hasImage = !!src && !failed;
  return <span className={`module-unit-banner unit-card-banner${hasImage ? "" : " unit-card-banner-empty"}`}>
    {hasImage ? <img className="module-unit-photo" src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} />
      : <span className="unit-banner-placeholder" aria-label="Unit image placeholder"><Icon name="image" size={36} /></span>}
    {(!hasImage || !referenceHeader) && <span className="module-unit-banner-copy" aria-hidden="true">
      <span className="module-unit-banner-code">{code}</span><strong>{title}</strong><span className="module-unit-banner-caption">{caption}</span>
    </span>}
    {editable && <label className="unit-banner-upload" onClick={event => event.stopPropagation()}>
      <Icon name="upload" size={15} />{hasImage ? "Replace image" : "Upload image"}
      <input type="file" accept="image/png,image/jpeg,image/webp" aria-label={`Upload banner for ${code}`} disabled={disabled}
        onChange={async event => {
          const file = event.currentTarget.files?.[0]; event.currentTarget.value = "";
          if (!file) return;
          setError(""); onBusyChange(true);
          try {
            if (!/^image\/(png|jpeg|webp)$/.test(file.type)) throw new Error("Choose a PNG, JPEG or WebP image.");
            onUpload(await fileToImageDataUrl(file));
          } catch (error) { setError(error instanceof Error ? error.message : "Could not read image."); }
          finally { onBusyChange(false); }
        }} />
    </label>}
    {error && <span className="unit-banner-error" role="alert">{error}</span>}
  </span>;
}
