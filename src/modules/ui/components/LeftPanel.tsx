import React, { useState, useEffect } from 'react';
import { Tabs, Button, Modal, message, Tag, Tooltip, Input } from 'antd';
import type { TabsProps } from 'antd';
import { useEditorStore } from '../../state/store';
import { STICKER_REGISTRY } from '../../stickers/registry';
import { BUILTIN_TEMPLATES } from '../../templates/builtins';
import { validateTemplateSchema } from '../../templates/schema';
import { sanitizeSvg } from '../../../utils/sanitize';
import { THEME_PRESETS } from '../../themes/registry';

export const LeftPanel: React.FC = () => {
  const addElement = useEditorStore((state) => state.addElement);
  const isDirty = useEditorStore((state) => state.isDirty);
  const applyTemplate = useEditorStore((state) => state.applyTemplate);
  const applyTheme = useEditorStore((state) => state.applyTheme);
  const saveDraftSnapshot = useEditorStore((state) => state.saveDraftSnapshot);
  const saveAsCustomTemplate = useEditorStore(
    (state) => state.saveAsCustomTemplate,
  );
  const loadCustomTemplates = useEditorStore(
    (state) => state.loadCustomTemplates,
  );
  const deleteCustomTemplateFn = useEditorStore(
    (state) => state.deleteCustomTemplate,
  );
  const theme = useEditorStore((state) => state.theme);

  const [customTemplates, setCustomTemplates] = useState<
    { id: string; name: string; savedAt: string }[]
  >([]);

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

  const handleAddShape = (shapeType: 'rect' | 'roundedRect' | 'circle') => {
    const names = {
      rect: '矩形',
      roundedRect: '圆角矩形',
      circle: '圆形',
    };
    addElement({
      type: 'shape',
      name: names[shapeType],
      x: 340,
      y: 760,
      width: 200,
      height: 200,
      shapeType,
      fill: '#e8e8e8',
      stroke: '#d9d9d9',
      strokeWidth: 1,
      cornerRadius: 12,
    });
  };

  useEffect(() => {
    loadCustomTemplates().then((templates) => {
      setCustomTemplates(
        (templates as { id: string; name: string; savedAt: string }[]).map(
          (t) => ({ id: t.id, name: t.name, savedAt: t.savedAt }),
        ),
      );
    });
  }, [loadCustomTemplates]);

  const handleApplyTheme = (themeId: string) => {
    applyTheme(themeId);
    const preset = THEME_PRESETS.find((t) => t.id === themeId);
    message.success(`已应用主题：${preset?.name}`);
  };

  const handleSaveAsTemplate = () => {
    Modal.confirm({
      title: '保存为我的模板',
      content: (
        <Input
          id="template-name-input"
          placeholder="请输入模板名称"
          maxLength={50}
        />
      ),
      okText: '保存',
      cancelText: '取消',
      onOk: async () => {
        const input = document.getElementById(
          'template-name-input',
        ) as HTMLInputElement;
        const name = input?.value?.trim();
        if (!name) {
          message.error('请输入模板名称');
          return Promise.reject();
        }
        saveDraftSnapshot();
        const saved = await saveAsCustomTemplate(name);
        if (saved) {
          message.success('已保存为模板');
          const templates = await loadCustomTemplates();
          setCustomTemplates(
            (templates as { id: string; name: string; savedAt: string }[]).map(
              (t) => ({ id: t.id, name: t.name, savedAt: t.savedAt }),
            ),
          );
        } else {
          message.error('保存模板失败');
        }
      },
    });
  };

  const handleLoadCustomTemplate = async (templateId: string) => {
    if (isDirty) {
      Modal.confirm({
        title: '检测到未保存改动',
        content: '加载模板会覆盖当前画布内容。请选择处理方式：',
        okText: '保存草稿后加载',
        cancelText: '取消',
        onOk: () => {
          saveDraftSnapshot().then(() => doLoad(templateId));
        },
        footer: (_, { OkBtn, CancelBtn }) => (
          <>
            <OkBtn />
            <Button
              data-testid="custom-template-apply-direct-btn"
              onClick={() => {
                Modal.destroyAll();
                doLoad(templateId);
              }}
            >
              直接加载
            </Button>
            <CancelBtn />
          </>
        ),
      });
    } else {
      doLoad(templateId);
    }
  };

  const doLoad = async (templateId: string) => {
    const records = (await loadCustomTemplates()) as {
      id: string;
      name: string;
      savedAt: string;
      template: unknown;
    }[];
    const record = records.find((r) => r.id === templateId);
    if (!record || !record.template) {
      message.error('模板不存在或数据损坏');
      return;
    }
    applyTemplate(record.template as Parameters<typeof applyTemplate>[0], true);
    message.success(`已加载模板：${record.name}`);
  };

  const handleDeleteCustomTemplate = (templateId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除该模板吗？',
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        const deleted = await deleteCustomTemplateFn(templateId);
        if (deleted) {
          message.success('已删除模板');
          setCustomTemplates((prev) => prev.filter((t) => t.id !== templateId));
        } else {
          message.error('删除失败');
        }
      },
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
          <Button
            data-testid="save-as-template-btn"
            onClick={handleSaveAsTemplate}
            block
          >
            保存当前为模板
          </Button>

          {customTemplates.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: '#999',
                  marginBottom: 6,
                  fontWeight: 500,
                }}
              >
                我的模板
              </div>
              {customTemplates.map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: '1px solid #f0f0f0',
                    borderRadius: 6,
                    padding: '6px 8px',
                    marginBottom: 6,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#999' }}>
                      {t.savedAt.slice(0, 10)}
                    </div>
                  </div>
                  <Button
                    size="small"
                    data-testid={`load-custom-template-${t.id}`}
                    onClick={() => handleLoadCustomTemplate(t.id)}
                    style={{ marginRight: 4 }}
                  >
                    加载
                  </Button>
                  <Button
                    size="small"
                    danger
                    data-testid={`delete-custom-template-${t.id}`}
                    onClick={() => handleDeleteCustomTemplate(t.id)}
                  >
                    删除
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              fontSize: 12,
              color: '#999',
              marginBottom: 4,
              fontWeight: 500,
            }}
          >
            官方模板
          </div>
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
      key: 'shape',
      label: '图形',
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
            data-testid="add-shape-rect-btn"
            onClick={() => handleAddShape('rect')}
            block
          >
            矩形
          </Button>
          <Button
            data-testid="add-shape-rounded-rect-btn"
            onClick={() => handleAddShape('roundedRect')}
            block
          >
            圆角矩形
          </Button>
          <Button
            data-testid="add-shape-circle-btn"
            onClick={() => handleAddShape('circle')}
            block
          >
            圆形
          </Button>
        </div>
      ),
    },
    {
      key: 'theme',
      label: '配色',
      children: (
        <div
          style={{
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 120px)',
          }}
        >
          {Object.keys(theme).length > 0 && (
            <Tag
              color="blue"
              style={{ alignSelf: 'flex-start', marginBottom: 4 }}
            >
              当前主题已激活
            </Tag>
          )}
          {THEME_PRESETS.map((preset) => (
            <div
              key={preset.id}
              data-testid={`theme-preset-${preset.id}`}
              onClick={() => handleApplyTheme(preset.id)}
              style={{
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                padding: 10,
                cursor: 'pointer',
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
              <div style={{ fontWeight: 500, marginBottom: 6, fontSize: 13 }}>
                {preset.name}
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 4,
                  marginBottom: 4,
                }}
              >
                {preset.swatches?.map((color, i) => (
                  <Tooltip key={i} title={color}>
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        background: color,
                        border: '1px solid rgba(0,0,0,0.1)',
                      }}
                    />
                  </Tooltip>
                ))}
              </div>
              <div style={{ fontSize: 11, color: '#999' }}>
                {preset.description}
              </div>
            </div>
          ))}
        </div>
      ),
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
