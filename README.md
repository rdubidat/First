# Growth Network Tasks 🐾

A floating, beautifully animated **desktop task manager** with a built-in
**Pomodoro timer** — starring **Leon** the golden retriever. Built for Windows
(and macOS/Linux) with Electron + React + Tailwind.

> Tick a task off and it vanishes from your list with a satisfying paw-stamp,
> confetti, and a little dopamine chime. It's not gone, though — completed tasks
> are buried safely in the **Doghouse**, ready to dig back up any time.

## ✨ Features

- **Floating & frameless** — sits on top of your other windows. Pin it on top,
  drag it anywhere, **minimize**, **hide to the tray**, or collapse it into a
  tiny **paw bubble** that stays out of your way.
- **Add & remove tasks** in a clean, distraction-free list.
- **Tick for dopamine** — every completion fires an animated paw-check, ring
  pulse, confetti burst, and a synthesized reward sound.
- **Doghouse archive** — completed tasks disappear from the list but can always
  be retrieved (or deleted forever).
- **Pomodoro timer** with dog-themed sessions — *Fetch* (focus), *Quick Sniff*
  (short break), *Nap Time* (long break) — a circular progress ring, auto-cycle,
  and configurable durations.
- **Light & dark themes**, remembered between launches (defaults to your OS).
- **Sound toggle** — mute the dopamine if you're in a meeting.
- Everything persists locally — your tasks are there when you reopen.

## 🚀 Getting started

```bash
npm install

# Develop the desktop app (Vite dev server + Electron with hot reload)
npm run electron:dev

# Or preview the UI in a browser (window controls hidden gracefully)
npm run dev
```

## 📦 Building a Windows installer

```bash
npm run dist        # builds a Windows NSIS installer into ./release
npm run dist:all    # mac + windows + linux (where supported)
```

App + tray icons are generated dependency-free from `build/generate-icons.cjs`.
Re-run `node build/generate-icons.cjs` if you tweak the artwork.

## 🏗️ Architecture

```
electron/
  main.cjs        Frameless, always-on-top, movable window; tray; compact mode; IPC
  preload.cjs     Safe contextBridge API exposed to the renderer (window.gnt)
src/
  App.jsx         Layout, tabs, theme/sound wiring, celebrations
  hooks/          useTasks · usePomodoro · useTheme · useSound (WebAudio)
  components/     TitleBar · TaskList/TaskItem · Archive · Pomodoro · Leon · ...
  state/          localStorage persistence helpers
```

The renderer is a plain React app, so it also runs in a normal browser — window
controls only appear when running inside Electron (`window.gnt` is present).

---

Made with 🦴 by Growth Network.
