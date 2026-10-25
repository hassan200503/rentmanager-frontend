import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "light" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

interface CommonProps {
    variant?: Variant;
    size?: Size;
    fullWidth?: boolean;
    className?: string;
    children: ReactNode;
}

type ButtonAsLinkProps = CommonProps & {
    href: string;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className" | "children">;

type ButtonAsButtonProps = CommonProps & {
    href?: never;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

export type ButtonProps = ButtonAsLinkProps | ButtonAsButtonProps;

const variantClasses: Record<Variant, string> = {
    primary:
        "bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/25 border border-emerald-500/30",
    light: "bg-white text-[#030712] hover:bg-white/90 shadow-2xl border border-white/20",
    outline:
        "bg-transparent text-white/80 border border-white/15 hover:border-emerald-500/40 hover:text-emerald-300 hover:bg-emerald-500/5",
    ghost: "bg-white/[0.04] text-white/80 border border-white/10 hover:bg-white/[0.08] hover:text-white",
};

const sizeClasses: Record<Size, string> = {
    sm: "px-4 py-2 text-xs min-h-10",
    md: "px-5 py-2.5 text-sm min-h-11",
    lg: "px-7 py-3.5 text-[15px] min-h-12",
};

function buildClasses(variant: Variant, size: Size, fullWidth: boolean, className: string) {
    return [
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold select-none",
        "transition-all duration-200 active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030712]",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? "w-full" : "",
        className,
    ].join(" ");
}

function LinkButton({
    variant = "primary",
    size = "md",
    fullWidth = false,
    className = "",
    href,
    children,
    ...rest
}: ButtonAsLinkProps) {
    return (
        <Link href={href} className={buildClasses(variant, size, fullWidth, className)} {...rest}>
            {children}
        </Link>
    );
}

function ElementButton({
    variant = "primary",
    size = "md",
    fullWidth = false,
    className = "",
    children,
    ...rest
}: ButtonAsButtonProps) {
    return (
        <button type="button" className={buildClasses(variant, size, fullWidth, className)} {...rest}>
            {children}
        </button>
    );
}

export function Button(props: ButtonProps) {
    if (props.href !== undefined) {
        return <LinkButton {...props} />;
    }
    return <ElementButton {...props as ButtonAsButtonProps} />;
}