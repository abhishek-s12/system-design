import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const baseStyle =
    "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed select-none";
  
  const variants = {
    primary: "bg-[#E8E6E1] text-[#0E0F11] hover:bg-[#E8E6E1]/90 active:scale-[0.98]",
    secondary: "bg-[#17181B] text-[#E8E6E1] border border-[#8B8D93]/20 hover:border-[#8B8D93]/40 active:scale-[0.98]",
    danger: "bg-[#E85D5D]/20 text-[#E85D5D] border border-[#E85D5D]/40 hover:bg-[#E85D5D]/30 active:scale-[0.98]",
    ghost: "bg-transparent text-[#E8E6E1]/70 hover:text-[#E8E6E1] hover:bg-[#17181B] active:scale-[0.98]",
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
