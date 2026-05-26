import { Component, ReactNode } from 'react';
import { Button } from './ui/Button';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="h-full flex flex-col items-center justify-center bg-[var(--bg-primary)] p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">加载失败</h2>
          <p className="text-[var(--text-muted)] mb-4 text-center max-w-md">
            {this.state.error?.message || '页面加载时发生错误'}
          </p>
          <Button
            onClick={() => window.location.reload()}
          >
            重新加载页面
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
