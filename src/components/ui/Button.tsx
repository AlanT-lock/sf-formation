import { type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

const variants = {
  primary: "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500",
  secondary: "bg-slate-700 text-white hover:bg-slate-600 focus:ring-slate-500",
  outline: "border-2 border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-slate-400",
  ghost: "text-slate-700 hover:bg-slate-100 focus:ring-slate-300",
  danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
};

const sizes = {
  sm: "py-1.5 px-3 text-sm rounded-md",
  md: "py-2.5 px-4 text-sm font-medium rounded-lg",
  lg: "py-3 px-6 text-base font-medium rounded-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  className = "",
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`
        inline-flex items-center justify-center transition
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      disabled={disabled}
      {...props}
    />
  );
}
