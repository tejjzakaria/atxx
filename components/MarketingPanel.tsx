/* ─── Company logo SVGs (white / currentColor, h-4) ──────────────────
   All logos use fill="currentColor" so they render white when the
   parent has text-white applied, then opacity-60 via the wrapper.
   ─────────────────────────────────────────────────────────────────── */

function DiscordLogo() {
  return (
    <svg
      className="h-4 w-auto"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-label="Discord"
      role="img"
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.001.043.028.083.061.107a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function MailchimpLogo() {
  return (
    <svg
      className="h-4 w-auto"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="Mailchimp"
      role="img"
    >
      {/* Head */}
      <path d="M12 2C8.5 2 6 4.5 6 7.5c0 2.1 1.1 3.9 2.8 4.9V15a1 1 0 0 0 1 1h4.4a1 1 0 0 0 1-1v-2.6C16.9 11.4 18 9.6 18 7.5 18 4.5 15.5 2 12 2z" />
      {/* Eyes */}
      <circle cx="9.5" cy="8" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="8" r="0.8" fill="currentColor" stroke="none" />
      {/* Smile */}
      <path d="M10 11s.8 1.2 2 1.2 2-1.2 2-1.2" />
      {/* Ears */}
      <path d="M6 7.5C4.9 7.5 4 8.2 4 9.1S4.9 10.8 6 10.8" />
      <path d="M18 7.5c1.1 0 2 .7 2 1.6s-.9 1.7-2 1.7" />
    </svg>
  );
}

function GrammarlyLogo() {
  return (
    <svg
      className="h-4 w-auto"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-label="Grammarly"
      role="img"
    >
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 1.8a8.2 8.2 0 1 1 0 16.4A8.2 8.2 0 0 1 12 3.8zm.6 3.6c-2.65 0-4.8 2.15-4.8 4.8 0 2.65 2.15 4.8 4.8 4.8 1.5 0 2.84-.69 3.74-1.77l-1.38-1.1a2.99 2.99 0 0 1-2.36 1.07A3 3 0 0 1 9.6 12.2a3 3 0 0 1 3-3c.8 0 1.52.32 2.05.83l1.06-1.44A4.77 4.77 0 0 0 12.6 7.4zm1.8 4.2h-2.4v1.8h2.4v-1.8z" />
    </svg>
  );
}

function AttentiveLogo() {
  return (
    <svg
      className="h-4 w-auto"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-label="Attentive"
      role="img"
    >
      {/* Stylised "a" lettermark in a rounded square */}
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path
        d="M12 7.5L8 16.5h2l.8-2h2.4l.8 2h2L12 7.5zm0 3.2 .8 1.8h-1.6l.8-1.8z"
        fill="white"
      />
    </svg>
  );
}

function HelloSignLogo() {
  return (
    <svg
      className="h-4 w-auto"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="HelloSign"
      role="img"
    >
      {/* Pen nib */}
      <path d="M17 3L21 7l-9 9-4 1 1-4 9-9z" />
      <path d="M15 5l4 4" />
      {/* Signature underline */}
      <path d="M3 21c2-1 4-1.5 6-1s3.5 1 5.5.5" />
    </svg>
  );
}

function IntercomLogo() {
  return (
    <svg
      className="h-4 w-auto"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-label="Intercom"
      role="img"
    >
      <rect x="2" y="2" width="20" height="20" rx="4" />
      <path
        d="M7 9h2v6H7zm4-1h2v8h-2zm4 2h2v4h-2z"
        fill="white"
      />
    </svg>
  );
}

function SquareLogo() {
  return (
    <svg
      className="h-4 w-auto"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-label="Square"
      role="img"
    >
      {/* Outer square */}
      <rect x="2" y="2" width="20" height="20" rx="3" />
      {/* Inner square cutout */}
      <rect x="8" y="8" width="8" height="8" rx="1" fill="black" opacity="0.6" />
    </svg>
  );
}

function DropboxLogo() {
  return (
    <svg
      className="h-4 w-auto"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-label="Dropbox"
      role="img"
    >
      <path d="M12 2.5L6 6.25l6 3.75 6-3.75L12 2.5zM6 13.75l6 3.75 6-3.75-6-3.75-6 3.75zM6 6.25L2 8.875l4 2.5 4-2.5-4-2.625zM18 6.25l-4 2.625 4 2.5 4-2.5-4-2.625zM12 18.125l-4 2.5 4 2.5 4-2.5-4-2.5z" />
    </svg>
  );
}

/* ─── Logo grid row ─────────────────────────────────────────────────── */

const LOGOS_ROW_1 = [
  { Logo: DiscordLogo, label: "Shopify" },
  { Logo: MailchimpLogo, label: "WooCommerce" },
  { Logo: GrammarlyLogo, label: "BigCommerce" },
  { Logo: AttentiveLogo, label: "Amazon" },
];

const LOGOS_ROW_2 = [
  { Logo: HelloSignLogo, label: "Stripe" },
  { Logo: IntercomLogo, label: "Klaviyo" },
  { Logo: SquareLogo, label: "Square" },
  { Logo: DropboxLogo, label: "Shippo" },
];

/* ─── Main component ────────────────────────────────────────────────── */

export default function MarketingPanel() {
  return (
    <div className="hidden md:flex md:w-[48%] relative overflow-hidden flex-col justify-between bg-[#0d3d38] p-12">
      {/* Radial glow — upper-right bloom */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 85% 15%, #1a6b5e 0%, transparent 60%)",
        }}
      />

      {/* All content above the gradient */}
      <div className="relative z-10 flex flex-col justify-between h-full">
        {/* ── Top: heading + testimonial ── */}
        <div>
          <h2 className="text-4xl font-bold text-white leading-tight tracking-tight">
            Your E-Commerce,
            <br />
            Fully Under Control
          </h2>

          {/* Testimonial */}
          <div className="mt-6">
            <p
              className="text-5xl font-serif text-teal-400 leading-none mb-2"
              aria-hidden="true"
            >
              &ldquo;
            </p>
            <p className="text-sm text-white/80 font-normal leading-relaxed">
              ATXX gave us a single place to manage all our stores, customers,
              and orders. Our team moved faster and our revenue followed.
            </p>

            {/* Reviewer */}
            <div className="mt-5 flex items-center">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 flex items-center justify-center bg-teal-600 flex-shrink-0">
                <span className="text-white text-xs font-semibold">SR</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-semibold text-white">
                  Sarah Reynolds
                </p>
                <p className="text-xs text-white/50">
                  Head of E-Commerce at Lumino
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom: social proof + logo grid ── */}
        <div>
          {/* "Join 1K Teams" label */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs font-medium tracking-widest uppercase text-white/40 whitespace-nowrap">
              Trusted by 2K+ Stores
            </span>
            <div className="flex-1 border-t border-white/10" />
          </div>

          {/* Logo grid — 4 columns × 2 rows */}
          <div className="grid grid-cols-4 gap-x-6 gap-y-4">
            {[...LOGOS_ROW_1, ...LOGOS_ROW_2].map(({ Logo, label }) => (
              <div
                key={label}
                className="flex items-center justify-center opacity-60 text-white"
                title={label}
              >
                <Logo />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
