import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Globe,
  Zap,
  History,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers,
} from 'lucide-react';

export type NavigationTab =
  | 'dashboard'
  | 'live-market'
  | 'otc-market'
  | 'signal-generator'
  | 'signal-history'
  | 'market-analysis'
  | 'settings';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  onLogout,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavigationTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: 'PRO',
      badgeColor: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    },
    {
      id: 'live-market' as NavigationTab,
      label: 'Live Market',
      icon: TrendingUp,
      badge: '18 Pairs',
      badgeColor: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    },
    {
      id: 'otc-market' as NavigationTab,
      label: 'OTC Market',
      icon: Globe,
      badge: '18 Pairs',
      badgeColor: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    },
    {
      id: 'signal-generator' as NavigationTab,
      label: 'AI Signal Generator',
      icon: Zap,
      badge: 'AI Engine',
      badgeColor: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    },
    {
      id: 'signal-history' as NavigationTab,
      label: 'Signal History',
      icon: History,
    },
    {
      id: 'market-analysis' as NavigationTab,
      label: 'Market Analysis',
      icon: BarChart3,
    },
    {
      id: 'settings' as NavigationTab,
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <aside
      className={`relative flex flex-col justify-between bg-[#080d1c] border-r border-slate-800/80 transition-all duration-300 z-20 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Branding Section */}
      <div>
        <div className="flex items-center justify-between p-4 border-b border-slate-800/80 h-16">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-amber-500 flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/40 border border-blue-400/30">
              <Shield className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-sm tracking-wider text-white truncate">
                  PREMIUM BOT
                </span>
                <span className="text-[10px] text-amber-400/90 font-mono font-semibold tracking-wider">
                  SP TRADER ULTIMATE
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1.5 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/25 to-blue-500/10 text-white border border-blue-500/30 shadow-md shadow-blue-900/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                {/* Active side indicator glow */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-blue-400 to-amber-400 rounded-r" />
                )}

                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />

                {!collapsed && (
                  <div className="flex items-center justify-between w-full min-w-0">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${item.badgeColor}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Market Quick Switcher & Logout */}
      <div className="p-3 border-t border-slate-800/80 space-y-2">
        {!collapsed && (
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>Market Feed</span>
              </span>
              <span className="text-emerald-400 font-bold font-mono text-[10px]">CONNECTED</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">36 Pairs Online</p>
          </div>
        )}

        <button
          onClick={onLogout}
          title={collapsed ? 'Logout' : undefined}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/30 border border-transparent hover:border-red-900/40 transition-all group cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0 group-hover:-translate-x-0.5 transition-transform" />
          {!collapsed && <span>Logout Terminal</span>}
        </button>
      </div>
    </aside>
  );
};
