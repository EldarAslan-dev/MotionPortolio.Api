const MAX_EDGE = 1280;

function frameToBlob(video: HTMLVideoElement): Promise<Blob | null> {
  const vw = video.videoWidth || 0;
  const vh = video.videoHeight || 0;
  if (!vw || !vh) return Promise.resolve(null);
  const scale = Math.min(1, MAX_EDGE / Math.max(vw, vh));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(vw * scale));
  canvas.height = Math.max(1, Math.round(vh * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.82));
}

async function primeFrame(video: HTMLVideoElement) {
  try {
    await Promise.race([
      video.play().then(() => {
        video.pause();
      }),
      new Promise<void>((resolve) => window.setTimeout(resolve, 500)),
    ]);
  } catch {
    /* iOS may block play; seeked frame is enough */
  }
}

export function snapshotVideo(video: HTMLVideoElement): Promise<Blob | null> {
  return frameToBlob(video);
}

export function capturePosterFromFile(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.preload = "auto";
    video.src = url;

    let done = false;
    let armed = false;
    const finish = (blob: Blob | null) => {
      if (done) return;
      done = true;
      URL.revokeObjectURL(url);
      video.pause();
      video.removeAttribute("src");
      video.load();
      resolve(blob);
    };

    const snap = async () => {
      if (!armed || done) return;
      await primeFrame(video);
      finish(await frameToBlob(video));
    };

    video.addEventListener("loadeddata", () => {
      armed = true;
      const t =
        Number.isFinite(video.duration) && video.duration > 0
          ? Math.min(0.4, Math.max(0.08, video.duration * 0.08))
          : 0.12;
      if (Math.abs(video.currentTime - t) < 0.04) {
        void snap();
        return;
      }
      try {
        video.currentTime = t;
      } catch {
        void snap();
      }
    });
    video.addEventListener("seeked", () => {
      if (!armed) return;
      void snap();
    });
    video.addEventListener("error", () => finish(null));
    window.setTimeout(() => finish(null), 12000);
  });
}

export function blobToPosterFile(blob: Blob, name = "poster.jpg") {
  return new File([blob], name, { type: "image/jpeg" });
}
