import React from "react";

interface SliderProps {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  disabled?: boolean;
  valueDisplay?: string;
  id?: string;
}

export function Slider({
  label,
  min,
  max,
  value,
  onChange,
  step = 1,
  disabled = false,
  valueDisplay,
  id,
}: SliderProps) {
  const generatedId = id || `slider-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex justify-between items-center text-xs font-medium text-[#E8E6E1]/70">
        <label htmlFor={generatedId} className="select-none">
          {label}
        </label>
        <span className="font-mono text-[#E8E6E1]">{valueDisplay !== undefined ? valueDisplay : value}</span>
      </div>
      <input
        id={generatedId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-[#0E0F11] rounded-lg appearance-none cursor-pointer accent-[#E8E6E1] disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
}
