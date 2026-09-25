import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { CommandPalette } from '../command/CommandPalette';
import { ToastContainer } from '../common/ToastContainer';
import { AIAssistantWidget } from '../ai/AIAssistantWidget';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {children}
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette />

      {/* Floating AI Assistant Widget */}
      <AIAssistantWidget />

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
};
