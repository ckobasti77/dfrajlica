import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { hero, site } from "@/content/site";

export const alt = `${site.name} — ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logo = await readFile(join(process.cwd(), "public/logos/logo-wide.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #ffffff 0%, #f3e4ee 100%)",
          color: "#2b1a26",
          position: "relative",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -140,
            right: -140,
            width: 420,
            height: 420,
            borderRadius: 999,
            background: "#c98bb8",
            opacity: 0.35,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -180,
            left: -120,
            width: 460,
            height: 460,
            borderRadius: 999,
            background: "#9b2c82",
            opacity: 0.16,
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} alt="" width={520} height={117} style={{ objectFit: "contain" }} />
        <div
          style={{
            marginTop: 8,
            fontSize: 40,
            color: "#7a1b63",
            display: "flex",
          }}
        >
          {hero.title.join(" ")}
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: 22,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#5b2e2a",
            display: "flex",
          }}
        >
          {site.tagline}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 40,
            fontSize: 24,
            color: "#7a1b63",
            display: "flex",
          }}
        >
          {site.phone.primary.display}
        </div>
      </div>
    ),
    { ...size },
  );
}
