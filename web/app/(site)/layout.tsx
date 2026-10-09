"use client";

import { useEffect, useRef } from "react";
import { ChatDock } from "@/components/ChatDock";
import { CustomCursor } from "@/components/motion/CustomCursor";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import { SmoothScrollProvider } from "@/components/motion/SmoothScrollProvider";
import { Footer } from "@/components/site/Footer";
import { SiteSkin } from "@/components/site/SiteSkin";
import { Intro } from "@/components/site/Intro";
import { Modals } from "@/components/site/Modals";
import { PaymentNotice } from "@/components/site/PaymentNotice";
import { Nav } from "@/components/site/Nav";
import { StoryViewer } from "@/components/site/StoryViewer";
import { useInquiryFlow } from "@/lib/site/useInquiryFlow";
import { useStudioData } from "@/lib/site/useStudioData";
import { StudioContext } from "@/lib/site/StudioContext";
import { ThemeProvider } from "@/lib/site/ThemeProvider";

function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || !window.matchMedia("(pointer:fine)").matches) {
      if (node) node.style.display = "none";
      return;
    }
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let x = mx;
    let y = my;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };
    const loop = () => {
      x += (mx - x) * 0.1;
      y += (my - y) * 0.1;
      node.style.transform = `translate(${x}px,${y}px)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);
  return <div ref={ref} className="pub-glow" aria-hidden />;
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll(".rise").forEach((node) => node.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
    );
    const watch = () => {
      document.querySelectorAll(".rise:not(.is-in)").forEach((node) => io.observe(node));
    };
    watch();
    const changes = new MutationObserver(watch);
    const main = document.querySelector("main");
    if (main) changes.observe(main, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      changes.disconnect();
    };
  }, []);

  const studioData = useStudioData();
  const inquiryFlow = useInquiryFlow({ setTestimonials: studioData.setTestimonials });
  const value = { ...studioData, ...inquiryFlow };

  return (
    <StudioContext.Provider value={value}>
      <ThemeProvider>
        <SmoothScrollProvider />
        <CustomCursor />
        <ScrollProgress />
        <div className="pub-amb" aria-hidden>
          <i />
          <i />
          <i />
        </div>
        <CursorGlow />
        <SiteSkin />
        <Intro />
        <Nav />
        <main className="relative z-[1] min-h-screen bg-transparent text-bone">{children}</main>
        <Footer />
        <ChatDock
          clientId={value.clientId}
          clientName={value.clientName}
          clientAvatar={value.clientAvatar}
          onNeedRegister={() => value.setRegisterOpen(true)}
        />
        <Modals />
        <PaymentNotice />
        <StoryViewer />
      </ThemeProvider>
    </StudioContext.Provider>
  );
}
