import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "white" | "whiteOutline";
export type ButtonSize = "sm" | "md" | "lg";

type Base = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  block?: boolean;
};

type AnchorProps = Base & Omit<ComponentPropsWithoutRef<"a">, keyof Base> & { href: string };
type NativeButtonProps = Base & Omit<ComponentPropsWithoutRef<"button">, keyof Base> & { href?: undefined };

export type ButtonProps = AnchorProps | NativeButtonProps;

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-plum-500 text-white shadow-plum hover:bg-plum-700 active:bg-plum-700",
  secondary:
    "bg-white text-plum-700 border border-plum-500 hover:bg-plum-100 active:bg-plum-100",
  ghost: "bg-transparent text-plum-700 hover:bg-plum-100",
  white: "bg-white text-plum-700 shadow-plum-lg hover:bg-plum-100",
  whiteOutline:
    "bg-transparent text-white border border-white/70 hover:bg-white/10 hover:border-white",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-[15px] gap-2",
  md: "h-12 px-6 text-[16px] gap-2.5",
  lg: "h-14 px-8 text-[17px] gap-3",
};

export function buttonClass({
  variant = "primary",
  size = "md",
  block = false,
  className = "",
}: Pick<Base, "variant" | "size" | "block" | "className">) {
  return [
    "inline-flex items-center justify-center rounded-pill font-semibold whitespace-nowrap select-none",
    "transition-[background-color,color,border-color,transform,box-shadow] duration-250 ease-out",
    "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-plum-500",
    "disabled:opacity-60 disabled:pointer-events-none",
    variants[variant],
    sizes[size],
    block ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export default function Button(props: ButtonProps) {
  const { variant, size, className, children, iconLeft, iconRight, block, ...rest } = props;
  const cls = buttonClass({ variant, size, block, className });
  const inner = (
    <>
      {iconLeft ? <span className="shrink-0 -ml-1">{iconLeft}</span> : null}
      <span>{children}</span>
      {iconRight ? <span className="shrink-0 -mr-1">{iconRight}</span> : null}
    </>
  );

  if ("href" in rest && typeof rest.href === "string") {
    const anchorRest = rest as Omit<AnchorProps, keyof Base>;
    return (
      <a className={cls} {...anchorRest}>
        {inner}
      </a>
    );
  }

  const buttonRest = rest as Omit<NativeButtonProps, keyof Base>;
  return (
    <button type={buttonRest.type ?? "button"} className={cls} {...buttonRest}>
      {inner}
    </button>
  );
}
