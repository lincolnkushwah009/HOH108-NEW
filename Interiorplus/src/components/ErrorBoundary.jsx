import { Component } from 'react'

class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo)
    }

    handleReload = () => {
        this.setState({ hasError: false, error: null })
        window.location.reload()
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', padding: '2rem' }}>
                    <div style={{ maxWidth: '420px', width: '100%', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '3rem 2rem', textAlign: 'center' }}>
                        <div style={{ width: '64px', height: '64px', margin: '0 auto 1.5rem', background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '2rem' }}>⚠️</span>
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a1a1a', marginBottom: '0.5rem' }}>Something went wrong</h2>
                        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                            An unexpected error occurred. Please try refreshing.
                        </p>
                        <button
                            onClick={this.handleReload}
                            style={{ padding: '0.75rem 2rem', fontSize: '0.875rem', fontWeight: 500, color: '#fff', background: '#edbc5c', border: 'none', borderRadius: '12px', cursor: 'pointer' }}
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
