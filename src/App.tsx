import { Layout } from 'antd';
import { useEffect } from 'react';
import { Header as EditorHeader } from './modules/ui/components/Header';
import { MemoizedLeftPanel } from './modules/ui/components/LeftPanel';
import { MemoizedRightPanel } from './modules/ui/components/RightPanel';
import { CanvasArea } from './modules/canvas/components/CanvasArea';
import { useEditorStore } from './modules/state/store';
import {
  loadLastUsedSize,
  saveLastUsedSize,
} from './modules/storage/preferences';
import './App.css';

const { Header, Sider, Content } = Layout;

function App() {
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
    restoreFromDraft();
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

export default App;
