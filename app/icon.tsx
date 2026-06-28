import { ImageResponse } from "next/og";

export const size        = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "#0F2438",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 18,
            height: 10,
            borderRadius: 999,
            background: "linear-gradient(to right, #1D9E75 50%, #178A66 50%)",
            transform: "rotate(-45deg)",
            display: "flex",
          }}
        />
      </div>
    ),
    { width: 32, height: 32 },
  );
}
