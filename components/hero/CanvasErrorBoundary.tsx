"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Called once when anything inside the WebGL subtree throws. */
  onError?: (error: Error) => void;
};

type State = { failed: boolean };

/**
 * Keeps a WebGL failure (no context, lost context, shader compile error, GLB 404)
 * from taking the whole hero down: renders nothing and reports upward so the
 * parent can keep the static PNG layer visible.
 */
export default class CanvasErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[HeroLeaves] falling back to static leaves:", error, info.componentStack);
    }
    this.props.onError?.(error);
  }

  render(): ReactNode {
    return this.state.failed ? null : this.props.children;
  }
}
