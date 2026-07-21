import React from "react";

interface MetricBadgeProps {
  label: string;
  value: string | number;
  className?: string;
}

export function MetricBadge({ label, value, className = "" }: MetricBadgeProps) {
  return (
    <div className={`flex flex-col bg-[#0E0F11] border border-[#8B8D93]/10 rounded-lg px-3 py-1.5 font-mono ${className}`}>
      <span className="text-[10px] uppercase tracking-wider text-[#E8E6E1]/40">{label}</span>
      <span className="text-sm font-semibold text-[#E8E6E1] mt-0.5 select-all">{value}</span>
    </div>
  );
}
