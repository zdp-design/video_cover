import { Layout } from 'antd';
import { useEffect } from 'react';
import { Header as EditorHeader } from './modules/ui/components/Header';
import { MemoizedLeftPanel } from './modules/ui/components/LeftPanel';
import { MemoizedRightPanel } from './modules/ui/components/RightPanel';
import { CanvasArea } from './modules/canvas/components/CanvasArea';
import { useEditorStore } from './modules/state/store';
import { saveLastUsedSize } from './modules/storage/preferences';
import { ErrorBoundary } from './components/ErrorBoundary';
import './App.css';

const { Header, Sider, Content } = Layout;

function AppContent() {
  const canvasSize = useEditorStore((state) => state.canvas);
  const restoreFromDraft = useEditorStore((state) => state.restoreFromDraft);
  const setCanvasSize = useEditorStore((state) => state.setCanvasSize);

  const handleSetCanvasSize = (size: { width: number; height: number }) => {
    setCanvasSize(size.width, size.height);
    saveLastUsedSize(size.width, size.height);
  };

  // App initialization: restore from latest draft snapshot if available.
  // Draft persistence covers canvas/theme/elements/selection, so last size
  // is already embedded. localStorage lastSize is a fallback for cases where
  // the draft doesn't exist but user previously used a non-default size.
  useEffect(() => {
    // restoreFromDraft 在内部已有 try-catch 处理，即使失败也不会阻断应用启动
    restoreFromDraft().catch((err) => {
      console.warn('草稿恢复失败，应用将以空白画布启动:', err);
    });
  }, [restoreFromDraft]);

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <Header
        style={{
          padding: 0,
          height: 60,
          lineHeight: '60px',
          background: '#fff',
        }}
      >
        <EditorHeader
          canvasSize={canvasSize}
          setCanvasSize={handleSetCanvasSize}
        />
      </Header>
      <Layout>
        <Sider width={320} theme="light">
          <MemoizedLeftPanel />
        </Sider>
        <Content>
          <CanvasArea canvasSize={canvasSize} />
        </Content>
        <Sider width={300} theme="light" style={{ background: '#fff' }}>
          <MemoizedRightPanel />
        </Sider>
      </Layout>
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;
