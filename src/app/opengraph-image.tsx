import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0d1117 0%, #010409 100%)",
          padding: 72,
          color: "#f0f6fc",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 22,
              background: "#010409",
              border: "2px solid #30363d",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                width: 44,
                height: 54,
                border: "6px solid #22c55e",
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                borderBottomLeftRadius: 34,
                borderBottomRightRadius: 34,
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 10,
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: 2,
                color: "#c9d1d9",
              }}
            >
              CTF
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: -0.5 }}>
              CTF Platform
            </div>
            <div style={{ fontSize: 22, color: "#8b949e" }}>
              Cybersecurity Training
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 56, fontWeight: 900, lineHeight: 1.05 }}>
            Secure Capture The Flag Platform
          </div>
          <div style={{ fontSize: 26, color: "#c9d1d9", maxWidth: 980 }}>
            Server-side flag verification, rate limiting, Firebase Auth, Firestore,
            and Next.js API Routes.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid #30363d",
            paddingTop: 22,
            color: "#8b949e",
            fontSize: 18,
          }}
        >
          <div>Academic cybersecurity project</div>
          <div style={{ color: "#22c55e", fontWeight: 700 }}>
            Authenticated and email-verified access
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}

