# llm-session-console explainer video: script

Video: [../console-explainer.mp4](../console-explainer.mp4) · 73.5 s · 1920×1080 · 30 fps · no audio ·
Remotion, all scenes in [`src/Composition.tsx`](src/Composition.tsx). Every screen in `public/` is a real
screenshot of the console (dark theme, 1280×720 at 1.5×) on the bundled logs `vxc-4-weeks` and
`vxc-day-2026-11-13`; the replay frames are the blocked session `6c2bdf203eed` (James Okafor asked to
export customers to a friend's garage).

Re-render:
```bash
python3 -m console &                       # from the repo root, for fresh screenshots (optional)
cd explainers/video && npm i
npx remotion render ConsoleExplainer ../console-explainer.mp4 --browser-executable=/opt/pw-browsers/chromium
ffmpeg -i ../console-explainer.mp4 -c:v libx264 -crf 31 -tune animation -pix_fmt yuv420p -movflags +faststart out.mp4   # ~5 MB
```

## Scenes
| # | Time | Scene | On screen / caption |
|---|---|---|---|
| 1 | 0:00–0:04.5 | Title | Logo orbit, name, "Drill down into and replay LLM agent sessions", five feature pills. |
| 2 | 0:04.5–0:12.5 | The problem | Rows of `calls` grow one message at a time, the old ones greyed: "Every row repeats the whole conversation…" |
| 3 | 0:12.5–0:19.5 | All traffic | Overview of 4 weeks: 4,409 calls, 27 agents. |
| 4 | 0:19.5–0:28.5 | One day | The day timeline of 13 Nov: a row per agent, a bar per session, 7 blocked in red. |
| 5 | 0:28.5–0:38.5 | A session | Timeline strip of calls, then tool cards with their results. |
| 6 | 0:38.5–0:48.5 | The verdict | The blocked call: matched words highlighted, the proxy answering as the LLM. |
| 7 | 0:48.5–1:00.5 | Replay | Five real replay frames cross-faded, playhead moving along the strip. |
| 8 | 1:00.5–1:06.5 | Galaxy | The 3D view of the four weeks. |
| 9 | 1:06.5–1:13.5 | Outro | `python3 -m console`, no install / key / network, blueprint shipped, repo URL. |
