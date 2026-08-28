"use client";
import React, { useMemo, useRef, useState, useEffect } from "react";

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export const BackgroundRippleEffect = ({
  rows = 12,
  cols = 35,
  cellSize = 56,
}: {
  rows?: number;
  cols?: number;
  cellSize?: number;
}) => {
  const [clickedCell, setClickedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [rippleKey, setRippleKey] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      
      // Calculate coordinates relative to the visible viewport
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const col = Math.floor(x / cellSize);
      const row = Math.floor(y / cellSize);
      
      console.log('Ripple Click Captured:', { clientX: e.clientX, clientY: e.clientY, rect, x, y, row, col });
      
      if (row >= 0 && row < rows && col >= 0 && col < cols) {
        setClickedCell({ row, col });
        setRippleKey((k) => k + 1);
      }
    };

    window.addEventListener("click", handleGlobalClick, { capture: true });
    return () => {
      window.removeEventListener("click", handleGlobalClick, { capture: true });
    };
  }, [rows, cols, cellSize]);

  return (
    <div
      ref={ref}
      className={cn(
        "absolute inset-0 h-full w-full pointer-events-none overflow-hidden bg-transparent",
        "[--cell-border-color:rgba(18,19,22,0.04)] [--cell-fill-color:rgba(0,212,178,0.005)]",
      )}
    >
      <div className="relative h-auto w-auto overflow-hidden">
        <DivGrid
          key={`base-${rippleKey}`}
          className="opacity-100"
          rows={rows}
          cols={cols}
          cellSize={cellSize}
          borderColor="var(--cell-border-color)"
          fillColor="var(--cell-fill-color)"
          clickedCell={clickedCell}
          rippleKey={rippleKey}
          interactive={false}
        />
      </div>
    </div>
  );
};

type DivGridProps = {
  key?: string;
  className?: string;
  rows: number;
  cols: number;
  cellSize: number; // in pixels
  borderColor: string;
  fillColor: string;
  clickedCell: { row: number; col: number } | null;
  rippleKey: number;
  onCellClick?: (row: number, col: number) => void;
  interactive?: boolean;
};

type CellStyle = React.CSSProperties & {
  ["--delay"]?: string;
  ["--duration"]?: string;
};

const DivGrid = ({
  className,
  rows = 7,
  cols = 30,
  cellSize = 56,
  borderColor = "rgba(18,19,22,0.04)",
  fillColor = "rgba(0,212,178,0.005)",
  clickedCell = null,
  rippleKey = 0,
  onCellClick = () => {},
  interactive = true,
}: DivGridProps) => {
  const cells = useMemo(
    () => Array.from({ length: rows * cols }, (_, idx) => idx),
    [rows, cols],
  );

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
    gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
    width: cols * cellSize,
    height: rows * cellSize,
    marginInline: "auto",
  };

  return (
    <div className={cn("relative z-[3]", className)} style={gridStyle}>
      {cells.map((idx) => {
        const rowIdx = Math.floor(idx / cols);
        const colIdx = idx % cols;
        const distance = clickedCell
          ? Math.hypot(clickedCell.row - rowIdx, clickedCell.col - colIdx)
          : 0;
        const delay = clickedCell ? Math.max(0, distance * 55) : 0; // ms
        const duration = 200 + distance * 80; // ms

        const style: CellStyle = clickedCell
          ? {
              "--delay": `${delay}ms`,
              "--duration": `${duration}ms`,
            }
          : {};

        const animationClass = rippleKey % 2 === 0 ? "animate-ripple-1" : "animate-ripple-2";

        return (
          <div
            key={idx}
            className={cn(
              "cell relative border-[0.5px] opacity-40 transition-opacity duration-150 will-change-transform hover:bg-[#00D4B2]/25 hover:opacity-100 cursor-pointer",
              clickedCell && animationClass,
              !interactive && "pointer-events-none",
            )}
            style={{
              backgroundColor: fillColor,
              borderColor: borderColor,
              ...style,
            }}
            onClick={
              interactive ? () => onCellClick?.(rowIdx, colIdx) : undefined
            }
          />
        );
      })}
    </div>
  );
};
