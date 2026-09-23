"use client";

import Icon from "./Icon";
import { toast } from "@/lib/toast";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function FeeBanner({
  mmg,
  fee,
  label,
  caption,
  noMmgCaption,
}: {
  mmg: string | null;
  fee: number;
  label?: string;
  caption?: string;
  noMmgCaption?: string;
}) {
  const { t } = useLanguage();

  function handleCopy() {
    if (!mmg) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(mmg).then(
        () => toast("MMG number copied — " + mmg),
        () => toast("MMG number: " + mmg)
      );
    } else {
      toast("MMG number: " + mmg);
    }
  }

  return (
    <div className="fee-box standalone">
      <div className="fee-label">
        <Icon name="Wallet" size={15} />
        {label ?? t("fees.activationDue")}
      </div>
      {mmg ? (
        <>
          <div className="fee-number-row">
            <span className="mono">{mmg}</span>
            <button type="button" className="fee-copy" onClick={handleCopy}>
              <Icon name="Copy" size={13} />
              {t("common.copy")}
            </button>
          </div>
          <p className="fee-caption">
            {caption ?? t("fees.activationCaption", { fee: fee.toLocaleString() })}
          </p>
        </>
      ) : (
        <p className="fee-caption">
          {noMmgCaption ?? t("fees.activationNoMmgCaption", { fee: fee.toLocaleString() })}
        </p>
      )}
    </div>
  );
}
