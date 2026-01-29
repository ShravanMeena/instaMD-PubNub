import React from 'react';
import { Button } from "@/components/ui/button";
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service like Sentry
    console.error("Uncaught Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-background p-4 text-center">
          <div className="bg-destructive/10 p-6 rounded-full mb-6">
             <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-muted-foreground max-w-md mb-6">
            We encountered an unexpected error. Our team has been notified.
            <br />
            <span className="text-xs opacity-50 font-mono mt-2 block">{this.state.error?.toString()}</span>
          </p>
          <div className="flex gap-4">
            <Button onClick={() => window.location.reload()} variant="default">
              Reload Application
            </Button>
            <Button onClick={() => window.location.href = '/'} variant="outline">
              Go Home
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
