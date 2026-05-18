import { test, expect } from '@playwright/test';

test('has editor layout and handles resize', async ({ page }) => {
  await page.goto('/');

  // Verify header elements
  await expect(page.locator('text=封面编辑器')).toBeVisible();

  // Verify left panel tabs
  await expect(page.locator('text=模板').first()).toBeVisible();
  await expect(page.locator('text=文本').first()).toBeVisible();

  // Verify right panel
  await expect(page.locator('text=未选中元素')).toBeVisible();

  // Test viewport resize to check layout stability
  await page.setViewportSize({ width: 800, height: 600 });

  // Elements should still be visible and not collapse completely
  await expect(page.locator('text=封面编辑器')).toBeVisible();
  await expect(page.locator('text=模板').first()).toBeVisible();
  await expect(page.locator('text=未选中元素')).toBeVisible();
});

test('can switch canvas size', async ({ page }) => {
  await page.goto('/');

  const board = page.locator('[data-testid="canvas-board"]');

  // 1. Verify default size 1080x1920
  await expect(board).toHaveCSS('width', '1080px');
  await expect(board).toHaveCSS('height', '1920px');

  // 2. Switch to 1080x1440 (3:4)
  await page.getByRole('combobox').click();
  await page
    .locator('.ant-select-item-option-content:has-text("1080x1440 (3:4)")')
    .click();
  await expect(board).toHaveCSS('width', '1080px');
  await expect(board).toHaveCSS('height', '1440px');

  // 3. Switch to 1080x1080 (1:1)
  await page.getByRole('combobox').click();
  await page
    .locator('.ant-select-item-option-content:has-text("1080x1080 (1:1)")')
    .click();
  await expect(board).toHaveCSS('width', '1080px');
  await expect(board).toHaveCSS('height', '1080px');

  // 4. Switch back to 1080x1920 (竖屏)
  await page.getByRole('combobox').click();
  await page
    .locator('.ant-select-item-option-content:has-text("1080x1920 (竖屏)")')
    .click();
  await expect(board).toHaveCSS('width', '1080px');
  await expect(board).toHaveCSS('height', '1920px');
});

test('can add and edit text element properties', async ({ page }) => {
  await page.goto('/');

  // 1. Click '文本' tab in left panel
  await page.locator('text=文本').first().click();

  // 2. Click '添加主标题 (80px Bold)' button
  await page.locator('[data-testid="add-main-title-btn"]').click();

  // 3. Verify it is visible on canvas with default content
  const board = page.locator('[data-testid="canvas-board"]');
  await expect(board).toContainText('主标题');

  // 4. Verify right panel has changed from Empty to Active Panel
  await expect(
    page.locator('[data-testid="active-element-panel"]'),
  ).toBeVisible();

  // 5. Change content to 'E2E Title Test'
  const textarea = page.locator('[data-testid="text-content-input"]');
  await textarea.fill('E2E Title Test');

  // 6. Verify canvas is updated
  await expect(board).toContainText('E2E Title Test');

  // 7. Change font size to '90'
  const fontSizeInput = page.locator('[data-testid="text-fontsize-input"]');
  await fontSizeInput.fill('90');

  // 8. Verify the updated style is correctly applied to the text element
  const textInner = board.locator('[data-testid^="canvas-text-inner-"]');
  await expect(textInner).toHaveCSS('font-size', '90px');
});

test('can drag, resize, and rotate elements in canvas', async ({ page }) => {
  await page.goto('/');

  // 1. Click '文本' tab and add a main title
  await page.locator('text=文本').first().click();
  await page.locator('[data-testid="add-main-title-btn"]').click();

  const board = page.locator('[data-testid="canvas-board"]');
  const elementId = await board
    .locator('[data-testid^="canvas-element-"]')
    .getAttribute('data-testid');
  const elId = elementId?.replace('canvas-element-', '') || '';
  const element = board.locator(`[data-testid="canvas-element-${elId}"]`);

  // Verify default position
  await expect(element).toHaveCSS('left', '90px');
  await expect(element).toHaveCSS('top', '200px');

  // --- Test Dragging ---
  const elBox = await element.boundingBox();
  expect(elBox).not.toBeNull();
  if (elBox) {
    // Click center and drag
    const startX = elBox.x + elBox.width / 2;
    const startY = elBox.y + elBox.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 100, startY + 50);
    await page.mouse.up();

    // Re-select element to ensure handles are active in case selection blurs on drag-end click leak
    await element.click();

    // Verify position changed
    const newBox = await element.boundingBox();
    expect(newBox).not.toBeNull();
    if (newBox) {
      expect(newBox.x).toBeGreaterThan(elBox.x + 20);
      expect(newBox.y).toBeGreaterThan(elBox.y + 10);
    }
  }

  // --- Test Resizing ---
  const freshBox = await element.boundingBox();
  expect(freshBox).not.toBeNull();
  if (freshBox) {
    const handleBr = element.locator(
      `[data-testid="handle-resize-br-${elId}"]`,
    );
    // Wait for the resize handle to be visible
    await expect(handleBr).toBeVisible();
    const handleBox = await handleBr.boundingBox();
    expect(handleBox).not.toBeNull();
    if (handleBox) {
      const startX = handleBox.x + handleBox.width / 2;
      const startY = handleBox.y + handleBox.height / 2;

      await page.mouse.move(startX, startY);
      await page.mouse.down();
      // Drag diagonally away to scale up
      await page.mouse.move(startX + 50, startY + 50);
      await page.mouse.up();

      // Re-select element to keep handles active
      await element.click();

      // Verify scale has changed in transform style
      const transform = await element.evaluate(
        (el) => window.getComputedStyle(el).transform,
      );
      expect(transform).not.toBe('none');
    }
  }

  // --- Test Rotating ---
  const handleRotate = element.locator(`[data-testid="handle-rotate-${elId}"]`);
  // Wait for the rotate handle to be visible
  await expect(handleRotate).toBeVisible();
  const rotateBox = await handleRotate.boundingBox();
  expect(rotateBox).not.toBeNull();
  if (rotateBox) {
    const startX = rotateBox.x + rotateBox.width / 2;
    const startY = rotateBox.y + rotateBox.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    // Drag horizontally to rotate
    await page.mouse.move(startX + 60, startY + 20);
    await page.mouse.up();

    // Verify transform contains rotation matrix values
    const transform = await element.evaluate(
      (el) => window.getComputedStyle(el).transform,
    );
    expect(transform).not.toBe('none');
  }
});

test('can add, drag, resize and render sticker elements offline', async ({
  page,
  context,
}) => {
  await page.goto('/');

  // 1. Click '贴纸' tab in left panel
  await page.locator('text=贴纸').first().click();

  // 2. Add '价格标签 1' sticker
  const stickerItem = page.locator('[data-testid="sticker-item-price_tag_1"]');
  await expect(stickerItem).toBeVisible();
  await stickerItem.click();

  // 3. Verify it is added to the canvas
  const board = page.locator('[data-testid="canvas-board"]');
  const elementId = await board
    .locator('[data-testid^="canvas-element-"]')
    .getAttribute('data-testid');
  const elId = elementId?.replace('canvas-element-', '') || '';
  const element = board.locator(`[data-testid="canvas-element-${elId}"]`);

  // Verify the inner sticker container rendering the SVG is visible
  const innerSticker = element.locator(
    `[data-testid="canvas-sticker-inner-${elId}"]`,
  );
  await expect(innerSticker).toBeVisible();

  // 4. Test Offline Rendering: Set network to offline and reload or verify
  // Since the asset is fully embedded in local JS, we disconnect the browser from network
  await context.setOffline(true);

  // Verify it still renders perfectly because SVG source is 100% offline
  await expect(innerSticker).toBeVisible();

  // Re-enable online to prevent impacting other tests
  await context.setOffline(false);

  // 5. Test Dragging Sticker
  const elBox = await element.boundingBox();
  expect(elBox).not.toBeNull();
  if (elBox) {
    const startX = elBox.x + elBox.width / 2;
    const startY = elBox.y + elBox.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 120, startY + 60);
    await page.mouse.up();

    // Re-select element to keep handles active
    await element.click();

    // Verify position has changed
    const newBox = await element.boundingBox();
    expect(newBox).not.toBeNull();
    if (newBox) {
      expect(newBox.x).toBeGreaterThan(elBox.x + 20);
      expect(newBox.y).toBeGreaterThan(elBox.y + 10);
    }
  }

  // 6. Test Resizing Sticker (Uniform Aspect-Ratio Scaling)
  const freshBox = await element.boundingBox();
  expect(freshBox).not.toBeNull();
  if (freshBox) {
    const handleBr = element.locator(
      `[data-testid="handle-resize-br-${elId}"]`,
    );
    await expect(handleBr).toBeVisible();

    const handleBox = await handleBr.boundingBox();
    expect(handleBox).not.toBeNull();
    if (handleBox) {
      const startX = handleBox.x + handleBox.width / 2;
      const startY = handleBox.y + handleBox.height / 2;

      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX + 40, startY + 40);
      await page.mouse.up();

      // Verify scale has changed in transform style
      const transform = await element.evaluate(
        (el) => window.getComputedStyle(el).transform,
      );
      expect(transform).not.toBe('none');
    }
  }
});

test('can adjust element layers in editor', async ({ page }) => {
  await page.goto('/');

  // 1. Click '文本' tab and add two titles
  await page.locator('text=文本').first().click();
  await page.locator('[data-testid="add-main-title-btn"]').click();

  // Wait for the first element to render
  const board = page.locator('[data-testid="canvas-board"]');
  const firstElement = board
    .locator('[data-testid^="canvas-element-"]')
    .first();
  await expect(firstElement).toBeVisible();

  // Click again to add the second element
  await page.locator('[data-testid="add-main-title-btn"]').click();

  // Now we should have 2 elements
  const elements = board.locator('[data-testid^="canvas-element-"]');
  await expect(elements).toHaveCount(2);

  // Retrieve the actual dynamic IDs to locate elements uniquely, independent of DOM order
  const id0 = await elements.nth(0).getAttribute('data-testid');
  const id1 = await elements.nth(1).getAttribute('data-testid');
  expect(id0).not.toBeNull();
  expect(id1).not.toBeNull();

  const elementA = board.locator(`[data-testid="${id0}"]`);
  const elementB = board.locator(`[data-testid="${id1}"]`);

  // By default, the first element (elementA) has zIndex 0, second (elementB) has zIndex 1
  await expect(elementA).toHaveCSS('z-index', '0');
  await expect(elementB).toHaveCSS('z-index', '1');

  // The active element in RightPanel should be the newly added second element (elementB)
  // Let's click the '置底' (Send to Back) button in the right panel
  const sendToBackBtn = page.locator('[data-testid="layer-to-back-btn"]');
  await expect(sendToBackBtn).toBeVisible();
  await sendToBackBtn.click();

  // After Send to Back, their z-indices should swap!
  // elementB is now at the bottom, so its zIndex style should be 0.
  // elementA is now at the top, so its zIndex style should be 1.
  await expect(elementB).toHaveCSS('z-index', '0');
  await expect(elementA).toHaveCSS('z-index', '1');
});

test('can use undo, redo, and new functionalities in the editor', async ({
  page,
}) => {
  await page.goto('/');

  // 1. Locate the Undo, Redo, and New buttons in the header
  const undoBtn = page.locator('[data-testid="undo-btn"]');
  const redoBtn = page.locator('[data-testid="redo-btn"]');
  const newBtn = page.locator('[data-testid="new-btn"]');

  // 2. Initially, undo & redo should be disabled
  await expect(undoBtn).toBeDisabled();
  await expect(redoBtn).toBeDisabled();

  // 3. Add a text element
  await page.locator('text=文本').first().click();
  await page.locator('[data-testid="add-main-title-btn"]').click();

  const board = page.locator('[data-testid="canvas-board"]');
  await expect(board).toContainText('主标题');

  // 4. After adding, Undo should be enabled, Redo should be disabled
  await expect(undoBtn).toBeEnabled();
  await expect(redoBtn).toBeDisabled();

  // 5. Change text content
  const textarea = page.locator('[data-testid="text-content-input"]');
  await textarea.fill('E2E Undo Test');
  await expect(board).toContainText('E2E Undo Test');

  // 6. Click Undo -> Text content should revert to \'主标题\'
  await undoBtn.click();
  await expect(board).toContainText('主标题');
  await expect(undoBtn).toBeEnabled();
  await expect(redoBtn).toBeEnabled();

  // 7. Click Undo again -> Text element should be removed from board completely
  await undoBtn.click();
  await expect(board).not.toContainText('主标题');
  await expect(undoBtn).toBeDisabled();
  await expect(redoBtn).toBeEnabled();

  // 8. Click Redo -> Text element is restored with default text \'主标题\'
  await redoBtn.click();
  await expect(board).toContainText('主标题');
  await expect(undoBtn).toBeEnabled();
  await expect(redoBtn).toBeEnabled();

  // 9. Click Redo again -> Text content is restored to \'E2E Undo Test\'
  await redoBtn.click();
  await expect(board).toContainText('E2E Undo Test');
  await expect(undoBtn).toBeEnabled();
  await expect(redoBtn).toBeDisabled();

  // 10. Click New button -> The entire workspace should be cleared
  await newBtn.click();
  await expect(board).not.toContainText('E2E Undo Test');
  await expect(undoBtn).toBeDisabled();
  await expect(redoBtn).toBeDisabled();
});
