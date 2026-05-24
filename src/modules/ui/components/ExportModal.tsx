import React, { useState } from 'react';
import { Modal, Radio, Space, Typography, Alert } from 'antd';
import { useEditorStore } from '../../state/store';
import {
  exportToBlob,
  downloadBlob,
  generateExportFilename,
  type ExportFormat,
  type ExportScale,
} from '../../export';

const { Text } = Typography;

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ open, onClose }) => {
  const [format, setFormat] = useState<ExportFormat>('png');
  const [scale, setScale] = useState<ExportScale>(1);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvas = useEditorStore((state) => state.canvas);
  const elements = useEditorStore((state) => state.elements);
  const currentTemplateName = useEditorStore(
    (state) => state.currentTemplateName,
  );

  const handleExport = async () => {
    setError(null);
    setExporting(true);

    try {
      const filename = generateExportFilename(
        currentTemplateName,
        canvas.width,
        canvas.height,
        scale,
        format,
      );

      const blob = await exportToBlob({
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        scale,
        format,
        name: currentTemplateName,
        backgroundColor: canvas.backgroundColor,
        elements,
      });

      downloadBlob(blob, filename);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Modal
      title="导出封面"
      open={open}
      onCancel={onClose}
      onOk={handleExport}
      okText="导出"
      confirmLoading={exporting}
    >
      <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
        {error && <Alert type="error" message={error} />}

        <div>
          <Text strong>格式</Text>
          <Radio.Group
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            style={{ marginLeft: 16 }}
          >
            <Radio value="png">PNG</Radio>
            <Radio value="jpeg">JPEG</Radio>
          </Radio.Group>
        </div>

        <div>
          <Text strong>清晰度</Text>
          <Radio.Group
            value={scale}
            onChange={(e) => setScale(e.target.value)}
            style={{ marginLeft: 16 }}
          >
            <Radio value={1}>
              标准 (1x, {canvas.width}x{canvas.height})
            </Radio>
            <Radio value={2}>
              高清 (2x, {canvas.width * 2}x{canvas.height * 2})
            </Radio>
          </Radio.Group>
        </div>

        <Text type="secondary" style={{ fontSize: 12 }}>
          文件名:{' '}
          {generateExportFilename(
            currentTemplateName,
            canvas.width,
            canvas.height,
            scale,
            format,
          )}
        </Text>

        {format === 'jpeg' && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            JPEG 质量固定为 0.92
          </Text>
        )}
      </Space>
    </Modal>
  );
};
