import React, { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '../../state/store';
import type { TextElement, StickerElement } from '../../state/types';

interface CanvasAreaProps {
  canvasSize: { width: number; height: number };
}

export const CanvasArea: React.FC<CanvasAreaProps> = ({ canvasSize }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const elements = useEditorStore((state) => state.elements);
  const selection = useEditorStore((state) => state.selection);
  const selectElement = useEditorStore((state) => state.selectElement);

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const padding = 40; // 20px padding on each side
      const availableWidth = container.clientWidth - padding * 2;
      const availableHeight = container.clientHeight - padding * 2;

      const scaleX = availableWidth / canvasSize.width;
      const scaleY = availableHeight / canvasSize.height;
      const newScale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond 1
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
        {elements.map((el) => {
          const isSelected = selection === el.id;

          const handleMouseDown = (
            e: React.MouseEvent,
            action: 'drag' | 'resize' | 'rotate',
          ) => {
            e.stopPropagation();
            if (el.locked) return;
            selectElement(el.id);

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

            const startDist = Math.sqrt(
              (startX - cx) ** 2 + (startY - cy) ** 2,
            );
            const startAngle = Math.atan2(startY - cy, startX - cx);

            const handleMouseMove = (moveEvent: MouseEvent) => {
              if (action === 'drag') {
                const dx = (moveEvent.clientX - startX) / scale;
                const dy = (moveEvent.clientY - startY) / scale;
                useEditorStore.getState().updateElement(
                  el.id,
                  {
                    x: startElX + dx,
                    y: startElY + dy,
                  },
                  true,
                );
              } else if (action === 'resize') {
                const curDist = Math.sqrt(
                  (moveEvent.clientX - cx) ** 2 + (moveEvent.clientY - cy) ** 2,
                );
                const ratio = startDist > 0 ? curDist / startDist : 1;
                const newScaleX = Math.max(0.1, startScaleX * ratio);
                const newScaleY = Math.max(0.1, startScaleY * ratio);
                useEditorStore.getState().updateElement(
                  el.id,
                  {
                    scaleX: newScaleX,
                    scaleY: newScaleY,
                  },
                  true,
                );
              } else if (action === 'rotate') {
                const angleRad = Math.atan2(
                  moveEvent.clientY - cy,
                  moveEvent.clientX - cx,
                );
                const angleDiff = angleRad - startAngle;
                const angleDiffDeg = (angleDiff * 180) / Math.PI;
                let newRotation = (startRotation + angleDiffDeg) % 360;
                if (newRotation < 0) newRotation += 360;
                useEditorStore.getState().updateElement(
                  el.id,
                  {
                    rotation: Math.round(newRotation),
                  },
                  true,
                );
              }
            };

            const handleMouseUp = (upEvent: MouseEvent) => {
              window.removeEventListener('mousemove', handleMouseMove);
              window.removeEventListener('mouseup', handleMouseUp);

              if (action === 'drag') {
                const dx = (upEvent.clientX - startX) / scale;
                const dy = (upEvent.clientY - startY) / scale;
                useEditorStore.getState().updateElement(
                  el.id,
                  {
                    x: startElX + dx,
                    y: startElY + dy,
                  },
                  false,
                );
              } else if (action === 'resize') {
                const curDist = Math.sqrt(
                  (upEvent.clientX - cx) ** 2 + (upEvent.clientY - cy) ** 2,
                );
                const ratio = startDist > 0 ? curDist / startDist : 1;
                const newScaleX = Math.max(0.1, startScaleX * ratio);
                const newScaleY = Math.max(0.1, startScaleY * ratio);
                useEditorStore.getState().updateElement(
                  el.id,
                  {
                    scaleX: newScaleX,
                    scaleY: newScaleY,
                  },
                  false,
                );
              } else if (action === 'rotate') {
                const angleRad = Math.atan2(
                  upEvent.clientY - cy,
                  upEvent.clientX - cx,
                );
                const angleDiff = angleRad - startAngle;
                const angleDiffDeg = (angleDiff * 180) / Math.PI;
                let newRotation = (startRotation + angleDiffDeg) % 360;
                if (newRotation < 0) newRotation += 360;
                useEditorStore.getState().updateElement(
                  el.id,
                  {
                    rotation: Math.round(newRotation),
                  },
                  false,
                );
              }
            };

            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
          };

          const renderInnerContent = () => {
            if (el.type === 'text') {
              const textEl = el as TextElement;
              return (
                <div
                  data-testid={`canvas-text-inner-${el.id}`}
                  style={{
                    color: textEl.fill,
                    fontFamily: textEl.fontFamily,
                    fontSize: `${textEl.fontSize}px`,
                    fontWeight: textEl.fontWeight,
                    lineHeight: textEl.lineHeight,
                    textAlign: textEl.textAlign,
                    width: '100%',
                    wordBreak: 'break-word',
                    userSelect: 'none',
                  }}
                >
                  {textEl.content}
                </div>
              );
            } else if (el.type === 'sticker') {
              const stickerEl = el as StickerElement;
              return (
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
                  dangerouslySetInnerHTML={{ __html: stickerEl.assetSource }}
                />
              );
            }
            return null;
          };

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
                justifyContent:
                  el.type === 'text' &&
                  (el as TextElement).textAlign === 'center'
                    ? 'center'
                    : el.type === 'text' &&
                        (el as TextElement).textAlign === 'right'
                      ? 'flex-end'
                      : 'flex-start',
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
                    <div
                      style={{ width: 1.5, height: 16, background: '#1890ff' }}
                    />
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
        })}
      </div>
    </div>
  );
};
