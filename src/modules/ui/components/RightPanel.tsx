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
  Divider,
  Tag,
} from 'antd';
import type { Color } from 'antd/es/color-picker';
import {
  VerticalAlignTopOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  VerticalAlignBottomOutlined,
  BgColorsOutlined,
} from '@ant-design/icons';
import { useEditorStore } from '../../state/store';
import type {
  TextElement,
  StickerElement,
  ShapeElement,
  BaseElement,
} from '../../state/types';
import { TEXT_STYLE_PRESETS, buildPresetUpdate } from '../../canvas/presets';
import { getContrastRatio, getContrastLevel } from '../../themes/registry';

export const RightPanel: React.FC = () => {
  const selection = useEditorStore((state) => state.selection);
  const elements = useEditorStore((state) => state.elements);
  const updateElement = useEditorStore((state) => state.updateElement);
  const canvas = useEditorStore((state) => state.canvas);

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

    const handleColorChange = (color: Color) => {
      updateElement(textEl.id, { fill: color.toHexString() });
    };

    const handleStrokeColorChange = (color: Color | null) => {
      if (color) {
        updateElement(textEl.id, { strokeColor: color.toHexString() });
      }
    };

    const handleStrokeWidthChange = (value: number | null) => {
      if (value !== null) {
        updateElement(textEl.id, { strokeWidth: value });
      }
    };

    const handleShadowColorChange = (color: Color | null) => {
      if (color) {
        updateElement(textEl.id, { shadowColor: color.toHexString() });
      }
    };

    const handleShadowBlurChange = (value: number | null) => {
      if (value !== null) {
        updateElement(textEl.id, { shadowBlur: value });
      }
    };

    const handleShadowOffsetXChange = (value: number | null) => {
      if (value !== null) {
        updateElement(textEl.id, { shadowOffsetX: value });
      }
    };

    const handleShadowOffsetYChange = (value: number | null) => {
      if (value !== null) {
        updateElement(textEl.id, { shadowOffsetY: value });
      }
    };

    const handleLetterSpacingChange = (value: number | null) => {
      if (value !== null) {
        updateElement(textEl.id, { letterSpacing: value });
      }
    };

    const handleApplyPreset = (presetId: string) => {
      const preset = TEXT_STYLE_PRESETS.find((p) => p.id === presetId);
      if (preset) {
        const updates = buildPresetUpdate(preset);
        updateElement(textEl.id, updates);
      }
    };

    const renderStrokeControls = () => (
      <div
        style={{
          border: '1px dashed #d9d9d9',
          borderRadius: 6,
          padding: 12,
          background: '#fafafa',
        }}
      >
        <div
          style={{
            marginBottom: 8,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>描边</span>
          {!textEl.strokeColor && !textEl.strokeWidth && (
            <Tag color="default" style={{ fontSize: 11 }}>
              未启用
            </Tag>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>
              描边颜色
            </div>
            <ColorPicker
              data-testid="text-stroke-color-input"
              value={textEl.strokeColor || '#ffffff'}
              onChange={handleStrokeColorChange}
              showText
              disabled={!textEl.strokeColor}
              style={{ width: '100%' }}
            />
            <Button
              data-testid="text-stroke-toggle"
              type={textEl.strokeColor ? 'primary' : 'default'}
              size="small"
              style={{ marginTop: 4, width: '100%' }}
              onClick={() => {
                if (textEl.strokeColor) {
                  updateElement(textEl.id, {
                    strokeColor: undefined,
                    strokeWidth: undefined,
                  });
                } else {
                  updateElement(textEl.id, {
                    strokeColor: '#ffffff',
                    strokeWidth: 2,
                  });
                }
              }}
            >
              {textEl.strokeColor ? '移除描边' : '启用描边'}
            </Button>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>
              描边宽度
            </div>
            <InputNumber
              data-testid="text-stroke-width-input"
              min={0.5}
              max={20}
              step={0.5}
              value={textEl.strokeWidth ?? 2}
              onChange={handleStrokeWidthChange}
              disabled={!textEl.strokeColor}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>
    );

    const renderShadowControls = () => (
      <div
        style={{
          border: '1px dashed #d9d9d9',
          borderRadius: 6,
          padding: 12,
          background: '#fafafa',
        }}
      >
        <div
          style={{
            marginBottom: 8,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>阴影</span>
          {!textEl.shadowColor && (
            <Tag color="default" style={{ fontSize: 11 }}>
              未启用
            </Tag>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>
              阴影颜色
            </div>
            <ColorPicker
              data-testid="text-shadow-color-input"
              value={textEl.shadowColor || '#000000'}
              onChange={handleShadowColorChange}
              showText
              disabled={!textEl.shadowColor}
              style={{ width: '100%' }}
            />
            <Button
              data-testid="text-shadow-toggle"
              type={textEl.shadowColor ? 'primary' : 'default'}
              size="small"
              style={{ marginTop: 4, width: '100%' }}
              onClick={() => {
                if (textEl.shadowColor) {
                  updateElement(textEl.id, {
                    shadowColor: undefined,
                    shadowBlur: undefined,
                    shadowOffsetX: undefined,
                    shadowOffsetY: undefined,
                  });
                } else {
                  updateElement(textEl.id, {
                    shadowColor: 'rgba(0,0,0,0.5)',
                    shadowBlur: 4,
                    shadowOffsetX: 2,
                    shadowOffsetY: 2,
                  });
                }
              }}
            >
              {textEl.shadowColor ? '移除阴影' : '启用阴影'}
            </Button>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>
              模糊
            </div>
            <InputNumber
              data-testid="text-shadow-blur-input"
              min={0}
              max={30}
              value={textEl.shadowBlur ?? 4}
              onChange={handleShadowBlurChange}
              disabled={!textEl.shadowColor}
              style={{ width: '100%', marginBottom: 8 }}
            />
            <div style={{ display: 'flex', gap: 4 }}>
              <InputNumber
                data-testid="text-shadow-offset-x-input"
                placeholder="X"
                min={-20}
                max={20}
                value={textEl.shadowOffsetX ?? 2}
                onChange={handleShadowOffsetXChange}
                disabled={!textEl.shadowColor}
                style={{ width: '50%' }}
              />
              <InputNumber
                data-testid="text-shadow-offset-y-input"
                placeholder="Y"
                min={-20}
                max={20}
                value={textEl.shadowOffsetY ?? 2}
                onChange={handleShadowOffsetYChange}
                disabled={!textEl.shadowColor}
                style={{ width: '50%' }}
              />
            </div>
          </div>
        </div>
      </div>
    );

    const renderLetterSpacingControl = () => (
      <div>
        <div style={{ marginBottom: 8 }}>字间距 (px)</div>
        <InputNumber
          data-testid="text-letter-spacing-input"
          min={0}
          max={50}
          value={textEl.letterSpacing ?? 0}
          onChange={handleLetterSpacingChange}
          style={{ width: '100%' }}
          placeholder="0"
        />
      </div>
    );

    return (
      <div
        data-testid="active-element-panel"
        style={{
          padding: 20,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          overflowY: 'auto',
        }}
      >
        <h3 style={{ margin: '0 0 10px 0' }}>文本属性编辑</h3>

        {/* Style Presets */}
        <div>
          <div
            style={{
              marginBottom: 8,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <BgColorsOutlined />
            <span>样式预设</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {TEXT_STYLE_PRESETS.map((preset) => (
              <Button
                key={preset.id}
                data-testid={`preset-${preset.id}`}
                size="small"
                onClick={() => handleApplyPreset(preset.id)}
              >
                {preset.name}
              </Button>
            ))}
          </div>
          {TEXT_STYLE_PRESETS.length > 0 && (
            <div style={{ marginTop: 4, fontSize: 11, color: '#999' }}>
              {TEXT_STYLE_PRESETS[0].description} ·{' '}
              {TEXT_STYLE_PRESETS[1].description} · ...
            </div>
          )}
        </div>

        <Divider style={{ margin: '8px 0' }} />

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
            value={
              textEl.fontWeight !== undefined
                ? String(textEl.fontWeight)
                : undefined
            }
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
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <ColorPicker
              data-testid="text-color-input"
              value={textEl.fill}
              onChange={handleColorChange}
              showText
            />
            {(() => {
              const ratio = getContrastRatio(
                textEl.fill,
                canvas.backgroundColor,
              );
              const level = getContrastLevel(ratio);
              return (
                <Tooltip
                  title={`对比度 ${ratio.toFixed(1)}:1，WCAG ${level.label}`}
                >
                  <Tag
                    data-testid="text-contrast-badge"
                    style={{
                      background: level.color,
                      color: '#fff',
                      border: 'none',
                    }}
                  >
                    {level.label}
                  </Tag>
                </Tooltip>
              );
            })()}
          </div>
        </div>

        <Divider style={{ margin: '8px 0' }} />

        {renderStrokeControls()}
        {renderShadowControls()}
        {renderLetterSpacingControl()}

        <Divider style={{ margin: '8px 0' }} />

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

  if (selectedElement.type === 'shape') {
    const shapeEl = selectedElement as ShapeElement;

    const handleFillChange = (color: Color | null) => {
      if (color) {
        updateElement(shapeEl.id, { fill: color.toHexString() });
      }
    };

    const handleStrokeChange = (color: Color | null) => {
      if (color) {
        updateElement(shapeEl.id, { stroke: color.toHexString() });
      }
    };

    const handleStrokeWidthChange = (value: number | null) => {
      if (value !== null) {
        updateElement(shapeEl.id, { strokeWidth: value });
      }
    };

    const handleCornerRadiusChange = (value: number | null) => {
      if (value !== null) {
        updateElement(shapeEl.id, { cornerRadius: value });
      }
    };

    const handleShapeTypeChange = (
      shapeType: 'rect' | 'roundedRect' | 'circle',
    ) => {
      updateElement(shapeEl.id, { shapeType });
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
          overflowY: 'auto',
        }}
      >
        <h3 style={{ margin: '0 0 10px 0' }}>图形属性编辑</h3>

        <div>
          <div style={{ marginBottom: 8 }}>图形类型</div>
          <Select
            data-testid="shape-type-input"
            value={shapeEl.shapeType}
            onChange={handleShapeTypeChange}
            style={{ width: '100%' }}
            options={[
              { label: '矩形', value: 'rect' },
              { label: '圆角矩形', value: 'roundedRect' },
              { label: '圆形', value: 'circle' },
            ]}
          />
        </div>

        <div>
          <div style={{ marginBottom: 8 }}>填充颜色</div>
          <ColorPicker
            data-testid="shape-fill-input"
            value={shapeEl.fill}
            onChange={handleFillChange}
            showText
          />
        </div>

        <div>
          <div style={{ marginBottom: 8 }}>边框颜色</div>
          <ColorPicker
            data-testid="shape-stroke-input"
            value={shapeEl.stroke}
            onChange={handleStrokeChange}
            showText
          />
        </div>

        <div>
          <div style={{ marginBottom: 8 }}>边框宽度 (px)</div>
          <InputNumber
            data-testid="shape-stroke-width-input"
            min={0}
            max={20}
            value={shapeEl.strokeWidth}
            onChange={handleStrokeWidthChange}
            style={{ width: '100%' }}
          />
        </div>

        {shapeEl.shapeType === 'roundedRect' && (
          <div>
            <div style={{ marginBottom: 8 }}>圆角半径 (px)</div>
            <InputNumber
              data-testid="shape-corner-radius-input"
              min={0}
              max={200}
              value={shapeEl.cornerRadius}
              onChange={handleCornerRadiusChange}
              style={{ width: '100%' }}
            />
          </div>
        )}

        <Divider style={{ margin: '8px 0' }} />

        {renderLayerControls(shapeEl.id)}
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

export const MemoizedRightPanel = React.memo(RightPanel);
