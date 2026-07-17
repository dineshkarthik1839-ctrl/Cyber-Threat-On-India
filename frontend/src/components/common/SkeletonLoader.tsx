import React from "react";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
}

export function SkeletonLoader({ width = "100%", height = 20, borderRadius = 6, style }: SkeletonProps) {
  return (
    <div
      className="skeleton"
      style={{
        width,
        height,
        borderRadius,
        ...style
      }}
    />
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div style={{ width: "100%" }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: "flex", gap: 16, padding: "14px 18px", borderBottom: "1px solid #1e2d42" }}>
          <SkeletonLoader width={60} />
          <SkeletonLoader width={120} />
          <SkeletonLoader width={180} />
          <SkeletonLoader width={100} />
          <SkeletonLoader width={80} />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="panel" style={{ padding: 20 }}>
      <SkeletonLoader width={140} height={12} style={{ marginBottom: 16 }} />
      <SkeletonLoader width="100%" height={32} style={{ marginBottom: 8 }} />
      <SkeletonLoader width="60%" height={12} />
    </div>
  );
}
