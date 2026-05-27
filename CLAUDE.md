# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

短视频封面制作工具 (Short Video Cover Design Tool) — a lightweight, offline-capable cover design tool for e-commerce promoters and store reviewers. Core goal: produce a publishable cover within 5 minutes.

## Tech Stack

| Concern       | Choice                                         |
| ------------- | ---------------------------------------------- |
| Framework     | React 18 + TypeScript                          |
| Build         | Vite 5.x                                       |
| Canvas Engine | Konva 9.x + react-konva 18.x                   |
| State         | Zustand 4.x/5.x                                |
| UI Components | Ant Design 5.x                                 |
| Styling       | Tailwind CSS (optional)                        |
| Local Storage | IndexedDB (via `idb`)                          |
| Export        | Native Canvas `toBlob`/`toDataURL` + FileSaver |
| Testing       | Vitest 2.x + React Testing Library             |
| E2E           | Playwright 1.x                                 |
| Linting       | ESLint + Prettier                              |

## Architecture

```
src/
  components/       # React components (panels, toolbar, modals)
  canvas/          # Konva canvas logic (elements, layers, selection)
  store/           # Zustand stores (editor state, history, templates)
  hooks/           # Custom hooks (useCanvas, useExport, useStorage)
  utils/           # Helpers (color, geometry, export)
  types/           # TypeScript interfaces
  constants/       # Templates, fonts, stickers, color schemes
```

## Key Concepts

- **Canvas Elements**: Text, stickers, shapes, images — all support drag, scale, rotate, z-index
- **Templates**: JSON layout presets with predefined positions and styles for common use cases (product promotion, store review)
- **Color Schemes**: Predefined theme palettes that can replace all colors in one click
- **Export**: Canvas rendered to PNG/JPEG blob, then downloaded locally via FileSaver

## Editor Layout

```
┌─────────────────────────────────────────────────────┐
│  TopBar: New · Undo/Redo · Export                    │
├──────────┬─────────────────────────┬────────────────┤
│  Left    │      Central Canvas     │    Right       │
│  Panel   │      (Konva Stage)      │    Panel       │
│          │                         │                │
│  Template│                         │   Properties   │
│  Text    │                         │   (selected    │
│  Sticker │                         │    element)    │
│  Colors  │                         │                │
└──────────┴─────────────────────────┴────────────────┘
```

## Local Storage Strategy

- **IndexedDB**: Drafts, user templates, recent projects (via `idb` library)
- **localStorage**: Lightweight UI preferences

## Naming Conventions

- Component files: PascalCase (`CanvasEditor.tsx`)
- Store slices: camelCase with `Store` suffix (`editorStore.ts`)
- Types/Interfaces: PascalCase with descriptive suffixes (`CanvasElement`, `TemplateSchema`)

## Commands

Since this is a greenfield project, initialize with:

```bash
npm create vite@latest . -- --template react-ts
npm install konva react-konva zustand antd idb file-saver
npm install -D vitest @testing-library/react @playwright/test eslint prettier
```

## 语言规范

- 所有对话和文档都使用中文
- 注释使用中文
- 错误提示使用中文
- 文档使用中文Markdown格式

## Design Principles

- Offline-first: all core editing and export work without network
- Performance target: 30 FPS+ during drag/scale interactions
- Only commercial-use fonts are included
