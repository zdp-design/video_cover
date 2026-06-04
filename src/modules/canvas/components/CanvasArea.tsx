import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  memo,
} from 'react';
import { useEditorStore } from '../../state/store';
import type {
  TextElement,
  StickerElement,
  ShapeElement,
  EditorElement,
} from '../../state/types';
import { sanitizeSvg } from '../../../utils/sanitize';

interface CanvasAreaProps {
  canvasSize: { width: number; height: number };
}

const SNAP_THRESHOLD = 8; // px in canvas logical coords

interface SnapGuideLines {
  vertical: number | null; // x position of vertical guide
  horizontal: number | null; // y position of horizontal guide
  edgeLeft: boolean;
  edgeRight: boolean;
  edgeTop: boolean;
  edgeBottom: boolean;
}

// Performance: Memoized inner content renderers
const TextContent = memo<{ el: TextElement }>(({ el }) => {
  const textShadow =
    el.shadowColor && el.shadowBlur !== undefined
      ? `${el.shadowOffsetX ?? 0}px ${el.shadowOffsetY ?? 0}px ${el.shadowBlur}px ${el.shadowColor}`
      : undefined;

  const textStroke =
    el.strokeColor && el.strokeWidth !== undefined
      ? `${el.strokeWidth}px ${el.strokeColor}`
      : undefined;

  return (
    <div
      data-testid={`canvas-text-inner-${el.id}`}
      style={{
        color: el.fill,
        fontFamily: el.fontFamily,
        fontSize: `${el.fontSize}px`,
        fontWeight: el.fontWeight,
        lineHeight: el.lineHeight,
        textAlign: el.textAlign,
        width: '100%',
        wordBreak: 'break-word',
        userSelect: 'none',
        letterSpacing:
          el.letterSpacing !== undefined ? `${el.letterSpacing}px` : undefined,
        textShadow,
        WebkitTextStroke: textStroke,
      }}
    >
      {el.content}
    </div>
  );
});
TextContent.displayName = 'TextContent';

const StickerContent = memo<{ el: StickerElement }>(({ el }) => (
  <div
    data-testid={`canvas-sticker-inner-${el.id}`}
    style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      userSelect: 'none',
    }}
    dangerouslySetInnerHTML={{ __html: sanitizeSvg(el.assetSource) }}
  />
));
StickerContent.displayName = 'StickerContent';

const ShapeContent = memo<{ el: ShapeElement }>(({ el }) => (
  <div
    data-testid={`canvas-shape-inner-${el.id}`}
    style={{
      width: '100%',
      height: '100%',
      userSelect: 'none',
      borderRadius:
        el.shapeType === 'circle'
          ? '50%'
          : el.shapeType === 'roundedRect'
            ? `${el.cornerRadius}px`
            : 0,
      backgroundColor: el.fill,
      border: `${el.strokeWidth}px solid ${el.stroke}`,
      boxSizing: 'border-box',
    }}
  />
));
ShapeContent.displayName = 'ShapeContent';

// Performance: Memoized element renderer with RAF-based drag updates
interface ElementRendererProps {
  el: EditorElement;
  isSelected: boolean;
  scale: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onSelect: (id: string) => void;
  onUpdate: (
    id: string,
    updates: Partial<EditorElement>,
    skipHistory?: boolean,
  ) => void;
  computeSnap: (
    x: number,
    y: number,
    width: number,
    height: number,
  ) => { x: number; y: number; guides: SnapGuideLines };
  computeTransformUpdate: (
    action: 'drag' | 'resize' | 'rotate',
    clientX: number,
    clientY: number,
    startX: number,
    startY: number,
    startElX: number,
    startElY: number,
    startScaleX: number,
    startScaleY: number,
    startRotation: number,
    cx: number,
    cy: number,
    startDist: number,
    startAngle: number,
  ) => Partial<{
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
  }>;
  onDragStateChange: (isDragging: boolean) => void;
  onSnapGuidesChange: (guides: SnapGuideLines) => void;
  onFinalizeDrag: (id: string) => void;
}

const ElementRenderer = memo<ElementRendererProps>(
  ({
    el,
    isSelected,
    scale,
    containerRef,
    onSelect,
    onUpdate,
    computeSnap,
    computeTransformUpdate,
    onDragStateChange,
    onSnapGuidesChange,
    onFinalizeDrag,
  }) => {
    const renderInnerContent = () => {
      if (el.type === 'text') {
        return <TextContent el={el as TextElement} />;
      } else if (el.type === 'sticker') {
        return <StickerContent el={el as StickerElement} />;
      } else if (el.type === 'shape') {
        return <ShapeContent el={el as ShapeElement} />;
      }
      return null;
    };

    const handleMouseDown = useCallback(
      (e: React.MouseEvent, action: 'drag' | 'resize' | 'rotate') => {
        e.stopPropagation();
        if (el.locked) return;
        onSelect(el.id);

        const startX = e.clientX;
        const startY = e.clientY;
        const startElX = el.x;
        const startElY = el.y;
        const startScaleX = el.scaleX;
        const startScaleY = el.scaleY;
        const startRotation = el.rotation;

        const boardElement = containerRef.current?.querySelector(
          '[data-testid="canvas-board"]',
        );
        if (!boardElement) return;
        const boardRect = boardElement.getBoundingClientRect();

        const cx = boardRect.left + (el.x + el.width / 2) * scale;
        const cy = boardRect.top + (el.y + el.height / 2) * scale;

        const startDist = Math.sqrt((startX - cx) ** 2 + (startY - cy) ** 2);
        const startAngle = Math.atan2(startY - cy, startX - cx);

        // Performance: RAF-based batched updates for drag
        let rafId: number | null = null;
        let lastClientX = startX;
        let lastClientY = startY;

        if (action === 'drag') {
          onDragStateChange(true);
          onSnapGuidesChange({
            vertical: null,
            horizontal: null,
            edgeLeft: false,
            edgeRight: false,
            edgeTop: false,
            edgeBottom: false,
          });
        }

        const handleMouseMove = (moveEvent: MouseEvent) => {
          lastClientX = moveEvent.clientX;
          lastClientY = moveEvent.clientY;

          // Cancel any pending RAF
          if (rafId !== null) {
            cancelAnimationFrame(rafId);
          }

          // Batch updates via RAF to reduce re-renders during drag
          rafId = requestAnimationFrame(() => {
            rafId = null;
            if (action === 'drag') {
              const dx = (lastClientX - startX) / scale;
              const dy = (lastClientY - startY) / scale;
              const rawX = startElX + dx;
              const rawY = startElY + dy;
              const { x: snappedX, y: snappedY, guides } = computeSnap(
                rawX,
                rawY,
                el.width,
                el.height,
              );
              onSnapGuidesChange(guides);
              onUpdate(el.id, { x: snappedX, y: snappedY }, true);
            } else {
              const updates = computeTransformUpdate(
                action,
                lastClientX,
                lastClientY,
                startX,
                startY,
                startElX,
                startElY,
                startScaleX,
                startScaleY,
                startRotation,
                cx,
                cy,
                startDist,
                startAngle,
              );
              onUpdate(el.id, updates, true);
            }
          });
        };

        const handleMouseUp = (upEvent: MouseEvent) => {
          // Cancel any pending RAF
          if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }

          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);

          if (action === 'drag') {
            onDragStateChange(false);
            onSnapGuidesChange({
              vertical: null,
              horizontal: null,
              edgeLeft: false,
              edgeRight: false,
              edgeTop: false,
              edgeBottom: false,
            });
            // Finalize drag with non-transient update for history
            onFinalizeDrag(el.id);
          } else {
            const updates = computeTransformUpdate(
              action,
              upEvent.clientX,
              upEvent.clientY,
              startX,
              startY,
              startElX,
              startElY,
              startScaleX,
              startScaleY,
              startRotation,
              cx,
              cy,
              startDist,
              startAngle,
            );
            onUpdate(el.id, updates, false);
          }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
      },
      [
        el,
        scale,
        containerRef,
        onSelect,
        onUpdate,
        computeSnap,
        computeTransformUpdate,
        onDragStateChange,
        onSnapGuidesChange,
        onFinalizeDrag,
      ],
    );

    const justifyContent =
      el.type === 'text' && (el as TextElement).textAlign === 'center'
        ? 'center'
        : el.type === 'text' && (el as TextElement).textAlign === 'right'
          ? 'flex-end'
          : 'flex-start';

    return (
      <div
        key={el.id}
        data-testid={`canvas-element-${el.id}`}
        onMouseDown={(e) => handleMouseDown(e, 'drag')}
        style={{
          position: 'absolute',
          left: el.x,
          top: el.y,
          width: el.width,
          height: el.height,
          transform: `rotate(${el.rotation}deg) scale(${el.scaleX}, ${el.scaleY})`,
          opacity: el.opacity,
          visibility: el.visible ? 'visible' : 'hidden',
          cursor: el.locked ? 'not-allowed' : 'move',
          border: isSelected ? '2px dashed #1890ff' : 'none',
          boxSizing: 'border-box',
          zIndex: el.zIndex,
          display: 'flex',
          alignItems: 'center',
          justifyContent,
          pointerEvents: el.locked ? 'none' : 'auto',
        }}
      >
        {renderInnerContent()}

        {/* Selection Handles */}
        {isSelected && !el.locked && (
          <>
            {/* Corner Resize Handles */}
            <div
              data-testid={`handle-resize-tl-${el.id}`}
              onMouseDown={(e) => handleMouseDown(e, 'resize')}
              style={{
                position: 'absolute',
                left: -6,
                top: -6,
                width: 10,
                height: 10,
                background: '#fff',
                border: '1.5px solid #1890ff',
                borderRadius: '2px',
                cursor: 'nwse-resize',
                zIndex: 10,
              }}
            />
            <div
              data-testid={`handle-resize-tr-${el.id}`}
              onMouseDown={(e) => handleMouseDown(e, 'resize')}
              style={{
                position: 'absolute',
                right: -6,
                top: -6,
                width: 10,
                height: 10,
                background: '#fff',
                border: '1.5px solid #1890ff',
                borderRadius: '2px',
                cursor: 'nesw-resize',
                zIndex: 10,
              }}
            />
            <div
              data-testid={`handle-resize-bl-${el.id}`}
              onMouseDown={(e) => handleMouseDown(e, 'resize')}
              style={{
                position: 'absolute',
                left: -6,
                bottom: -6,
                width: 10,
                height: 10,
                background: '#fff',
                border: '1.5px solid #1890ff',
                borderRadius: '2px',
                cursor: 'nesw-resize',
                zIndex: 10,
              }}
            />
            <div
              data-testid={`handle-resize-br-${el.id}`}
              onMouseDown={(e) => handleMouseDown(e, 'resize')}
              style={{
                position: 'absolute',
                right: -6,
                bottom: -6,
                width: 10,
                height: 10,
                background: '#fff',
                border: '1.5px solid #1890ff',
                borderRadius: '2px',
                cursor: 'nwse-resize',
                zIndex: 10,
              }}
            />

            {/* Rotation Handle */}
            <div
              data-testid={`handle-rotate-${el.id}`}
              onMouseDown={(e) => handleMouseDown(e, 'rotate')}
              style={{
                position: 'absolute',
                left: '50%',
                top: -30,
                transform: 'translateX(-50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'grab',
                zIndex: 10,
              }}
            >
              <div style={{ width: 1.5, height: 16, background: '#1890ff' }} />
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#fff',
                  border: '1.5px solid #1890ff',
                }}
              />
            </div>
          </>
        )}
      </div>
    );
  },
);
ElementRenderer.displayName = 'ElementRenderer';

const CanvasAreaComponent: React.FC<CanvasAreaProps> = ({ canvasSize }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [snapGuides, setSnapGuides] = useState<SnapGuideLines>({
    vertical: null,
    horizontal: null,
    edgeLeft: false,
    edgeRight: false,
    edgeTop: false,
    edgeBottom: false,
  });

  // Performance: Use individual selectors to avoid unnecessary re-renders
  const elements = useEditorStore((state) => state.elements);
  const selection = useEditorStore((state) => state.selection);
  const selectElement = useEditorStore((state) => state.selectElement);
  const updateElement = useEditorStore((state) => state.updateElement);

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const padding = 40;
      const availableWidth = container.clientWidth - padding * 2;
      const availableHeight = container.clientHeight - padding * 2;

      const scaleX = availableWidth / canvasSize.width;
      const scaleY = availableHeight / canvasSize.height;
      const newScale = Math.min(scaleX, scaleY, 1);
      setScale(newScale);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [canvasSize]);

  const handleContainerClick = (e: React.MouseEvent) => {
    if (
      e.target === containerRef.current ||
      (e.target as HTMLElement).getAttribute('data-testid') === 'canvas-board'
    ) {
      selectElement(null);
    }
  };

  const computeSnap = useCallback(
    (
      x: number,
      y: number,
      width: number,
      height: number,
    ): { x: number; y: number; guides: SnapGuideLines } => {
      const { width: cw, height: ch } = canvasSize;
      const centerX = cw / 2;
      const centerY = ch / 2;

      const elLeft = x;
      const elRight = x + width;
      const elTop = y;
      const elBottom = y + height;
      const elCenterX = x + width / 2;
      const elCenterY = y + height / 2;

      let snappedX = x;
      let snappedY = y;
      const guides: SnapGuideLines = {
        vertical: null,
        horizontal: null,
        edgeLeft: false,
        edgeRight: false,
        edgeTop: false,
        edgeBottom: false,
      };

      // Threshold scales with element size (5% of smaller dimension, min 8px)
      const threshold = Math.max(
        SNAP_THRESHOLD,
        Math.min(width, height) * 0.05,
      );

      // Horizontal snap (vertical guide lines)
      if (Math.abs(elCenterX - centerX) < threshold) {
        snappedX = centerX - width / 2;
        guides.vertical = centerX;
      } else if (Math.abs(elLeft) < threshold) {
        snappedX = 0;
        guides.vertical = 0;
      } else if (Math.abs(elRight - cw) < threshold) {
        snappedX = cw - width;
        guides.vertical = cw;
      }

      // Vertical snap (horizontal guide lines)
      if (Math.abs(elCenterY - centerY) < threshold) {
        snappedY = centerY - height / 2;
        guides.horizontal = centerY;
      } else if (Math.abs(elTop) < threshold) {
        snappedY = 0;
        guides.horizontal = 0;
      } else if (Math.abs(elBottom - ch) < threshold) {
        snappedY = ch - height;
        guides.horizontal = ch;
      }

      return { x: snappedX, y: snappedY, guides };
    },
    [canvasSize],
  );

  const computeTransformUpdate = useCallback(
    (
      action: 'drag' | 'resize' | 'rotate',
      clientX: number,
      clientY: number,
      startX: number,
      startY: number,
      startElX: number,
      startElY: number,
      startScaleX: number,
      startScaleY: number,
      startRotation: number,
      cx: number,
      cy: number,
      startDist: number,
      startAngle: number,
    ): Partial<{
      x: number;
      y: number;
      scaleX: number;
      scaleY: number;
      rotation: number;
    }> => {
      if (action === 'drag') {
        const dx = (clientX - startX) / scale;
        const dy = (clientY - startY) / scale;
        return { x: startElX + dx, y: startElY + dy };
      } else if (action === 'resize') {
        const curDist = Math.sqrt((clientX - cx) ** 2 + (clientY - cy) ** 2);
        const ratio = startDist > 0 ? curDist / startDist : 1;
        const newScaleX = Math.max(0.1, startScaleX * ratio);
        const newScaleY = Math.max(0.1, startScaleY * ratio);
        return { scaleX: newScaleX, scaleY: newScaleY };
      } else {
        const angleRad = Math.atan2(clientY - cy, clientX - cx);
        const angleDiff = angleRad - startAngle;
        const angleDiffDeg = (angleDiff * 180) / Math.PI;
        let newRotation = (startRotation + angleDiffDeg) % 360;
        if (newRotation < 0) newRotation += 360;
        return { rotation: Math.round(newRotation) };
      }
    },
    [scale],
  );

  // Performance: Memoize element props to prevent unnecessary re-renders
  const elementRenderers = useMemo(() => {
    return elements.map((el) => ({
      el,
      isSelected: selection === el.id,
    }));
  }, [elements, selection]);

  const handleDragStateChange = useCallback((isDragging: boolean) => {
    setIsDragging(isDragging);
  }, []);

  const handleSnapGuidesChange = useCallback((guides: SnapGuideLines) => {
    setSnapGuides(guides);
  }, []);

  const handleFinalizeDrag = useCallback(
    (id: string) => {
      // Finalize drag with non-transient update to record position in history
      updateElement(id, {}, false);
    },
    [updateElement],
  );

  return (
    <div
      ref={containerRef}
      style={{
        height: '100%',
        background: '#f0f2f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
      data-testid="canvas-container"
      onClick={handleContainerClick}
    >
      <div
        data-testid="canvas-board"
        style={{
          position: 'relative',
          width: canvasSize.width,
          height: canvasSize.height,
          background: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          transition: 'all 0.3s',
          flexShrink: 0,
        }}
      >
        {/* Safe Area & Alignment Guide Lines — always visible */}
        <div
          data-testid="safe-area-guides"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            overflow: 'hidden',
            zIndex: 0,
          }}
        >
          {/* Center vertical line */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              width: 0,
              height: '100%',
              borderLeft: '1px dashed rgba(25, 143, 255, 0.25)',
              transform: 'translateX(-50%)',
            }}
          />
          {/* Center horizontal line */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              width: '100%',
              height: 0,
              borderTop: '1px dashed rgba(25, 143, 255, 0.25)',
              transform: 'translateY(-50%)',
            }}
          />
          {/* Edge lines — only show when dragging and element is near */}
          {isDragging && snapGuides.vertical !== null && (
            <div
              data-testid="snap-guide-vertical"
              style={{
                position: 'absolute',
                left: snapGuides.vertical,
                top: 0,
                width: 0,
                height: '100%',
                borderLeft: '1px solid rgba(25, 143, 255, 0.7)',
                transform: 'translateX(-50%)',
              }}
            />
          )}
          {isDragging && snapGuides.horizontal !== null && (
            <div
              data-testid="snap-guide-horizontal"
              style={{
                position: 'absolute',
                top: snapGuides.horizontal,
                left: 0,
                width: '100%',
                height: 0,
                borderTop: '1px solid rgba(25, 143, 255, 0.7)',
                transform: 'translateY(-50%)',
              }}
            />
          )}
        </div>

        {/* Render elements using memoized ElementRenderer */}
        {elementRenderers.map(({ el, isSelected }) => (
          <ElementRenderer
            key={el.id}
            el={el}
            isSelected={isSelected}
            scale={scale}
            containerRef={containerRef}
            onSelect={selectElement}
            onUpdate={updateElement}
            computeSnap={computeSnap}
            computeTransformUpdate={computeTransformUpdate}
            onDragStateChange={handleDragStateChange}
            onSnapGuidesChange={handleSnapGuidesChange}
            onFinalizeDrag={handleFinalizeDrag}
          />
        ))}
      </div>
    </div>
  );
};

const areEqual = (prev: CanvasAreaProps, next: CanvasAreaProps) => {
  return (
    prev.canvasSize.width === next.canvasSize.width &&
    prev.canvasSize.height === next.canvasSize.height
  );
};

export const CanvasArea = React.memo(CanvasAreaComponent, areEqual);
