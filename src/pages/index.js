import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { SPARKLE_LANDING_CSS } from "@/lib/ui/sparkle-ui-css";

export default function Home() {
  const router = useRouter();
  const [profileSlug, setProfileSlug] = useState("");

  const colors = {
    bg: "#0f172a",
    cardBorder: "rgba(148, 163, 184, 0.28)",
    text: "#f1f5f9",
    textSecondary: "#cbd5e1",
    inputBg: "rgba(30, 41, 59, 0.75)",
    inputBorder: "rgba(148, 163, 184, 0.35)",
    buttonBg: "#3b82f6",
    buttonText: "#ffffff",
    buttonHover: "#2563eb",
    buttonDisabled: "#475569",
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (profileSlug.trim()) {
      router.push(`/${profileSlug.trim()}`);
    }
  };

  return (
    <>
      <Head>
        <title>Resume Tailor</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{SPARKLE_LANDING_CSS}</style>
      </Head>

      <div
        className="rt-landing-page"
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          background: colors.bg,
          color: colors.text,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif",
          padding: "16px",
          boxSizing: "border-box",
        }}
      >
        <div className="rt-landing-ambient" aria-hidden>
          <div className="rt-landing-ambient__glow" />
          <div className="rt-landing-sparks">
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i} className="rt-spark" />
            ))}
          </div>
        </div>
        <div
          className="rt-landing-inner"
          style={{
            flex: "1 1 auto",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            maxWidth: "800px",
            width: "100%",
            margin: "0 auto",
            padding: "16px 4px",
            boxSizing: "border-box",
            minWidth: 0,
          }}
        >
          <div
            className="rt-landing-card"
            style={{
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              background: "rgba(15, 23, 42, 0.72)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              borderRadius: "12px",
              border: `1px solid ${colors.cardBorder}`,
              padding: "clamp(22px, 4vw, 36px)",
              boxSizing: "border-box",
            }}
          >
            <div className="rt-landing-card__glow" aria-hidden />
            <div className="rt-landing-card__sparks" aria-hidden>
              {Array.from({ length: 6 }, (_, i) => (
                <span key={i} className="rt-spark" />
              ))}
            </div>
            <div className="rt-landing-card__content">
              <h1
                style={{
                  fontSize: "28px",
                  fontWeight: "600",
                  color: colors.text,
                  margin: "0 0 28px 0",
                  minWidth: 0,
                }}
              >
                Resume Tailor
              </h1>

              <form
                onSubmit={handleSubmit}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  minWidth: 0,
                  maxWidth: "100%",
                }}
              >
                <div style={{ minWidth: 0, maxWidth: "100%" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "15px",
                      fontWeight: "400",
                      color: colors.textSecondary,
                      marginBottom: "8px",
                    }}
                  >
                    Enter Profile ID
                  </label>
                  <input
                    type="text"
                    value={profileSlug}
                    onChange={(e) => setProfileSlug(e.target.value)}
                    style={{
                      width: "100%",
                      maxWidth: "100%",
                      padding: "14px 16px",
                      fontSize: "16px",
                      fontFamily: "inherit",
                      color: colors.text,
                      background: colors.inputBg,
                      border: `1px solid ${colors.inputBorder}`,
                      borderRadius: "8px",
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = colors.buttonBg;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = colors.inputBorder;
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!profileSlug.trim()}
                  style={{
                    width: "100%",
                    maxWidth: "100%",
                    padding: "14px 24px",
                    fontSize: "16px",
                    fontWeight: "500",
                    color: colors.buttonText,
                    background: profileSlug.trim()
                      ? colors.buttonBg
                      : colors.buttonDisabled,
                    border: "none",
                    borderRadius: "8px",
                    cursor: profileSlug.trim() ? "pointer" : "not-allowed",
                    boxSizing: "border-box",
                    transition: "background 0.2s ease, opacity 0.2s ease",
                  }}
                >
                  Go to Profile
                </button>

                <div
                  style={{
                    marginTop: "20px",
                    paddingTop: "20px",
                    borderTop: `1px solid ${colors.cardBorder}`,
                    textAlign: "center",
                  }}
                >
                  <Link
                    href="/manual"
                    className="rt-home-manual-link rt-home-manual-link--dark"
                  >
                    <span className="rt-home-manual-prefix">No API key? &nbsp;</span>
                    <span className="rt-home-manual-rest"> Use manual mode →</span>
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
