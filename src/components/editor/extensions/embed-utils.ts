export interface ProviderInfo {
  provider: string;
  embedUrl: string;
  aspectRatio?: string;
  height?: string;
}

export function isAllowedEmbedUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export function detectProvider(url: string): ProviderInfo {
  try {
    const u = new URL(url);
    // Block dangerous URL schemes (javascript:, data:, etc.)
    if (u.protocol !== "https:" && u.protocol !== "http:") {
      return { provider: "generic", embedUrl: "", aspectRatio: "16/9" };
    }
    const host = u.hostname.toLowerCase();

    // YouTube
    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      let videoId = "";
      if (host.includes("youtu.be")) {
        videoId = u.pathname.slice(1);
      } else {
        videoId = u.searchParams.get("v") || "";
      }
      return {
        provider: "youtube",
        embedUrl: videoId
          ? `https://www.youtube.com/embed/${videoId}`
          : url,
        aspectRatio: "16/9",
      };
    }

    // Loom
    if (host.includes("loom.com")) {
      const shareMatch = u.pathname.match(/\/share\/([a-zA-Z0-9]+)/);
      return {
        provider: "loom",
        embedUrl: shareMatch
          ? `https://www.loom.com/embed/${shareMatch[1]}`
          : url,
        aspectRatio: "16/9",
      };
    }

    // Google Calendar
    if (host.includes("calendar.google.com")) {
      return {
        provider: "google-calendar",
        embedUrl: url,
        height: "600px",
      };
    }

    // Google Drive
    if (host.includes("drive.google.com")) {
      return {
        provider: "google-drive",
        embedUrl: url.replace("/view", "/preview"),
        height: "500px",
      };
    }

    // PDF
    if (u.pathname.endsWith(".pdf")) {
      return {
        provider: "pdf",
        embedUrl: url,
        height: "700px",
      };
    }

    return { provider: "generic", embedUrl: url, aspectRatio: "16/9" };
  } catch {
    return { provider: "generic", embedUrl: url, aspectRatio: "16/9" };
  }
}
