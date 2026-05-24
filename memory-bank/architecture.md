# 架构洞察与文件作用说明

本文档用于记录和解释项目中的核心架构设计以及关键文件的作用，供后续开发者快速理解项目上下文。

## 核心技术栈说明
- **框架**：React 19 + TypeScript
- **构建工具**：Vite
- **全局状态**：Zustand
- **UI 组件库**：Ant Design (v5) + @ant-design/icons
- **测试框架**：Vitest (单测/组件测) + Playwright (E2E测试)
- **代码规范**：ESLint (Flat Config) + Prettier

## 基础模块划分（`/src/modules`）

项目基于领域驱动和高内聚低耦合的原则，将编辑器拆分为以下几大核心模块：

### 1. `canvas/` (画布模块)
- 负责主渲染区域的实现。
- **`components/CanvasArea.tsx`**：接收 `canvasSize`，渲染实际的画布画板（Canvas Board）。内部实现了根据容器宽度和高度自动执行 `scale` 缩放的自适应算法，使得大分辨率画布（如 1080x1920）能在小屏幕上完美按比例预览，且通过 `flex-shrink: 0` 杜绝了弹性收缩形变。
- 点击 CanvasArea 内部空白或 board 会调用 `selectElement(null)` 以清空当前的选中状态。
- 未来将集成 Konva 引擎，负责图形的渲染、拖拽、缩放等交互。

### 2. `state/` (状态模块 - Step 4 全新集成)
- 负责全局状态管理与运行时元素校验，对外暴露出纯净、强类型的 API 接口。
- **`types.ts`**：核心领域模型接口定义。包括 `BaseElement` 通用基础字段，专属的 `TextElement` 与 `StickerElement` 字段，以及 `CanvasConfig`、`ThemeColors`、`HistoryState` 等。**采用 type-only import 规范**，确保了在被外部 JS 文件引用时不会生成冗余的空引用，成功规避了 Vite HMR 编译时报 `"Requested module does not provide export"` 的运行时语法错误。
- **`schema.ts`**：运行时外部数据白名单过滤器。提供 `validateAndFilterElement` 工具函数，用于将来自外部的模板 JSON 或本地草稿转换为受信任的强类型实体，剔除杂质和未知字段，并在过滤时输出 `console.warn` 日志告警。
- **`store.ts`**：Zustand store 的实体逻辑实现。包含尺寸、背景色设置，元素的增删改查，全局选中机制（支持不存在 ID 回退、删除时自动重置等），以及最高 50 步的 Undo/Redo 历史栈支持。

### 3. `ui/` (UI 面板模块)
- 包含编辑器周边的控制面板组件。
- **`components/Header.tsx`**：顶部工具栏。承载了封面编辑器的标题、画布预设尺寸切换下拉菜单（Select），以及”新建/撤销/重做/导出”按钮组。导出按钮通过 `ExportModal` 提供 PNG/JPEG 导出选项。
- **`components/LeftPanel.tsx`**：左侧素材面板。使用竖向 Tab 选项卡展示”模板”、”文本”、”贴纸”、”配色”栏目。
- **`components/RightPanel.tsx`**：右侧属性编辑面板。已与 Zustand 的 `selection` 机制完全绑定。无选中元素时展示默认的 Empty “未选中元素”提示；当有元素被选中时，展示对应的属性编辑面板。
- **`components/ExportModal.tsx`**：导出配置弹窗。提供格式（PNG/JPEG）和清晰度（标准 1x / 高清 2x）选项，预览导出文件名，触发实际导出流程。导出前临时隐藏选中框手柄，导出完成后恢复。

### 4. `template/` (模板数据模块)
- 负责解析、加载和管理封面模板 JSON 数据。
- **`types.ts`**：模板类型定义（`TemplateSchema`、`ValidTemplate`）。
- **`schema.ts`**：模板校验器，验证 `version/meta/canvas/theme/elements` 顶层结构，复用元素的运行时白名单校验。
- **`builtins.ts`**：3 套内置模板 JSON（带货 2 套、探店 1 套）。

### 5. `stickers/` (贴纸资源模块)
- 管理离线内置 SVG 贴纸资产注册表。
- **`registry.ts`**：`STICKER_REGISTRY` 数组，包含 6 个 SVG 贴纸（价格标签 2、箭头 2、星标 1、推荐章 1），每条记录含 `id`、`name`、`category`、`svgSource`。所有 SVG 内联嵌入，完全离线可用。

### 5. `export/` (导出模块)
- 负责最终封面的生成与导出逻辑，比如 Canvas 到 PNG/JPEG 的转换。
- **`index.ts`**：导出核心工具函数：
  - `sanitizeFilename`：净化文件名（移除非法字符、空格转连字符、100 字符截断）。
  - `generateExportFilename`：按 `{name}_{width}x{height}_{scale}_{YYYYMMDD_HHmmss}.{ext}` 格式生成文件名。
  - `exportToBlob`：使用 Canvas API + foreignObject 将 DOM 画布元素渲染为 PNG/JPEG Blob，支持 1x/2x 缩放，JPEG 固定质量 0.92。
  - `downloadBlob`：触发浏览器文件下载。
- **`index.test.ts`**：导出工具的单元测试，16 个用例覆盖文件名生成、格式化、边界情况。

### 6. `storage/` (存储模块)
- 负责浏览器本地存储，将使用 IndexedDB / localStorage 持久化用户草稿和自定义模板。

## 根目录关键文件作用
- `vite.config.ts`：Vite 构建配置，内含 Vitest 的测试环境配置。
- `playwright.config.ts`：端到端测试框架 Playwright 的配置。
- `eslint.config.js` / `.prettierrc`：代码规范校验和格式化规则。
- `e2e/smoke.spec.ts`：E2E 端到端测试脚本。用于在真实浏览器中验证四区布局的稳定性、视口缩放表现以及画布尺寸切换下拉逻辑。
- `src/App.tsx`：根组件，目前承载了 `canvasSize` 状态，并使用 Ant Design `<Layout>` 完成了经典的后台四区拼装。
- `src/App.test.tsx`：根组件及基础布局交互的单元与集成级测试。
- `src/setupTests.ts`：Vitest 运行前的环境初始化（除引入 `jest-dom` 中外，还注入了 `window.matchMedia` 和 `ResizeObserver` 的 mock 实现，以保证 Ant Design UI 能够脱离真实浏览器顺利在 JSDOM 环境中测试）。
