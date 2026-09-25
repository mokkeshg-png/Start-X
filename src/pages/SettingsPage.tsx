import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Settings, Palette, Sun, Moon, Check, Database, Trash2 } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export const SettingsPage: React.FC = () => {
  const { brandingConfig, setBrandingConfig, theme, setTheme, showToast, resetData } = useApp();

  const [collegeName, setCollegeName] = useState(brandingConfig.collegeName);
  const [platformName, setPlatformName] = useState(brandingConfig.platformName);
  const [logoText, setLogoText] = useState(brandingConfig.logoText);

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    setBrandingConfig({
      ...brandingConfig,
      collegeName,
      platformName,
      logoText
    });
    showToast("Branding Updated", "Global college branding tokens modified successfully.", "success");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-500" /> Platform & Institutional Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Customize college branding tokens, platform appearance, and runtime data controls.
        </p>
      </div>

      {/* Prototype Data Control Section */}
      <Card variant="ai" className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-indigo-200 dark:border-indigo-900 pb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-500" /> Runtime Data Storage
          </h3>
          <Badge variant="ai">Zero-Mock Architecture</Badge>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          The system stores user-created entities in local storage. You can purge all business records back to a zero-data empty state.
        </p>

        <div className="flex flex-wrap gap-3 pt-1 text-xs">
          <Button
            variant="danger"
            size="sm"
            onClick={resetData}
            icon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Reset to Empty System (Purge All Records)
          </Button>
        </div>
      </Card>

      {/* College Branding Token Customization */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Palette className="w-4 h-4 text-indigo-500" /> Configurable College Identity Tokens
          </h3>
          <Badge variant="purple">Design System</Badge>
        </div>

        <form onSubmit={handleSaveBranding} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">College Name [COLLEGE_NAME]</label>
              <input
                type="text"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Platform Name [PLATFORM_NAME]</label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Logo Emblem Text</label>
              <input
                type="text"
                value={logoText}
                onChange={(e) => setLogoText(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <Button type="submit" variant="primary" size="sm" icon={<Check className="w-3.5 h-3.5" />}>
            Save Branding Configuration
          </Button>
        </form>
      </Card>

      {/* Appearance Settings */}
      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Theme & Appearance</h3>
        <div className="flex gap-4 text-xs">
          <button
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border flex flex-col items-center gap-2 flex-1 ${
              theme === 'light' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold' : 'bg-slate-50 dark:bg-slate-800'
            }`}
          >
            <Sun className="w-6 h-6" /> Light Theme
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border flex flex-col items-center gap-2 flex-1 ${
              theme === 'dark' ? 'bg-indigo-950 border-indigo-500 text-indigo-300 font-bold' : 'bg-slate-50 dark:bg-slate-800'
            }`}
          >
            <Moon className="w-6 h-6" /> Dark Theme
          </button>
        </div>
      </Card>
    </div>
  );
};
