const API = (import.meta.env.VITE_API_URL ).replace(/\/$/, "");
// || "http://127.0.0.1:8000"

export async function post(path, body) {
  let res;
  try {
    res = await fetch(API + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw { status: 0, message: e.message };
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw { status: res.status, message: data.detail || data.message || "Request failed" };
  return data;
}

export function friendlyError({ status, message = "" }) {
  const m = String(message).toLowerCase();
  if (status === 429 || /rate.?limit|too many requests|quota|resource_exhausted|per minute/.test(m))
    return { title: "AI model limit reached", description: "Model ki rate limit ya free quota exceed ho gayi hai. Thodi der wait karke retry karo." };
  if (status === 502 || status === 503)
    return { title: "AI service unavailable", description: "Model ya backend abhi available nahi hai. Kuch der baad dobara try karo." };
  if (status === 0 || m.includes("failed to fetch"))
    return { title: "Can't reach the backend", description: "Check karo ki FastAPI server chal raha hai aur VITE_API_URL sahi hai." };
  return { title: "Something went wrong", description: message.length < 500 ? message : "Backend terminal mein error check karo." };
}

/** Text -> heading / bullet / paragraph blocks */
export function parseBlocks(text = "") {
  return text
    .split("\n")
    .filter((l) => l.trim() && !/^\s*[-_=*]{3,}\s*$/.test(l))
    .map((l) => {
      let m = l.match(/^#{1,4}\s+(.*)/) || l.match(/^\*\*([^*]+?)\*\*:?$/) || l.match(/^([A-Z][A-Za-z' ]{2,32}):$/);
      if (m) return { type: "h", text: m[1].replace(/\*\*/g, "") };
      m = l.match(/^\s*(?:[-*•]|\d+\.)\s+(.*)/);
      return m ? { type: "li", text: m[1] } : { type: "p", text: l };
    });
}

export function getScore(critic = "") {
  const m = critic.match(/score\s*:\s*(\d+(?:\.\d+)?)\s*\/\s*10/i);
  return m ? Number(m[1]) : null;
}
