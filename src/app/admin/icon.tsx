import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function AdminIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1a1416",
        }}
      >
        <div
          style={{
            fontSize: 300,
            fontFamily: "Georgia, 'Times New Roman', serif",
            color: "#8f5a66",
            fontWeight: 400,
            lineHeight: 1,
            marginTop: 24,
          }}
        >
          C
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
