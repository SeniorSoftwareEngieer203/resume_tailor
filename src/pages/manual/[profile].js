import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { slugToProfileName } from "@/lib/profile/profile-template-mapping";
import { firstNameFromFullName } from "@/lib/profile/profile-utils";
import { QuickCopyIcon, DockPinIcon } from "@/lib/ui/quick-copy-icons";
import {
  QUICK_COPY_ANIMATIONS_CSS,
  quickCopyAnimSlot,
} from "@/lib/ui/quick-copy-animations-css";
import { SPARKLE_PROFILE_CSS } from "@/lib/ui/sparkle-ui-css";
import { EmailSnippetsSidebar } from "@/components/EmailSnippetsSidebar";

function ManualProfileLoadingSpinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "40px" }}>
      <style>{`
        @keyframes rtManualProfileSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div
        style={{
          width: "40px",
          height: "40px",
          border: "3px solid rgba(74, 144, 226, 0.3)",
          borderTop: "3px solid #4a90e2",
          borderRadius: "50%",
          animation: "rtManualProfileSpin 1s linear infinite",
        }}
      />
    </div>
  );
}

export default function ManualProfilePage() {
  const router = useRouter();
  const { profile: profileSlug } = router.query;

  const [jd, setJd] = useState("");
  const [chatgptResponse, setChatgptResponse] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [generating, setGenerating] = useState(null);
  /** null | "resume-pdf" | "resume-docx" | "cover-pdf" | "cover-docx" */
  const [elapsedTime, setElapsedTime] = useState(0);
  const [lastGenerationTime, setLastGenerationTime] = useState(null);
  const [lastGenerationWasCover, setLastGenerationWasCover] = useState(false);
  const [selectedProfileData, setSelectedProfileData] = useState(null);
  const [profileName, setProfileName] = useState("");
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState(null);
  const [quickCopyDockPinned, setQuickCopyDockPinned] = useState(false);
  const [cvUrlPeek, setCvUrlPeek] = useState(null);
  const [copyPromptLoading, setCopyPromptLoading] = useState(false);
  const [flowCvConnected, setFlowCvConnected] = useState(false);
  const [flowCvSessionEmail, setFlowCvSessionEmail] = useState("");
  const [flowCvResumeId, setFlowCvResumeId] = useState("");
  const [flowCvOverrideEmail, setFlowCvOverrideEmail] = useState("");
  const [flowCvOverridePassword, setFlowCvOverridePassword] = useState("");
  const [flowCvAuthLoading, setFlowCvAuthLoading] = useState(false);
  const [flowCvAuthError, setFlowCvAuthError] = useState("");
  const timerIntervalRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    setCvUrlPeek(null);
  }, [profileSlug]);

  useEffect(() => {
    if (!profileSlug) return;

    const profileNameFromSlug = slugToProfileName(profileSlug);
    if (!profileNameFromSlug) {
      setLoading(false);
      router.push("/manual");
      return;
    }

    setProfileName(profileNameFromSlug);
    setLoading(true);

    const loadData = async () => {
      try {
        const response = await fetch(
          `/api/profiles/${encodeURIComponent(profileNameFromSlug)}`
        );
        if (!response.ok) {
          if (response.status === 404) {
            router.push("/manual");
            return;
          }
          throw new Error(`Failed to fetch profile: ${response.statusText}`);
        }
        const data = await response.json();
        setSelectedProfileData(data);
      } catch (err) {
        console.error("Failed to load profile data:", err);
        router.push("/manual");
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(loadData, 100);
    return () => clearTimeout(timer);
  }, [profileSlug, router]);

  useEffect(() => {
    if (!profileSlug) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(
          `/api/flowcv/session?profile=${encodeURIComponent(profileSlug)}`,
        );
        if (!r.ok) return;
        const d = await r.json();
        if (cancelled) return;
        setFlowCvConnected(Boolean(d.connected));
        setFlowCvSessionEmail(d.email || "");
        setFlowCvResumeId(d.resumeId || "");
      } catch {
        if (!cancelled) setFlowCvConnected(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profileSlug]);

  const copyToClipboard = async (text, fieldName) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const getLastCompany = () =>
    selectedProfileData?.experience?.[0]?.company || null;
  const getLastRole = () =>
    selectedProfileData?.experience?.[0]?.title || null;

  const copyPromptToClipboard = async () => {
    if (!jd.trim()) {
      alert("Please enter a job description first");
      return;
    }

    setCopyPromptLoading(true);
    try {
      const response = await fetch("/api/manual-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: profileSlug, jd }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to build prompt");
      }

      const { prompt } = await response.json();
      await navigator.clipboard.writeText(prompt);
      setCopiedField("prompt");
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Copy prompt error:", err);
      alert("Failed to copy prompt: " + err.message);
    } finally {
      setCopyPromptLoading(false);
    }
  };

  const handleGenerate = async (outputFormat) => {
    if (!chatgptResponse.trim()) {
      alert("Please paste the ChatGPT response (JSON) first");
      return;
    }

    if (!selectedProfileData || !profileSlug) {
      alert("Profile data not loaded");
      return;
    }

    const fmt = outputFormat === "docx" ? "docx" : "pdf";
    setGenerating(fmt === "docx" ? "resume-docx" : "resume-pdf");
    setElapsedTime(0);
    startTimeRef.current = Date.now();

    timerIntervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);

    try {
      const response = await fetch("/api/generate-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: profileSlug,
          chatgptResponse: chatgptResponse.trim(),
          companyName: companyName.trim() || null,
          format: fmt,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Download failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const contentDisposition = response.headers.get("Content-Disposition");
      const ext = fmt === "docx" ? ".docx" : ".pdf";
      let filename = `${profileName?.replace(/\s+/g, "_") || profileSlug}${ext}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) filename = filenameMatch[1];
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setLastGenerationWasCover(false);
      setLastGenerationTime(
        Math.floor((Date.now() - startTimeRef.current) / 1000)
      );
    } catch (error) {
      console.error("Generation error:", error);
      alert(
        (fmt === "docx" ? "Failed to generate Word file: " : "Failed to generate PDF: ") +
          error.message
      );
    } finally {
      setGenerating(null);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      startTimeRef.current = null;
    }
  };

  const handleCoverLetterGenerate = async (outputFormat) => {
    if (!jd.trim()) {
      alert("Please enter a job description first");
      return;
    }

    if (!selectedProfileData || !profileSlug) {
      alert("Profile data not loaded");
      return;
    }

    const fmt = outputFormat === "docx" ? "docx" : "pdf";
    setGenerating(fmt === "docx" ? "cover-docx" : "cover-pdf");
    setElapsedTime(0);
    startTimeRef.current = Date.now();

    timerIntervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);

    try {
      const response = await fetch("/api/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: profileSlug,
          jd: jd.trim(),
          companyName: companyName.trim() || null,
          targetRole: targetRole.trim() || null,
          format: fmt,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Download failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const contentDisposition = response.headers.get("Content-Disposition");
      const ext = fmt === "docx" ? ".docx" : ".pdf";
      let filename = `${profileName?.replace(/\s+/g, "_") || profileSlug}_cover_letter${ext}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) filename = filenameMatch[1];
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setLastGenerationWasCover(true);
      setLastGenerationTime(
        Math.floor((Date.now() - startTimeRef.current) / 1000)
      );
    } catch (error) {
      console.error("Cover letter error:", error);
      alert(
        (fmt === "docx"
          ? "Failed to generate cover letter Word file: "
          : "Failed to generate cover letter PDF: ") + error.message
      );
    } finally {
      setGenerating(null);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      startTimeRef.current = null;
    }
  };

  const loadFlowCvSession = async () => {
    if (!profileSlug) return;
    const r = await fetch(
      `/api/flowcv/session?profile=${encodeURIComponent(profileSlug)}`,
    );
    if (r.ok) {
      const d = await r.json();
      setFlowCvConnected(Boolean(d.connected));
      setFlowCvSessionEmail(d.email || "");
      setFlowCvResumeId(d.resumeId || "");
    }
  };

  const handleFlowCvLogin = async () => {
    const canUseProfileFile = selectedProfileData?.flowcv?.configured;
    const hasOverrideCreds =
      flowCvOverrideEmail.trim() && flowCvOverridePassword;
    if (!canUseProfileFile && !hasOverrideCreds) {
      setFlowCvAuthError(
        'Add a "flowcv" object with email and password to this profile JSON, or use the override fields below.',
      );
      return;
    }
    setFlowCvAuthLoading(true);
    setFlowCvAuthError("");
    try {
      const body = { profile: profileSlug };
      if (flowCvOverrideEmail.trim()) body.email = flowCvOverrideEmail.trim();
      if (flowCvOverridePassword) body.password = flowCvOverridePassword;
      const r = await fetch("/api/flowcv/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "FlowCV sign-in failed");
      setFlowCvOverridePassword("");
      await loadFlowCvSession();
    } catch (e) {
      setFlowCvAuthError(e.message);
    } finally {
      setFlowCvAuthLoading(false);
    }
  };

  const handleFlowCvLogout = async () => {
    setFlowCvAuthLoading(true);
    setFlowCvAuthError("");
    try {
      await fetch("/api/flowcv/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: profileSlug }),
      });
      setFlowCvConnected(false);
      setFlowCvSessionEmail("");
      setFlowCvResumeId("");
    } catch (e) {
      setFlowCvAuthError(e.message);
    } finally {
      setFlowCvAuthLoading(false);
    }
  };

  const handleManualFlowCvExportPdf = async () => {
    if (!chatgptResponse.trim()) {
      alert("Please paste the ChatGPT response (JSON) first");
      return;
    }
    if (!flowCvConnected) {
      alert("Sign in to FlowCV for this profile first.");
      return;
    }

    setGenerating("flowcv-pdf");
    setElapsedTime(0);
    startTimeRef.current = Date.now();
    timerIntervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);

    try {
      const response = await fetch("/api/flowcv/export-pdf-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: profileSlug,
          chatgptResponse: chatgptResponse.trim(),
          companyName: companyName.trim() || null,
        }),
      });
      if (!response.ok) {
        const text = await response.text();
        let msg = text;
        try {
          const j = JSON.parse(text);
          if (j.error) msg = j.error;
        } catch {
          /* keep text */
        }
        throw new Error(msg || "FlowCV manual export failed");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `${
        profileName?.replace(/\s+/g, "_") || profileSlug
      }_flowcv_manual.pdf`;
      if (contentDisposition) {
        const m = contentDisposition.match(/filename="(.+)"/);
        if (m) filename = m[1];
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setLastGenerationWasCover(false);
      setLastGenerationTime(
        Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000),
      );
    } catch (error) {
      console.error("FlowCV manual export error:", error);
      alert("FlowCV PDF export failed: " + error.message);
    } finally {
      setGenerating(null);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      startTimeRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const colors = {
    bg: "#0f172a",
    cardBg: "#1e293b",
    cardBorder: "rgba(148, 163, 184, 0.28)",
    text: "#f1f5f9",
    textSecondary: "#cbd5e1",
    textMuted: "#94a3b8",
    inputBg: "rgba(30, 41, 59, 0.75)",
    inputBorder: "rgba(148, 163, 184, 0.35)",
    inputFocus: "#3b82f6",
    textareaBg: "rgba(30, 41, 59, 0.85)",
    buttonBg: "#3b82f6",
    buttonHover: "#2563eb",
    buttonText: "#ffffff",
    buttonDisabled: "#475569",
    wordButtonBg: "#0d9488",
    wordButtonHover: "#0f766e",
    coverPdfBg: "#7c3aed",
    coverPdfHover: "#6d28d9",
    coverWordBg: "#6366f1",
    coverWordHover: "#4f46e5",
    successBg: "rgba(34, 197, 94, 0.1)",
    successText: "#22c55e",
    infoBg: "rgba(59, 130, 246, 0.1)",
    infoText: "#3b82f6",
    copyBg: "rgba(59, 130, 246, 0.15)",
    copyHover: "rgba(59, 130, 246, 0.25)",
  };

  if (!router.isReady || !profileSlug) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          background: colors.bg,
          color: colors.text,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ManualProfileLoadingSpinner />
        <p style={{ marginTop: "12px", fontSize: "14px", color: colors.textSecondary }}>Loading…</p>
      </div>
    );
  }

  if (loading || !selectedProfileData) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          background: colors.bg,
          color: colors.text,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ManualProfileLoadingSpinner />
        <p style={{ marginTop: "12px", fontSize: "14px", color: colors.textSecondary }}>Loading profile…</p>
      </div>
    );
  }

  const cvLinkRaw =
    selectedProfileData?.cvLink ?? selectedProfileData?.cv_link;
  const cvLinkValue =
    typeof cvLinkRaw === "string" ? cvLinkRaw.trim() : cvLinkRaw;
  const hasCvLink = Boolean(cvLinkValue);

  const quickCopyFieldsCore = [
    { key: "email", label: "Email", value: selectedProfileData?.email },
    { key: "phone", label: "Phone", value: selectedProfileData?.phone },
    { key: "location", label: "Address", value: selectedProfileData?.location },
    { key: "zip", label: "Zip", value: selectedProfileData?.zip },
    { key: "lastCompany", label: "Last Company", value: getLastCompany() },
    { key: "lastRole", label: "Last Role", value: getLastRole() },
    { key: "linkedin", label: "LinkedIn", value: selectedProfileData?.linkedin },
    { key: "github", label: "GitHub", value: selectedProfileData?.github },
  ].filter((f) => f.value);

  const showQuickCopyDock =
    quickCopyFieldsCore.length > 0 || hasCvLink;

  const handleCvUrlDockClick = async () => {
    if (!hasCvLink) {
      alert(
        'No CV URL yet. Add a "cvLink" string to this profile JSON in the resumes/ folder (same level as email), e.g. "cvLink": "https://flowcv.com/..."'
      );
      return;
    }
    setCvUrlPeek(cvLinkValue);
    setTimeout(() => setCvUrlPeek(null), 4500);
    await copyToClipboard(cvLinkValue, "cvLink");
  };

  const replyFirstName = firstNameFromFullName(selectedProfileData?.name);

  return (
    <>
      <Head>
        <title>Manual Resume - {profileName}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{QUICK_COPY_ANIMATIONS_CSS}</style>
        <style>{SPARKLE_PROFILE_CSS}</style>
      </Head>

      <div
        className="rt-profile-page"
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          background: colors.bg,
          color: colors.text,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif",
          boxSizing: "border-box",
        }}
      >
        <div className="rt-profile-page-ambient" aria-hidden>
          <div className="rt-profile-page-ambient__glow" />
          <div className="rt-profile-page-sparks">
            {Array.from({ length: 8 }, (_, i) => (
              <span key={i} className="rt-spark" />
            ))}
          </div>
        </div>

        <EmailSnippetsSidebar replyFirstName={replyFirstName} />

        {showQuickCopyDock && (
          <div className={`rt-top-copy-dock${quickCopyDockPinned ? " rt-top-copy-dock--pinned" : ""}`}>
            <div className="rt-top-copy-dock__hit" aria-hidden />
            <div className="rt-top-copy-dock__panel">
              {quickCopyFieldsCore.map(({ key, label, value }, index) => (
                <button
                  key={key}
                  type="button"
                  aria-label={copiedField === key ? `${label} copied` : `Copy ${label}`}
                  className={`rt-quick-copy-btn rt-dock-copy-btn rt-qca-${quickCopyAnimSlot(key)}${copiedField === key ? " rt-quick-copy-btn--copied" : ""}`}
                  onClick={() => copyToClipboard(value, key)}
                  style={{ animationDelay: `${index * 45}ms` }}
                >
                  <span className="rt-quick-copy-icon-wrap">
                    <QuickCopyIcon
                      fieldKey={key}
                      size={48}
                      color={copiedField === key ? colors.successText : "#1e293b"}
                    />
                  </span>
                  <div className="rt-quick-copy-label">{copiedField === key ? "Copied!" : label}</div>
                </button>
              ))}
              <button
                type="button"
                aria-label={
                  copiedField === "cvLink"
                    ? "CV URL copied"
                    : hasCvLink
                      ? `Copy CV URL: ${cvLinkValue}`
                      : "CV URL — not set in profile JSON"
                }
                title={hasCvLink ? cvLinkValue : undefined}
                className={`rt-quick-copy-btn rt-dock-copy-btn rt-qca-${quickCopyAnimSlot("cvLink")}${copiedField === "cvLink" ? " rt-quick-copy-btn--copied" : ""}`}
                onClick={handleCvUrlDockClick}
                style={{
                  animationDelay: `${quickCopyFieldsCore.length * 45}ms`,
                  opacity: hasCvLink ? 1 : 0.72,
                }}
              >
                <span className="rt-quick-copy-icon-wrap">
                  <QuickCopyIcon
                    fieldKey="cvLink"
                    size={48}
                    color={
                      copiedField === "cvLink"
                        ? colors.successText
                        : hasCvLink
                          ? "#1e293b"
                          : "#64748b"
                    }
                  />
                </span>
                <div className="rt-quick-copy-label">
                  {cvUrlPeek
                    ? cvUrlPeek.length > 30
                      ? `${cvUrlPeek.slice(0, 28)}…`
                      : cvUrlPeek
                    : copiedField === "cvLink"
                      ? "Copied!"
                      : "CV URL"}
                </div>
              </button>
              <button
                type="button"
                className={`rt-top-copy-dock__pin${quickCopyDockPinned ? " rt-top-copy-dock__pin--active" : ""}`}
                aria-pressed={quickCopyDockPinned}
                aria-label={quickCopyDockPinned ? "Unpin quick-copy bar" : "Pin quick-copy bar open"}
                onClick={() => setQuickCopyDockPinned((p) => !p)}
              >
                <DockPinIcon size={16} color="#0f172a" />
              </button>
            </div>
          </div>
        )}

        <div
          className="rt-profile-page-fill"
          style={{
            flex: "1 1 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            padding: "20px 12px",
            boxSizing: "border-box",
            minHeight: "100dvh",
            width: "100%",
          }}
        >
        <div
          className="rt-main-group"
          style={{
            flex: "1 1 auto",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            maxWidth: "min(1600px, 100%)",
            width: "100%",
            margin: "0 auto",
            minWidth: 0,
            boxSizing: "border-box",
            overflow: "auto",
          }}
        >
          <div
            className="rt-profile-card rt-profile-card--form"
            style={{
              flex: "1 1 auto",
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              background: "rgba(15, 23, 42, 0.72)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderRadius: "8px",
              border: `1px solid ${colors.cardBorder}`,
              padding: "16px",
              minWidth: 0,
              maxWidth: "100%",
              boxSizing: "border-box",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div className="rt-pcard-sparkle" aria-hidden>
              <div className="rt-pcard-sparkle__glow" />
              <div className="rt-pcard-sparkle__sparks">
                {Array.from({ length: 6 }, (_, i) => (
                  <span key={i} className="rt-spark" />
                ))}
              </div>
            </div>
            <div
              className="rt-pcard-inner"
              style={{
                flex: "1 1 auto",
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
              }}
            >
            {/* Step 1: Job Description — layout matches API profile page */}
            <div
              style={{
                flex: "1 1 auto",
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                marginBottom: "16px",
              }}
            >
              <div style={{ marginBottom: "10px" }}>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px 12px",
                    marginBottom: "8px",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "10px",
                      fontWeight: "600",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      color: colors.infoText,
                      background: "rgba(59, 130, 246, 0.12)",
                      border: "1px solid rgba(96, 165, 250, 0.3)",
                      borderRadius: "4px",
                      padding: "3px 8px",
                    }}
                  >
                    Manual mode
                  </span>
                  <Link
                    href="/manual"
                    style={{
                      fontSize: "12px",
                      color: colors.infoText,
                      textDecoration: "none",
                    }}
                  >
                    ← Manual
                  </Link>
                </div>
                <h1
                  style={{
                    fontSize: "20px",
                    fontWeight: "600",
                    color: colors.text,
                    margin: "0 0 4px 0",
                    lineHeight: 1.25,
                  }}
                >
                  {profileName}
                </h1>
                {selectedProfileData?.title ? (
                  <p
                    style={{
                      fontSize: "13px",
                      color: colors.textSecondary,
                      margin: 0,
                      lineHeight: 1.4,
                    }}
                  >
                    {selectedProfileData.title}
                  </p>
                ) : null}
              </div>
              <span
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: "600",
                  color: colors.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                  marginBottom: "6px",
                }}
              >
                Step 1 — Job Description
              </span>
              <textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Paste the job description here..."
                rows="12"
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  flex: "1 1 260px",
                  minHeight: "min(52vh, 520px)",
                  padding: "10px 12px",
                  fontSize: "13px",
                  fontFamily: "inherit",
                  color: colors.text,
                  background: colors.textareaBg,
                  border: `1px solid ${colors.inputBorder}`,
                  borderRadius: "6px",
                  outline: "none",
                  resize: "vertical",
                  lineHeight: "1.5",
                  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = colors.inputFocus;
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.infoBg}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = colors.inputBorder;
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Step 2: Copy Prompt */}
            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: "600",
                  color: colors.textSecondary,
                  marginBottom: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                }}
              >
                Step 2 — Copy Prompt for ChatGPT
              </label>
              <button
                type="button"
                onClick={copyPromptToClipboard}
                disabled={copyPromptLoading || !jd.trim()}
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  padding: "8px 12px",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: colors.buttonText,
                  background:
                    copyPromptLoading || !jd.trim()
                      ? colors.buttonDisabled
                      : colors.buttonBg,
                  border: "none",
                  borderRadius: "6px",
                  cursor:
                    copyPromptLoading || !jd.trim()
                      ? "not-allowed"
                      : "pointer",
                  boxSizing: "border-box",
                  transition: "background 0.2s ease, opacity 0.2s ease",
                }}
              >
                {copiedField === "prompt"
                  ? "✓ Copied! Paste into ChatGPT"
                  : copyPromptLoading
                    ? "Building prompt..."
                    : "Copy Prompt (Profile + JD) → Paste in ChatGPT"}
              </button>
              <p
                style={{
                  fontSize: "11px",
                  color: colors.textMuted,
                  marginTop: "4px",
                  marginBottom: 0,
                }}
              >
                Paste the copied text into ChatGPT. Copy the JSON response back below.
              </p>
            </div>

            {/* Step 3: ChatGPT Response */}
            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: "600",
                  color: colors.textSecondary,
                  marginBottom: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                }}
              >
                Step 3 — Paste ChatGPT Response (JSON)
              </label>
              <textarea
                value={chatgptResponse}
                onChange={(e) => setChatgptResponse(e.target.value)}
                placeholder='Paste the JSON from ChatGPT here (e.g. {"title":"...","summary":"...","skills":{...},"experience":[...]})'
                rows="10"
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  padding: "8px 10px",
                  fontSize: "13px",
                  fontFamily: "monospace",
                  color: colors.text,
                  background: colors.textareaBg,
                  border: `1px solid ${colors.inputBorder}`,
                  borderRadius: "6px",
                  outline: "none",
                  resize: "vertical",
                  minHeight: "clamp(200px, min(36vh, 480px), 560px)",
                  lineHeight: "1.5",
                  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Company Name */}
            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: "600",
                  color: colors.textSecondary,
                  marginBottom: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                }}
              >
                Company Name <span style={{ fontWeight: "400", textTransform: "none" }}>(Optional)</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company name (filenames + letter when provided)…"
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  fontSize: "13px",
                  fontFamily: "inherit",
                  color: colors.text,
                  background: colors.inputBg,
                  border: `1px solid ${colors.inputBorder}`,
                  borderRadius: "6px",
                  outline: "none",
                  transition: "all 0.2s ease",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: "600",
                  color: colors.textSecondary,
                  marginBottom: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                }}
              >
                Role you&apos;re applying for{" "}
                <span style={{ fontWeight: "400", textTransform: "none" }}>(Optional)</span>
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder={
                  selectedProfileData?.title
                    ? `Defaults to: ${selectedProfileData.title}`
                    : "Defaults to profile headline"
                }
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  fontSize: "13px",
                  fontFamily: "inherit",
                  color: colors.text,
                  background: colors.inputBg,
                  border: `1px solid ${colors.inputBorder}`,
                  borderRadius: "6px",
                  outline: "none",
                  transition: "all 0.2s ease",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div
              style={{
                marginBottom: "14px",
                padding: "12px",
                borderRadius: "8px",
                border: `1px solid ${colors.cardBorder}`,
                background: "rgba(30, 41, 59, 0.5)",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: colors.text,
                  marginBottom: "6px",
                }}
              >
                FlowCV (manual JSON)
              </div>
              <p
                style={{
                  fontSize: "12px",
                  color: colors.textSecondary,
                  margin: "0 0 8px 0",
                  lineHeight: 1.45,
                }}
              >
                Uses your pasted JSON from Step 3, syncs FlowCV sections, then downloads PDF from FlowCV.
              </p>
              {!selectedProfileData.flowcv?.configured && (
                <p
                  style={{
                    fontSize: "11px",
                    color: colors.textMuted,
                    margin: "0 0 8px 0",
                  }}
                >
                  Set <code>flowcv.email</code> and <code>flowcv.password</code> in this
                  profile&apos;s JSON, or use the override fields below.
                </p>
              )}
              {flowCvAuthError && (
                <div style={{ fontSize: "12px", color: "#f87171", marginBottom: "8px" }}>
                  {flowCvAuthError}
                </div>
              )}
              {flowCvConnected ? (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "8px",
                  }}
                >
                  <p style={{ fontSize: "12px", color: colors.textSecondary, margin: 0, flex: "1 1 auto" }}>
                    Connected{flowCvSessionEmail ? ` as ${flowCvSessionEmail}` : ""}
                    {flowCvResumeId ? ` · resume id ${flowCvResumeId}` : ""}
                  </p>
                  <button
                    type="button"
                    onClick={handleFlowCvLogout}
                    disabled={flowCvAuthLoading}
                    style={{
                      padding: "6px 10px",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: colors.textSecondary,
                      background: "transparent",
                      border: `1px solid ${colors.inputBorder}`,
                      borderRadius: "6px",
                      cursor: flowCvAuthLoading ? "not-allowed" : "pointer",
                    }}
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: "8px" }}>
                    <input
                      type="email"
                      value={flowCvOverrideEmail}
                      onChange={(e) => setFlowCvOverrideEmail(e.target.value)}
                      placeholder="Override email (optional)"
                      style={{
                        width: "100%",
                        maxWidth: "100%",
                        padding: "6px 10px",
                        fontSize: "12px",
                        color: colors.text,
                        background: colors.inputBg,
                        border: `1px solid ${colors.inputBorder}`,
                        borderRadius: "6px",
                        boxSizing: "border-box",
                        marginBottom: "6px",
                      }}
                    />
                    <input
                      type="password"
                      value={flowCvOverridePassword}
                      onChange={(e) => setFlowCvOverridePassword(e.target.value)}
                      placeholder="Override password (optional)"
                      style={{
                        width: "100%",
                        maxWidth: "100%",
                        padding: "6px 10px",
                        fontSize: "12px",
                        color: colors.text,
                        background: colors.inputBg,
                        border: `1px solid ${colors.inputBorder}`,
                        borderRadius: "6px",
                        boxSizing: "border-box",
                      }}
                      autoComplete="off"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleFlowCvLogin}
                    disabled={flowCvAuthLoading}
                    style={{
                      padding: "8px 12px",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: colors.buttonText,
                      background: flowCvAuthLoading
                        ? colors.buttonDisabled
                        : colors.infoText,
                      border: "none",
                      borderRadius: "6px",
                      cursor: flowCvAuthLoading ? "not-allowed" : "pointer",
                      marginBottom: "10px",
                    }}
                  >
                    {flowCvAuthLoading ? "Signing in…" : "Sign in to FlowCV"}
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={handleManualFlowCvExportPdf}
                disabled={generating !== null || !chatgptResponse.trim() || !flowCvConnected}
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  minWidth: 0,
                  padding: "9px 10px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: colors.buttonText,
                  background:
                    generating !== null || !chatgptResponse.trim() || !flowCvConnected
                      ? colors.buttonDisabled
                      : colors.coverPdfBg,
                  border: "none",
                  borderRadius: "6px",
                  cursor:
                    generating !== null || !chatgptResponse.trim() || !flowCvConnected
                      ? "not-allowed"
                      : "pointer",
                  boxSizing: "border-box",
                }}
              >
                {generating === "flowcv-pdf"
                  ? `FlowCV PDF… (${elapsedTime}s)`
                  : "Download PDF (FlowCV, manual JSON)"}
              </button>
            </div>

            <span
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: "600",
                color: colors.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.3px",
                marginBottom: "6px",
              }}
            >
              Résumé (needs JSON from Step 3)
            </span>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                marginBottom: "12px",
                minWidth: 0,
              }}
            >
              <button
                type="button"
                onClick={() => handleGenerate("pdf")}
                disabled={generating !== null || !chatgptResponse.trim()}
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  minWidth: 0,
                  padding: "8px 10px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: colors.buttonText,
                  background:
                    generating !== null || !chatgptResponse.trim()
                      ? colors.buttonDisabled
                      : colors.buttonBg,
                  border: "none",
                  borderRadius: "6px",
                  cursor:
                    generating !== null || !chatgptResponse.trim()
                      ? "not-allowed"
                      : "pointer",
                  boxSizing: "border-box",
                  transition: "background 0.2s ease, opacity 0.2s ease",
                }}
              >
                {generating === "resume-pdf"
                  ? `Generating… (${elapsedTime}s)`
                  : "Download as PDF file"}
              </button>
              <button
                type="button"
                onClick={() => handleGenerate("docx")}
                disabled={generating !== null || !chatgptResponse.trim()}
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  minWidth: 0,
                  padding: "8px 10px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: colors.buttonText,
                  background:
                    generating !== null || !chatgptResponse.trim()
                      ? colors.buttonDisabled
                      : colors.wordButtonBg,
                  border: "none",
                  borderRadius: "6px",
                  cursor:
                    generating !== null || !chatgptResponse.trim()
                      ? "not-allowed"
                      : "pointer",
                  boxSizing: "border-box",
                  transition: "background 0.2s ease, opacity 0.2s ease",
                }}
              >
                {generating === "resume-docx"
                  ? `Generating… (${elapsedTime}s)`
                  : "Download as Word file"}
              </button>
            </div>

            <span
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: "600",
                color: colors.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.3px",
                marginBottom: "6px",
                marginTop: "2px",
              }}
            >
              Cover letter (uses JD only — API key on server)
            </span>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                marginBottom: "12px",
                minWidth: 0,
              }}
            >
              <button
                type="button"
                onClick={() => handleCoverLetterGenerate("pdf")}
                disabled={generating !== null || !jd.trim()}
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  minWidth: 0,
                  padding: "8px 10px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: colors.buttonText,
                  background:
                    generating !== null || !jd.trim()
                      ? colors.buttonDisabled
                      : colors.coverPdfBg,
                  border: "none",
                  borderRadius: "6px",
                  cursor:
                    generating !== null || !jd.trim()
                      ? "not-allowed"
                      : "pointer",
                  boxSizing: "border-box",
                  transition: "background 0.2s ease, opacity 0.2s ease",
                }}
              >
                {generating === "cover-pdf"
                  ? `Generating… (${elapsedTime}s)`
                  : "Download as PDF file"}
              </button>
              <button
                type="button"
                onClick={() => handleCoverLetterGenerate("docx")}
                disabled={generating !== null || !jd.trim()}
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  minWidth: 0,
                  padding: "8px 10px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: colors.buttonText,
                  background:
                    generating !== null || !jd.trim()
                      ? colors.buttonDisabled
                      : colors.coverWordBg,
                  border: "none",
                  borderRadius: "6px",
                  cursor:
                    generating !== null || !jd.trim()
                      ? "not-allowed"
                      : "pointer",
                  boxSizing: "border-box",
                  transition: "background 0.2s ease, opacity 0.2s ease",
                }}
              >
                {generating === "cover-docx"
                  ? `Generating… (${elapsedTime}s)`
                  : "Download as Word file"}
              </button>
            </div>

            {lastGenerationTime && (
              <div
                style={{
                  padding: "10px 12px",
                  background: colors.successBg,
                  border: `1px solid ${colors.successText}`,
                  borderRadius: "6px",
                  color: colors.successText,
                  fontSize: "12px",
                  textAlign: "center",
                  fontWeight: "500",
                }}
              >
                ✓ {lastGenerationWasCover ? "Cover letter" : "Résumé"} generated successfully in{" "}
                {lastGenerationTime}s
              </div>
            )}
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
