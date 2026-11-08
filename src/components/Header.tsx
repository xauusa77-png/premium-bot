import React, { useState, useEffect } from 'react';
import {
  Clock,
  Radio,
  Bell,
  Settings,
  Shield,
  Menu,
  ChevronDown,
  LogOut,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { soundService } from '../services/sound';

interface HeaderProps {
  onToggleSidebar?: () => void;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  onLogout: () => void;
  unreadCount?: number;
  connectionStatus?: string;
  isLiveMarket?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onOpenSettings,
  onOpenNotifications,
  onLogout,
  unreadCount = 0,
  connectionStatus = 'Active Connection',
  isLiveMarket = true,
}) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [pktTime, setPktTime] = useState<string>('');
  const [pktDate, setPktDate] = useState<string>('');
  const [soundOn, setSoundOn] = useState(() => soundService.isEnabled());

  // Live Pakistan Time clock (Asia/Karachi UTC+05:00)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeFmt = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Karachi',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      const dateFmt = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Karachi',
        weekday: 'short',
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      });

      setPktTime(timeFmt.format(now));
      setPktDate(dateFmt.format(now));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-[#090f1f]/95 border-b border-slate-800/80 backdrop-blur-md">
      {/* Left: Mobile Menu toggle + Logo Branding */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-blue-500 to-amber-500 flex items-center justify-center shadow-md shadow-blue-500/20">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-wider text-white">PREMIUM BOT</span>
              <span className="hidden sm:inline-block px-1.5 py-0.2 text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                SP TRADER
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
              AI Market Intelligence & Signals
            </span>
          </div>
        </div>
      </div>

      {/* Middle: Pakistan Standard Time (PKT) & Connection Status */}
      <div className="hidden lg:flex items-center gap-6">
        {/* Pakistan Time Clock */}
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-white tracking-wide tabular-nums text-xs">
                {pktTime || '00:00:00 AM'}
              </span>
              <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 px-1 py-0.5 rounded">
                PKT
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {pktDate || 'Asia/Karachi (UTC+05:00)'}
            </span>
          </div>
        </div>

        {/* Real-time Connection status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-medium text-[11px]">{connectionStatus}</span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isLiveMarket ? 'bg-emerald-400' : 'bg-blue-400'
            }`}
          />
        </div>
      </div>

      {/* Right Controls: Notifications, Settings, Profile */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Mobile PKT Time indicator */}
        <div className="lg:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-amber-400 font-bold tabular-nums">
          <Clock className="w-3 h-3" />
          <span>{pktTime.split(' ')[0]}</span>
        </div>

        {/* Sound ON/OFF Quick Toggle */}
        <button
          onClick={() => setSoundOn(soundService.toggle())}
          className={`p-2 rounded-xl border transition-all cursor-pointer ${
            soundOn
              ? 'text-amber-400 bg-amber-400/10 border-amber-400/30 hover:bg-amber-400/20'
              : 'text-slate-500 bg-slate-900/70 border-slate-800 hover:text-slate-300'
          }`}
          title={soundOn ? 'Sound Effects Enabled (Click to Mute)' : 'Sound Effects Muted (Click to Unmute)'}
        >
          {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Notification Button */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900/70 hover:bg-slate-800 border border-slate-800 transition-colors"
          title="Signal Alerts & Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-[#090f1f]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Settings Shortcut */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900/70 hover:bg-slate-800 border border-slate-800 transition-colors"
          title="Terminal Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-700 flex items-center justify-center font-bold text-[10px] text-white">
              VIP
            </div>
            <span className="hidden sm:inline text-xs font-semibold text-slate-200">Authorized</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#0c1427] border border-slate-700/80 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-slate-800 mb-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Terminal Master</span>
                  <span className="text-[10px] text-amber-400 font-mono font-semibold">PREMIUM</span>
                </div>
                <span className="text-[10px] text-slate-400">Authenticated Session</span>
              </div>

              <button
                onClick={() => {
                  setProfileOpen(false);
                  onOpenSettings();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors text-left"
              >
                <Settings className="w-3.5 h-3.5 text-blue-400" />
                <span>Security & Settings</span>
              </button>

              <button
                onClick={() => {
                  setProfileOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg transition-colors text-left"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Lock & Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
