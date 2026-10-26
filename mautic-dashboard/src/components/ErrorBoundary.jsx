import { Component } from "react";

/**
 * Shows an error card instead of a blank screen when a page crashes.
 * Pass resetKey (e.g. the current path) so moving to another section
 * clears the error.
 */
export default class ErrorBoundary extends Component {
  state = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error) {
    return { error };
  }

  static getDerivedStateFromProps(props, state) {
    if (props.resetKey !== state.resetKey) return { error: null, resetKey: props.resetKey };
    return null;
  }

  componentDidCatch(error, info) {
    console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="p-6">
        <div className="card p-5 text-sm space-y-3">
          <h2 className="font-semibold text-white">This section couldn't be shown</h2>
          <p className="text-muted">{this.state.error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1.5 rounded-md bg-brand/15 text-brand font-medium hover:bg-brand/25"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}
