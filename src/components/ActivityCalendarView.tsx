// @smartlot/component
import React, { useState, useMemo } from 'react';
import { ResidentRequest } from '../store/smartLotStore';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Wrench, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Vote, 
  Sparkles, 
  Building2, 
  Layers, 
  ArrowRight,
  ShieldAlert,
  Search,
  Check,
  CalendarDays,
  Tag
} from 'lucide-react';

export type CalendarZoomLevel = '1m' | '3m' | '6m' | '12m';

interface ActivityCalendarViewProps {
  requests: ResidentRequest[];
  onSelectRequest: (request: ResidentRequest) => void;
  activePersonaRole: string;
  activeSchemeName?: string;
}

// Robust helper to parse requests' created_at / dueDate into a valid JS Date
function parseRequestDate(dateStr?: string): Date {
  if (!dateStr) return new Date();

  // Handle relative strings
  const lower = dateStr.toLowerCase();
  const now = new Date();
  if (lower.includes('today') || lower.includes('hour') || lower.includes('min') || lower.includes('just now')) {
    return now;
  }
  if (lower.includes('yesterday')) {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return d;
  }
  if (lower.includes('day ago') || lower.includes('days ago')) {
    const match = lower.match(/(\d+)\s*days?\s*ago/);
    const count = match ? parseInt(match[1], 10) : 1;
    const d = new Date(now);
    d.setDate(d.getDate() - count);
    return d;
  }

  // Handle formats like "10 Sep 2026" or "10 Sep" or "2026-09-10"
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    // If year is missing (e.g. "10 Sep"), set to current year 2026
    if (parsed.getFullYear() < 2000) {
      parsed.setFullYear(2026);
    }
    return parsed;
  }

  // Fallback: match "10 Sep" with regex
  const parts = dateStr.match(/(\d{1,2})\s+([A-Za-z]{3})(?:\s+(\d{4}))?/);
  if (parts) {
    const day = parseInt(parts[1], 10);
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthIdx = monthNames.indexOf(parts[2].toLowerCase());
    const year = parts[3] ? parseInt(parts[3], 10) : 2026;
    if (monthIdx !== -1) {
      return new Date(year, monthIdx, day);
    }
  }

  return now;
}

export function ActivityCalendarView({
  requests,
  onSelectRequest,
  activePersonaRole,
  activeSchemeName
}: ActivityCalendarViewProps) {
  // Calendar View Controls
  const [zoomLevel, setZoomLevel] = useState<CalendarZoomLevel>('1m');
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 8, 12)); // Default to Sept 2026 (local context)
  const [filterMaintenanceOnly, setFilterMaintenanceOnly] = useState<'all' | 'maintenance' | 'urgent' | 'voting'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'done' | 'pending'>('all');
  const [calendarSearch, setCalendarSearch] = useState('');

  // Selected Day drill-down modal / popover in 1M view
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ date: Date; items: ResidentRequest[] } | null>(null);

  // Period Navigation Helpers
  const handlePrevPeriod = () => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      if (zoomLevel === '1m') next.setMonth(next.getMonth() - 1);
      else if (zoomLevel === '3m') next.setMonth(next.getMonth() - 3);
      else if (zoomLevel === '6m') next.setMonth(next.getMonth() - 6);
      else if (zoomLevel === '12m') next.setFullYear(next.getFullYear() - 1);
      return next;
    });
  };

  const handleNextPeriod = () => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      if (zoomLevel === '1m') next.setMonth(next.getMonth() + 1);
      else if (zoomLevel === '3m') next.setMonth(next.getMonth() + 3);
      else if (zoomLevel === '6m') next.setMonth(next.getMonth() + 6);
      else if (zoomLevel === '12m') next.setFullYear(next.getFullYear() + 1);
      return next;
    });
  };

  const handleJumpToday = () => {
    setCurrentDate(new Date(2026, 8, 12));
  };

  // Header Title based on Zoom Level
  const periodTitle = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthName = currentDate.toLocaleDateString('en-AU', { month: 'long' });

    if (zoomLevel === '1m') {
      return `${monthName} ${year}`;
    }
    if (zoomLevel === '3m') {
      const quarter = Math.floor(month / 3) + 1;
      const qStartMonth = new Date(year, (quarter - 1) * 3, 1).toLocaleDateString('en-AU', { month: 'short' });
      const qEndMonth = new Date(year, quarter * 3 - 1, 1).toLocaleDateString('en-AU', { month: 'short' });
      return `Q${quarter} ${year} (${qStartMonth} – ${qEndMonth})`;
    }
    if (zoomLevel === '6m') {
      const half = month < 6 ? 'H1 (Jan – Jun)' : 'H2 (Jul – Dec)';
      return `${half} ${year}`;
    }
    return `Annual Calendar ${year} (12 Months)`;
  }, [currentDate, zoomLevel]);

  // Request categorization & filtering
  const filteredActivities = useMemo(() => {
    return requests.filter(req => {
      // 1. Maintenance & Category Filter
      if (filterMaintenanceOnly === 'maintenance') {
        const isMaint = 
          req.stream === 'common_area_repair' || 
          req.stream === 'maintenance_upgrade' ||
          (req.requestType && req.requestType.toLowerCase().includes('repair')) ||
          (req.requestType && req.requestType.toLowerCase().includes('maintenance')) ||
          (req.title && req.title.toLowerCase().includes('repair')) ||
          (req.title && req.title.toLowerCase().includes('leak')) ||
          (req.title && req.title.toLowerCase().includes('hydraulic'));
        if (!isMaint) return false;
      } else if (filterMaintenanceOnly === 'urgent') {
        if (req.priority !== 'High' && req.priority !== 'Urgent' && req.stream !== 'emergency_repair') return false;
      } else if (filterMaintenanceOnly === 'voting') {
        if (req.status !== 'in_voting') return false;
      }

      // 2. Status Filter (Done vs Pending)
      const isDone = req.status === 'resolved' || req.status === 'closed' || req.status === 'approved';
      if (statusFilter === 'done' && !isDone) return false;
      if (statusFilter === 'pending' && isDone) return false;

      // 3. Search query
      if (calendarSearch.trim()) {
        const q = calendarSearch.toLowerCase();
        const matchesTitle = req.title.toLowerCase().includes(q);
        const matchesRef = (req.referenceId || req.id).toLowerCase().includes(q);
        const matchesUnit = (req.unit || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesRef && !matchesUnit) return false;
      }

      return true;
    });
  }, [requests, filterMaintenanceOnly, statusFilter, calendarSearch]);

  // KPI Metrics Calculation across filtered activities
  const metrics = useMemo(() => {
    const total = filteredActivities.length;
    const done = filteredActivities.filter(r => r.status === 'resolved' || r.status === 'closed' || r.status === 'approved').length;
    const inVoting = filteredActivities.filter(r => r.status === 'in_voting').length;
    const pending = total - done;
    const urgent = filteredActivities.filter(r => (r.priority === 'High' || r.priority === 'Urgent') && r.status !== 'closed' && r.status !== 'resolved').length;
    return { total, done, pending, inVoting, urgent };
  }, [filteredActivities]);

  // Helper: map activities by date string key (YYYY-MM-DD)
  const activitiesByDate = useMemo(() => {
    const map = new Map<string, ResidentRequest[]>();
    filteredActivities.forEach(req => {
      const d = parseRequestDate(req.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(req);
    });
    return map;
  }, [filteredActivities]);

  // Helper: check if a request is "Done"
  const isRequestDone = (status: string) => {
    return status === 'resolved' || status === 'closed' || status === 'approved';
  };

  return (
    <div className="space-y-6">
      
      {/* ── Top Multi-Zoom Controls & Navigation Bar ────────── */}
      <div className="bg-white dark:bg-[#0D121C] rounded-3xl p-5 border border-gray-200 dark:border-white/10 shadow-sm space-y-4">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Period Title & Nav Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center bg-gray-100 dark:bg-white/5 rounded-2xl p-1 border border-gray-200 dark:border-white/10 shadow-2xs">
              <button
                type="button"
                onClick={handlePrevPeriod}
                className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
                title="Previous Period"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={handleJumpToday}
                className="px-3 py-1 rounded-xl text-xs font-bold hover:bg-white dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleNextPeriod}
                className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
                title="Next Period"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                <CalendarDays size={20} className="text-[#0055FF] dark:text-[#00D4B2]" />
                <span>{periodTitle}</span>
              </h2>
            </div>
          </div>

          {/* Zoom Level Selector (1M, 3M, 6M, 12M) */}
          <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">
              Calendar Zoom:
            </span>
            <div className="flex items-center bg-gray-100 dark:bg-black/40 p-1 rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xs">
              {[
                { id: '1m' as CalendarZoomLevel, label: '1 Month' },
                { id: '3m' as CalendarZoomLevel, label: '3 Months' },
                { id: '6m' as CalendarZoomLevel, label: '6 Months' },
                { id: '12m' as CalendarZoomLevel, label: '12 Months' },
              ].map(zoom => (
                <button
                  key={zoom.id}
                  type="button"
                  onClick={() => setZoomLevel(zoom.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    zoomLevel === zoom.id
                      ? 'bg-white dark:bg-[#1A2232] text-gray-900 dark:text-[#00D4B2] shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {zoom.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Filters & Search Row ──────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-white/5 text-xs">
          
          {/* Maintenance Category Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Filter size={12} /> Focus:
            </span>
            <button
              type="button"
              onClick={() => setFilterMaintenanceOnly('all')}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer border ${
                filterMaintenanceOnly === 'all'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-black border-transparent shadow-2xs'
                  : 'bg-transparent text-gray-500 border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5'
              }`}
            >
              All Activities
            </button>
            <button
              type="button"
              onClick={() => setFilterMaintenanceOnly('maintenance')}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                filterMaintenanceOnly === 'maintenance'
                  ? 'bg-[#0055FF] text-white border-transparent shadow-2xs'
                  : 'bg-transparent text-gray-500 border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5'
              }`}
            >
              <Wrench size={12} />
              <span>Maintenance & Repairs Only</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterMaintenanceOnly('urgent')}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                filterMaintenanceOnly === 'urgent'
                  ? 'bg-red-500 text-white border-transparent shadow-2xs'
                  : 'bg-transparent text-gray-500 border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5'
              }`}
            >
              <AlertTriangle size={12} />
              <span>Urgent / High Priority</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterMaintenanceOnly('voting')}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                filterMaintenanceOnly === 'voting'
                  ? 'bg-purple-600 text-white border-transparent shadow-2xs'
                  : 'bg-transparent text-gray-500 border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5'
              }`}
            >
              <Vote size={12} />
              <span>Under Voting</span>
            </button>
          </div>

          {/* Status Done vs Pending Toggle & Search */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-gray-100 dark:bg-black/30 p-1 rounded-xl border border-gray-200 dark:border-white/10 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-0.5 rounded-lg cursor-pointer ${statusFilter === 'all' ? 'bg-white dark:bg-white/15 text-gray-900 dark:text-white shadow-2xs' : 'text-gray-400'}`}
              >
                All Status
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('done')}
                className={`px-2.5 py-0.5 rounded-lg cursor-pointer flex items-center gap-1 ${statusFilter === 'done' ? 'bg-emerald-500 text-black font-black shadow-2xs' : 'text-emerald-500'}`}
              >
                <CheckCircle2 size={10} /> Done ({metrics.done})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`px-2.5 py-0.5 rounded-lg cursor-pointer flex items-center gap-1 ${statusFilter === 'pending' ? 'bg-amber-500 text-black font-black shadow-2xs' : 'text-amber-500'}`}
              >
                <Clock size={10} /> Pending ({metrics.pending})
              </button>
            </div>

            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Filter calendar..."
                value={calendarSearch}
                onChange={e => setCalendarSearch(e.target.value)}
                className="pl-7 pr-2.5 py-1 rounded-xl bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 text-[11px] focus:outline-none focus:ring-1 focus:ring-[#0055FF]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Summary Cards Strip ───────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#0D121C] border border-gray-200 dark:border-white/10 rounded-2xl p-3.5 flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-[#0055FF]/10 text-[#0055FF] dark:text-[#60A5FA] flex items-center justify-center font-black text-sm">
            {metrics.total}
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Activities</div>
            <div className="text-xs font-black text-gray-900 dark:text-white">In Current View</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0D121C] border border-gray-200 dark:border-white/10 rounded-2xl p-3.5 flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black text-sm">
            {metrics.done}
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Completed / Done</div>
            <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
              {metrics.total > 0 ? `${Math.round((metrics.done / metrics.total) * 100)}% Resolved` : '0%'}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0D121C] border border-gray-200 dark:border-white/10 rounded-2xl p-3.5 flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-black text-sm">
            {metrics.pending}
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">In Progress</div>
            <div className="text-xs font-black text-blue-600 dark:text-blue-400">Scheduled / Active</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0D121C] border border-gray-200 dark:border-white/10 rounded-2xl p-3.5 flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-black text-sm">
            {metrics.inVoting}
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">In Voting Motion</div>
            <div className="text-xs font-black text-purple-600 dark:text-purple-400">Committee Deciding</div>
          </div>
        </div>
      </div>

      {/* ── ZOOM 1: 1 MONTH FULL CALENDAR GRID ───────────────── */}
      {zoomLevel === '1m' && (
        <div className="bg-white dark:bg-[#0D121C] rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
          
          {/* Day Headers (Mon – Sun) */}
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-center py-2.5 text-xs font-black text-gray-400 uppercase tracking-wider">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span className="text-blue-500">Sat</span>
            <span className="text-blue-500">Sun</span>
          </div>

          {/* Month Days Matrix */}
          <div className="grid grid-cols-7 divide-x divide-y divide-gray-100 dark:divide-white/5 bg-gray-50/20 dark:bg-black/10">
            {(() => {
              const year = currentDate.getFullYear();
              const month = currentDate.getMonth();

              // Days calculation: 1st of month day of week (0=Sun, 1=Mon...)
              const firstDay = new Date(year, month, 1);
              let startDay = firstDay.getDay() - 1; // Align to Monday = 0
              if (startDay === -1) startDay = 6;

              const daysInMonth = new Date(year, month + 1, 0).getDate();
              const daysInPrevMonth = new Date(year, month, 0).getDate();

              const cells = [];

              // Leading days from previous month
              for (let i = startDay - 1; i >= 0; i--) {
                const dayNum = daysInPrevMonth - i;
                cells.push(
                  <div key={`prev-${dayNum}`} className="min-h-[110px] p-2 bg-gray-100/40 dark:bg-black/40 text-gray-300 dark:text-gray-700 opacity-40">
                    <span className="text-xs font-mono font-bold">{dayNum}</span>
                  </div>
                );
              }

              // Days of current month
              for (let day = 1; day <= daysInMonth; day++) {
                const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayEvents = activitiesByDate.get(dateKey) || [];
                const isToday = year === 2026 && month === 8 && day === 12;

                cells.push(
                  <div 
                    key={`curr-${day}`}
                    className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors group relative ${
                      isToday ? 'bg-blue-500/5 dark:bg-[#00D4B2]/5' : 'hover:bg-white dark:hover:bg-white/3'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-mono font-black w-6 h-6 rounded-full flex items-center justify-center ${
                          isToday 
                            ? 'bg-[#0055FF] text-white dark:bg-[#00D4B2] dark:text-black shadow-2xs' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {day}
                        </span>

                        {dayEvents.length > 0 && (
                          <span className="text-[10px] font-bold text-gray-400 font-mono">
                            {dayEvents.length} {dayEvents.length === 1 ? 'task' : 'tasks'}
                          </span>
                        )}
                      </div>

                      {/* Day Tasks List */}
                      <div className="space-y-1 mt-1">
                        {dayEvents.slice(0, 3).map(req => {
                          const done = isRequestDone(req.status);
                          return (
                            <div
                              key={req.id}
                              onClick={() => onSelectRequest(req)}
                              className={`p-1.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer truncate flex items-center gap-1.5 shadow-2xs hover:scale-[1.02] ${
                                done 
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25 hover:bg-emerald-500/20'
                                  : req.status === 'in_voting'
                                  ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/25 hover:bg-purple-500/20'
                                  : req.priority === 'High' || req.priority === 'Urgent'
                                  ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25 hover:bg-red-500/20'
                                  : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25 hover:bg-blue-500/20'
                              }`}
                              title={`${req.title} (${req.unit || 'Lot'})`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                done ? 'bg-emerald-500' : req.status === 'in_voting' ? 'bg-purple-500' : 'bg-blue-500'
                              }`} />
                              <span className="truncate">{req.title}</span>
                            </div>
                          );
                        })}

                        {dayEvents.length > 3 && (
                          <div 
                            onClick={() => setSelectedDayEvents({ date: new Date(year, month, day), items: dayEvents })}
                            className="text-[10px] font-bold text-gray-400 hover:text-blue-500 dark:hover:text-[#00D4B2] cursor-pointer pt-0.5 pl-1"
                          >
                            +{dayEvents.length - 3} more activities...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              // Trailing days
              const totalSlots = cells.length;
              const remaining = 35 - totalSlots > 0 ? 35 - totalSlots : 42 - totalSlots;
              for (let i = 1; i <= remaining; i++) {
                cells.push(
                  <div key={`next-${i}`} className="min-h-[110px] p-2 bg-gray-100/40 dark:bg-black/40 text-gray-300 dark:text-gray-700 opacity-40">
                    <span className="text-xs font-mono font-bold">{i}</span>
                  </div>
                );
              }

              return cells;
            })()}
          </div>
        </div>
      )}

      {/* ── ZOOM 2: 3 MONTHS (QUARTERLY VIEW) ────────────────── */}
      {zoomLevel === '3m' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(() => {
            const year = currentDate.getFullYear();
            const currentMonth = currentDate.getMonth();
            const quarter = Math.floor(currentMonth / 3);
            const startMonth = quarter * 3;

            return [0, 1, 2].map(offset => {
              const mIdx = startMonth + offset;
              const mDate = new Date(year, mIdx, 1);
              const mName = mDate.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
              
              // Filter activities in this month
              const monthActivities = filteredActivities.filter(r => {
                const d = parseRequestDate(r.createdAt);
                return d.getFullYear() === year && d.getMonth() === mIdx;
              });

              const mDone = monthActivities.filter(r => isRequestDone(r.status)).length;
              const mPending = monthActivities.length - mDone;

              return (
                <div key={mIdx} className="bg-white dark:bg-[#0D121C] rounded-3xl border border-gray-200 dark:border-white/10 p-5 shadow-sm space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-3">
                      <div>
                        <h3 className="text-base font-black text-gray-900 dark:text-white">{mName}</h3>
                        <span className="text-[11px] text-gray-400">Quarter {quarter + 1} Maintenance</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentDate(mDate);
                          setZoomLevel('1m');
                        }}
                        className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-[#0055FF] dark:text-[#00D4B2] cursor-pointer text-xs font-bold flex items-center gap-1"
                        title="Zoom into 1 Month"
                      >
                        <span>Drilldown</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>

                    {/* Progress Bar for this month */}
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-emerald-500">{mDone} Done</span>
                        <span className="text-amber-500">{mPending} Pending</span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden flex">
                        <div 
                          style={{ width: `${monthActivities.length > 0 ? (mDone / monthActivities.length) * 100 : 0}%` }}
                          className="bg-emerald-500" 
                        />
                        <div 
                          style={{ width: `${monthActivities.length > 0 ? (mPending / monthActivities.length) * 100 : 0}%` }}
                          className="bg-amber-500" 
                        />
                      </div>
                    </div>

                    {/* Activities List */}
                    <div className="space-y-2 mt-4">
                      {monthActivities.length === 0 ? (
                        <div className="py-8 text-center text-gray-400 text-xs italic">
                          No maintenance scheduled in {mDate.toLocaleDateString('en-AU', { month: 'short' })}.
                        </div>
                      ) : (
                        monthActivities.slice(0, 5).map(req => {
                          const done = isRequestDone(req.status);
                          return (
                            <div
                              key={req.id}
                              onClick={() => onSelectRequest(req)}
                              className="p-2.5 rounded-xl bg-gray-50/70 dark:bg-white/3 border border-gray-200/60 dark:border-white/5 hover:border-blue-400 dark:hover:border-[#00D4B2]/40 transition-all cursor-pointer text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-gray-900 dark:text-white truncate">{req.title}</span>
                                <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                                  done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                                }`}>
                                  {done ? 'DONE' : 'ACTIVE'}
                                </span>
                              </div>
                              <div className="text-[10px] text-gray-400 flex items-center justify-between">
                                <span>{req.unit || 'Lot'}</span>
                                <span className="font-mono">{req.createdAt}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {monthActivities.length > 5 && (
                    <div className="text-[11px] text-center font-bold text-gray-400 pt-2">
                      +{monthActivities.length - 5} more items in {mDate.toLocaleDateString('en-AU', { month: 'short' })}
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      )}

      {/* ── ZOOM 3: 6 MONTHS (SEMI-ANNUAL VIEW) ──────────────── */}
      {zoomLevel === '6m' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(() => {
            const year = currentDate.getFullYear();
            const isH1 = currentDate.getMonth() < 6;
            const startMonth = isH1 ? 0 : 6;

            return [0, 1, 2, 3, 4, 5].map(offset => {
              const mIdx = startMonth + offset;
              const mDate = new Date(year, mIdx, 1);
              const mName = mDate.toLocaleDateString('en-AU', { month: 'long' });

              const monthActivities = filteredActivities.filter(r => {
                const d = parseRequestDate(r.createdAt);
                return d.getFullYear() === year && d.getMonth() === mIdx;
              });

              const mDone = monthActivities.filter(r => isRequestDone(r.status)).length;
              const mPending = monthActivities.length - mDone;

              return (
                <div 
                  key={mIdx}
                  className="bg-white dark:bg-[#0D121C] rounded-3xl border border-gray-200 dark:border-white/10 p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-black text-gray-900 dark:text-white">{mName} {year}</h4>
                      <span className="text-xs text-gray-400">{monthActivities.length} Maintenance Tasks</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentDate(mDate);
                        setZoomLevel('1m');
                      }}
                      className="px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-[#0055FF]/10 text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-[#0055FF] transition-colors cursor-pointer"
                    >
                      Inspect
                    </button>
                  </div>

                  {/* Ratio bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-emerald-500 font-bold">{mDone} Resolved</span>
                      <span className="text-amber-500 font-bold">{mPending} Scheduled</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden flex">
                      <div 
                        style={{ width: `${monthActivities.length > 0 ? (mDone / monthActivities.length) * 100 : 0}%` }}
                        className="bg-emerald-500" 
                      />
                      <div 
                        style={{ width: `${monthActivities.length > 0 ? (mPending / monthActivities.length) * 100 : 0}%` }}
                        className="bg-amber-500" 
                      />
                    </div>
                  </div>

                  {/* Sample items */}
                  <div className="space-y-1.5 pt-1">
                    {monthActivities.slice(0, 3).map(req => (
                      <div 
                        key={req.id}
                        onClick={() => onSelectRequest(req)}
                        className="p-2 rounded-xl bg-gray-50 dark:bg-white/3 text-xs font-bold truncate text-gray-700 dark:text-gray-300 hover:text-blue-500 cursor-pointer flex items-center justify-between"
                      >
                        <span className="truncate">{req.title}</span>
                        <span className="text-[10px] text-gray-400 font-mono shrink-0 ml-1">{req.createdAt}</span>
                      </div>
                    ))}
                    {monthActivities.length === 0 && (
                      <div className="py-4 text-center text-xs text-gray-400 italic">No tasks logged</div>
                    )}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}

      {/* ── ZOOM 4: 12 MONTHS (FULL ANNUAL GOVERNANCE MATRIX) ── */}
      {zoomLevel === '12m' && (
        <div className="bg-white dark:bg-[#0D121C] rounded-3xl border border-gray-200 dark:border-white/10 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-4">
            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <span>Annual Maintenance Schedule Matrix</span>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                  {currentDate.getFullYear()}
                </span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Full 12-month bird's eye view. Track preventative works, by-law compliance, and vendor maintenance throughout the year.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(mIdx => {
              const year = currentDate.getFullYear();
              const mDate = new Date(year, mIdx, 1);
              const mName = mDate.toLocaleDateString('en-AU', { month: 'short' });
              const isCurrentMonth = mIdx === 8; // Sept

              const monthActivities = filteredActivities.filter(r => {
                const d = parseRequestDate(r.createdAt);
                return d.getFullYear() === year && d.getMonth() === mIdx;
              });

              const mDone = monthActivities.filter(r => isRequestDone(r.status)).length;
              const mPending = monthActivities.length - mDone;

              return (
                <div
                  key={mIdx}
                  onClick={() => {
                    setCurrentDate(mDate);
                    setZoomLevel('1m');
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 relative group ${
                    isCurrentMonth 
                      ? 'bg-blue-500/5 dark:bg-[#00D4B2]/5 border-blue-500/40 shadow-xs' 
                      : 'bg-gray-50/50 dark:bg-white/2 border-gray-200/80 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-gray-900 dark:text-white">{mName}</span>
                      {isCurrentMonth && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-blue-500 text-white dark:bg-[#00D4B2] dark:text-black">
                          CURRENT
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-xs font-bold text-gray-400">
                      {monthActivities.length} {monthActivities.length === 1 ? 'task' : 'tasks'}
                    </span>
                  </div>

                  {/* Progress ratio */}
                  <div className="space-y-1">
                    <div className="h-1.5 w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden flex">
                      <div 
                        style={{ width: `${monthActivities.length > 0 ? (mDone / monthActivities.length) * 100 : 0}%` }}
                        className="bg-emerald-500" 
                      />
                      <div 
                        style={{ width: `${monthActivities.length > 0 ? (mPending / monthActivities.length) * 100 : 0}%` }}
                        className="bg-amber-500" 
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span>{mDone} done</span>
                      <span>{mPending} pending</span>
                    </div>
                  </div>

                  {/* Mini bullet highlights */}
                  <div className="space-y-1 pt-1">
                    {monthActivities.slice(0, 2).map(req => (
                      <div key={req.id} className="text-[10px] truncate text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-blue-400 shrink-0" />
                        <span className="truncate">{req.title}</span>
                      </div>
                    ))}
                    {monthActivities.length === 0 && (
                      <div className="text-[10px] text-gray-400 italic">No scheduled works</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Day Drilldown Modal (When clicking "+X more activities") ─ */}
      {selectedDayEvents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0C1018] rounded-3xl max-w-lg w-full border border-gray-200 dark:border-white/15 p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-gray-100 dark:border-white/5 pb-3">
              <div>
                <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <CalendarDays size={18} className="text-[#0055FF] dark:text-[#00D4B2]" />
                  <span>{selectedDayEvents.date.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {selectedDayEvents.items.length} maintenance activities on this date
                </p>
              </div>
              <button 
                onClick={() => setSelectedDayEvents(null)} 
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {selectedDayEvents.items.map(req => {
                const done = isRequestDone(req.status);
                return (
                  <div
                    key={req.id}
                    onClick={() => {
                      onSelectRequest(req);
                      setSelectedDayEvents(null);
                    }}
                    className="p-3 rounded-2xl bg-gray-50 dark:bg-white/3 border border-gray-200 dark:border-white/5 hover:border-[#0055FF] transition-all cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">{req.title}</h4>
                      <span className={`text-[10px] font-black px-2 py-0.2 rounded-full ${
                        done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {done ? 'DONE' : 'PENDING'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                      <span>{req.unit || 'Lot'} • {req.requestorName}</span>
                      <span className="font-mono">{req.priority}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedDayEvents(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/10 text-xs font-bold cursor-pointer hover:bg-gray-200 dark:hover:bg-white/20"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
