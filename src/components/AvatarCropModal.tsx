"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const FRAME_SIZE = 260; // on-screen crop frame, px
const OUTPUT_SIZE = 480; // exported square photo, px

type Offset = { x: number; y: number };

// A simple drag-to-reposition, slider-to-zoom photo cropper. Takes any
// image Blob (a freshly picked file, or bytes fetched from an existing
// photo URL) and hands back a cropped, square JPEG Blob sized for an
// avatar — no external cropping library, just canvas + pointer events.
export default function AvatarCropModal({
  source,
  onCancel,
  onSave,
  saving = false,
}: {
  source: Blob;
  onCancel: () => void;
  onSave: (blob: Blob) => void;
  saving?: boolean;
}) {
  const { t } = useLanguage();
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [minScale, setMinScale] = useState(1);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const imgElRef = useRef<HTMLImageElement>(null);
  const dragState = useRef<{ startX: number; startY: number; startOffset: Offset } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(source);
    setImgSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [source]);

  function clampOffset(next: Offset, s: number, natural: { w: number; h: number }): Offset {
    const scaledW = natural.w * s;
    const scaledH = natural.h * s;
    const maxX = Math.max(0, (scaledW - FRAME_SIZE) / 2);
    const maxY = Math.max(0, (scaledH - FRAME_SIZE) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, next.x)),
      y: Math.min(maxY, Math.max(-maxY, next.y)),
    };
  }

  function handleImgLoad() {
    const el = imgElRef.current;
    if (!el) return;
    const natural = { w: el.naturalWidth, h: el.naturalHeight };
    const cover = Math.max(FRAME_SIZE / natural.w, FRAME_SIZE / natural.h);
    setNaturalSize(natural);
    setMinScale(cover);
    setScale(cover);
    setOffset({ x: 0, y: 0 });
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (!naturalSize) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startY: e.clientY, startOffset: offset };
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragState.current || !naturalSize) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    const next = {
      x: dragState.current.startOffset.x + dx,
      y: dragState.current.startOffset.y + dy,
    };
    setOffset(clampOffset(next, scale, naturalSize));
  }

  function handlePointerUp(e: React.PointerEvent) {
    dragState.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  function handleZoomChange(pct: number) {
    if (!naturalSize) return;
    const nextScale = minScale + (pct / 100) * minScale * 2; // up to 3x minScale
    setScale(nextScale);
    setOffset((cur) => clampOffset(cur, nextScale, naturalSize));
  }

  async function handleSave() {
    const el = imgElRef.current;
    if (!el || !naturalSize) return;
    const left = FRAME_SIZE / 2 - (naturalSize.w * scale) / 2 + offset.x;
    const top = FRAME_SIZE / 2 - (naturalSize.h * scale) / 2 + offset.y;
    const sx = -left / scale;
    const sy = -top / scale;
    const sSize = FRAME_SIZE / scale;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(el, sx, sy, sSize, sSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    canvas.toBlob(
      (blob) => {
        if (blob) onSave(blob);
      },
      "image/jpeg",
      0.92
    );
  }

  const zoomPct = naturalSize ? Math.round(((scale - minScale) / (minScale * 2)) * 100) : 0;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onCancel();
      }}
    >
      <div className="modal-card">
        <button type="button" className="modal-close" onClick={onCancel} disabled={saving}>
          <Icon name="X" />
        </button>
        <h2>{t("editProfile.cropTitle")}</h2>
        <p className="hint" style={{ marginBottom: 16 }}>
          {t("editProfile.cropHint")}
        </p>

        <div
          className="crop-frame"
          style={{ width: FRAME_SIZE, height: FRAME_SIZE }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {imgSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={imgElRef}
              src={imgSrc}
              alt={t("editProfile.cropAlt")}
              onLoad={handleImgLoad}
              draggable={false}
              className="crop-frame-img"
              style={
                naturalSize
                  ? {
                      width: naturalSize.w * scale,
                      height: naturalSize.h * scale,
                      left: FRAME_SIZE / 2 - (naturalSize.w * scale) / 2 + offset.x,
                      top: FRAME_SIZE / 2 - (naturalSize.h * scale) / 2 + offset.y,
                    }
                  : { opacity: 0 }
              }
            />
          )}
          <div className="crop-frame-ring" />
        </div>

        <div className="crop-zoom-row">
          <Icon name="Image" size={15} />
          <input
            type="range"
            min={0}
            max={100}
            value={zoomPct}
            disabled={!naturalSize}
            onChange={(e) => handleZoomChange(Number(e.target.value))}
          />
          <Icon name="ZoomIn" size={15} />
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-line" onClick={onCancel} disabled={saving}>
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className="btn btn-accent"
            onClick={handleSave}
            disabled={saving || !naturalSize}
          >
            {saving ? t("common.saving") : t("editProfile.useThisPhoto")}
          </button>
        </div>
      </div>
    </div>
  );
}
