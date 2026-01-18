import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 6,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "#010409",
            border: "1px solid #30363d",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {/* Shield */}
          <div
            style={{
              position: "absolute",
              top: 5,
              width: 14,
              height: 16,
              border: "2px solid #22c55e",
              borderTopLeftRadius: 6,
              borderTopRightRadius: 6,
              borderBottomLeftRadius: 10,
              borderBottomRightRadius: 10,
              transform: "translateY(0)",
            }}
          />
          {/* Text */}
          <div
            style={{
              position: "absolute",
              bottom: 4,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 0.5,
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
    {
      ...size,
    }
  );
}

