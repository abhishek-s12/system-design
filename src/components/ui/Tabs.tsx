import React from "react";

interface TabItem {
  id: string;
  label: React.ReactNode;
}

interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ items, activeId, onChange, className = "" }: TabsProps) {
  return (
    <div className={`flex bg-[#0E0F11] border border-[#8B8D93]/10 rounded-lg p-1 ${className}`}>
      {items.map((item) => {
        const isActive = activeId === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 select-none ${
              isActive
                ? "bg-[#17181B] text-[#E8E6E1] border border-[#8B8D93]/10 shadow"
                : "text-[#E8E6E1]/50 hover:text-[#E8E6E1]/80"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
