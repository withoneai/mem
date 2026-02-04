import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "mem - Memory for AI agents";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#080600",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "monospace",
          padding: "60px",
        }}
      >
        {/* Terminal window */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "900px",
            background: "#0d0b00",
            borderRadius: "12px",
            border: "1px solid #9a5a38",
            overflow: "hidden",
          }}
        >
          {/* Window chrome */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "16px 20px",
              borderBottom: "1px solid #9a5a38",
            }}
          >
            <div style={{ width: "14px", height: "14px", borderRadius: "50%", background: "#ff5f56" }} />
            <div style={{ width: "14px", height: "14px", borderRadius: "50%", background: "#ffbd2e" }} />
            <div style={{ width: "14px", height: "14px", borderRadius: "50%", background: "#27ca40" }} />
            <span style={{ color: "#9a5a38", fontSize: "16px", marginLeft: "12px" }}>
              terminal
            </span>
          </div>

          {/* Terminal content */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "32px",
              gap: "16px",
            }}
          >
            {/* Command line */}
            <div style={{ display: "flex", fontSize: "28px" }}>
              <span style={{ color: "#9a5a38" }}>$</span>
              <span style={{ color: "#FD885D", marginLeft: "12px" }}>mem search "user preferences"</span>
            </div>

            {/* Output */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
              <span style={{ color: "#27ca40", fontSize: "24px" }}>Found 3 memories:</span>
              <span style={{ color: "#9a5a38", fontSize: "20px" }}>  preference  "User prefers dark mode"      0.94</span>
              <span style={{ color: "#9a5a38", fontSize: "20px" }}>  decision    "Use TypeScript everywhere"  0.87</span>
              <span style={{ color: "#9a5a38", fontSize: "20px" }}>  note        "Likes concise responses"    0.82</span>
            </div>

            {/* Cursor */}
            <div style={{ display: "flex", fontSize: "28px", marginTop: "16px" }}>
              <span style={{ color: "#9a5a38" }}>$</span>
              <span style={{ color: "#FD885D", marginLeft: "12px" }}>_</span>
            </div>
          </div>
        </div>

        {/* Branding below terminal */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: "40px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ color: "#FD885D", fontSize: "48px", fontWeight: "bold" }}>mem</span>
            <span style={{ color: "#9a5a38", fontSize: "32px" }}>Memory for AI agents</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
