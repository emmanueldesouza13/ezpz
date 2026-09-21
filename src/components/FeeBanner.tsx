"use client";

import Icon from "./Icon";
import { toast } from "@/lib/toast";

export default function FeeBanner({ mmg, fee }: { mmg: string | null; fee: number }) {
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
        Activation fee due — your listing is live now
      </div>
      {mmg ? (
        <>
          <div className="fee-number-row">
            <span className="mono">{mmg}</span>
            <button type="button" className="fee-copy" onClick={handleCopy}>
              <Icon name="Copy" size={13} />
              Copy
            </button>
          </div>
          <p className="fee-caption">
            Send GY${fee.toLocaleString()} to this MMG number to settle your activation fee. Your
            listing is already visible to buyers — an admin will mark this paid once it&#39;s
            received.
          </p>
        </>
      ) : (
        <p className="fee-caption">
          GY${fee.toLocaleString()} activation fee — the site hasn&#39;t set a payout MMG number
          yet, so hold off paying until it does.
        </p>
      )}
    </div>
  );
}
