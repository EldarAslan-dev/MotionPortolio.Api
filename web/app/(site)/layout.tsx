"use client";

import { ChatDock } from "@/components/ChatDock";
import { CustomCursor } from "@/components/motion/CustomCursor";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import { SmoothScrollProvider } from "@/components/motion/SmoothScrollProvider";
import { Footer } from "@/components/site/Footer";
import { Modals } from "@/components/site/Modals";
import { Nav } from "@/components/site/Nav";
import { StoryViewer } from "@/components/site/StoryViewer";
import { useInquiryFlow } from "@/lib/site/useInquiryFlow";
import { useStudioData } from "@/lib/site/useStudioData";
import { StudioContext } from "@/lib/site/StudioContext";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const studioData = useStudioData();
  const inquiryFlow = useInquiryFlow({ setTestimonials: studioData.setTestimonials });
  const value = { ...studioData, ...inquiryFlow };

  return (
    <StudioContext.Provider value={value}>
      <SmoothScrollProvider />
      <CustomCursor />
      <ScrollProgress />
      <Nav />
      <main className="min-h-screen bg-void text-bone">{children}</main>
      <Footer />
      <ChatDock
        clientId={value.clientId}
        clientName={value.clientName}
        onNeedRegister={() => value.setRegisterOpen(true)}
      />
      <Modals />
      <StoryViewer />
    </StudioContext.Provider>
  );
}
