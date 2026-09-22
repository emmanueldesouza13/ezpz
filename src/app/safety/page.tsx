import Header from "@/components/Header";
import Icon from "@/components/Icon";
import BackButton from "@/components/BackButton";

const TIPS = [
  {
    icon: "Shield",
    title: "Confirm scope and price up front",
    body: "Agree on the scope and price before work starts, and never wire money or pay outside the app for a job that hasn't been done yet.",
  },
  {
    icon: "MapPin",
    title: "Meet in a public place",
    body: "Choose a well-lit, busy location — a police department lobby, a bank, or a grocery store parking lot. Bring a friend if you can.",
  },
  {
    icon: "MessageCircle",
    title: "Keep the conversation in-app",
    body: "Message through EzPz until you're ready to meet. If someone pushes you to text, email, or call immediately, treat that as a red flag.",
  },
  {
    icon: "Users",
    title: "Inspect before you pay",
    body: "Check the work or item before any money changes hands. Never wire money, send gift cards, or pay a deposit up front.",
  },
  {
    icon: "Shield",
    title: "Trust the Verified badge",
    body: "Verified sellers have confirmed their identity with EzPz. It's not a guarantee, but it's a strong signal — and you can always report a listing that feels off.",
  },
  {
    icon: "Wallet",
    title: "MMG payments go straight to the seller",
    body: "EzPz shows each seller's MMG number so you can pay them directly — we never collect or hold that money ourselves. MMG transfers can't be reversed, so only send payment once you've confirmed the work.",
  },
];

export default function SafetyPage() {
  return (
    <>
      <Header />
      <main>
        <section className="wrap">
          <div className="safety-wrap">
            <BackButton />
            <h1>Safety tips</h1>
            <p className="lede">
              EzPz is built to make booking local services feel safer than the classifieds sites
              you grew up with. Here&#39;s how to stay protected.
            </p>
            {TIPS.map((t) => (
              <div className="card tip-card" key={t.title}>
                <div className="tip-icon">
                  <Icon name={t.icon} />
                </div>
                <div>
                  <h2>{t.title}</h2>
                  <p>{t.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
