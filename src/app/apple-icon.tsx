import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0d1117",
        }}
      >
        <div
          style={{
            width: 152,
            height: 152,
            borderRadius: 32,
            background: "#010409",
            border: "2px solid #30363d",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            boxShadow: "0 10px 25px rgba(0,0,0,0.45)",
          }}
        >
          <div
            style={{
              width: 74,
              height: 88,
              border: "8px solid #22c55e",
              borderTopLeftRadius: 36,
              borderTopRightRadius: 36,
              borderBottomLeftRadius: 56,
              borderBottomRightRadius: 56,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 26,
              fontSize: 36,
              fontWeight: 800,
              letterSpacing: 2,
              color: "#c9d1d9",
              fontFamily:
                "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
            }}
          >
            CTF
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}

