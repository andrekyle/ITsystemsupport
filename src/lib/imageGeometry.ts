export type ResizeCorner = "nw" | "ne" | "sw" | "se";

export interface ImageRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Pure CSS-pixel geometry used by the lesson image pointer editor. */
export function resizeImageRect(start: ImageRect, dx: number, dy: number, corner: ResizeCorner, cropped: boolean, maxWidth: number): ImageRect {
  const horizontalDirection = corner.endsWith("e") ? 1 : -1;
  const verticalDirection = corner.startsWith("s") ? 1 : -1;
  const requestedWidth = start.width + dx * horizontalDirection;
  const requestedHeight = start.height + dy * verticalDirection;
  let width: number;
  let height: number;
  if (cropped) {
    width = Math.max(80, Math.min(maxWidth, requestedWidth));
    height = Math.max(80, Math.min(900, requestedHeight));
  } else {
    const widthScale = requestedWidth / start.width;
    const heightScale = requestedHeight / start.height;
    const scale = Math.abs(widthScale - 1) >= Math.abs(heightScale - 1) ? widthScale : heightScale;
    const boundedScale = Math.max(80 / start.width, Math.min(maxWidth / start.width, scale));
    width = start.width * boundedScale;
    height = start.height * boundedScale;
  }
  return {
    left: corner.endsWith("e") ? start.left : start.left + start.width - width,
    top: corner.startsWith("s") ? start.top : start.top + start.height - height,
    width,
    height,
  };
}

export function draggedImageOrigin(pointerX: number, pointerY: number, grabX: number, grabY: number) {
  return { left: pointerX - grabX, top: pointerY - grabY };
}
