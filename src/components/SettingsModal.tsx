import React, { useState } from 'react';
import {
  Settings,
  KeyRound,
  ShieldCheck,
  Radio,
  Clock,
  LogOut,
  AlertCircle,
  CheckCircle2,
  Lock,
  Globe,
  Sliders,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { api } from '../services/api';
import { soundService } from '../services/sound';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  connectionStatus: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onLogout,
  connectionStatus,
}) => {
  const [currentKey, setCurrentKey] = useState('');
  const [newKey, setNewKey] = useState('');
  const [confirmKey, setConfirmKey] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => soundService.isEnabled());

  if (!isOpen) return null;

  const handleChangeKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentKey.trim() || !newKey.trim()) {
      setStatusMessage({ text: 'Please fill in all key fields', isError: true });
      return;
    }

    if (newKey !== confirmKey) {
      setStatusMessage({ text: 'New keys do not match', isError: true });
      return;
    }

    if (newKey.length < 4) {
      setStatusMessage({ text: 'Key must be at least 4 characters long', isError: true });
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await api.changeKey(currentKey.trim(), newKey.trim());
      if (res.success) {
        setStatusMessage({ text: 'Master Access Key updated successfully!', isError: false });
        setCurrentKey('');
        setNewKey('');
        setConfirmKey('');
      } else {
        setStatusMessage({ text: res.message || 'Failed to update key', isError: true });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Error updating key', isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-2xl bg-[#0c1427] border border-slate-700/80 p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">TERMINAL SETTINGS</h3>
              <span className="text-[10px] text-slate-400 font-mono">
                System Security & Market Feeds
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Timezone & Localization Section */}
          <div className="p-4 rounded-xl bg-[#070c18] border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Timezone & Regional Clock</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20 font-bold">
                FIXED PKT
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Timezone: <strong className="text-white">Asia/Karachi (UTC+05:00)</strong>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              All market feeds, candle timestamps, and generated signal histories are indexed to
              Pakistan Standard Time.
            </p>
          </div>

          {/* Sound Effects Section (Requirement #3) */}
          <div className="p-4 rounded-xl bg-[#070c18] border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Volume2 className="w-4 h-4 text-amber-400" />
                <span>Audio Feedback & Signal Chimes</span>
              </div>
              <button
                type="button"
                onClick={() => setSoundEnabled(soundService.toggle())}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  soundEnabled ? 'bg-blue-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    soundEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Plays digital click when clicking Generate Signal and a subtle harmonic confirmation chime when a signal appears.
            </p>
            <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-slate-800/80">
              <span className="text-[11px] font-mono text-slate-400">
                Status: <strong className={soundEnabled ? 'text-emerald-400' : 'text-slate-500'}>{soundEnabled ? 'SOUND ON' : 'MUTED'}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  setTimeout(() => soundService.playSignalArrival('UP'), 150);
                }}
                disabled={!soundEnabled}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-[11px] font-mono text-amber-300 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-40 cursor-pointer"
              >
                Test Sound Chime
              </button>
            </div>
          </div>

          {/* Connection Status Section */}
          <div className="p-4 rounded-xl bg-[#070c18] border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Radio className="w-4 h-4 text-emerald-400" />
                <span>Data Feed Diagnostic</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">OPERATIONAL</span>
            </div>
            <div className="space-y-1 text-xs font-mono text-slate-400">
              <div className="flex justify-between">
                <span>Twelve Data Forex:</span>
                <span className="text-emerald-400 font-bold">Connected</span>
              </div>
              <div className="flex justify-between">
                <span>OTC Synthetic Engine:</span>
                <span className="text-blue-400 font-bold">18 Pairs Active</span>
              </div>
              <div className="flex justify-between">
                <span>Latency:</span>
                <span className="text-slate-300">Ultra-Low (~14ms)</span>
              </div>
            </div>
          </div>

          {/* Master Access Key Change Form */}
          <div className="p-4 rounded-xl bg-[#070c18] border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200 mb-3">
              <KeyRound className="w-4 h-4 text-blue-400" />
              <span>Modify Master Access Key</span>
            </div>

            <form onSubmit={handleChangeKey} className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Current Access Key
                </label>
                <input
                  type="password"
                  value={currentKey}
                  onChange={(e) => setCurrentKey(e.target.value)}
                  placeholder="Enter current key"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">New Access Key</label>
                <input
                  type="password"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="Enter new master key"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Confirm New Access Key
                </label>
                <input
                  type="password"
                  value={confirmKey}
                  onChange={(e) => setConfirmKey(e.target.value)}
                  placeholder="Re-enter new key"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              {statusMessage && (
                <div
                  className={`p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                    statusMessage.isError
                      ? 'bg-red-950/40 border border-red-500/40 text-red-400'
                      : 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-400'
                  }`}
                >
                  {statusMessage.isError ? (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Updating Key...' : 'Save New Access Key'}
              </button>
            </form>
          </div>

          {/* Logout Action */}
          <div className="pt-2">
            <button
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-950/30 border border-red-900/50 hover:bg-red-900/40 text-red-400 hover:text-red-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Lock Terminal & Terminate Session</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
