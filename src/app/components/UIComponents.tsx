"use client";
import React from 'react';

interface ErrorDisplayProps {
  error: string | null;
  onClose?: () => void;
}

export default function ErrorDisplay({ error, onClose }: ErrorDisplayProps) {
  if (!error) return null;

  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
      <strong className="font-bold">Error: </strong>
      <span className="block sm:inline">{error}</span>
      {onClose && (
        <button
          className="absolute top-0 bottom-0 right-0 px-4 py-3"
          onClick={onClose}
          aria-label="Close error message"
        >
          <span className="text-red-500 text-xl">&times;</span>
        </button>
      )}
    </div>
  );
}

interface LoadingIndicatorProps {
  message?: string;
}

export function LoadingIndicator({ message = "Loading..." }: LoadingIndicatorProps) {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
      <span className="text-gray-600">{message}</span>
    </div>
  );
}

interface StatusIndicatorProps {
  status: 'idle' | 'connecting' | 'connected' | 'recording' | 'processing' | 'speaking' | 'error';
  message?: string;
}

export function StatusIndicator({ status, message }: StatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'connecting':
        return { color: 'text-yellow-600', icon: '🔄', text: message || 'Connecting...' };
      case 'connected':
        return { color: 'text-green-600', icon: '✅', text: message || 'Connected' };
      case 'recording':
        return { color: 'text-red-600', icon: '🎤', text: message || 'Recording...' };
      case 'processing':
        return { color: 'text-blue-600', icon: '🧠', text: message || 'Processing...' };
      case 'speaking':
        return { color: 'text-purple-600', icon: '🔊', text: message || 'Speaking...' };
      case 'error':
        return { color: 'text-red-600', icon: '❌', text: message || 'Error' };
      default:
        return { color: 'text-gray-600', icon: '⚪', text: message || 'Idle' };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`flex items-center ${config.color} font-medium`}>
      <span className="mr-2">{config.icon}</span>
      <span>{config.text}</span>
    </div>
  );
}
