import { ImageResponse } from "next/og";

// Next.js serves this as /apple-touch-icon.png and injects the link tag automatically.
export const size        = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 110,
            height: 60,
            borderRadius: 999,
            background: "linear-gradient(to right, #1D9E75 50%, #178A66 50%)",
            transform: "rotate(-45deg)",
            display: "flex",
          }}
        />
      </div>
    ),
    { width: 180, height: 180 },
  );
}
