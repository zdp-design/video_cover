import React from 'react';
import {
  Empty,
  Input,
  InputNumber,
  Select,
  Radio,
  ColorPicker,
  Button,
  Tooltip,
  Space,
} from 'antd';
import {
  VerticalAlignTopOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  VerticalAlignBottomOutlined,
} from '@ant-design/icons';
import { useEditorStore } from '../../state/store';
import type { TextElement, StickerElement, BaseElement } from '../../state/types';

export const RightPanel: React.FC = () => {
  const selection = useEditorStore((state) => state.selection);
  const elements = useEditorStore((state) => state.elements);
  const updateElement = useEditorStore((state) => state.updateElement);

  const selectedElement = elements.find((el) => el.id === selection);

  const bringToFront = useEditorStore((state) => state.bringToFront);
  const bringForward = useEditorStore((state) => state.bringForward);
  const sendBackward = useEditorStore((state) => state.sendBackward);
  const sendToBack = useEditorStore((state) => state.sendToBack);

  const renderLayerControls = (id: string) => (
    <div style={{ marginTop: 8 }}>
      <div style={{ marginBottom: 8, fontWeight: 500 }}>层级调整</div>
      <Space.Compact style={{ width: '100%' }}>
        <Tooltip title="置顶">
          <Button
            data-testid="layer-to-front-btn"
            style={{ width: '25%' }}
            icon={<VerticalAlignTopOutlined />}
            onClick={() => bringToFront(id)}
          />
        </Tooltip>
        <Tooltip title="上移">
          <Button
            data-testid="layer-forward-btn"
            style={{ width: '25%' }}
            icon={<ArrowUpOutlined />}
            onClick={() => bringForward(id)}
          />
        </Tooltip>
        <Tooltip title="下移">
          <Button
            data-testid="layer-backward-btn"
            style={{ width: '25%' }}
            icon={<ArrowDownOutlined />}
            onClick={() => sendBackward(id)}
          />
        </Tooltip>
        <Tooltip title="置底">
          <Button
            data-testid="layer-to-back-btn"
            style={{ width: '25%' }}
            icon={<VerticalAlignBottomOutlined />}
            onClick={() => sendToBack(id)}
          />
        </Tooltip>
      </Space.Compact>
    </div>
  );

  if (!selectedElement) {
    return (
      <div
        style={{
          height: '100%',
          background: '#fff',
          borderLeft: '1px solid #e8e8e8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Empty description="未选中元素" />
      </div>
    );
  }

  if (selectedElement.type === 'text') {
    const textEl = selectedElement as TextElement;

    const handleContentChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      updateElement(textEl.id, { content: e.target.value });
    };

    const handleFontSizeChange = (value: number | null) => {
      if (value !== null) {
        updateElement(textEl.id, { fontSize: value });
      }
    };

    const handleFontWeightChange = (value: string) => {
      updateElement(textEl.id, { fontWeight: value });
    };

    const handleTextAlignChange = (e: import('antd').RadioChangeEvent) => {
      updateElement(textEl.id, { textAlign: e.target.value });
    };

    const handleColorChange = (color: { toHexString: () => string }) => {
      updateElement(textEl.id, { fill: color.toHexString() });
    };

    return (
      <div
        data-testid="active-element-panel"
        style={{
          padding: 20,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <h3 style={{ margin: '0 0 10px 0' }}>文本属性编辑</h3>

        <div>
          <div style={{ marginBottom: 8 }}>文本内容</div>
          <Input.TextArea
            data-testid="text-content-input"
            value={textEl.content}
            onChange={handleContentChange}
            rows={3}
          />
        </div>

        <div>
          <div style={{ marginBottom: 8 }}>字号 (px)</div>
          <InputNumber
            data-testid="text-fontsize-input"
            min={12}
            max={200}
            value={textEl.fontSize}
            onChange={handleFontSizeChange}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <div style={{ marginBottom: 8 }}>字重</div>
          <Select
            data-testid="text-fontweight-input"
            value={textEl.fontWeight !== undefined ? String(textEl.fontWeight) : undefined}
            onChange={handleFontWeightChange}
            style={{ width: '100%' }}
            options={[
              { label: '常规 (Normal)', value: 'normal' },
              { label: '加粗 (Bold)', value: 'bold' },
              { label: '极细 (100)', value: '100' },
              { label: '偏粗 (500)', value: '500' },
              { label: '极粗 (900)', value: '900' },
            ]}
          />
        </div>

        <div>
          <div style={{ marginBottom: 8 }}>对齐方式</div>
          <Radio.Group
            data-testid="text-align-input"
            value={textEl.textAlign}
            onChange={handleTextAlignChange}
            style={{ width: '100%' }}
            buttonStyle="solid"
          >
            <Radio.Button
              value="left"
              style={{ width: '33.33%', textAlign: 'center' }}
            >
              左对齐
            </Radio.Button>
            <Radio.Button
              value="center"
              style={{ width: '33.33%', textAlign: 'center' }}
            >
              居中
            </Radio.Button>
            <Radio.Button
              value="right"
              style={{ width: '33.33%', textAlign: 'center' }}
            >
              右对齐
            </Radio.Button>
          </Radio.Group>
        </div>

        <div>
          <div style={{ marginBottom: 8 }}>文本颜色</div>
          <ColorPicker
            data-testid="text-color-input"
            value={textEl.fill}
            onChange={handleColorChange}
            showText
          />
        </div>

        {renderLayerControls(textEl.id)}
      </div>
    );
  }

  if (selectedElement.type === 'sticker') {
    const stickerEl = selectedElement as StickerElement;
    return (
      <div
        data-testid="active-element-panel"
        style={{
          padding: 20,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <h3 style={{ margin: '0 0 10px 0' }}>贴纸属性编辑</h3>
        <div>
          <div style={{ marginBottom: 4, color: '#666' }}>贴纸名称</div>
          <Input value={stickerEl.name} disabled />
        </div>
        <div>
          <div style={{ marginBottom: 4, color: '#666' }}>资产ID</div>
          <Input value={stickerEl.assetId} disabled />
        </div>
        <div>
          <div style={{ marginBottom: 4, color: '#666' }}>资产类型</div>
          <Input value={stickerEl.assetType} disabled />
        </div>

        {renderLayerControls(stickerEl.id)}
      </div>
    );
  }

  const element = selectedElement as BaseElement;
  return (
    <div style={{ padding: 20 }}>
      <h3>元素属性</h3>
      <p>名称: {element.name}</p>
      <p>类型: {element.type}</p>
      {renderLayerControls(element.id)}
    </div>
  );
};
