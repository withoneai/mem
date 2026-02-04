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
          fontSize: 48,
          background: "#080600",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "monospace",
        }}
      >
        {/* ASCII Logo */}
        <pre
          style={{
            color: "#FD885D",
            fontSize: 24,
            lineHeight: 1.2,
            margin: 0,
            marginBottom: 40,
          }}
        >
{`███╗   ███╗███████╗███╗   ███╗
████╗ ████║██╔════╝████╗ ████║
██╔████╔██║█████╗  ██╔████╔██║
██║╚██╔╝██║██╔══╝  ██║╚██╔╝██║
██║ ╚═╝ ██║███████╗██║ ╚═╝ ██║
╚═╝     ╚═╝╚══════╝╚═╝     ╚═╝`}
        </pre>

        {/* Tagline */}
        <div
          style={{
            color: "#FD885D",
            fontSize: 36,
            marginBottom: 16,
          }}
        >
          Memory for AI agents.
        </div>
        <div
          style={{
            color: "#9a5a38",
            fontSize: 24,
          }}
        >
          Simple. Fast. Works anywhere.
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
