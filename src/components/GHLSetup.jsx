import { useState } from 'react';
import { isConfigured, saveGHLConfig, getGHLConfig, clearGHLConfig } from '../utils/ghlApi';

export default function GHLSetup({ onComplete }) {
  const [config, setConfig] = useState(getGHLConfig());
  const [mode, setMode] = useState(isConfigured() ? 'connected' : 'setup');

  const handleSave = () => {
    saveGHLConfig(config);
    setMode('connected');
    if (onComplete) onComplete();
  };

  const handleDisconnect = () => {
    clearGHLConfig();
    setConfig({ accessToken: '', refreshToken: '', locationId: '', companyId: '', apiKey: '' });
    setMode('setup');
  };

  const handleSkip = () => {
    if (onComplete) onComplete();
  };

  if (mode === 'connected') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">GoHighLevel Connected</h3>
            <p className="text-sm text-gray-500">Location ID: {config.locationId || 'Configured'}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Disconnect
          </button>
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Connect GoHighLevel</h3>
          <p className="text-sm text-gray-500">Link your sub-account to sync contacts & calendars</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">API Key or Access Token</label>
          <input
            type="password"
            value={config.accessToken || config.apiKey || ''}
            onChange={(e) => setConfig({ ...config, accessToken: e.target.value, apiKey: e.target.value })}
            placeholder="Enter your GHL API key or OAuth access token"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-gray-400">
            Found in GHL &gt; Settings &gt; Business Profile &gt; API Keys
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location ID (Sub-Account)</label>
          <input
            type="text"
            value={config.locationId || ''}
            onChange={(e) => setConfig({ ...config, locationId: e.target.value })}
            placeholder="e.g., abc123XYZ..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-gray-400">
            Found in GHL &gt; Settings &gt; Business Profile &gt; Location ID
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={!config.accessToken && !config.apiKey}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Connect Account
          </button>
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Skip for now (use offline)
          </button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">How to embed in GoHighLevel:</h4>
        <ol className="text-xs text-gray-500 space-y-1 list-decimal list-inside">
          <li>Deploy this app to a hosting provider (Netlify, Vercel, etc.)</li>
          <li>In GHL, go to Sites &gt; Custom Menu Links</li>
          <li>Add a new link with your deployed URL</li>
          <li>The app will appear in your GHL dashboard sidebar</li>
        </ol>
      </div>
    </div>
  );
}
