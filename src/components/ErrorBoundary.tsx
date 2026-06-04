import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Result, Button, Typography } from 'antd';

const { Paragraph, Text } = Typography;

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * 全局错误边界组件，用于捕获子组件渲染过程中的未处理异常。
 * 异常不会导致整个应用白屏，而是显示可读的错误提示并提供恢复选项。
 *
 * 使用说明：
 * - 仅捕获子组件的渲染错误，不捕获事件处理器、异步代码的异常
 * - 错误恢复后，子组件会在下一次渲染时重新挂载
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // 将错误信息记录到控制台，方便开发者调试
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      // 获取简洁的错误信息
      const errorMessage = error?.message || '未知错误';
      const errorName = error?.name || '应用程序错误';

      // 提取关键错误类型，提供针对性的友好提示
      let friendlyMessage = '抱歉，编辑器遇到了一个问题。';
      let suggestion = '您可以尝试重新加载页面来解决这个问题。';

      if (errorMessage.includes('IndexedDB') || errorMessage.includes('idb')) {
        friendlyMessage = '本地存储服务暂时不可用。';
        suggestion =
          '请检查浏览器是否支持 IndexedDB，并确保未处于隐私浏览模式。';
      } else if (
        errorMessage.includes('font') ||
        errorMessage.includes('Font')
      ) {
        friendlyMessage = '字体加载失败。';
        suggestion = '请检查网络连接后刷新重试。';
      } else if (
        errorMessage.includes('canvas') ||
        errorMessage.includes('Canvas')
      ) {
        friendlyMessage = '画布初始化失败。';
        suggestion = '请尝试重新加载页面。';
      } else if (
        errorMessage.includes('template') ||
        errorMessage.includes('Template')
      ) {
        friendlyMessage = '模板数据加载失败。';
        suggestion = '请尝试重新加载页面或清除浏览器缓存。';
      }

      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: '#f5f5f5',
          }}
        >
          <Result
            status="error"
            title={errorName}
            subTitle={friendlyMessage}
            extra={[
              <Button key="reload" type="primary" onClick={this.handleReload}>
                重新加载页面
              </Button>,
              <Button key="reset" onClick={this.handleReset}>
                尝试恢复
              </Button>,
            ]}
          >
            <div style={{ textAlign: 'left', maxWidth: 400, margin: '0 auto' }}>
              <Paragraph>
                <Text strong>建议操作：</Text>
                <br />
                {suggestion}
              </Paragraph>
              {import.meta.env.DEV && error && (
                <>
                  <Paragraph>
                    <Text type="danger" style={{ fontSize: 12 }}>
                      {errorMessage}
                    </Text>
                  </Paragraph>
                  {errorInfo?.componentStack && (
                    <Paragraph>
                      <details style={{ whiteSpace: 'pre-wrap' }}>
                        <summary style={{ cursor: 'pointer', marginBottom: 8 }}>
                          详细信息（开发模式）
                        </summary>
                        <Text
                          type="secondary"
                          style={{ fontSize: 11, fontFamily: 'monospace' }}
                        >
                          {errorInfo.componentStack}
                        </Text>
                      </details>
                    </Paragraph>
                  )}
                </>
              )}
            </div>
          </Result>
        </div>
      );
    }

    return children;
  }
}

/**
 * 小型错误边界包装器，用于保护单个可能崩溃的组件。
 * 当受保护的组件崩溃时，显示内联的降级 UI。
 */
interface FallbackProps {
  error: Error;
  reset: () => void;
}

type FallbackComponent = (props: FallbackProps) => ReactNode;

interface SafeComponentProps {
  fallback?: FallbackComponent;
  fallbackContent?: ReactNode;
  children: ReactNode;
}

interface SafeComponentState {
  hasError: boolean;
  error: Error | null;
}

export class SafeComponent extends Component<
  SafeComponentProps,
  SafeComponentState
> {
  constructor(props: SafeComponentProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): SafeComponentState {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallbackContent) {
        return <>{this.props.fallbackContent}</>;
      }
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error!,
          reset: this.handleReset,
        });
      }
      return (
        <div
          style={{
            padding: 16,
            background: '#fff2f0',
            border: '1px solid #ffccc7',
            borderRadius: 4,
            color: '#ff4d4f',
          }}
        >
          <div style={{ marginBottom: 8 }}>组件渲染失败</div>
          <Button size="small" onClick={this.handleReset}>
            重试
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
