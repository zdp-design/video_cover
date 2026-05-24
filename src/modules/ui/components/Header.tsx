import React, { useState } from 'react';
import { Button, Space, Typography, Select } from 'antd';
import {
  UndoOutlined,
  RedoOutlined,
  DownloadOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useEditorStore } from '../../state/store';
import { ExportModal } from './ExportModal';

const { Title } = Typography;

interface HeaderProps {
  canvasSize: { width: number; height: number };
  setCanvasSize: (size: { width: number; height: number }) => void;
}

const PRESETS = [
  { label: '1080x1920 (竖屏)', value: '1080x1920', width: 1080, height: 1920 },
  { label: '1080x1440 (3:4)', value: '1080x1440', width: 1080, height: 1440 },
  { label: '1080x1080 (1:1)', value: '1080x1080', width: 1080, height: 1080 },
];

export const Header: React.FC<HeaderProps> = ({
  canvasSize,
  setCanvasSize,
}) => {
  const currentValue = `${canvasSize.width}x${canvasSize.height}`;
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const past = useEditorStore((state) => state.past);
  const future = useEditorStore((state) => state.future);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const resetStore = useEditorStore((state) => state.resetStore);

  const handleChange = (value: string) => {
    const preset = PRESETS.find((p) => p.value === value);
    if (preset) {
      setCanvasSize({ width: preset.width, height: preset.height });
    }
  };

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '100%',
          padding: '0 20px',
          borderBottom: '1px solid #e8e8e8',
          background: '#fff',
        }}
      >
        <Space size="large">
          <Title level={4} style={{ margin: 0 }}>
            封面编辑器
          </Title>
          <Select
            data-testid="canvas-size-select"
            value={currentValue}
            style={{ width: 160 }}
            onChange={handleChange}
            options={PRESETS.map((p) => ({ label: p.label, value: p.value }))}
          />
        </Space>
        <Space>
          <Button
            data-testid="new-btn"
            icon={<PlusOutlined />}
            onClick={resetStore}
          >
            新建
          </Button>
          <Button
            data-testid="undo-btn"
            icon={<UndoOutlined />}
            onClick={undo}
            disabled={past.length === 0}
          >
            撤销
          </Button>
          <Button
            data-testid="redo-btn"
            icon={<RedoOutlined />}
            onClick={redo}
            disabled={future.length === 0}
          >
            重做
          </Button>
          <Button
            type="primary"
            data-testid="export-btn"
            icon={<DownloadOutlined />}
            onClick={() => setExportModalOpen(true)}
          >
            导出
          </Button>
        </Space>
      </div>
      <ExportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
      />
    </>
  );
};
