import type { Metadata } from "next";
import "./globals.css";
import { STUDIO_NAME } from "@/lib/site/copy";

export const metadata: Metadata = {
  title: "Bilgeyis Mirzazada — Motion Designer",
  description: "Motion design and video editing studio",
};

const BOOT_SCRIPT = `(()=>{try{var p=location.pathname;if(p.indexOf("/admin")===0||p.indexOf("/team")===0){document.documentElement.setAttribute("data-theme","night");return;}var t=localStorage.getItem("bm-theme");var theme=(t==="night"||t==="day")?t:(window.matchMedia("(prefers-color-scheme: dark)").matches?"night":"day");document.documentElement.setAttribute("data-theme",theme);document.documentElement.classList.add("intro-pending");document.documentElement.setAttribute("data-intro-at",String(Date.now()));}catch(e){document.documentElement.setAttribute("data-theme","day");}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
      </head>
      <body className="antialiased">
        <div id="site-intro" className="intro-screen" aria-hidden="true">
          <div className="intro-name-wrap">
            <p className="intro-name">
              <span className="intro-name-ghost">{STUDIO_NAME}</span>
              <span className="intro-name-fill">{STUDIO_NAME}</span>
            </p>
          </div>
        </div>
        {children}
      </body>
    </html>
  );
}
