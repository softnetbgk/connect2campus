import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 z-[9999] relative">
                    <div className="bg-white p-6 rounded-xl shadow-2xl max-w-lg w-full text-center border-l-8 border-red-500 overflow-hidden">
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">Application Error</h1>
                        <p className="text-gray-500 mb-4 text-sm">We encountered an unexpected issue.</p>

                        <div className="bg-slate-900 text-red-300 p-4 rounded-lg text-left text-[10px] font-mono mb-6 overflow-auto max-h-[60vh] break-words whitespace-pre-wrap shadow-inner border border-red-900/50">
                            <strong>{this.state.error && this.state.error.toString()}</strong>
                            <br /><br />
                            <span className="text-gray-500">{this.state.errorComponentStack}</span>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    localStorage.clear();
                                    sessionStorage.clear();
                                    window.location.href = '/login';
                                }}
                                className="flex-1 bg-red-100 text-red-700 px-4 py-3 rounded-lg font-bold hover:bg-red-200 transition text-sm"
                            >
                                Clear Data & Logout
                            </button>
                            <button
                                onClick={() => {
                                    this.setState({ hasError: false });
                                    window.location.reload();
                                }}
                                className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-indigo-700 transition text-sm"
                            >
                                Reload App
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
