/**
 * Riconosce link YouTube e Vimeo e restituisce l'URL da incorporare.
 * Qualsiasi altro indirizzo viene rifiutato: così nella pagina pubblica
 * finiscono solo player di cui ci fidiamo, mai un URL arbitrario.
 */
export type VideoEmbed = {
  provider: "youtube" | "vimeo";
  embedUrl: string;
};

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const VIMEO_ID = /^\d{6,12}$/;

export function parseVideoEmbed(raw: string | null | undefined): VideoEmbed | null {
  const value = raw?.trim();
  if (!value) return null;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");

  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id && YOUTUBE_ID.test(id) ? youtube(id) : null;
  }

  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    const id =
      parts[0] === "watch"
        ? url.searchParams.get("v")
        : ["shorts", "embed", "live", "v"].includes(parts[0] ?? "")
          ? parts[1]
          : null;
    return id && YOUTUBE_ID.test(id) ? youtube(id) : null;
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = url.pathname
      .split("/")
      .filter(Boolean)
      .find((p) => VIMEO_ID.test(p));
    return id
      ? { provider: "vimeo", embedUrl: `https://player.vimeo.com/video/${id}?dnt=1` }
      : null;
  }

  return null;
}

function youtube(id: string): VideoEmbed {
  return {
    provider: "youtube",
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0`,
  };
}
