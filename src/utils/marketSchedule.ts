/**
 * Market Schedule Utility
 *
 * Rules:
 * 1. LIVE MARKET: Available Monday through Friday only.
 *    On Saturday and Sunday, LIVE MARKET is CLOSED. Signal generation disabled.
 * 2. OTC MARKET: Available all 7 days of the week (Monday through Sunday, 24/7).
 *    Works independently even when Live Market is closed.
 * Timezone: Asia/Karachi (Pakistan Time, UTC+05:00)
 */

export interface MarketScheduleResult {
  isOpen: boolean;
  statusText: 'LIVE FOREX ACTIVE' | 'LIVE MARKET CLOSED' | 'OTC 24/7 ACTIVE';
  badgeText: string;
  dayOfWeek: string;
  dateFormatted: string;
  timeFormatted: string;
  isWeekend: boolean;
  message: string | null;
}

export function getMarketSchedule(market: 'LIVE' | 'OTC', date = new Date()): MarketScheduleResult {
  const dayFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    weekday: 'long',
  });
  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const dayOfWeek = dayFormatter.format(date); // e.g. "Monday", "Saturday", "Sunday"
  const dateFormatted = dateFormatter.format(date);
  const timeFormatted = timeFormatter.format(date) + ' PKT';
  const isWeekend = dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday';

  if (market === 'OTC') {
    // OTC Market is available all 7 days of the week (24/7)
    return {
      isOpen: true,
      statusText: 'OTC 24/7 ACTIVE',
      badgeText: '7 DAYS ACTIVE',
      dayOfWeek,
      dateFormatted,
      timeFormatted,
      isWeekend,
      message: null,
    };
  }

  // LIVE Market is Monday through Friday only
  if (isWeekend) {
    return {
      isOpen: false,
      statusText: 'LIVE MARKET CLOSED',
      badgeText: 'WEEKEND CLOSED',
      dayOfWeek,
      dateFormatted,
      timeFormatted,
      isWeekend: true,
      message: 'LIVE MARKET CLOSED: Live market is available Monday through Friday only. Live market signals are disabled on Saturday and Sunday. Switch to OTC Market for 24/7 weekend educational simulation.',
    };
  }

  return {
    isOpen: true,
    statusText: 'LIVE FOREX ACTIVE',
    badgeText: 'MARKET OPEN',
    dayOfWeek,
    dateFormatted,
    timeFormatted,
    isWeekend: false,
    message: null,
  };
}
