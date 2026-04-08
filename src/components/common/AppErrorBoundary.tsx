import React from 'react';

interface AppErrorBoundaryState {
    hasError: boolean;
    errorMessage: string;
}

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, AppErrorBoundaryState> {
    state: AppErrorBoundaryState = {
        hasError: false,
        errorMessage: ''
    };

    static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
        return {
            hasError: true,
            errorMessage: error.message || 'The application crashed.'
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('AppErrorBoundary caught an error', error, errorInfo);
    }

    private handleReset = () => {
        localStorage.removeItem('marine-email-drafts');
        localStorage.removeItem('marine-email-signatures');
        localStorage.removeItem('marine-email-messages');
        window.location.reload();
    };

    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#f8fafc' }}>
                <div style={{ maxWidth: 620, width: '100%', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 24, boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)' }}>
                    <h2 style={{ marginTop: 0, marginBottom: 8, color: '#991b1b' }}>The app hit a runtime error</h2>
                    <p style={{ marginTop: 0, color: '#475569' }}>
                        We can safely clear the saved email composer state and reload the app.
                    </p>
                    <div style={{ margin: '12px 0', padding: 12, borderRadius: 10, background: '#fef2f2', color: '#991b1b', fontFamily: 'monospace', fontSize: 12 }}>
                        {this.state.errorMessage}
                    </div>
                    <button
                        onClick={this.handleReset}
                        style={{ padding: '10px 14px', borderRadius: 8, border: 'none', background: '#1e3a5f', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
                    >
                        Reset Email Data And Reload
                    </button>
                </div>
            </div>
        );
    }
}
