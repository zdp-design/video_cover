import React from 'react';
import { Tabs, Button } from 'antd';
import type { TabsProps } from 'antd';
import { useEditorStore } from '../../state/store';
import { STICKER_REGISTRY } from '../../stickers/registry';

export const LeftPanel: React.FC = () => {
  const addElement = useEditorStore((state) => state.addElement);

  const handleAddMainTitle = () => {
    addElement({
      type: 'text',
      name: '文本元素',
      x: 90,
      y: 200,
      width: 900,
      height: 120,
      content: '主标题',
      fontSize: 80,
      fontWeight: 'bold',
      lineHeight: 1.2,
      textAlign: 'center',
      fill: '#000000',
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
    });
  };

  const handleAddSubtitle = () => {
    addElement({
      type: 'text',
      name: '文本元素',
      x: 90,
      y: 350,
      width: 900,
      height: 80,
      content: '副标题',
      fontSize: 40,
      fontWeight: 'normal',
      lineHeight: 1.3,
      textAlign: 'center',
      fill: '#666666',
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
    });
  };

  const handleAddSticker = (sticker: (typeof STICKER_REGISTRY)[number]) => {
    addElement({
      type: 'sticker',
      name: sticker.name,
      x: 440,
      y: 860,
      width: 200,
      height: 200,
      assetId: sticker.id,
      assetType: 'svg',
      assetSource: sticker.svgSource,
    });
  };

  const items: TabsProps['items'] = [
    {
      key: 'template',
      label: '模板',
      children: <div style={{ padding: 16 }}>模板占位</div>,
    },
    {
      key: 'text',
      label: '文本',
      children: (
        <div
          style={{
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <Button
            type="primary"
            data-testid="add-main-title-btn"
            style={{
              height: 50,
              fontSize: 18,
              fontWeight: 'bold',
              fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
            }}
            onClick={handleAddMainTitle}
          >
            添加主标题 (80px Bold)
          </Button>
          <Button
            data-testid="add-subtitle-btn"
            style={{
              height: 50,
              fontSize: 14,
              fontWeight: 'normal',
              color: '#555',
              fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
            }}
            onClick={handleAddSubtitle}
          >
            添加副标题 (40px Regular)
          </Button>
        </div>
      ),
    },
    {
      key: 'sticker',
      label: '贴纸',
      children: (
        <div
          style={{
            padding: '16px 8px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 120px)',
          }}
        >
          {STICKER_REGISTRY.map((sticker) => (
            <div
              key={sticker.id}
              data-testid={`sticker-item-${sticker.id}`}
              onClick={() => handleAddSticker(sticker)}
              style={{
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                padding: 8,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#fafafa',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#1890ff';
                e.currentTarget.style.background = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#f0f0f0';
                e.currentTarget.style.background = '#fafafa';
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 60,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                dangerouslySetInnerHTML={{ __html: sticker.svgSource }}
              />
              <span style={{ fontSize: 12, marginTop: 4, color: '#666' }}>
                {sticker.name}
              </span>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'theme',
      label: '配色',
      children: <div style={{ padding: 16 }}>配色占位</div>,
    },
  ];

  return (
    <div
      style={{
        height: '100%',
        background: '#fff',
        borderRight: '1px solid #e8e8e8',
      }}
    >
      <Tabs tabPosition="left" items={items} style={{ height: '100%' }} />
    </div>
  );
};
