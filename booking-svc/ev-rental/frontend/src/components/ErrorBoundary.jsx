import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { hasError: false, error: null } }
  static getDerivedStateFromError(error){ return { hasError: true, error } }
  componentDidCatch(error, info){ if (console && console.error) console.error('UI Error:', error, info); }
  render(){
    if (this.state.hasError) {
      return (
        <div className="max-padd-container py-10 text-red-700">
          <div className="font-semibold mb-2">Đã xảy ra lỗi khi hiển thị trang.</div>
          <div className="text-sm break-all">{String(this.state.error && (this.state.error.message || this.state.error))}</div>
        </div>
      );
    }
    return this.props.children;
  }
}

