# Pixel Agents production changes — 2026-11-23

This public source sync carries forward the [November 19 sync](SOURCE-SYNC-2026-11-19.md)
and adds the deployed office controls and leisure behavior.

- **Office controls:** A browser-local, default-off **Agents On Top** setting
  moves existing desktop cards into a scrollable top row. The lower-left desktop
  panel combines Layout, Settings and zoom in a 32 px high toolbar with a 20 px
  collapse/restore control. Mobile and read-only layouts retain their controls.
- **Space + left drag:** On the desktop stage, hold Space and drag to pan using
  the existing clamped camera path. Without Space, normal clicks and editing still
  work. Middle drag, wheel zoom and phone controls are unchanged.
- **Leisure:** Solo, TV and paired play expire after five to seven minutes.
  The 30% roll after each eligible 60-second interval, arrival rules, reservation
  cleanup and immediate work preemption are unchanged. The existing six
  named jungle identities render an otherwise unknown status as idle; that is
  a frontend display choice, not a provider or bridge status rewrite.
- **North-facing play:** The renderer uses eight 150 ms arm poses over a fixed
  standing base. Hands and sleeves animate without moving the head, torso or feet;
  standard 16 px frames pad to 24 px without shifting the anchor. The public data
  contains only the arm pixels that the renderer reads, not full reference frames.
  Other facings, seated TV viewing and the work/read/idle/walk paths are unchanged.

The production frontend was checked in the retained live browser sessions for
option persistence, horizontal scrolling, toolbar layout and keyboard restore,
panning without unintended clicks or edits, mobile rendering, and work
preemption. Those checks used the deployed frontend; the public package is
qualified separately and does not ship the live office or private assets.

The public OpenClaw bridge still maps one actual agent to one named character;
host-only display mirrors are intentionally not published. Credentials, live
layout/settings, external scene packs and generated release binaries are not
part of the Git sync.
