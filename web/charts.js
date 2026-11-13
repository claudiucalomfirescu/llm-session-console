/* Small SVG charts with no dependencies: stacked bars over time, heatmap, horizontal bars, sparkline,
   a day timeline (users x sessions) and a session waterfall (calls and the tool time between them).
   Every chart takes plain arrays and an onClick so a bar is also a drill-down link. */
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const fmt = (n) => n == null ? "–" : Math.abs(n) >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + "M"
    : Math.abs(n) >= 1e3 ? (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + "k" : String(Math.round(n * 100) / 100);
  const el = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  const tip = {
    show(ev, html) { const t = document.getElementById("tip"); t.innerHTML = html; t.hidden = false; tip.move(ev); },
    move(ev) {
      const t = document.getElementById("tip"); if (t.hidden) return;
      const w = t.offsetWidth, h = t.offsetHeight;
      t.style.left = Math.min(ev.clientX + 14, innerWidth - w - 8) + "px";
      t.style.top = Math.min(ev.clientY + 14, innerHeight - h - 8) + "px";
    },
    hide() { document.getElementById("tip").hidden = true; },
  };
  const niceMax = (v) => {
    if (v <= 0) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(v))), m = v / p;
    return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
  };

  /* Stacked bars. rows: [{bucket, ...}], keys: [{key, label, color}], line: optional {key, label, color}
     (drawn against its own right-hand scale). selected: bucket to highlight. */
  function bars(container, rows, { keys, line, height = 220, onClick, selected, label = (r) => r.bucket, tipExtra } = {}) {
    container.innerHTML = "";
    if (!rows.length) { container.innerHTML = '<div class="empty">No traffic in this range.</div>'; return; }
    const W = Math.max(container.clientWidth || 600, 300), H = height, m = { l: 44, r: line ? 48 : 8, t: 8, b: 26 };
    const svg = el("svg", { class: "chart", viewBox: `0 0 ${W} ${H}`, role: "img" }, container);
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const tot = rows.map((r) => keys.reduce((s, k) => s + (r[k.key] || 0), 0));
    const ymax = niceMax(Math.max(...tot));
    const g = el("g", { class: "grid" }, svg);
    for (let i = 0; i <= 4; i++) {
      const y = m.t + ih - (ih * i) / 4;
      el("line", { x1: m.l, x2: W - m.r, y1: y, y2: y }, g);
      el("text", { x: m.l - 6, y: y + 4, "text-anchor": "end" }, svg).textContent = fmt((ymax * i) / 4);
    }
    const bw = iw / rows.length, gap = Math.min(4, bw * 0.2);
    const every = Math.ceil(rows.length / Math.max(1, Math.floor(iw / 64)));
    rows.forEach((r, i) => {
      const x = m.l + i * bw;
      if (selected && r.bucket === selected) el("rect", { class: "sel", x, y: m.t, width: bw, height: ih }, svg);
      let y = m.t + ih;
      const grp = el("g", { class: "bar" }, svg);
      keys.forEach((k) => {
        const v = r[k.key] || 0; if (!v) return;
        const h = (v / ymax) * ih;
        y -= h;
        el("rect", { x: x + gap / 2, y, width: Math.max(1, bw - gap), height: Math.max(h, 0.5), fill: k.color, rx: Math.min(2, bw / 4) }, grp);
      });
      el("rect", { x, y: m.t, width: bw, height: ih, fill: "transparent" }, grp);
      grp.addEventListener("mousemove", (ev) => tip.show(ev, `<b>${label(r)}</b>` + keys.map((k) =>
        `<div><span class="dot" style="background:${k.color}"></span>${k.label}: ${fmt(r[k.key] || 0)}</div>`).join("")
        + (line ? `<div>${line.label}: ${fmt(r[line.key] || 0)}</div>` : "") + (tipExtra ? tipExtra(r) : "")
        + (onClick ? '<div class="muted">click to drill in</div>' : "")));
      grp.addEventListener("mouseleave", tip.hide);
      if (onClick) grp.addEventListener("click", () => { tip.hide(); onClick(r); });
      if (i % every === 0) el("text", { x: x + bw / 2, y: H - 8, "text-anchor": "middle" }, svg).textContent = shortDate(r.bucket);
    });
    if (line) {
      const lmax = niceMax(Math.max(...rows.map((r) => r[line.key] || 0)));
      const pts = rows.map((r, i) => `${m.l + i * bw + bw / 2},${m.t + ih - ((r[line.key] || 0) / lmax) * ih}`).join(" ");
      el("polyline", { points: pts, fill: "none", stroke: line.color, "stroke-width": 2, "stroke-linejoin": "round", "pointer-events": "none" }, svg);
      for (let i = 0; i <= 4; i++) el("text", { x: W - m.r + 6, y: m.t + ih - (ih * i) / 4 + 4 }, svg).textContent = fmt((lmax * i) / 4);
    }
  }

  function shortDate(b) {
    if (!b) return "";
    if (b.length > 10) return b.slice(11, 16);
    const d = new Date(b + "T00:00:00Z");
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
  }

  /* Weekday x hour heatmap. cells: [{dow, hour, calls}] */
  function heatmap(container, cells, { onClick } = {}) {
    container.innerHTML = "";
    const W = Math.max(container.clientWidth || 600, 300), m = { l: 34, t: 4, b: 18 }, cw = (W - m.l) / 24, ch = 18, H = m.t + 7 * ch + m.b;
    const svg = el("svg", { class: "chart", viewBox: `0 0 ${W} ${H}` }, container);
    const max = Math.max(1, ...cells.map((c) => c.calls));
    const by = {}; cells.forEach((c) => (by[c.dow + ":" + c.hour] = c.calls));
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], accent = css("--accent");
    days.forEach((d, i) => {
      el("text", { x: m.l - 6, y: m.t + i * ch + 13, "text-anchor": "end" }, svg).textContent = d;
      for (let h = 0; h < 24; h++) {
        const v = by[i + ":" + h] || 0;
        const r = el("rect", { x: m.l + h * cw + 1, y: m.t + i * ch + 1, width: cw - 2, height: ch - 2, rx: 2,
          fill: v ? accent : css("--panel2"), "fill-opacity": v ? 0.15 + 0.85 * Math.sqrt(v / max) : 1 }, svg);
        r.addEventListener("mousemove", (ev) => tip.show(ev, `<b>${d} ${String(h).padStart(2, "0")}:00–${String(h + 1).padStart(2, "0")}:00 UTC</b>${v} calls`));
        r.addEventListener("mouseleave", tip.hide);
        if (onClick && v) { r.style.cursor = "pointer"; r.addEventListener("click", () => onClick(i, h)); }
      }
    });
    for (let h = 0; h < 24; h += 3) el("text", { x: m.l + h * cw + cw / 2, y: H - 4, "text-anchor": "middle" }, svg).textContent = String(h).padStart(2, "0");
  }

  /* Horizontal bars as an HTML grid: items [{key, value, href?, color?, extra?}] */
  function hbars(container, items, { fmtv = fmt } = {}) {
    if (!items.length) { container.innerHTML = '<div class="empty">Nothing here.</div>'; return; }
    const max = Math.max(...items.map((i) => i.value), 1);
    container.innerHTML = `<div class="hbar">${items.map((i) => `
      ${i.href ? `<a href="${i.href}" title="${esc(i.key)}">${esc(i.key)}</a>` : `<span class="k" title="${esc(i.key)}">${esc(i.key)}</span>`}
      <div><div class="b" style="width:${(100 * i.value) / max}%;${i.color ? "background:" + i.color : ""}"></div></div>
      <span class="n">${fmtv(i.value)}${i.extra || ""}</span>`).join("")}</div>`;
  }

  /* Tiny inline sparkline (SVG string) over a fixed list of days. */
  function spark(days, byDay, color) {
    if (!days.length) return "";
    const w = 90, h = 20, max = Math.max(1, ...days.map((d) => byDay[d] || 0)), bw = w / days.length;
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">${days.map((d, i) => {
      const v = byDay[d] || 0, bh = v ? Math.max(1.5, (v / max) * h) : 0;
      return bh ? `<rect x="${i * bw + 0.3}" y="${h - bh}" width="${Math.max(1, bw - 0.6)}" height="${bh}" fill="${color}"/>` : "";
    }).join("")}</svg>`;
  }


  /* Time axis helpers for the timelines: epoch ms from "YYYY-MM-DDTHH:MM:SSZ", and round tick steps. */
  const ms = (ts) => Date.parse(ts.length === 20 ? ts : ts.slice(0, 19) + "Z");
  const hhmm = (t) => new Date(t).toISOString().slice(11, 16);
  function ticks(t0, t1, width) {
    const steps = [60e3, 300e3, 600e3, 900e3, 1800e3, 3600e3, 7200e3, 10800e3, 21600e3];
    const step = steps.find((s) => (t1 - t0) / s <= Math.max(2, width / 90)) || 43200e3;
    const out = [];
    for (let t = Math.ceil(t0 / step) * step; t <= t1; t += step) out.push(t);
    return out;
  }

  /* Day timeline: one lane per user, one bar per session (start -> end), coloured by its worst firewall level.
     lanes: [{key, label, color, items: [{start, end, level, title, ...}]}] */
  function timeline(container, lanes, { levelColor, onClick, tipHtml } = {}) {
    container.innerHTML = "";
    const all = lanes.flatMap((l) => l.items);
    if (!all.length) { container.innerHTML = '<div class="empty">No sessions in this range.</div>'; return; }
    let t0 = Math.min(...all.map((i) => ms(i.start))), t1 = Math.max(...all.map((i) => ms(i.end)));
    const pad = Math.max(60e3, (t1 - t0) * 0.02); t0 -= pad; t1 += pad;
    const W = Math.max(container.clientWidth || 600, 320), lh = 22, m = { l: 150, r: 10, t: 6, b: 22 };
    const H = m.t + lanes.length * lh + m.b, iw = W - m.l - m.r, X = (t) => m.l + ((t - t0) / (t1 - t0)) * iw;
    const svg = el("svg", { class: "chart timeline", viewBox: `0 0 ${W} ${H}`, role: "img" }, container);
    const g = el("g", { class: "grid" }, svg);
    ticks(t0, t1, iw).forEach((t) => {
      el("line", { x1: X(t), x2: X(t), y1: m.t, y2: H - m.b }, g);
      el("text", { x: X(t), y: H - 6, "text-anchor": "middle" }, svg).textContent = hhmm(t);
    });
    lanes.forEach((lane, i) => {
      const y = m.t + i * lh;
      if (i % 2) el("rect", { x: 0, y, width: W, height: lh, class: "lane-alt" }, svg);
      el("circle", { cx: 8, cy: y + lh / 2, r: 4, fill: lane.color }, svg);
      const t = el("text", { x: 18, y: y + lh / 2 + 4, class: "lane-label" }, svg);
      t.textContent = lane.label.length > 20 ? lane.label.slice(0, 19) + "…" : lane.label;
      lane.items.forEach((it) => {
        const x = X(ms(it.start)), w = Math.max(4, X(ms(it.end)) - x);
        const r = el("rect", { x, y: y + 4, width: w, height: lh - 8, rx: 3, class: "seg-bar" + (it.level ? " lv" : ""),
          fill: levelColor(it.level) }, svg);
        r.addEventListener("mousemove", (ev) => tip.show(ev, tipHtml(it, lane)));
        r.addEventListener("mouseleave", tip.hide);
        if (onClick) r.addEventListener("click", () => { tip.hide(); onClick(it, lane); });
      });
    });
  }

  /* One session as a strip: each LLM call is a bar (its latency), the gaps between are the agent running
     tools; diamonds mark tool calls. steps: [{call_id, ts, duration_ms, level, tools: [name]}]. Returns
     {setPlayhead(index)} so replay can move a cursor along it. */
  function waterfall(container, steps, { levelColor, onClick, tipHtml } = {}) {
    container.innerHTML = "";
    if (!steps.length) return { setPlayhead() {} };
    const starts = steps.map((s) => ms(s.ts)), ends = steps.map((s, i) => starts[i] + (s.duration_ms || 0));
    const t0 = starts[0], t1 = Math.max(t0 + 1000, ...ends);
    const W = Math.max(container.clientWidth || 600, 320), H = 64, m = { l: 8, r: 8, t: 14, b: 20 }, iw = W - m.l - m.r;
    const X = (t) => m.l + ((t - t0) / (t1 - t0)) * iw, y = m.t, bh = H - m.t - m.b;
    const svg = el("svg", { class: "chart waterfall", viewBox: `0 0 ${W} ${H}`, role: "img" }, container);
    const g = el("g", { class: "grid" }, svg);
    ticks(t0, t1, iw).forEach((t) => { el("line", { x1: X(t), x2: X(t), y1: y, y2: y + bh }, g);
      el("text", { x: X(t), y: H - 5, "text-anchor": "middle" }, svg).textContent = hhmm(t); });
    el("line", { x1: m.l, x2: W - m.r, y1: y + bh / 2, y2: y + bh / 2, class: "rail" }, svg);
    const head = el("line", { x1: 0, x2: 0, y1: 2, y2: y + bh + 2, class: "playhead", visibility: "hidden" }, svg);
    steps.forEach((s, i) => {
      const x = X(starts[i]), w = Math.max(3, X(ends[i]) - x);
      const grp = el("g", { class: "bar" }, svg);
      el("rect", { x, y, width: w, height: bh, rx: 3, fill: levelColor(s.level) }, grp);
      (s.tools || []).forEach((_, k) => el("path", { d: `M${x + w + 3 + k * 5},${y - 6} l3,3 l-3,3 l-3,-3z`, class: "tooltick" }, grp));
      el("rect", { x: x - 2, y: 0, width: w + 4, height: H - m.b, fill: "transparent" }, grp);
      grp.addEventListener("mousemove", (ev) => tip.show(ev, tipHtml(s, i)));
      grp.addEventListener("mouseleave", tip.hide);
      if (onClick) grp.addEventListener("click", () => { tip.hide(); onClick(s, i); });
    });
    const groups = [...svg.querySelectorAll("g.bar")];
    return { setPlayhead(i, atStart) {   // i = call index; atStart: at the call's request, else at its answer
      groups.forEach((gr, k) => gr.classList.toggle("on", k === i));
      if (i == null || i < 0) { head.setAttribute("visibility", "hidden"); return; }
      const x = atStart ? X(starts[i]) : X(ends[Math.min(i, steps.length - 1)]);
      head.setAttribute("x1", x); head.setAttribute("x2", x); head.setAttribute("visibility", "visible");
    } };
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  window.Charts = { bars, heatmap, hbars, spark, timeline, waterfall, fmt, esc, tip, css, shortDate };
})();
