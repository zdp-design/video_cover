import React from 'react';
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useEditorStore } from './store';
import { STICKER_REGISTRY } from '../stickers/registry';
import { LeftPanel } from '../ui/components/LeftPanel';
import type { StickerElement } from './types';

// Mock matchMedia for Antd Tabs inside LeftPanel
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe('Step 7 Stickers Tests', () => {
  beforeEach(() => {
    useEditorStore.getState().resetStore();
  });

  it('单测：贴纸元数据注册表中至少 6 条且分类完整', () => {
    expect(STICKER_REGISTRY.length).toBeGreaterThanOrEqual(6);

    const categories = STICKER_REGISTRY.map((s) => s.category);
    expect(categories).toContain('价格标签');
    expect(categories).toContain('箭头');
    expect(categories).toContain('星标');
    expect(categories).toContain('推荐章');
  });

  it('单测：贴纸元素创建后 assetId/assetType/assetSource 三字段完整可用', () => {
    const store = useEditorStore.getState();
    const mockSticker = STICKER_REGISTRY[0];

    store.addElement({
      type: 'sticker',
      name: mockSticker.name,
      assetId: mockSticker.id,
      assetType: 'svg',
      assetSource: mockSticker.svgSource,
    });

    const elements = useEditorStore.getState().elements;
    expect(elements).toHaveLength(1);

    const createdSticker = elements[0] as StickerElement;
    expect(createdSticker.type).toBe('sticker');
    expect(createdSticker.assetId).toBe(mockSticker.id);
    expect(createdSticker.assetType).toBe('svg');
    expect(createdSticker.assetSource).toBe(mockSticker.svgSource);
    expect(createdSticker.width).toBe(100); // Base default width
    expect(createdSticker.height).toBe(100); // Base default height
  });

  it('组件测试：贴纸面板渲染正确，点击可添加', () => {
    render(<LeftPanel />);

    // 1. Find and click "贴纸" Tab to render stickers
    const tabSticker = screen.getByText('贴纸');
    expect(tabSticker).toBeInTheDocument();
    fireEvent.click(tabSticker);

    // 2. Verify all 6 stickers are rendered by their testid or text
    STICKER_REGISTRY.forEach((sticker) => {
      const stickerItem = screen.getByTestId(`sticker-item-${sticker.id}`);
      expect(stickerItem).toBeInTheDocument();
      expect(screen.getByText(sticker.name)).toBeInTheDocument();
    });

    // 3. Click one sticker and verify it gets added to the store elements!
    const targetSticker = STICKER_REGISTRY[2]; // Arrow 1
    const arrowItem = screen.getByTestId(`sticker-item-${targetSticker.id}`);
    fireEvent.click(arrowItem);

    const storeElements = useEditorStore.getState().elements;
    expect(storeElements).toHaveLength(1);
    expect(storeElements[0].type).toBe('sticker');
    expect((storeElements[0] as StickerElement).assetId).toBe(targetSticker.id);
  });
});
