# Demo · llm-session-console

## Recorded (no key, 1 minute)
```bash
python3 -m console          # first run unpacks demo/data/*.db.xz (~1.5 MB -> ~200 MB), then:
# open http://127.0.0.1:8095/
```
What you should see: four weeks of VXC Motors traffic (5–29 Oct 2026): ~4,400 LLM calls, ~1,100
sessions, 27 users (12 employees, simulated customers, the BMW desk), with firewall findings.

## The demo logs
| Log (picker top right) | What it is | Schema |
|---|---|---|
| `vxc-4-weeks` (default) | VXC Motors, a BMW dealership whose 12 employees are AI agents. Wed 28 and Thu 29 Oct are two **real recorded workdays** (nemotron via OpenRouter, every call genuine). The 17 earlier days are **rebuilt from those real sessions**: a seeded sample copied onto earlier dates with new session ids (`labels.replay_of` names the original). Volumes vary by weekday, Priya is on holiday the week of 12 Oct, 14 Oct has an incident cluster. | @2 (with firewall) |
| `vxc-day-2026-11-13` | One full VXC workday **re-recorded on 13 Nov 2026** by vxc-motors-sim: 552 real calls (all free nemotron, $0), 115 sessions, 88 findings, 7 blocked sessions (customer PII export, harassment, a shared portal login…), the BMW tech-support desk answering a case. Users come from `labels.user`. Best log for the day timeline and replay. | @2 (user in labels) |
| `vxc-recorded-day` | The first recorded workday exactly as the learning project's proxy wrote it, before `calls.user` existed: users come from `X-Agent-Id`. | legacy |
| `brightleaf-team-week` | The llm-proxy-log demo team (maya engineering, omar support, lena sales, raj ops), 125 real calls over a week. | @1 (no firewall) |
| `brightleaf-firewall-week` | The same team behind llm-proxy-firewall: 109 agent calls plus 21 intent checks by the firewall itself (system traffic, hidden by default), 50 findings, 10 admin actions. | @2 |

## Live traffic
With a real proxy, point the console at its log while it runs; new calls appear on the next click:
```bash
python3 -m console --db ../llm-proxy-firewall/logs/proxy.db
```
Without a proxy or key, replay a recorded day into a fresh file at 20× speed:
```bash
python3 demo/live_replay.py --speed 20 &
python3 -m console --db demo/data/.cache/live.db --port 8096
```

## Ten-step walkthrough
1. **All traffic.** KPI tiles, the over-time chart, users, departments, models and the weekday × hour
   heatmap. The breadcrumb says users come from `X-Agent-User`. (R-005, R-007, R-021)
2. **Switch the chart metric** to *tokens*, then *firewall*; toggle **Week**. (R-006, R-024)
3. **Click the 14 Oct bar.** The range narrows to that day (chip 📅 in the breadcrumb), the chart
   switches to hours and a **day timeline** appears: a row per user, a bar per session, red and amber
   where the firewall flagged it. Click a bar to open that session; remove the chip with ✕. (R-021, R-024, R-028)
4. **Click `james-okafor`** in the users table: his days, the tools the LLM called for him
   (`crm_*`, `mail_*`…), his hours, and his sessions. Filter sessions to **≥ block**. (R-008, R-009)
5. **Open a blocked session.** The **timeline strip** on top shows each LLM call as a bar (width =
   latency, colour = firewall level) and the gaps where the agent ran tools; click a bar to jump. Each
   call shows only what it added, then the LLM's answer; every **tool call is a card** with its
   arguments and the result the agent sent back (`5 rows · customer_id, name…`, full JSON one click
   away). On the blocked call the words the firewall matched are **highlighted** in the agent's
   message, the proxy answers *as the LLM*, and the findings say which side they were found on.
   Click **{ } raw** for the exact JSON. (R-010, R-011, R-025, R-026, R-029)
6. **Press ▶ Replay.** The session plays back message by message with a playhead on the strip; space
   pauses, ← → step, the scrubber jumps, 1–8× sets the speed, Esc shows everything. Add `&replay=1` to
   a session link to share it as a replay. Then use **‹ prev / next ›** to walk the user's sessions and
   the breadcrumb to go back up. Every view is a URL. (R-021, R-027)
7. **Firewall tab.** Findings over time, the topic × level matrix (click a cell), detectors, every
   finding and admin action; click a row to land on that call inside its session. (R-012)
8. **Galaxy 3D tab.** Stars are users grouped by department, planets their sessions, red/amber halos
   flag warnings and blocks. Drag, zoom, click `tom-becker`, then one of his flagged sessions in the
   panel: the orbits stop, the session's calls appear as moons; click a moon, then *Open this call in
   drill-down*. Esc returns to the overview. (R-013, R-022)
9. **Switch the log** to `brightleaf-team-week`: no firewall tiles; the Firewall tab explains that a
   K-log-schema@1 log has no firewall tables. Switch to `vxc-recorded-day`: users now come from
   `X-Agent-Id`; `vxc-day-2026-11-13` opens straight on its day timeline. (R-002, R-003, R-023)
10. **Search** "discount" from the header. Toggle the ◐ theme; with the OS set to reduce motion the
    galaxy stops spinning. Everything above works with the network unplugged. (R-014, R-102, R-104)

## The demo cast (vxc-4-weeks)
Victor Hale (general manager), Maria Santos (reception), Daniel Reed, Tom Becker, Sofia Marin (sales),
James Okafor, Elena Popescu, Nina Kovac (service), Lucas Meyer, Priya Nair (workshop), Mark Doyle
(parts), Aisha Rahman (finance) — each an agent whose only channel is the LLM; plus simulated
customers and the BMW dealer desk. The incidents seeded in their scripts (a PII leak to a personal
address, discount fraud, poaching for a competitor, harassment, credential sharing) are what the
firewall catches.
