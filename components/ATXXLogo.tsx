/**
 * ATXX Logo Mark — Animated upward chevron
 *
 * Two bold arms draw from the apex outward (0.4 s),
 * then the mark floats gently up-and-down forever.
 */

interface ATXXLogoProps {
  size?: number;
  variant?: "on-dark" | "on-light";
}

export default function ATXXLogo({
  size = 32,
  variant = "on-light",
}: ATXXLogoProps) {
  const color = variant === "on-dark" ? "#ffffff" : "#0d3d38";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-label="ATXX"
      role="img"
    >
      <defs>
        <style>{`
          /* Each arm draws from the apex (length ≈ 24 px) */
          @keyframes atxx-draw-l {
            from { stroke-dashoffset: 26; }
            to   { stroke-dashoffset: 0;  }
          }
          @keyframes atxx-draw-r {
            from { stroke-dashoffset: 26; }
            to   { stroke-dashoffset: 0;  }
          }

          /* Continuous float after draw completes */
          @keyframes atxx-float {
            0%, 100% { transform: translateY(0px);  }
            50%       { transform: translateY(-4px); }
          }

          .atxx-arm-l {
            stroke-dasharray: 26;
            animation: atxx-draw-l 0.38s cubic-bezier(.4,0,.2,1) 0.05s both;
          }
          .atxx-arm-r {
            stroke-dasharray: 26;
            animation: atxx-draw-r 0.38s cubic-bezier(.4,0,.2,1) 0.05s both;
          }
          .atxx-chevron {
            animation: atxx-float 2.2s ease-in-out 0.55s infinite;
          }
        `}</style>
      </defs>

      {/* The chevron — both arms share the same <g> so they float together */}
      <g className="atxx-chevron">
        {/* Left arm: apex → bottom-left */}
        <line
          className="atxx-arm-l"
          x1="24" y1="15"
          x2="10" y2="33"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Right arm: apex → bottom-right */}
        <line
          className="atxx-arm-r"
          x1="24" y1="15"
          x2="38" y2="33"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
