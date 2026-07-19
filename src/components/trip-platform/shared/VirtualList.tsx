import { useMemo, useState, type ReactNode } from 'react';
import { computeVirtualWindow } from '../../../finalisation/performance';

export function VirtualList<T>({
  items,
  itemHeight,
  height,
  renderItem,
  getKey,
  ariaLabel,
}: {
  items: T[];
  itemHeight: number;
  height: number;
  renderItem: (item: T, index: number) => ReactNode;
  getKey: (item: T, index: number) => string;
  ariaLabel: string;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const window = useMemo(
    () =>
      computeVirtualWindow({
        scrollTop,
        viewportHeight: height,
        itemCount: items.length,
        itemHeight,
      }),
    [scrollTop, height, items.length, itemHeight],
  );

  const visible = items.slice(window.startIndex, window.endIndex);

  return (
    <div
      role="list"
      aria-label={ariaLabel}
      className="overflow-auto rounded-xl border border-white/10"
      style={{ height }}
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
    >
      <div style={{ height: window.totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${window.offsetY}px)` }}>
          {visible.map((item, offset) => {
            const index = window.startIndex + offset;
            return (
              <div role="listitem" key={getKey(item, index)} style={{ height: itemHeight }}>
                {renderItem(item, index)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
