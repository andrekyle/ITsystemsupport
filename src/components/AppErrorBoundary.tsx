import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  failed: boolean;
}

/** Last-resort startup guard: a render error should never leave a blank app. */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ITSS Learn could not render", error, info);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <div className="gate">
        <div className="gate-card" style={{ textAlign: "center" }}>
          <h1>Let's get you back in</h1>
          <p className="sub">
            The app could not open this screen. Your saved work is still safe.
          </p>
          <button className="btn block" type="button" onClick={() => window.location.reload()}>
            Reload the app
          </button>
        </div>
      </div>
    );
  }
}
