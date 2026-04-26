/**
 * Shared styles for profile quick-copy buttons (entrance + per-slot idle motion on icons).
 * Icon animations pause on hover so manual hover styles win.
 */

/** Stable class suffix 0–8 for `.rt-qca-{n}` — same field type always gets the same idle animation. */
export const quickCopyAnimSlot = (key) => {
  const m = {
    email: 0,
    phone: 1,
    location: 2,
    zip: 3,
    lastCompany: 4,
    lastRole: 5,
    linkedin: 6,
    github: 7,
    cvLink: 8,
  };
  return m[key] ?? 0;
};

export const QUICK_COPY_ANIMATIONS_CSS = `
  @keyframes rtQuickCopyIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes rtQcaBob {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-3px); }
  }
  @keyframes rtQcaPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.12); }
  }
  @keyframes rtQcaTilt {
    0%, 100% { transform: rotate(-4deg); }
    50% { transform: rotate(4deg); }
  }
  @keyframes rtQcaNudge {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(3px); }
  }
  @keyframes rtQcaOrbit {
    0%, 100% { transform: rotate(0deg) translateY(0); }
    25% { transform: rotate(-6deg) translateY(-2px); }
    75% { transform: rotate(6deg) translateY(-1px); }
  }
  @keyframes rtQcaBreathe {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(0.92); opacity: 0.82; }
  }
  @keyframes rtQcaSkew {
    0%, 100% { transform: skewX(0deg); }
    50% { transform: skewX(-4deg); }
  }
  @keyframes rtQcaWobble {
    0%, 100% { transform: rotate(0deg) scale(1); }
    33% { transform: rotate(-5deg) scale(1.05); }
    66% { transform: rotate(5deg) scale(1.05); }
  }
  .rt-quick-copy-grid {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
  }
  .rt-quick-copy-btn {
    animation: rtQuickCopyIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) backwards;
    box-sizing: border-box;
  }
  .rt-quick-copy-icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.22s ease;
  }
  .rt-qca-0 .rt-quick-copy-icon-wrap {
    animation: rtQcaBob 2.3s ease-in-out infinite;
  }
  .rt-qca-1 .rt-quick-copy-icon-wrap {
    animation: rtQcaPulse 2s ease-in-out infinite;
  }
  .rt-qca-2 .rt-quick-copy-icon-wrap {
    animation: rtQcaTilt 2.6s ease-in-out infinite;
  }
  .rt-qca-3 .rt-quick-copy-icon-wrap {
    animation: rtQcaNudge 2.4s ease-in-out infinite;
  }
  .rt-qca-4 .rt-quick-copy-icon-wrap {
    animation: rtQcaOrbit 3s ease-in-out infinite;
  }
  .rt-qca-5 .rt-quick-copy-icon-wrap {
    animation: rtQcaBreathe 2.8s ease-in-out infinite;
  }
  .rt-qca-6 .rt-quick-copy-icon-wrap {
    animation: rtQcaSkew 2.5s ease-in-out infinite;
  }
  .rt-qca-7 .rt-quick-copy-icon-wrap {
    animation: rtQcaWobble 2.7s ease-in-out infinite;
  }
  .rt-qca-8 .rt-quick-copy-icon-wrap {
    animation: rtQcaBob 2.35s ease-in-out infinite;
  }
  .rt-quick-copy-btn:hover .rt-quick-copy-icon-wrap {
    animation-play-state: paused;
    transform: scale(1.1) translateY(-2px);
  }
  .rt-quick-copy-btn:active .rt-quick-copy-icon-wrap {
    animation-play-state: paused;
    transform: scale(0.92);
  }
  /* Always reserve label space so hover/focus does not change row height */
  .rt-quick-copy-label {
    display: block;
    width: 100%;
    text-align: center;
    font-size: 9px;
    line-height: 1.25;
    margin-top: 4px;
    opacity: 1;
    max-height: none;
    overflow: visible;
    word-break: break-word;
    pointer-events: none;
  }
`;
