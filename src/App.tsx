import { Layout } from 'antd';
import { Header as EditorHeader } from './modules/ui/components/Header';
import { MemoizedLeftPanel } from './modules/ui/components/LeftPanel';
import { MemoizedRightPanel } from './modules/ui/components/RightPanel';
import { CanvasArea } from './modules/canvas/components/CanvasArea';
import { useEditorStore } from './modules/state/store';
import './App.css';

const { Header, Sider, Content } = Layout;

function App() {
  const canvasSize = useEditorStore((state) => state.canvas);
  const setCanvasSize = useEditorStore((state) => state.setCanvasSize);

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
          setCanvasSize={(size) => setCanvasSize(size.width, size.height)}
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
