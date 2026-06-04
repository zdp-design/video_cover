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
- **`components/CanvasArea.tsx`**：接收 `canvasSize`，渲染实际的画布画板（Canvas Board）。内部实现了根据容器宽度和高度自动执行 `scale` 缩放的自适应算法，使得大分辨率画布（如 1080x1920）能在小屏幕上完美按比例预览，且通过 `flex-shrink: 0` 杜绝了弹性收缩形变。**已集成安全区可视化引导线和拖拽吸附对齐系统**：中心虚线（`rgba(25,143,255,0.25)`）始终可见；拖拽时元素接近对齐位置（阈值 8px）自动吸附并显示高亮引导线（`rgba(25,143,255,0.7)`）。吸附修正通过 `useCallback` + `canvasSize` 依赖缓存，拖拽结束时写入一条撤销重做快照。引导线使用 `pointerEvents: none`，天然不出现在 Canvas API 导出结果中。**Step 19 性能优化**：提取 `TextContent`、`StickerContent`、`ShapeContent` 为独立 `React.memo` 组件；新增 `ElementRenderer` 组件实现元素级 memo 化；拖拽/缩放/旋转处理使用 `requestAnimationFrame` 批处理减少重渲染；`computeTransformUpdate` 和回调函数使用 `useCallback` 缓存防止不必要的重渲染。
- **高级文本样式渲染**：文本元素在画布中渲染时，通过 CSS `textShadow`（描边）、`-webkit-text-stroke`（描边）、`letter-spacing`（字间距）实现 Step 14 高级样式。
- 点击 CanvasArea 内部空白或 board 会调用 `selectElement(null)` 以清空当前的选中状态。
- 元素拖拽使用 `mousemove/mouseup` 全局监听实现，支持 scale 补偿（逻辑坐标换算），确保不同窗口尺寸下指针不漂移。
- **`presets.ts`**：文本样式预设注册表。`TEXT_STYLE_PRESETS` 包含 6 套电商场景预设（爆款价、必吃榜、避雷提醒、限时特价、新商品、热销榜），每套定义描边、阴影、字间距字段。`buildPresetUpdate` 将预设字段映射为元素更新对象。

### 2. `state/` (状态模块 - Step 4 全新集成)
- 负责全局状态管理与运行时元素校验，对外暴露出纯净、强类型的 API 接口。
- **`types.ts`**：核心领域模型接口定义。包括 `BaseElement` 通用基础字段，`TextElement`/`StickerElement`/`ShapeElement` 三个专属类型，以及 `CanvasConfig`、`ThemeColors`、`HistoryState` 等。Step 15 新增 `ShapeSubtype` 和 `ShapeElement`（含 `shapeType`、`fill`、`stroke`、`strokeWidth`、`cornerRadius`）。**采用 type-only import 规范**，确保了在被外部 JS 文件引用时不会生成冗余的空引用，成功规避了 Vite HMR 编译时报 `"Requested module does not provide export"` 的运行时语法错误。
- **`schema.ts`**：运行时外部数据白名单过滤器。提供 `validateAndFilterElement` 工具函数，用于将来自外部的模板 JSON 或本地草稿转换为受信任的强类型实体，剔除杂质和未知字段，并在过滤时输出 `console.warn` 日志告警。Step 15 扩展支持 `shape` 类型；Step 14 扩展 text 专属字段白名单（描边/阴影/字间距）。
- **`store.ts`**：Zustand store 的实体逻辑实现。包含尺寸、背景色设置，元素的增删改查，全局选中机制（支持不存在 ID 回退、删除时自动重置等），以及最高 50 步的 Undo/Redo 历史栈支持。**Step 16 新增 `applyTheme(themeId)`**：根据主题 ID 查找预设，通过 `buildColorReplaceMap` 计算旧主题到新主题的颜色映射，扫描所有元素的 fill/stroke 字段进行批量替换，同时更新 canvas 背景色，写入一条撤销重做快照。若映射为空则直接返回。**Step 17 新增**：`autoSave()` 方法（仅持久化到 IndexedDB，不修改 `isDirty`，用于崩溃恢复）；`restoreFromDraft()` 从 IndexedDB 恢复最新草稿快照，同时清空历史栈（会话边界）；`saveAsCustomTemplate(name)` / `loadCustomTemplates()` / `deleteCustomTemplate(id)` 委托给 storage 层；`applyTemplate` 增加 `isCustomTemplate` 参数（builtin 模板清空 `currentTemplateName`，自定义模板保留）；所有写操作（增删元素、尺寸/背景色/主题变更、层级调整）在状态更新后自动调用 `autoSave()`。**Step 19 性能优化**：引入 `AUTO_SAVE_DEBOUNCE_MS = 1000` 防抖机制，使用 `setTimeout` + `clearTimeout` 减少频繁 IndexedDB 写入；在 `saveDraftSnapshot`/`restoreFromDraft`/`resetStore` 时清理待处理定时器避免内存泄漏。新增 `useCanvasSelector`、`useElementsSelector`、`useSelectionSelector` 专用选择器，以及 `useEditorStoreShallow` 导出高效的浅比较选择器。

### 3. `ui/` (UI 面板模块)
- 包含编辑器周边的控制面板组件。
- **`components/Header.tsx`**：顶部工具栏。承载了封面编辑器的标题、画布预设尺寸切换下拉菜单（Select），以及”新建/撤销/重做/导出”按钮组。导出按钮通过 `ExportModal` 提供 PNG/JPEG 导出选项。
- **`components/LeftPanel.tsx`**：左侧素材面板。使用竖向 Tab 选项卡展示”模板”、”文本”、”贴纸”、”图形”、”配色”栏目。图形 Tab 提供矩形、圆角矩形、圆形三种添加按钮。**配色 Tab（Step 16 新增）**展示 5 套主题预设的 swatch 色块、名称和描述，点击后触发 `applyTheme` 并提示用户已应用的主题名称。**模板 Tab（Step 17 新增）**：新增”保存当前为模板”按钮，弹出 Input 确认框；展示”我的模板”列表（名称+日期+加载/删除按钮）；加载自定义模板支持未保存改动确认弹窗（保存草稿后加载 / 直接加载 / 取消）；官方模板列表保持在最下方。
- **`components/RightPanel.tsx`**：右侧属性编辑面板。已与 Zustand 的 `selection` 机制完全绑定。无选中元素时展示默认的 Empty “未选中元素”提示；当有文本元素被选中时，展示完整的文本属性编辑面板（含 Step 14 高级样式控件）；当有图形元素被选中时，展示图形属性编辑面板（类型切换、填充/边框颜色拾取、边框宽度、圆角半径）。贴纸元素展示元数据信息。**Step 16 新增**：文本颜色拾取器右侧显示 WCAG 对比度徽章，实时计算文本色与画布背景色的对比比率和等级（AAA/AA/AA+/_fail），颜色对应等级。
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
  - `exportToBlob`：使用 Canvas 2D API 直接绘制所有元素（文本用 `fillText` + `strokeText` 描边，贴纸 SVG 转 Image 后 `drawImage`，图形用 `drawShapeElement`），**不使用 foreignObject**（避免 taint canvas 安全错误）。**Step 14 扩展**：文本支持 `shadowColor/shadowBlur/shadowOffsetX/shadowOffsetY` 投影、`strokeStyle/lineWidth` 描边、`letterSpacing` 字间距（Chrome 99+/FF91+）。**Step 15 扩展**：`drawShapeElement` 使用 `beginPath/rect/ellipse/arcTo` 绘制三种图形，支持 `fill`/`stroke`/`strokeWidth`，圆角矩形使用 `arcTo` 近似绘制。支持 1x/2x 缩放，JPEG 固定质量 0.92。引导线因不属于 elements 数组，天然不出现在导出结果中。
  - `downloadBlob`：触发浏览器文件下载。
- **`index.test.ts`**：导出工具的单元测试，16 个用例覆盖文件名生成、格式化、边界情况。

### 6. `storage/` (存储模块)
- 负责浏览器本地存储，使用 IndexedDB / localStorage 持久化用户草稿和自定义模板。两个功能使用独立的 IndexedDB object store 分仓存储，避免互相覆盖。
- **`draft.ts`**：`saveDraft` / `loadDraft` / `deleteDraft` 使用 IndexedDB object store `'drafts'`（key `'current-draft'`）。`saveDraft`/`loadDraft` 均包裹 try-catch，失败时返回 false/undefined 而不抛异常，保证隐私模式等恶劣环境下编辑流程不阻断。Step 17 后，草稿由 store 的 `autoSave()` 机制自动持续更新。
- **`db.ts`**（Step 17 新增）：Shared IndexedDB database singleton. 统一管理 `video-cover-db` 的 `openDB` 调用和 `upgradeneeded` 回调，在首次创建时一次性初始化 `'drafts'` 和 `'custom-templates'` 两个 object store，避免多次 `openDB` 调用导致升级回调不触发的问题。
- **`template.ts`**（Step 17 新增）：使用独立 IndexedDB object store `'custom-templates'`。`saveCustomTemplate(name, template)` 生成随机 UUID 并附加元数据（`id/name/savedAt/template`）；`loadCustomTemplates` 返回完整记录列表；`deleteCustomTemplate(id)` 按 ID 删除。
- **`preferences.ts`**（Step 17 新增）：使用 `localStorage` 存储轻量 UI 偏好（当前仅支持 `lastSize`）。`saveLastUsedSize(width, height)` 以 JSON 存于 `video-cover:prefs:lastSize`；`loadLastUsedSize()` 对格式错误和字段缺失返回 null 而不抛异常。

### 7. `themes/` (主题配色模块)
- 负责主题预设注册、WCAG 对比度计算和颜色替换映射。
- **`registry.ts`**：核心主题系统实现：
  - `ThemePreset` 接口：包含 `id`、`name`、`description`、`colors: {primary, accent, text, background}`、`swatches[]`（视觉预览色块）。
  - `THEME_PRESETS`：5 套内置主题（带货高对比、探店清新、夜景霓虹、轻奢金棕、清凉海蓝）。
  - `getRelativeLuminance(hex)`：WCAG 相对亮度计算（IEC 61966-2-1 标准公式，用于对比度计算）。
  - `getContrastRatio(foreground, background)`：对比度比值计算，公式为 `(lighter+0.05)/(darker+0.05)`，返回值范围 1~21。
  - `getContrastLevel(ratio)`：WCAG 等级判定 — ratio≥7 → AAA（绿 #52c41a），ratio≥4.5 → AA（蓝 #1890ff），ratio≥3 → AA+（橙 #fa8c16），ratio<3 → _fail（红 #ff4d4f）。
  - `buildColorReplaceMap(oldTheme, newTheme)`：将旧主题和新主题按 token key 对比，返回 `Map<oldHex, newHex>`，用于 `applyTheme` 时的批量颜色替换。
  - `buildThemeFromPreset(preset)`：将主题预设展开为扁平的 `{primary, accent, text, background}` 颜色记录。

### 8. `utils/` (工具模块)
- **`sanitize.ts`**：SVG 安全净化工具，使用 `DOMPurify` 对贴纸 SVG 源码进行 XSS 过滤。仅允许安全的 SVG 标签（`svg`, `g`, `path`, `rect`, `circle` 等）和属性（`viewBox`, `fill`, `stroke`, `d`, `transform` 等），剥离所有脚本和事件处理器。

## 根目录关键文件作用
- `vite.config.ts`：Vite 构建配置，内含 Vitest 的测试环境配置。
- `playwright.config.ts`：端到端测试框架 Playwright 的配置。
- `eslint.config.js` / `.prettierrc`：代码规范校验和格式化规则。
- `e2e/smoke.spec.ts`：E2E 端到端测试脚本。用于在真实浏览器中验证四区布局的稳定性、视口缩放表现以及画布尺寸切换下拉逻辑。
- `RELEASE.md`（Step 20 新增）：版本发布说明文档。包含核心功能状态表、技术栈版本、发布前检查清单（自动化测试、手工抽检、浏览器兼容性、导出质量、版权合规）、已知限制说明、数据存储方式以及版本历史记录。
- `src/components/ErrorBoundary.tsx`（Step 18 新增）：全局 React 错误边界组件。**`ErrorBoundary`** 类组件捕获子组件渲染过程中的未处理异常，防止白屏；针对 IndexedDB/font/canvas/template 错误提供友好提示；提供"重新加载页面"和"尝试恢复"两个降级恢复选项；开发模式下显示详细错误堆栈。**`SafeComponent`** 小型错误边界用于保护单个可能崩溃的组件，提供内联"重试"降级 UI。
- `src/App.tsx`：根组件，使用 Ant Design `<Layout>` 完成了经典的后台四区拼装。**Step 17 新增**：`useEffect` 中调用 `restoreFromDraft()` 在应用启动时从 IndexedDB 恢复最新草稿快照；`handleSetCanvasSize` 在用户显式切换画布尺寸时同步调用 `saveLastUsedSize` 将偏好写入 localStorage，供下次启动时感知（非独立恢复，仅作为草稿缺失时的尺寸回退）。**Step 18 新增**：`App` 组件改为仅做 `ErrorBoundary` 包裹层，实际业务逻辑下沉到 `AppContent` 组件；`restoreFromDraft()` 调用增加 `.catch()` 处理启动时的潜在异常。
- `src/App.test.tsx`：根组件及基础布局交互的单元与集成级测试。
- `src/setupTests.ts`：Vitest 运行前的环境初始化（除引入 `jest-dom` 中外，还注入了 `window.matchMedia` 和 `ResizeObserver` 的 mock 实现，以保证 Ant Design UI 能够脱离真实浏览器顺利在 JSDOM 环境中测试）。
