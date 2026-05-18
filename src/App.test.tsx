import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import App from './App';
import { useEditorStore } from './modules/state/store';

describe('App Layout & Canvas Size & Selection', () => {
  beforeEach(() => {
    act(() => {
      useEditorStore.getState().resetStore();
    });
  });

  it('renders the 4-region layout correctly', () => {
    render(<App />);

    // Header check
    expect(screen.getByText('封面编辑器')).toBeInTheDocument();

    // Left panel check
    expect(screen.getByText('模板')).toBeInTheDocument();
    expect(screen.getByText('文本')).toBeInTheDocument();

    // Right panel check
    expect(screen.getByText('未选中元素')).toBeInTheDocument();
  });

  it('can switch canvas size', async () => {
    render(<App />);
    const board = screen.getByTestId('canvas-board');
    // Default size is 1080x1920
    expect(board.style.width).toBe('1080px');
    expect(board.style.height).toBe('1920px');

    const select = screen.getByRole('combobox');
    fireEvent.mouseDown(select);

    // Find the 1080x1080 option
    const option = await screen.findByText('1080x1080 (1:1)');
    fireEvent.click(option);

    expect(board.style.width).toBe('1080px');
    expect(board.style.height).toBe('1080px');
  });

  it('组件测试：点击空白画布后 selection 清空，右侧属性区同步显示“未选中”', () => {
    render(<App />);

    // 1. Initially it should show Empty placeholder
    expect(screen.getByText('未选中元素')).toBeInTheDocument();
    expect(screen.queryByTestId('active-element-panel')).toBeNull();

    // 2. Programmatically add and select an element using the store
    act(() => {
      useEditorStore.getState().addElement({
        type: 'text',
        content: 'Test Element Selection',
      });
    });

    // 3. Now the RightPanel should display properties of the selected element
    expect(screen.queryByText('未选中元素')).toBeNull();
    expect(screen.getByTestId('active-element-panel')).toBeInTheDocument();
    expect(screen.getByText('文本属性编辑')).toBeInTheDocument();

    // 4. Simulate clicking on the empty canvas container
    const container = screen.getByTestId('canvas-container');
    fireEvent.click(container);

    // 5. The RightPanel should rollback to displaying "未选中元素"
    expect(screen.getByText('未选中元素')).toBeInTheDocument();
    expect(screen.queryByTestId('active-element-panel')).toBeNull();
  });

  it('组件测试：修改文本内容和样式后，右侧属性值与画布展示一致', async () => {
    render(<App />);

    // 1. Click '文本' tab in LeftPanel to show text buttons
    const textTab = screen.getByText('文本');
    fireEvent.click(textTab);

    // 2. Click '添加主标题' button
    const addMainTitleBtn = await screen.findByTestId('add-main-title-btn');
    fireEvent.click(addMainTitleBtn);

    // 3. Main Title element should be added and automatically selected
    const board = screen.getByTestId('canvas-board');
    expect(board).toHaveTextContent('主标题');

    // Get the newly created element ID from state
    const elementId = useEditorStore.getState().elements[0].id;
    const innerTextDiv = screen.getByTestId('canvas-text-inner-' + elementId);

    // 4. Right panel should display "文本属性编辑"
    expect(screen.getByText('文本属性编辑')).toBeInTheDocument();

    // 5. Change content in RightPanel
    const contentInput = screen.getByTestId('text-content-input');
    fireEvent.change(contentInput, { target: { value: '我的酷炫封面' } });

    // 6. Canvas and RightPanel value should be updated and consistent
    expect(board).toHaveTextContent('我的酷炫封面');
    expect(contentInput).toHaveValue('我的酷炫封面');

    // 7. Change font size
    const fontSizeInput = screen.getByTestId('text-fontsize-input');
    fireEvent.change(fontSizeInput, { target: { value: '95' } });

    expect(innerTextDiv.style.fontSize).toBe('95px');
  });

  it('组件测试：层级调整按钮正确渲染且触发 store 重排操作', async () => {
    render(<App />);

    // 1. Add two elements
    act(() => {
      useEditorStore.getState().addElement({
        type: 'text',
        content: 'Element A',
        id: 'elA',
      });
      useEditorStore.getState().addElement({
        type: 'text',
        content: 'Element B',
        id: 'elB',
      });
    });

    // elB should be automatically selected
    expect(useEditorStore.getState().selection).toBe('elB');

    // 2. Right panel should show active element panel with Layer controls
    expect(screen.getByTestId('active-element-panel')).toBeInTheDocument();
    expect(screen.getByText('层级调整')).toBeInTheDocument();

    const toFrontBtn = screen.getByTestId('layer-to-front-btn');
    const forwardBtn = screen.getByTestId('layer-forward-btn');
    const backwardBtn = screen.getByTestId('layer-backward-btn');
    const toBackBtn = screen.getByTestId('layer-to-back-btn');

    expect(toFrontBtn).toBeInTheDocument();
    expect(forwardBtn).toBeInTheDocument();
    expect(backwardBtn).toBeInTheDocument();
    expect(toBackBtn).toBeInTheDocument();

    // Originally, array is: [elA, elB], so elB is at index 1 (top)
    // 3. Click send to back on elB
    fireEvent.click(toBackBtn);

    // Array should become: [elB, elA]
    const elements = useEditorStore.getState().elements;
    expect(elements[0].id).toBe('elB');
    expect(elements[0].zIndex).toBe(0);
    expect(elements[1].id).toBe('elA');
    expect(elements[1].zIndex).toBe(1);
  });
});
