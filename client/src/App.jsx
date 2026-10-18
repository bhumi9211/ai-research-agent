import { useEffect, useState } from "react";
import { post, friendlyError, parseBlocks, getScore } from "./lib";

const STEPS = ["Search", "Read", "Write", "Review"];
const EXAMPLES = ["Impact of AI on healthcare", "Causes of floods in Nepal", "Future of solid-state batteries", "How India's UPI works"];
const TABS = [["report", "Report"], ["critic", "Critic feedback"], ["sources", "Sources"]];

const card = "rounded-2xl border border-line bg-panel p-4 sm:p-6";
const btn = "min-h-11 cursor-pointer rounded-xl bg-linear-to-br from-ac to-sky-300 px-5 py-3 font-semibold text-[#04141a] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45";
const ghost = "cursor-pointer rounded-lg border border-line px-3.5 py-2 text-sm hover:bg-white/5";

// **bold** aur links ko render karta hai
const fmt = (s) =>
  s.split(/(\*\*[^*]+\*\*|https?:\/\/[^\s)]+)/g).map((p, i) =>
    p.startsWith("**") ? <b key={i} className="text-white">{p.slice(2, -2)}</b>
    : /^https?:/.test(p) ? <a key={i} href={p} target="_blank" rel="noreferrer" className="break-all text-ac underline underline-offset-4">{p}</a>
    : p
  );

function Prose({ text }) {
  return (
    <div className="max-w-[70ch] leading-8 text-slate-300">
      {parseBlocks(text).map((b, i) =>
        b.type === "h" ? <h3 key={i} className="mb-2 mt-7 font-serif text-2xl font-semibold text-white first:mt-0">{b.text}</h3>
        : b.type === "li" ? <p key={i} className="mb-3 flex gap-3"><i className="mt-3 size-1.5 shrink-0 rounded-full bg-ac" /><span>{fmt(b.text)}</span></p>
        : <p key={i} className="mb-3 wrap-break-word">{fmt(b.text)}</p>
      )}
    </div>
  );
}

export default function App() {
  const [topic, setTopic] = useState("");
  const [data, setData] = useState(null);
  const [rev, setRev] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(null); // "research" | "revise" | null
  const [tab, setTab] = useState("report");
  const [step, setStep] = useState(0);
  const [copied, setCopied] = useState(false);

  // sirf visual progress (backend se live status nahi aata)
  useEffect(() => {
    if (busy !== "research") return;
    setStep(0);
    const id = setInterval(() => setStep((s) => Math.min(s + 1, 3)), 12000);
    return () => clearInterval(id);
  }, [busy]);

  const report = rev?.revised_report || data?.report || "";
  const critic = rev?.revised_feedback || data?.feedback || "";
  const score = getScore(critic);
  const words = report.split(/\s+/).filter(Boolean).length;
  const scoreColor = score >= 8 ? "text-emerald-300" : score >= 6 ? "text-amber-300" : "text-rose-300";
  const compact = data || busy === "research";

  async function run(e, preset) {
    e?.preventDefault();
    const t = (preset ?? topic).trim();
    if (!t) return setErr({ title: "Topic required", description: "Enter your research topic first." });
    setTopic(t); setBusy("research"); setErr(null); setData(null); setRev(null); setTab("report");
    try { setData(await post("/research", { topic: t })); }
    catch (x) { setErr(friendlyError(x)); }
    finally { setBusy(null); }
  }

  async function revise() {
    setBusy("revise"); setErr(null);
    try {
      const d = await post("/revise", { topic: data.topic || topic, report: data.report, feedback: data.feedback });
      if (!d.revised_report) throw { status: 500, message: "Cannot find revised_report." };
      setRev(d); setTab("report");
    } catch (x) { setErr(friendlyError(x)); }
    finally { setBusy(null); }
  }

  async function copy() {
    await navigator.clipboard.writeText(report).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  }

  function save() {
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([report], { type: "text/markdown" })),
      download: "report.md",
    });
    a.click(); URL.revokeObjectURL(a.href);
  }

  const reviseBox = !rev && data?.report && data?.feedback && (
    <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-ac/20 bg-linear-to-br from-ac/10 to-ac2/10 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <b>Improve this report</b>
        <p className="mt-1 text-sm text-mut">Writer will revise the report with critic feedback</p>
      </div>
      <button className={btn} onClick={revise} disabled={!!busy}>{busy === "revise" ? "Revising…" : "Revise report"}</button>
    </div>
  );

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="glow pointer-events-none absolute inset-x-0 top-0 h-140" />

      <header className="sticky top-0 z-10 border-b border-line bg-ink/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-300 items-center gap-2.5 px-4 sm:px-6">
          <span className="grid size-8 place-items-center rounded-lg bg-linear-to-br from-ac to-ac2 font-bold text-[#06121a]">R</span>
          <b>ResearchPilot</b>
        </div>
      </header>

      <main className="relative mx-auto max-w-300 px-4 pb-16 sm:px-6">
        {/* Hero + form */}
        <section className={`max-w-215 ${compact ? "pb-5 pt-8" : "pb-8 pt-12 sm:pt-20"}`}>
          <h1 className={`mb-4 font-serif font-semibold leading-[1.05] tracking-tight ${compact ? "text-3xl sm:text-4xl" : "text-4xl sm:text-6xl lg:text-7xl"}`}>
            Ask anything. Get a <em className="bg-linear-to-r from-ac to-ac2 bg-clip-text italic text-transparent">sourced</em> report.
          </h1>
          {!compact && <p className="mb-7 max-w-[56ch] text-lg text-mut">Enter Topic. Web search, page reading, report writing aur critic review are automatic.</p>}

          <form onSubmit={run} className="rounded-2xl border border-line bg-panel p-3.5 shadow-2xl shadow-black/40 transition focus-within:border-ac/50 focus-within:ring-4 focus-within:ring-ac/10">
            <textarea
              rows={2} maxLength={500} value={topic} disabled={!!busy}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && run(e)}
              placeholder="What do you want to research?"
              className="w-full resize-none bg-transparent px-1.5 py-1.5 text-[1.05rem] outline-hidden placeholder:text-slate-500"
            />
            <div className="mt-2 flex flex-col gap-3 border-t border-line pt-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-mut">{topic.length}/500 · Enter to submit</span>
              <button className={`${btn} w-full sm:w-auto`} disabled={!!busy || !topic.trim()}>
                {busy === "research" ? "Researching…" : "Generate report"}
              </button>
            </div>
          </form>

          {!compact && (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-mut">Try:</span>
              {EXAMPLES.map((x) => (
                <button key={x} onClick={() => run(null, x)} className="cursor-pointer rounded-full border border-line bg-panel px-3.5 py-1.5 transition hover:border-ac hover:text-ac">{x}</button>
              ))}
            </div>
          )}
        </section>

        {/* Error */}
        {err && (
          <div role="alert" className="mb-4 flex max-w-215 justify-between gap-3 rounded-2xl border border-rose-500/35 bg-rose-500/10 p-4 text-rose-200">
            <div><b>{err.title}</b><p className="mt-1 text-sm opacity-85">{err.description}</p></div>
            <button onClick={() => setErr(null)} aria-label="Dismiss" className="cursor-pointer self-start text-2xl leading-none">×</button>
          </div>
        )}

        {/* Loading */}
        {busy === "research" && (
          <div className={`${card} max-w-215`} role="status">
            <b>Your research is in progress</b>
            <p className="text-sm text-mut">Usually 30–90 seconds. Donot close the tab.</p>
            <ol className="my-5 grid gap-4 sm:grid-cols-4">
              {STEPS.map((s, i) => (
                <li key={s} className={`flex items-center gap-2.5 ${i > step ? "opacity-40" : ""}`}>
                  <span className={`grid size-7 place-items-center rounded-full border border-ac text-xs font-semibold ${i < step ? "bg-ac text-[#04141a]" : "text-ac"} ${i === step ? "animate-pulse ring-4 ring-ac/20" : ""}`}>
                    {i < step ? "✓" : i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
            {[100, 90, 60].map((w) => (
              <div key={w} style={{ width: `${w}%` }} className="my-2.5 h-3 animate-shimmer rounded-md bg-linear-to-r from-white/5 via-white/10 to-white/5 bg-size-[200%_100%]" />
            ))}
          </div>
        )}

        {/* Idle: how it works */}
        {!compact && !err && (
          <section className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s} className={card}>
                <span className="mb-2 grid size-7 place-items-center rounded-full border border-ac text-xs font-semibold text-ac">{i + 1}</span>
                <b>{s}</b>
              </div>
            ))}
          </section>
        )}

        {/* Result */}
        {data && busy !== "research" && (
          <section className="grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
            <aside className={`${card} lg:sticky lg:top-20`}>
              <p className="text-xs text-mut">{rev ? "Revised version" : "First draft"}</p>
              <h2 className="mb-4 mt-1 wrap-break-word font-serif text-xl font-semibold leading-tight">{data.topic || topic}</h2>
              <div className="flex items-end justify-between gap-4 border-t border-line pt-4">
                {score !== null && (
                  <div>
                    <p className="text-xs text-mut">Critic score</p>
                    <p className={`text-4xl font-semibold ${scoreColor}`}>{score}<span className="text-base text-mut">/10</span></p>
                  </div>
                )}
                <div className="text-right text-sm text-mut">
                  <p>{words.toLocaleString()} words</p>
                  <p>{Math.max(1, Math.round(words / 220))} min read</p>
                </div>
              </div>
            </aside>

            <div className="flex min-w-0 flex-col gap-4">
              <div role="tablist" className="flex gap-1 overflow-x-auto rounded-2xl border border-line bg-panel p-1">
                {TABS.map(([id, label]) => (
                  <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                    className={`flex-1 cursor-pointer whitespace-nowrap rounded-xl px-4 py-2.5 font-medium transition ${tab === id ? "bg-white/10" : "text-mut hover:text-fg"}`}>
                    {label}
                  </button>
                ))}
              </div>

              {tab === "report" && (
                <article className={card}>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-semibold">{rev ? "Revised report" : "Report"}</h2>
                    <div className="flex w-full gap-2 sm:w-auto">
                      <button className={`${ghost} flex-1`} onClick={copy}>{copied ? "Copied ✓" : "Copy"}</button>
                      <button className={`${ghost} flex-1`} onClick={save}>Download .md</button>
                    </div>
                  </div>
                  <Prose text={report} />
                  {reviseBox}
                </article>
              )}

              {tab === "critic" && (
                <article className={card}>
                  <h2 className="mb-4 font-semibold">{rev ? "Updated critic feedback" : "Critic feedback"}</h2>
                  <Prose text={critic} />
                  {reviseBox}
                </article>
              )}

              {tab === "sources" && [["Search results", data.search_results], ["Scraped page content", data.scraped_content]].map(([title, text]) => (
                <article key={title} className={card}>
                  <h2 className="mb-4 font-semibold">{title}</h2>
                  <pre className="max-h-120 overflow-auto whitespace-pre-wrap wrap-break-word rounded-xl bg-black/30 p-4 font-mono text-sm leading-relaxed text-slate-400">{text || "Nothing returned."}</pre>
                </article>
              ))}
            </div>
          </section>
        )}

        <footer className="mt-14 border-t border-line pt-5 text-xs text-slate-500">
          AI-generated research can make mistakes. Important facts can be verified from original sources.
        </footer>
      </main>
    </div>
  );
}
