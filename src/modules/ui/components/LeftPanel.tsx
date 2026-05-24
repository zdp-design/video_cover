import React from 'react';
import { Tabs, Button, Modal, message } from 'antd';
import type { TabsProps } from 'antd';
import { useEditorStore } from '../../state/store';
import { STICKER_REGISTRY } from '../../stickers/registry';
import { BUILTIN_TEMPLATES } from '../../templates/builtins';
import { validateTemplateSchema } from '../../templates/schema';
import { sanitizeSvg } from '../../../utils/sanitize';

export const LeftPanel: React.FC = () => {
  const addElement = useEditorStore((state) => state.addElement);
  const isDirty = useEditorStore((state) => state.isDirty);
  const applyTemplate = useEditorStore((state) => state.applyTemplate);
  const saveDraftSnapshot = useEditorStore((state) => state.saveDraftSnapshot);

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

  const loadTemplate = (templateId: string) => {
    const rawTemplate = BUILTIN_TEMPLATES.find(
      (item) => item.meta.id === templateId,
    );
    if (!rawTemplate) {
      message.error('模板不存在');
      return;
    }
    const validated = validateTemplateSchema(rawTemplate);
    if (!validated) {
      message.error('模板数据校验失败');
      return;
    }
    applyTemplate(validated);
    message.success(`已套用模板：${validated.meta.name}`);
  };

  const confirmApplyTemplate = (templateId: string) => {
    if (!isDirty) {
      loadTemplate(templateId);
      return;
    }

    Modal.confirm({
      title: '检测到未保存改动',
      content: '套用模板会覆盖当前画布内容。请选择处理方式：',
      okText: '保存草稿后覆盖',
      cancelText: '取消',
      onOk: () => {
        saveDraftSnapshot();
        loadTemplate(templateId);
      },
      footer: (_, { OkBtn, CancelBtn }) => (
        <>
          <OkBtn />
          <Button
            data-testid="template-apply-direct-btn"
            onClick={() => {
              Modal.destroyAll();
              loadTemplate(templateId);
            }}
          >
            直接覆盖
          </Button>
          <CancelBtn />
        </>
      ),
    });
  };

  const items: TabsProps['items'] = [
    {
      key: 'template',
      label: '模板',
      children: (
        <div
          style={{
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {BUILTIN_TEMPLATES.map((template) => (
            <Button
              key={template.meta.id}
              data-testid={`apply-template-${template.meta.id}`}
              onClick={() => confirmApplyTemplate(template.meta.id)}
            >
              {template.meta.name}
            </Button>
          ))}
        </div>
      ),
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
                dangerouslySetInnerHTML={{
                  __html: sanitizeSvg(sticker.svgSource),
                }}
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
      children: <div style={{ padding: 16, color: '#999' }}>TODO: 配色方案功能开发中</div>,
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
      <Tabs tabPlacement="start" items={items} style={{ height: '100%' }} />
    </div>
  );
};

export const MemoizedLeftPanel = React.memo(LeftPanel);
