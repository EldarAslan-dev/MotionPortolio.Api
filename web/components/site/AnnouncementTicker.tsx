"use client";

import { useStudio } from "@/lib/site/StudioContext";

export function AnnouncementTicker() {
  const { profile } = useStudio();
  const text = profile?.showAnnouncement ? profile.announcementText?.trim() : "";
  if (!text) return null;

  const items = [text, text, text, text];

  return (
    <div className="announce-ticker" role="marquee">
      <div className="announce-track marquee-run">
        {items.map((item, i) => (
          <span key={i} className="announce-item">
            {item}
            <span className="announce-dot" />
          </span>
        ))}
      </div>
    </div>
  );
}
