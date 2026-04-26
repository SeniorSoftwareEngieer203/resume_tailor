/**
 * Low-motion “center sparkle” backgrounds (opacity + gentle breathing only).
 * SPARKLE_LANDING_CSS: API home + manual entry pages.
 * SPARKLE_PROFILE_CSS: profile + manual profile (main form, top hover dock, right email rail).
 */

export const SPARKLE_LANDING_CSS = `
  .rt-landing-page {
    position: relative;
    min-height: 100vh;
    overflow-x: hidden;
  }
  .rt-landing-ambient {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
  }
  .rt-landing-ambient__glow {
    position: absolute;
    left: 50%;
    top: 44%;
    width: min(95vmin, 720px);
    height: min(95vmin, 720px);
    transform: translate(-50%, -50%);
    background: radial-gradient(
      circle at 50% 50%,
      rgba(74, 144, 226, 0.16) 0%,
      rgba(59, 130, 246, 0.06) 42%,
      transparent 68%
    );
    animation: rtLandGlow 10s ease-in-out infinite alternate;
  }
  @keyframes rtLandGlow {
    from { opacity: 0.45; transform: translate(-50%, -50%) scale(0.97); }
    to { opacity: 0.7; transform: translate(-50%, -50%) scale(1.03); }
  }

  .rt-landing-sparks {
    position: absolute;
    inset: 0;
  }
  .rt-landing-sparks .rt-spark {
    position: absolute;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: rgba(226, 238, 255, 0.95);
    box-shadow: 0 0 8px 2px rgba(147, 197, 253, 0.35);
    animation: rtSparkTwinkle 5s ease-in-out infinite;
  }
  .rt-landing-sparks .rt-spark:nth-child(1) { left: 14%; top: 22%; animation-delay: 0s; }
  .rt-landing-sparks .rt-spark:nth-child(2) { left: 86%; top: 18%; animation-delay: 0.7s; }
  .rt-landing-sparks .rt-spark:nth-child(3) { left: 50%; top: 12%; animation-delay: 1.4s; }
  .rt-landing-sparks .rt-spark:nth-child(4) { left: 22%; top: 55%; animation-delay: 2.1s; }
  .rt-landing-sparks .rt-spark:nth-child(5) { left: 78%; top: 48%; animation-delay: 2.8s; }
  .rt-landing-sparks .rt-spark:nth-child(6) { left: 48%; top: 72%; animation-delay: 3.5s; }
  .rt-landing-sparks .rt-spark:nth-child(7) { left: 34%; top: 38%; animation-delay: 1s; }
  .rt-landing-sparks .rt-spark:nth-child(8) { left: 66%; top: 62%; animation-delay: 2.4s; }
  .rt-landing-sparks .rt-spark:nth-child(9) { left: 8%; top: 70%; animation-delay: 3.2s; }
  .rt-landing-sparks .rt-spark:nth-child(10) { left: 92%; top: 65%; animation-delay: 0.4s; }

  @keyframes rtSparkTwinkle {
    0%, 100% { opacity: 0.08; transform: scale(0.9); }
    50% { opacity: 0.42; transform: scale(1); }
  }

  .rt-landing-inner {
    position: relative;
    z-index: 1;
  }

  .rt-landing-card {
    position: relative;
    overflow: hidden;
    isolation: isolate;
  }
  .rt-landing-card__glow {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 140%;
    height: 140%;
    transform: translate(-50%, -50%);
    background: radial-gradient(
      circle at 50% 50%,
      rgba(74, 144, 226, 0.12) 0%,
      transparent 55%
    );
    animation: rtCardGlow 12s ease-in-out infinite alternate;
    pointer-events: none;
    z-index: 0;
  }
  @keyframes rtCardGlow {
    from { opacity: 0.35; }
    to { opacity: 0.6; }
  }
  .rt-landing-card__sparks {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
  }
  .rt-landing-card__sparks .rt-spark {
    position: absolute;
    width: 2px;
    height: 2px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.85);
    box-shadow: 0 0 5px 1px rgba(147, 197, 253, 0.3);
    animation: rtSparkTwinkle 6s ease-in-out infinite;
  }
  .rt-landing-card__sparks .rt-spark:nth-child(1) { left: 18%; top: 25%; animation-delay: 0s; }
  .rt-landing-card__sparks .rt-spark:nth-child(2) { left: 82%; top: 30%; animation-delay: 1.1s; }
  .rt-landing-card__sparks .rt-spark:nth-child(3) { left: 50%; top: 15%; animation-delay: 2.2s; }
  .rt-landing-card__sparks .rt-spark:nth-child(4) { left: 28%; top: 78%; animation-delay: 0.5s; }
  .rt-landing-card__sparks .rt-spark:nth-child(5) { left: 72%; top: 72%; animation-delay: 3s; }
  .rt-landing-card__sparks .rt-spark:nth-child(6) { left: 50%; top: 55%; animation-delay: 1.6s; }

  .rt-landing-card__content {
    position: relative;
    z-index: 1;
  }

  /* Manual link (API home): short label expands on hover */
  .rt-home-manual-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    max-width: 100%;
    font-size: 14px;
    text-decoration: none;
    cursor: pointer;
    border-radius: 8px;
    padding: 8px 10px;
    margin: -8px -10px;
    transition: color 0.2s ease, background 0.35s ease;
  }
  .rt-home-manual-link:hover,
  .rt-home-manual-link:focus-visible {
    background: rgba(106, 183, 255, 0.08);
    outline: none;
  }
  .rt-home-manual-prefix { flex-shrink: 0; white-space: nowrap; }
  .rt-home-manual-rest {
    display: inline-block;
    max-width: 0;
    opacity: 0;
    overflow: hidden;
    white-space: nowrap;
    vertical-align: bottom;
    transition:
      max-width 0.5s cubic-bezier(0.22, 1, 0.32, 1),
      opacity 0.4s ease 0.05s,
      transform 0.45s cubic-bezier(0.22, 1, 0.32, 1);
    transform: translateX(-6px);
  }
  .rt-home-manual-link:hover .rt-home-manual-rest,
  .rt-home-manual-link:focus-visible .rt-home-manual-rest {
    max-width: 240px;
    opacity: 1;
    transform: translateX(0);
  }
  .rt-home-manual-link--dark { color: #6ab7ff; }

  .rt-landing-back-link {
    display: inline-block;
    font-size: 14px;
    text-decoration: none;
    border-radius: 8px;
    padding: 8px 10px;
    margin: -8px -10px;
    transition: background 0.25s ease, color 0.2s ease;
  }
  .rt-landing-back-link:hover,
  .rt-landing-back-link:focus-visible {
    outline: none;
    background: rgba(106, 183, 255, 0.08);
  }

  @media (hover: none) {
    .rt-home-manual-rest {
      max-width: 260px;
      opacity: 1;
      transform: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .rt-landing-ambient__glow,
    .rt-landing-card__glow,
    .rt-spark {
      animation: none !important;
    }
    .rt-landing-ambient__glow,
    .rt-landing-card__glow {
      opacity: 0.5;
    }
    .rt-spark {
      opacity: 0.2;
    }
  }
`;

export const SPARKLE_PROFILE_CSS = `
  .rt-profile-page {
    position: relative;
  }
  .rt-profile-page-ambient {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
  }
  .rt-profile-page-ambient__glow {
    position: absolute;
    left: 50%;
    top: 48%;
    width: min(100vmin, 900px);
    height: min(100vmin, 900px);
    transform: translate(-50%, -50%);
    background: radial-gradient(
      circle at 50% 50%,
      rgba(59, 130, 246, 0.12) 0%,
      rgba(99, 102, 241, 0.05) 40%,
      transparent 70%
    );
    animation: rtProfGlow 12s ease-in-out infinite alternate;
  }
  @keyframes rtProfGlow {
    from { opacity: 0.4; transform: translate(-50%, -50%) scale(0.98); }
    to { opacity: 0.65; transform: translate(-50%, -50%) scale(1.02); }
  }

  .rt-profile-page-sparks {
    position: absolute;
    inset: 0;
  }
  .rt-profile-page-sparks .rt-spark {
    position: absolute;
    width: 2px;
    height: 2px;
    border-radius: 50%;
    background: rgba(226, 238, 255, 0.9);
    box-shadow: 0 0 6px 1px rgba(147, 197, 253, 0.28);
    animation: rtSparkTwinkleProf 5.5s ease-in-out infinite;
  }
  .rt-profile-page-sparks .rt-spark:nth-child(1) { left: 12%; top: 20%; animation-delay: 0s; }
  .rt-profile-page-sparks .rt-spark:nth-child(2) { left: 88%; top: 24%; animation-delay: 0.8s; }
  .rt-profile-page-sparks .rt-spark:nth-child(3) { left: 50%; top: 8%; animation-delay: 1.6s; }
  .rt-profile-page-sparks .rt-spark:nth-child(4) { left: 20%; top: 78%; animation-delay: 2.4s; }
  .rt-profile-page-sparks .rt-spark:nth-child(5) { left: 80%; top: 72%; animation-delay: 3.2s; }
  .rt-profile-page-sparks .rt-spark:nth-child(6) { left: 50%; top: 88%; animation-delay: 1s; }
  .rt-profile-page-sparks .rt-spark:nth-child(7) { left: 36%; top: 45%; animation-delay: 2s; }
  .rt-profile-page-sparks .rt-spark:nth-child(8) { left: 64%; top: 52%; animation-delay: 3.8s; }

  @keyframes rtSparkTwinkleProf {
    0%, 100% { opacity: 0.06; transform: scale(0.88); }
    50% { opacity: 0.38; transform: scale(1); }
  }

  .rt-profile-page-fill {
    position: relative;
    z-index: 1;
  }

  .rt-main-group {
    position: relative;
    border-radius: 12px;
    padding: 14px;
    border: 1px solid rgba(148, 163, 184, 0.35);
    background: rgba(15, 23, 42, 0.55);
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
  }
  .rt-main-group::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    opacity: 0.85;
    background: linear-gradient(
      125deg,
      rgba(30, 58, 138, 0.22) 0%,
      rgba(13, 148, 136, 0.14) 28%,
      rgba(67, 56, 202, 0.16) 56%,
      rgba(30, 64, 175, 0.2) 78%,
      rgba(15, 118, 110, 0.12) 100%
    );
    background-size: 280% 280%;
    animation: rtMainGroupGradient 18s ease-in-out infinite;
  }
  @keyframes rtMainGroupGradient {
    0%,
    100% {
      background-position: 0% 40%;
    }
    50% {
      background-position: 100% 60%;
    }
  }
  .rt-main-group > * {
    position: relative;
    z-index: 1;
  }

  .rt-profile-card {
    position: relative;
    overflow: hidden;
    isolation: isolate;
  }
  .rt-pcard-sparkle {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
  }
  .rt-pcard-sparkle__glow {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 120%;
    height: 120%;
    transform: translate(-50%, -50%);
    background: radial-gradient(
      circle at 50% 50%,
      rgba(59, 130, 246, 0.1) 0%,
      transparent 58%
    );
    animation: rtPcardGlowSoft 14s ease-in-out infinite alternate;
  }
  .rt-profile-card--form .rt-pcard-sparkle__glow {
    background: radial-gradient(
      circle at 50% 50%,
      rgba(45, 212, 191, 0.08) 0%,
      rgba(59, 130, 246, 0.06) 45%,
      transparent 60%
    );
  }
  @keyframes rtPcardGlowSoft {
    from { opacity: 0.3; }
    to { opacity: 0.55; }
  }

  .rt-pcard-sparkle__sparks .rt-spark {
    position: absolute;
    width: 2px;
    height: 2px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.8);
    box-shadow: 0 0 4px 1px rgba(147, 197, 253, 0.25);
    animation: rtSparkTwinkleProf 6s ease-in-out infinite;
  }
  .rt-profile-card--header .rt-pcard-sparkle__sparks .rt-spark:nth-child(1) { left: 15%; top: 20%; animation-delay: 0s; }
  .rt-profile-card--header .rt-pcard-sparkle__sparks .rt-spark:nth-child(2) { left: 85%; top: 25%; animation-delay: 1.2s; }
  .rt-profile-card--header .rt-pcard-sparkle__sparks .rt-spark:nth-child(3) { left: 50%; top: 12%; animation-delay: 2.4s; }
  .rt-profile-card--header .rt-pcard-sparkle__sparks .rt-spark:nth-child(4) { left: 25%; top: 85%; animation-delay: 0.6s; }
  .rt-profile-card--header .rt-pcard-sparkle__sparks .rt-spark:nth-child(5) { left: 75%; top: 80%; animation-delay: 3s; }

  .rt-profile-card--form .rt-pcard-sparkle__sparks .rt-spark:nth-child(1) { left: 12%; top: 15%; animation-delay: 0.3s; }
  .rt-profile-card--form .rt-pcard-sparkle__sparks .rt-spark:nth-child(2) { left: 88%; top: 18%; animation-delay: 1.5s; }
  .rt-profile-card--form .rt-pcard-sparkle__sparks .rt-spark:nth-child(3) { left: 50%; top: 8%; animation-delay: 2.7s; }
  .rt-profile-card--form .rt-pcard-sparkle__sparks .rt-spark:nth-child(4) { left: 18%; top: 92%; animation-delay: 0.9s; }
  .rt-profile-card--form .rt-pcard-sparkle__sparks .rt-spark:nth-child(5) { left: 82%; top: 88%; animation-delay: 2.1s; }
  .rt-profile-card--form .rt-pcard-sparkle__sparks .rt-spark:nth-child(6) { left: 48%; top: 50%; animation-delay: 3.6s; }

  .rt-pcard-inner {
    position: relative;
    z-index: 1;
  }

  /* macOS-style dock: thin top hit-zone only (rest pointer-events: none so page stays usable) */
  .rt-top-copy-dock {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 90;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: transparent;
    padding: 0 12px;
    box-sizing: border-box;
    pointer-events: none;
  }
  .rt-top-copy-dock__hit {
    width: 100%;
    max-width: min(920px, calc(100vw - 24px));
    height: 18px;
    flex-shrink: 0;
    pointer-events: auto;
  }
  .rt-top-copy-dock__panel {
    position: relative;
    width: 100%;
    max-width: min(920px, calc(100vw - 24px));
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 14px 20px;
    max-height: 0;
    opacity: 0;
    overflow: hidden;
    transform: translateY(-18px) scale(0.94);
    transform-origin: 50% 0%;
    border-radius: 18px;
    padding: 0 16px;
    box-sizing: border-box;
    background: transparent;
    border: 1px solid transparent;
    box-shadow: none;
    pointer-events: none;
    transition:
      max-height 0.55s cubic-bezier(0.22, 1, 0.32, 1),
      opacity 0.38s cubic-bezier(0.22, 1, 0.55, 1),
      transform 0.55s cubic-bezier(0.34, 1.45, 0.52, 1),
      padding 0.45s ease,
      background 0.35s ease,
      border-color 0.35s ease,
      box-shadow 0.45s ease;
  }
  .rt-top-copy-dock:hover .rt-top-copy-dock__panel,
  .rt-top-copy-dock--pinned .rt-top-copy-dock__panel {
    /* Icon area only (labels below tiles via position:absolute; hover does not change height) */
    max-height: 152px;
    min-height: 64px;
    opacity: 1;
    transform: translateY(0) scale(1);
    pointer-events: auto;
    /* Extra right space for the pin control (positioned bottom-right) */
    padding: 10px 40px 10px 16px;
    overflow: visible;
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.22);
    box-shadow:
      0 12px 40px rgba(0, 0, 0, 0.18),
      0 0 0 1px rgba(255, 255, 255, 0.08) inset;
    backdrop-filter: blur(24px) saturate(160%);
    -webkit-backdrop-filter: blur(24px) saturate(160%);
  }

  .rt-top-copy-dock__pin {
    position: absolute;
    right: 8px;
    bottom: 6px;
    z-index: 4;
    width: 30px;
    height: 30px;
    min-width: 30px;
    min-height: 30px;
    padding: 0;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    cursor: pointer;
    box-sizing: border-box;
    border: 1px solid rgba(255, 255, 255, 0.4);
    background: rgba(255, 255, 255, 0.28);
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.55) inset;
    color: #1e293b;
    transition:
      transform 0.2s cubic-bezier(0.34, 1.45, 0.52, 1),
      background 0.2s ease,
      border-color 0.2s ease,
      box-shadow 0.2s ease;
  }

  .rt-top-copy-dock__pin:hover,
  .rt-top-copy-dock__pin:focus-visible {
    transform: scale(1.08);
    background: rgba(255, 255, 255, 0.42);
    border-color: rgba(255, 255, 255, 0.58);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1), 0 1px 0 rgba(255, 255, 255, 0.75) inset;
    outline: none;
  }

  .rt-top-copy-dock__pin--active {
    background: rgba(34, 211, 238, 0.35);
    border-color: rgba(6, 182, 212, 0.65);
    box-shadow:
      0 0 0 1px rgba(34, 211, 238, 0.25) inset,
      0 1px 0 rgba(255, 255, 255, 0.5) inset;
  }

  .rt-top-copy-dock__pin--active:hover,
  .rt-top-copy-dock__pin--active:focus-visible {
    background: rgba(34, 211, 238, 0.48);
    border-color: rgba(8, 145, 178, 0.75);
  }
  .rt-top-copy-dock .rt-dock-copy-btn {
    position: relative;
    width: 56px;
    height: 56px;
    min-width: 56px;
    min-height: 56px;
    flex: 0 0 auto;
    padding: 4px;
    cursor: pointer;
    box-sizing: border-box;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.22);
    border: 1px solid rgba(255, 255, 255, 0.35);
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.65) inset;
    transition:
      transform 0.28s cubic-bezier(0.34, 1.45, 0.52, 1),
      background 0.22s ease,
      border-color 0.22s ease,
      box-shadow 0.22s ease;
  }
  .rt-top-copy-dock .rt-dock-copy-btn:hover,
  .rt-top-copy-dock .rt-dock-copy-btn:focus-visible {
    transform: scale(1.32);
    z-index: 2;
    background: rgba(255, 255, 255, 0.38);
    border-color: rgba(255, 255, 255, 0.55);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12), 0 1px 0 rgba(255, 255, 255, 0.85) inset;
    outline: none;
  }
  .rt-top-copy-dock .rt-dock-copy-btn .rt-quick-copy-icon-wrap {
    flex: 1 1 auto;
    width: 100%;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: none !important;
  }
  .rt-top-copy-dock .rt-dock-copy-btn .rt-quick-copy-icon-wrap svg {
    width: 48px !important;
    height: 48px !important;
    flex-shrink: 0;
    max-width: 100%;
    max-height: 100%;
  }
  .rt-top-copy-dock .rt-dock-copy-btn:hover .rt-quick-copy-icon-wrap,
  .rt-top-copy-dock .rt-dock-copy-btn:focus-visible .rt-quick-copy-icon-wrap {
    transform: none;
  }
  .rt-top-copy-dock .rt-dock-copy-btn.rt-quick-copy-btn--copied {
    background: rgba(34, 197, 94, 0.28);
    border-color: rgba(22, 163, 74, 0.55);
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.4) inset;
  }
  .rt-top-copy-dock .rt-dock-copy-btn.rt-quick-copy-btn--copied:hover,
  .rt-top-copy-dock .rt-dock-copy-btn.rt-quick-copy-btn--copied:focus-visible {
    background: rgba(34, 197, 94, 0.38);
    border-color: rgba(22, 163, 74, 0.75);
  }
  .rt-top-copy-dock .rt-quick-copy-label {
    position: absolute;
    left: 50%;
    top: calc(100% + 6px);
    transform: translateX(-50%);
    margin: 0;
    padding: 0;
    max-height: none;
    overflow: visible;
    white-space: nowrap;
    pointer-events: none;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-size: 10px;
    line-height: 1.2;
    color: #22d3ee;
    text-shadow:
      0 0 14px rgba(34, 211, 238, 0.55),
      0 0 8px rgba(6, 182, 212, 0.45),
      0 1px 2px rgba(15, 23, 42, 0.35);
    opacity: 0;
    transition: opacity 0.18s ease, color 0.18s ease;
  }
  .rt-top-copy-dock .rt-dock-copy-btn:hover .rt-quick-copy-label,
  .rt-top-copy-dock .rt-dock-copy-btn:focus-visible .rt-quick-copy-label,
  .rt-top-copy-dock .rt-dock-copy-btn.rt-quick-copy-btn--copied .rt-quick-copy-label {
    opacity: 1;
  }
  .rt-top-copy-dock .rt-quick-copy-btn--copied .rt-quick-copy-label {
    color: #86efac;
    text-shadow:
      0 0 14px rgba(134, 239, 172, 0.65),
      0 0 8px rgba(74, 222, 128, 0.5),
      0 1px 2px rgba(15, 23, 42, 0.35);
  }

  /* Right rail: email snippet topics from /email-snippets.json (hover or pin to keep open) */
  .rt-right-email-dock {
    position: fixed;
    right: 0;
    left: auto;
    top: 0;
    bottom: 0;
    z-index: 85;
    display: flex;
    flex-direction: row-reverse;
    align-items: stretch;
    padding: 16px 0 20px;
    box-sizing: border-box;
    pointer-events: none;
  }
  .rt-right-email-dock__hit {
    width: 18px;
    flex-shrink: 0;
    align-self: stretch;
    pointer-events: auto;
  }
  .rt-right-email-dock__panel {
    display: flex;
    flex-direction: column;
    min-width: 0;
    max-width: 0;
    max-height: calc(100dvh - 36px);
    align-self: center;
    margin: 0;
    padding: 0;
    overflow: hidden;
    opacity: 0;
    transform: translateX(12px);
    transform-origin: 100% 50%;
    border-radius: 16px;
    box-sizing: border-box;
    pointer-events: none;
    border: 1px solid transparent;
    background: transparent;
    box-shadow: none;
    transition:
      max-width 0.48s cubic-bezier(0.22, 1, 0.32, 1),
      min-width 0.48s cubic-bezier(0.22, 1, 0.32, 1),
      opacity 0.34s cubic-bezier(0.22, 1, 0.55, 1),
      transform 0.45s cubic-bezier(0.34, 1.45, 0.52, 1),
      padding 0.4s ease,
      background 0.3s ease,
      border-color 0.3s ease,
      box-shadow 0.4s ease;
  }
  .rt-right-email-dock:hover .rt-right-email-dock__panel,
  .rt-right-email-dock--pinned .rt-right-email-dock__panel {
    min-width: min(272px, calc(100vw - 36px));
    max-width: min(272px, calc(100vw - 36px));
    opacity: 1;
    transform: translateX(0);
    pointer-events: auto;
    padding: 12px 14px 14px;
    margin-right: 2px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.22);
    box-shadow:
      -12px 0 40px rgba(0, 0, 0, 0.18),
      0 0 0 1px rgba(255, 255, 255, 0.08) inset;
    backdrop-filter: blur(24px) saturate(160%);
    -webkit-backdrop-filter: blur(24px) saturate(160%);
  }
  .rt-right-email-dock__head {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex: 0 0 auto;
    margin-bottom: 8px;
  }
  .rt-right-email-dock__title {
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.03em;
    text-transform: none;
    color: #f0f9ff;
    text-shadow:
      0 0 14px rgba(56, 189, 248, 0.55),
      0 0 8px rgba(34, 211, 238, 0.4),
      0 1px 2px rgba(15, 23, 42, 0.5);
  }
  .rt-right-email-dock__pin {
    width: 30px;
    height: 30px;
    min-width: 30px;
    min-height: 30px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    cursor: pointer;
    box-sizing: border-box;
    border: 1px solid rgba(255, 255, 255, 0.4);
    background: rgba(255, 255, 255, 0.28);
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.55) inset;
    color: #1e293b;
    transition:
      transform 0.2s cubic-bezier(0.34, 1.45, 0.52, 1),
      background 0.2s ease,
      border-color 0.2s ease;
  }
  .rt-right-email-dock__pin:hover,
  .rt-right-email-dock__pin:focus-visible {
    transform: scale(1.06);
    background: rgba(255, 255, 255, 0.42);
    border-color: rgba(255, 255, 255, 0.58);
    outline: none;
  }
  .rt-right-email-dock__pin--active {
    background: rgba(34, 211, 238, 0.35);
    border-color: rgba(6, 182, 212, 0.65);
    box-shadow:
      0 0 0 1px rgba(34, 211, 238, 0.25) inset,
      0 1px 0 rgba(255, 255, 255, 0.5) inset;
  }
  .rt-right-email-dock__pin--active:hover,
  .rt-right-email-dock__pin--active:focus-visible {
    background: rgba(34, 211, 238, 0.48);
    border-color: rgba(8, 145, 178, 0.75);
  }
  .rt-right-email-dock__error {
    margin: 0 0 8px;
    padding: 0;
    font-size: 11px;
    line-height: 1.35;
    color: #fca5a5;
  }
  .rt-right-email-dock__topics {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    /* Horizontal padding so borders/shadows are not clipped at the rail edge */
    padding: 2px 8px 0 8px;
    overflow-x: hidden;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
  .rt-right-email-dock__topic {
    flex: 0 0 auto;
    width: 100%;
    margin: 0;
    padding: 11px 14px;
    text-align: left;
    font-size: 15px;
    font-weight: 700;
    line-height: 1.35;
    color: #e0f2fe;
    border-radius: 11px;
    cursor: pointer;
    box-sizing: border-box;
    border: 1px solid rgba(56, 189, 248, 0.5);
    background: rgba(15, 23, 42, 0.58);
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.1) inset,
      0 0 22px rgba(34, 211, 238, 0.12);
    text-shadow:
      0 0 12px rgba(56, 189, 248, 0.45),
      0 1px 2px rgba(15, 23, 42, 0.85);
    transition:
      background 0.18s ease,
      border-color 0.18s ease,
      transform 0.2s ease,
      color 0.18s ease,
      box-shadow 0.2s ease;
  }
  .rt-right-email-dock__topic:hover,
  .rt-right-email-dock__topic:focus-visible {
    background: rgba(8, 47, 73, 0.78);
    border-color: rgba(103, 232, 249, 0.85);
    color: #ffffff;
    outline: none;
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.14) inset,
      0 0 28px rgba(34, 211, 238, 0.22);
    text-shadow:
      0 0 16px rgba(165, 243, 252, 0.65),
      0 1px 2px rgba(15, 23, 42, 0.9);
  }
  .rt-right-email-dock__topic--copied {
    background: rgba(6, 78, 59, 0.65);
    border-color: rgba(52, 211, 153, 0.8);
    color: #d1fae5;
    text-shadow:
      0 0 14px rgba(167, 243, 208, 0.55),
      0 1px 2px rgba(15, 23, 42, 0.85);
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.12) inset,
      0 0 20px rgba(74, 222, 128, 0.2);
  }

  @media (hover: none) {
    .rt-top-copy-dock {
      pointer-events: auto;
      padding: 8px 12px 0;
    }
    .rt-top-copy-dock__hit {
      display: none;
      height: 0;
      pointer-events: none;
    }
    .rt-top-copy-dock .rt-top-copy-dock__panel {
      max-height: none;
      min-height: auto;
      opacity: 1;
      transform: none;
      pointer-events: auto;
      padding: 10px 40px 10px 16px;
      overflow: visible;
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.22);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(255, 255, 255, 0.08) inset;
      backdrop-filter: blur(24px) saturate(160%);
      -webkit-backdrop-filter: blur(24px) saturate(160%);
    }
    .rt-top-copy-dock .rt-dock-copy-btn {
      width: auto;
      min-width: 56px;
      height: auto;
      min-height: 56px;
      padding: 6px 8px 8px;
    }
    .rt-top-copy-dock .rt-dock-copy-btn .rt-quick-copy-icon-wrap svg {
      width: 48px !important;
      height: 48px !important;
    }
    .rt-top-copy-dock .rt-quick-copy-label {
      position: static;
      transform: none;
      opacity: 1;
      margin-top: 6px;
      white-space: normal;
      max-width: 72px;
      text-align: center;
      line-height: 1.15;
      font-weight: 700;
      font-size: 10px;
      letter-spacing: 0.05em;
      color: #22d3ee;
      text-shadow:
        0 0 12px rgba(34, 211, 238, 0.5),
        0 1px 2px rgba(15, 23, 42, 0.35);
    }

    .rt-right-email-dock {
      pointer-events: auto;
      padding: 12px 0 16px 8px;
    }
    .rt-right-email-dock__hit {
      display: none;
      width: 0;
      pointer-events: none;
    }
    .rt-right-email-dock .rt-right-email-dock__panel {
      min-width: min(272px, calc(100vw - 20px));
      max-width: min(272px, calc(100vw - 20px));
      opacity: 1;
      transform: none;
      pointer-events: auto;
      padding: 12px 14px 14px;
      margin-right: 8px;
      overflow: hidden;
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.22);
      box-shadow:
        -12px 0 40px rgba(0, 0, 0, 0.18),
        0 0 0 1px rgba(255, 255, 255, 0.08) inset;
      backdrop-filter: blur(24px) saturate(160%);
      -webkit-backdrop-filter: blur(24px) saturate(160%);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .rt-top-copy-dock__panel {
      transition-duration: 0.01ms !important;
    }
    .rt-right-email-dock__panel {
      transition-duration: 0.01ms !important;
    }
    .rt-main-group::before {
      animation: none !important;
      background-position: 50% 50%;
      opacity: 0.65;
    }
    .rt-profile-page-ambient__glow,
    .rt-pcard-sparkle__glow,
    .rt-spark {
      animation: none !important;
    }
    .rt-profile-page-ambient__glow { opacity: 0.45; }
    .rt-pcard-sparkle__glow { opacity: 0.4; }
    .rt-spark { opacity: 0.15; }
  }
`;
