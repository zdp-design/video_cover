import { chromium } from 'playwright';
import fs from 'fs';

async function debugExport() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Navigate to the app
    await page.goto('http://localhost:5174');
    await page.waitForSelector('[data-testid="canvas-board"]', { timeout: 10000 });
    console.log('Page loaded');

    // Add a main title text
    await page.locator('text=文本').first().click();
    await page.locator('[data-testid="add-main-title-btn"]').click();
    await page.waitForTimeout(500);

    // Get text element on canvas
    const textInner = page.locator('[data-testid^="canvas-text-inner-"]').first();
    const textBox = await textInner.boundingBox();
    console.log('Text element box:', textBox);

    // Get canvas board
    const board = page.locator('[data-testid="canvas-board"]');
    const boardBox = await board.boundingBox();
    console.log('Canvas board box:', boardBox);

    // Take screenshot of editor
    await page.screenshot({ path: 'editor_view.png', type: 'png' });
    console.log('Saved editor screenshot');

    // Get the store state via page.evaluate
    const storeState = await page.evaluate(() => {
      // @ts-ignore
      const store = window.__ZUSTAND_STORE__;
      // Try to get state from zustand
      const { useEditorStore } = window as any;
      if (useEditorStore) {
        return useEditorStore.getState();
      }
      return null;
    });

    if (storeState) {
      console.log('Elements:', JSON.stringify(storeState.elements, null, 2));
      console.log('Canvas config:', JSON.stringify(storeState.canvas, null, 2));
    }

    // Try to capture export via JavaScript
    const exportDataUrl = await page.evaluate(async () => {
      const { useEditorStore } = await import('./src/modules/state/store');
      const state = useEditorStore.getState();

      const { exportToBlob } = await import('./src/modules/export');

      const blob = await exportToBlob({
        canvasWidth: state.canvas.width,
        canvasHeight: state.canvas.height,
        scale: 1,
        format: 'png',
        name: state.currentTemplateName,
        backgroundColor: state.canvas.backgroundColor,
      });

      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    });

    console.log('Export data URL length:', exportDataUrl.length);

    // Save the export
    const base64Data = exportDataUrl.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync('exported_image.png', Buffer.from(base64Data, 'base64'));
    console.log('Saved exported image');

    // Also get the text element's actual rendered text
    const textContent = await textInner.textContent();
    console.log('Text content:', textContent);

    // Check element position and style via store
    const elementInfo = await page.evaluate(() => {
      // Get zustand store
      const elements = (window as any).__ZUSTAND_STORE__?.getState?.()?.elements;
      if (elements && elements.length > 0) {
        const el = elements[0];
        return {
          id: el.id,
          type: el.type,
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
          fill: el.fill,
          textAlign: el.textAlign,
          fontFamily: el.fontFamily,
          fontSize: el.fontSize,
          fontWeight: el.fontWeight,
          content: el.content,
        };
      }
      return null;
    });

    console.log('Element info from store:', elementInfo);

    console.log('\n--- Done ---');
    console.log('Check editor_view.png and exported_image.png');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

debugExport().catch(console.error);