import React, { Component, ErrorInfo, ReactNode } from 'react';
import { withTranslation, WithTranslation } from 'next-i18next';
import Link from 'next/link';

interface Props extends WithTranslation {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo
    });
    
    // You can log the error to an error reporting service here
  }

  // Helper function to safely get translation or fallback to default text
  safeTranslate = (key: string, defaultText: string): string => {
    const { t } = this.props;
    try {
      const translation = t(key);
      // Check if the translation is the same as the key (indicating missing translation)
      return translation === key ? defaultText : translation;
    } catch (error) {
      return defaultText;
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Otherwise, render the default error UI
      return (
        <div className="min-h-[50vh] flex items-center justify-center px-4 py-16">
          <div className="max-w-lg w-full bg-white shadow-lg rounded-lg p-8">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full">
              <span className="text-3xl text-red-600" aria-hidden="true">⚠️</span>
            </div>
            
            <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
              {this.safeTranslate('errorBoundary.title', 'Something went wrong')}
            </h1>
            
            <h2 className="text-lg text-center text-gray-600 mb-6">
              {this.safeTranslate('errorBoundary.subtitle', 'We apologize for the inconvenience')}
            </h2>
            
            <p className="text-gray-600 mb-6">
              {this.safeTranslate('errorBoundary.description', "We've encountered an error processing your request")}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                aria-label={this.safeTranslate('accessibility.tryAgainButton', 'Try again')}
              >
                <span className="text-lg mr-2">🔄</span>
                {this.safeTranslate('errorBoundary.tryAgain', 'Try again')}
              </button>
              
              <Link
                href="/kontakt"
                className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                aria-label={this.safeTranslate('accessibility.contactSupportLink', 'Contact support')}
              >
                {this.safeTranslate('errorBoundary.contactSupport', 'Contact support')}
              </Link>
            </div>
            
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                {this.safeTranslate('errorBoundary.technicalDetails', 'Technical details')}
              </h3>
              
              {this.state.error && (
                <p className="text-sm text-gray-600 mb-2 font-mono bg-gray-50 p-2 rounded overflow-auto">
                  {this.state.error.toString()}
                </p>
              )}
              
              <Link
                href="/"
                className="text-sm text-primary-600 hover:text-primary-700"
                aria-label={this.safeTranslate('accessibility.returnHomeLink', 'Return to homepage')}
              >
                {this.safeTranslate('errorBoundary.returnHome', 'Return to homepage')}
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default withTranslation('common')(ErrorBoundary);
