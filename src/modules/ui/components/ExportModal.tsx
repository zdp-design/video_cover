import React, { useState } from 'react';
import { Modal, Radio, Space, Typography, Alert, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
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
  const [retryCount, setRetryCount] = useState(0);

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
      setRetryCount(0); // Reset retry count on success
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Export failed';
      setError(errorMessage);
      setRetryCount((prev) => prev + 1);

      // 提供针对性的错误提示
      let friendlyMessage = errorMessage;
      if (errorMessage.includes('canvas')) {
        friendlyMessage = '画布初始化失败，请尝试重新导出';
      } else if (
        errorMessage.includes('font') ||
        errorMessage.includes('Font')
      ) {
        friendlyMessage = '字体加载超时，请稍后重试';
      } else if (
        errorMessage.includes('memory') ||
        errorMessage.includes('Memory')
      ) {
        friendlyMessage = '内存不足，请尝试减少画布中的元素数量';
      } else if (retryCount >= 2) {
        friendlyMessage = `多次导出失败（${retryCount}次）。建议：刷新页面后重试，或降低清晰度后导出`;
      }
      setError(friendlyMessage);
    } finally {
      setExporting(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleExport();
  };

  return (
    <Modal
      title="导出封面"
      open={open}
      onCancel={onClose}
      onOk={handleExport}
      okText={exporting ? '导出中...' : '导出'}
      confirmLoading={exporting}
      okButtonProps={{ 'data-testid': 'confirm-export-btn' }}
    >
      <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
        {error && (
          <Alert
            type="error"
            message={error}
            description={
              retryCount > 0 && retryCount < 3 ? (
                <Button
                  type="link"
                  icon={<ReloadOutlined />}
                  onClick={handleRetry}
                  loading={exporting}
                  style={{ padding: 0, height: 'auto' }}
                >
                  点击重试
                </Button>
              ) : undefined
            }
            showIcon
          />
        )}

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
