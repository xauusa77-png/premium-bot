import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ArrowRight, AlertCircle, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { soundService } from '../services/sound';

interface AccessKeyModalProps {
  onSuccess: () => void;
}

export const AccessKeyModal: React.FC<AccessKeyModalProps> = ({ onSuccess }) => {
  const [accessKey, setAccessKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessKey.trim()) {
      setErrorMessage('Please enter your password');
      return;
    }

    soundService.playClick();
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await api.unlock(accessKey.trim());
      if (response.success) {
        soundService.playSignalArrival('UP');
        onSuccess();
      } else {
        setErrorMessage(response.message || 'INVALID PASSWORD');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'INVALID PASSWORD');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050811] px-4 overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[320px] bg-gradient-to-tr from-blue-600/15 via-blue-500/10 to-amber-500/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm rounded-2xl bg-[#0c1427]/95 border border-slate-800/80 shadow-2xl backdrop-blur-xl p-7 md:p-8 overflow-hidden"
      >
        {/* Top subtle highlight */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-amber-400" />

        {/* Brand Header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-900 border border-blue-400/30 shadow-lg shadow-blue-950/50 mb-3.5 relative group">
            <Shield className="w-7 h-7 text-amber-400" />
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-500 to-amber-500 opacity-20 blur group-hover:opacity-40 transition-opacity" />
          </div>

          <h1 className="text-xl font-extrabold tracking-wider text-white">PREMIUM BOT</h1>
          <p className="text-[11px] text-slate-400 font-mono mt-1">
            Institutional Trading Terminal
          </p>
        </div>

        {/* Simple Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4 text-blue-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={accessKey}
                onChange={(e) => {
                  setAccessKey(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Enter password"
                autoFocus
                disabled={loading}
                className="w-full pl-10 pr-11 py-3 bg-[#070d1c] border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-950/50 border border-red-500/40 text-red-400 text-xs font-semibold"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Premium LOGIN Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full relative group overflow-hidden py-3 px-4 rounded-xl font-bold text-xs tracking-wider uppercase text-white bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] transition-all shadow-lg shadow-blue-600/30 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 border border-blue-400/20"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>LOGGING IN...</span>
              </div>
            ) : (
              <>
                <span>LOGIN</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center text-[10px] text-slate-500 font-mono">
          Terminal Authorization · Asia/Karachi (UTC+05:00)
        </div>
      </motion.div>
    </div>
  );
};
