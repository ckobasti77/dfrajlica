import type { ComponentPropsWithoutRef, ReactNode } from "react";

type ContainerTag = "div" | "section" | "header" | "footer" | "nav" | "article";

type ContainerProps = ComponentPropsWithoutRef<"div"> & {
  as?: ContainerTag;
  children: ReactNode;
};

/** max-width 1200px + fluid inline padding (see .container-x in globals.css) */
export default function Container({ as: Tag = "div", className = "", children, ...rest }: ContainerProps) {
  return (
    <Tag className={`container-x ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  );
}
