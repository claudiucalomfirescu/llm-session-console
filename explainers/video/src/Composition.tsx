// llm-session-console explainer: from a proxy log nobody can read to the one message that crossed the line.
// All scenes in this file. Screens in public/ are real screenshots of the console on the bundled demo logs
// (vxc-4-weeks and vxc-day-2026-11-13); numbers in FACTS come from those logs.
import React from "react";
import {
  AbsoluteFill,
  Composition,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const FACTS = { weeks: 4, calls: "4,409", agents: 27, dayCalls: 552, daySessions: 115, blocked: 7 };

const C = {
  bg: "#0b1020",
  panel: "#141b33",
  panel2: "#1b2444",
  line: "#2c3866",
  text: "#e8ecf8",
  dim: "#9aa6c8",
  accent: "#6ea1ff",
  tool: "#f0aa2c",
  info: "#5aa2f0",
  warn: "#f0aa2c",
  block: "#f06262",
};
const FONT = 'Inter, "Helvetica Neue", Helvetica, Arial, "Segoe UI", sans-serif';
const MONO = '"JetBrains Mono", "DejaVu Sans Mono", Menlo, monospace';
const FPS = 30;
const S = (s: number) => Math.round(s * FPS);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const SCENES = [
  { id: "title", d: 4.5 },
  { id: "problem", d: 8 },
  { id: "overview", d: 7 },
  { id: "day", d: 9 },
  { id: "session", d: 10 },
  { id: "blocked", d: 10 },
  { id: "replay", d: 12 },
  { id: "galaxy", d: 6 },
  { id: "outro", d: 7 },
] as const;
const TOTAL = SCENES.reduce((a, s) => a + S(s.d), 0);

// Fade a scene in and out at its edges.
const Fade: React.FC<{ d: number; children: React.ReactNode }> = ({ d, children }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 10, S(d) - 10, S(d)], [0, 1, 1, 0], clamp);
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

const Caption: React.FC<{ kicker: string; text: string; delay?: number }> = ({ kicker, text, delay = 6 }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [delay, delay + 14], [0, 1], clamp);
  const y = interpolate(f, [delay, delay + 14], [16, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <div style={{ position: "absolute", left: 120, right: 120, bottom: 56, opacity: o, transform: `translateY(${y}px)`,
      display: "flex", gap: 22, alignItems: "baseline", background: "rgba(11,16,32,.88)", border: `1px solid ${C.line}`,
      borderRadius: 18, padding: "20px 28px", backdropFilter: "blur(6px)" }}>
      <span style={{ color: C.accent, fontFamily: MONO, fontSize: 24, letterSpacing: 2, textTransform: "uppercase", whiteSpace: "nowrap" }}>{kicker}</span>
      <span style={{ color: C.text, fontSize: 36, lineHeight: 1.3, fontWeight: 500 }}>{text}</span>
    </div>
  );
};

// A real screenshot (1920x1080) in a window frame, slowly zooming from one focus to another.
const Screen: React.FC<{ src: string; d: number; from?: [number, number, number]; to?: [number, number, number]; opacity?: number }> = ({
  src, d, from = [1, 0, 0], to = [1.06, 0, 0], opacity = 1,
}) => {
  const f = useCurrentFrame();
  const t = interpolate(f, [0, S(d)], [0, 1], { ...clamp, easing: Easing.inOut(Easing.sin) });
  const [s, x, y] = from.map((v, i) => v + (to[i] - v) * t);
  return (
    <div style={{ position: "absolute", left: 120, top: 60, width: 1680, height: 945, borderRadius: 16, overflow: "hidden",
      border: `1px solid ${C.line}`, boxShadow: "0 30px 80px rgba(0,0,0,.55)", background: C.panel, opacity }}>
      <Img src={staticFile(src)} style={{ width: 1680, height: 945, transform: `scale(${s}) translate(${x}px, ${y}px)`, transformOrigin: "50% 50%" }} />
    </div>
  );
};

const Title: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: f, fps, config: { damping: 14 } });
  const sub = interpolate(f, [18, 34], [0, 1], clamp);
  const pills = ["day timeline", "tool cards", "firewall verdicts", "replay", "galaxy 3D"];
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 30 }}>
      <svg width={120} height={120} viewBox="0 0 24 24" style={{ transform: `scale(${pop})` }}>
        <circle cx="12" cy="12" r="3.2" fill={C.accent} />
        <circle cx="12" cy="12" r="8" fill="none" stroke={C.accent} strokeWidth="1.2" strokeDasharray="3 2.4"
          transform={`rotate(${f * 2} 12 12)`} />
        <circle cx={12 + 8 * Math.cos(f / 12)} cy={12 + 8 * Math.sin(f / 12)} r="1.6" fill={C.warn} />
      </svg>
      <div style={{ fontFamily: MONO, fontSize: 88, color: C.text, fontWeight: 700, transform: `scale(${0.9 + 0.1 * pop})` }}>llm-session-console</div>
      <div style={{ fontSize: 44, color: C.dim, opacity: sub }}>Drill down into and replay LLM agent sessions</div>
      <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
        {pills.map((p, i) => (
          <span key={p} style={{ opacity: interpolate(f, [40 + i * 8, 52 + i * 8], [0, 1], clamp), border: `1px solid ${C.line}`,
            background: C.panel, color: C.text, borderRadius: 999, padding: "10px 22px", fontSize: 28 }}>{p}</span>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// The log as the proxy writes it: every row carries the whole conversation so far.
const Problem: React.FC = () => {
  const f = useCurrentFrame();
  const kinds: [string, string][] = [["system", C.dim], ["user", C.accent], ["assistant", C.text], ["tool", C.tool], ["assistant", C.text], ["tool", C.tool], ["assistant", C.text]];
  const rows = 6;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 150, top: 90, color: C.dim, fontFamily: MONO, fontSize: 28 }}>proxy.db · table calls · one row per LLM call</div>
      <div style={{ position: "absolute", left: 150, top: 150, display: "flex", flexDirection: "column", gap: 18 }}>
        {Array.from({ length: rows }).map((_, r) => {
          const appear = 8 + r * 16;
          const o = interpolate(f, [appear, appear + 10], [0, 1], clamp);
          return (
            <div key={r} style={{ display: "flex", gap: 10, alignItems: "center", opacity: o }}>
              <span style={{ fontFamily: MONO, color: C.dim, fontSize: 26, width: 150 }}>call {r + 1}</span>
              {kinds.slice(0, r + 2).map(([k, c], i) => (
                <span key={i} style={{ fontFamily: MONO, fontSize: 22, color: c, border: `1px solid ${i < r + 1 ? C.line : c}`,
                  background: i < r + 1 ? C.panel : C.panel2, borderRadius: 8, padding: "8px 14px",
                  opacity: i < r + 1 ? 0.55 : 1 }}>{k}</span>
              ))}
            </div>
          );
        })}
      </div>
      <Caption kicker="the problem" delay={110} text="Every row repeats the whole conversation. Thousands a day, JSON inside JSON: complete, and unreadable." />
    </AbsoluteFill>
  );
};

const ScreenScene: React.FC<{ src: string; d: number; kicker: string; text: string; from?: [number, number, number]; to?: [number, number, number] }> = (p) => (
  <AbsoluteFill>
    <Screen src={p.src} d={p.d} from={p.from} to={p.to} />
    <Caption kicker={p.kicker} text={p.text} />
  </AbsoluteFill>
);

// Two screens: the session's top (strip of calls), then its tool cards.
const Session: React.FC = () => {
  const f = useCurrentFrame();
  const swap = interpolate(f, [S(4.2), S(5)], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Screen src="session-top.png" d={5} from={[1, 0, 0]} to={[1.08, 0, 60]} opacity={1 - swap} />
      <Screen src="tools.png" d={10} from={[1.02, 0, 0]} to={[1.1, 40, 40]} opacity={swap} />
      <Caption kicker="a session" text={f < S(4.6) ? "A strip of its LLM calls: width is latency, gaps are the agent running tools."
        : "Every tool call is one card: what the LLM asked for, and what the agent sent back."} />
    </AbsoluteFill>
  );
};

// Replay: real frames of the console replaying the blocked session, cross-faded.
const Replay: React.FC = () => {
  const f = useCurrentFrame();
  const frames = ["r1.png", "r2.png", "r3.png", "r4.png", "r5.png"];
  const each = S(12) / frames.length;
  return (
    <AbsoluteFill>
      {frames.map((src, i) => {
        const o = interpolate(f, [i * each - 8, i * each + 4, (i + 1) * each - 4, (i + 1) * each + 8], [0, 1, 1, i === frames.length - 1 ? 1 : 0], clamp);
        return <Screen key={src} src={src} d={12} from={[1, 0, 0]} to={[1.03, 0, 0]} opacity={o} />;
      })}
      <Caption kicker="replay" text="Play any session back message by message, with a playhead on the strip. Space, ← →, 1–8×." />
    </AbsoluteFill>
  );
};

const Outro: React.FC = () => {
  const f = useCurrentFrame();
  const line = (i: number) => interpolate(f, [10 + i * 14, 24 + i * 14], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 34 }}>
      <div style={{ fontFamily: MONO, fontSize: 56, color: C.text, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 16,
        padding: "26px 44px", opacity: line(0) }}><span style={{ color: C.dim }}>$ </span>python3 -m console</div>
      <div style={{ fontSize: 40, color: C.text, opacity: line(1) }}>No install · no API key · offline · never writes to the log</div>
      <div style={{ fontSize: 34, color: C.dim, opacity: line(2) }}>Ships its blueprint too: goal, spec, decisions and the prompts to rebuild it</div>
      <div style={{ fontFamily: MONO, fontSize: 34, color: C.accent, opacity: line(3) }}>github.com/claudiucalomfirescu/llm-session-console</div>
    </AbsoluteFill>
  );
};

const Explainer: React.FC = () => {
  let at = 0;
  const seq = SCENES.map((s) => {
    const from = at;
    at += S(s.d);
    let body: React.ReactNode;
    switch (s.id) {
      case "title": body = <Title />; break;
      case "problem": body = <Problem />; break;
      case "overview": body = <ScreenScene src="overview.png" d={s.d} kicker="all traffic" from={[1, 0, 0]} to={[1.07, 0, 30]}
        text={`Open the log read-only. ${FACTS.weeks} weeks of a dealership run by AI agents: ${FACTS.calls} calls, ${FACTS.agents} agents.`} />; break;
      case "day": body = <ScreenScene src="day.png" d={s.d} kicker="one day" from={[1, 0, 0]} to={[1.12, 60, -40]}
        text={`Pick a day: one row per agent, one bar per session. ${FACTS.daySessions} sessions, ${FACTS.blocked} blocked in red.`} />; break;
      case "session": body = <Session />; break;
      case "blocked": body = <ScreenScene src="blocked.png" d={s.d} kicker="the verdict" from={[1, 0, 0]} to={[1.12, 70, -50]}
        text="The words the firewall matched, highlighted in the message. The proxy answered as the LLM." />; break;
      case "replay": body = <Replay />; break;
      case "galaxy": body = <ScreenScene src="galaxy.png" d={s.d} kicker="the whole company" from={[1, 0, 0]} to={[1.15, 0, 20]}
        text="Or see it in 3D: agents are stars, sessions planets, calls moons." />; break;
      default: body = <Outro />;
    }
    return <Sequence key={s.id} from={from} durationInFrames={S(s.d)}><Fade d={s.d}>{body}</Fade></Sequence>;
  });
  return <AbsoluteFill style={{ background: `radial-gradient(1200px 700px at 30% 20%, #16204a, ${C.bg})`, fontFamily: FONT }}>{seq}</AbsoluteFill>;
};

export const MyComposition: React.FC = () => (
  <Composition id="ConsoleExplainer" component={Explainer} durationInFrames={TOTAL} fps={FPS} width={1920} height={1080} />
);
