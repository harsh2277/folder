'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import CustomSelect from '../../../components/ui/CustomSelect';
import Link from 'next/link';
import Portal from '@/components/ui/Portal';

export default function AdminDashboard() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState('Super Admin');
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [pendingProjects, setPendingProjects] = useState<any[]>([]);
  const [approvedProjects, setApprovedProjects] = useState<any[]>([]);
  const [designers, setDesigners] = useState<any[]>([]);
  const [selectedDesigners, setSelectedDesigners] = useState<Record<string, string>>({});
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingProjId, setRejectingProjId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [activeMonth, setActiveMonth] = useState('May');
  const [hoveredRing, setHoveredRing] = useState<string | null>(null);

  const [stats, setStats] = useState({
    totalProjects: 0,
    completedProjects: 0,
    inDesignProjects: 0,
    underReviewProjects: 0,
    revenueTurnover: 0,
    approvedPercent: 0,
    inDesignPercent: 0,
    underReviewPercent: 0,
    approvedCount: 0
  });

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', user.id)
            .single();
          if (data?.name) {
            setAdminName(data.name);
          }
        }

        const res = await fetch('/api/admin/dashboard');
        const resData = await res.json();
        if (resData.error) throw new Error(resData.error);

        const { designers: designerProfiles, projects, payments } = resData;
        setDesigners(designerProfiles || []);

        const allProjects = projects || [];
        setRecentProjects(allProjects.slice(0, 5));
        setPendingProjects(allProjects.filter((p: any) => p.status === 'Under Review' || p.status === 'Submitted'));

        // Sort approved/closed by updated_at desc (most recently approved first)
        const approved = allProjects
          .filter((p: any) => p.status === 'Approved' || p.status === 'Closed')
          .sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
          .slice(0, 5);
        setApprovedProjects(approved);

        const total = allProjects.length;
        const completed = allProjects.filter((p: any) => p.status === 'Closed' || p.status === 'Approved').length;
        const inDesign = allProjects.filter((p: any) => p.status === 'In Design').length;
        const underReview = allProjects.filter((p: any) => p.status === 'Under Review').length;
        const approvedCount = allProjects.filter((p: any) => p.status === 'Approved').length;

        const approvedPct = total > 0 ? Math.round((approvedCount / total) * 100) : 0;
        const inDesignPct = total > 0 ? Math.round((inDesign / total) * 100) : 0;
        const underReviewPct = total > 0 ? Math.round((underReview / total) * 100) : 0;

        const revenue = payments
          ? payments.filter((p: any) => p.status === 'completed').reduce((sum: number, p: any) => sum + Number(p.amount), 0)
          : 0;

        setStats({
          totalProjects: total,
          completedProjects: completed,
          inDesignProjects: inDesign,
          underReviewProjects: underReview,
          revenueTurnover: revenue,
          approvedPercent: approvedPct,
          inDesignPercent: inDesignPct,
          underReviewPercent: underReviewPct,
          approvedCount
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <svg className="animate-spin h-6 w-6 text-neutral-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  const maxVal = 40; // max revenue axis
  const avgVal = 27.6; // average revenue

  const revenuePoints = [
    { month: 'Jan', value: 18, prevValue: 12 },
    { month: 'Feb', value: 23, prevValue: 15 },
    { month: 'Mar', value: 25, prevValue: 19 },
    { month: 'Apr', value: 21, prevValue: 22 },
    { month: 'May', value: 28, prevValue: 24 },
    { month: 'Jun', value: 32, prevValue: 25 },
    { month: 'Jul', value: 32, prevValue: 28 },
    { month: 'Aug', value: 31, prevValue: 27 },
    { month: 'Sep', value: 29, prevValue: 26 },
    { month: 'Oct', value: 32, prevValue: 30 },
    { month: 'Nov', value: 32, prevValue: 29 },
    { month: 'Dec', value: 28, prevValue: 27 }
  ];

  const handleApproveProject = async (id: string) => {
    try {
      const designerId = selectedDesigners[id];
      if (!designerId) {
        alert('Please select and assign a designer before approving the project.');
        return;
      }

      const { error } = await supabase
        .from('projects')
        .update({
          status: 'In Design',
          assigned_designer_id: designerId
        })
        .eq('id', id);

      if (error) throw error;

      setPendingProjects(prev => prev.filter(p => p.id !== id));
      setRecentProjects(prev => prev.map(p => p.id === id ? { ...p, status: 'In Design' } : p));
    } catch (err: any) {
      alert('Failed to approve project: ' + err.message);
    }
  };

  const handleRejectProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingProjId || !rejectReason.trim()) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          status: 'Revision Requested',
          project_notes: `Rejection Reason: ${rejectReason}`
        })
        .eq('id', rejectingProjId);

      if (error) throw error;

      setPendingProjects(prev => prev.filter(p => p.id !== rejectingProjId));
      setRecentProjects(prev => prev.map(p => p.id === rejectingProjId ? { ...p, status: 'Revision Requested' } : p));

      setShowRejectModal(false);
      setRejectingProjId(null);
      setRejectReason('');
    } catch (err: any) {
      alert('Failed to reject project: ' + err.message);
    }
  };

  return (
    <div className="space-y-4">

      {/* Top Banner / Hero Card */}
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 text-white rounded-md p-4 sm:p-5 xl:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-neutral-800">
        <div className="space-y-1 min-w-0">
          <h2 className="text-base sm:text-lg xl:text-xl font-medium tracking-tight truncate">Good morning, {adminName}</h2>
          <p className="text-xs sm:text-sm text-neutral-400 truncate">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} &mdash; {stats.underReviewProjects} critical deadlines remaining.
          </p>
        </div>
        <div className="flex items-center flex-wrap gap-2 shrink-0">
          <Link
            href="/admin/projects"
            className="px-3 py-1.5 xl:px-4 xl:py-2 bg-amber-500 hover:bg-amber-600 text-neutral-950 rounded-md text-xs xl:text-sm font-medium transition-all flex items-center space-x-1.5 whitespace-nowrap"
          >
            <i className="bx bx-folder text-sm"></i>
            <span>View Projects</span>
          </Link>
          <Link
            href="/admin/users"
            className="px-3 py-1.5 xl:px-4 xl:py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-md text-xs xl:text-sm font-medium border border-neutral-700 transition-all flex items-center space-x-1.5 whitespace-nowrap"
          >
            <i className="bx bx-user-plus text-sm"></i>
            <span>Invite Designer</span>
          </Link>
        </div>
      </div>

      {/* Project Approval Requests Queue */}
      {pendingProjects.length > 0 && (
        <div className="bg-white border border-rose-200 rounded-md p-5 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-rose-100">
            <div>
              <h3 className="text-sm font-medium text-rose-950 flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                <span>Pending Project Approvals</span>
              </h3>
              <p className="text-sm text-rose-500 font-medium mt-0.5">Projects submitted by architects awaiting administrator verification.</p>
            </div>
            <span className="text-sm font-medium bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-100 font-sans">
              {pendingProjects.length} Pending
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingProjects.map((p) => (
              <div key={p.id} className="bg-neutral-50/50 border border-neutral-200 rounded-md p-4 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="text-base font-medium text-neutral-900 truncate max-w-[200px]" title={p.project_name}>{p.project_name}</h4>
                    <span className="text-xs text-neutral-450 font-medium font-sans">ID: {p.id.substring(0, 8)}...</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm font-medium text-neutral-500">
                    <div className="flex items-center space-x-1">
                      <i className="bx bx-user text-neutral-400 text-base"></i>
                      <span className="truncate">{p.client_name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <i className="bx bx-area text-neutral-400 text-base"></i>
                      <span>{p.area_sq_ft ? p.area_sq_ft.toLocaleString() : 'N/A'} sq ft</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-neutral-100">
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">Assign Designer</label>
                    <CustomSelect
                      value={selectedDesigners[p.id] || ''}
                      onChange={(val) => setSelectedDesigners(prev => ({ ...prev, [p.id]: val }))}
                      options={[
                        { value: '', label: '-- Choose Designer --' },
                        ...designers.map((d) => ({
                          value: d.id,
                          label: `${d.name} (${d.email})`
                        }))
                      ]}
                      className="w-full text-sm"
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-1">
                    <button
                      onClick={() => {
                        setRejectingProjId(p.id);
                        setShowRejectModal(true);
                      }}
                      className="px-3 py-1.5 border border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-100 rounded text-sm font-medium transition-all cursor-pointer active:scale-[0.98]"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApproveProject(p.id)}
                      className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-sm font-medium transition-all cursor-pointer active:scale-[0.98]"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid of Key Performance Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 xl:gap-4">

        {/* KPI 1 */}
        <div className="bg-white border border-neutral-200 rounded-md p-3 sm:p-4 xl:p-5 flex items-center justify-between">
          <div className="space-y-0.5 min-w-0">
            <span className="text-xs font-medium text-neutral-400 block truncate">Revenue</span>
            <div className="flex items-baseline space-x-1">
              <span className="kpi-number text-neutral-900 font-sans">₹{(stats.revenueTurnover / 100000).toFixed(1)}L</span>
              <span className="text-xs font-medium text-emerald-600 font-sans whitespace-nowrap">+14%</span>
            </div>
            <span className="text-xs text-neutral-400 block hidden sm:block truncate">Settled payouts volume</span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 xl:w-12 xl:h-12 bg-blue-50 rounded-md flex items-center justify-center text-blue-600 border border-blue-100 shrink-0">
            <i className="bx bx-trending-up text-base xl:text-xl"></i>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-neutral-200 rounded-md p-3 sm:p-4 xl:p-5 flex items-center justify-between">
          <div className="space-y-0.5 min-w-0">
            <span className="text-xs font-medium text-neutral-400 block truncate">In Design</span>
            <div className="flex items-baseline space-x-1">
              <span className="kpi-number text-neutral-900 font-sans">{stats.inDesignProjects}</span>
              <span className="text-xs font-medium text-cyan-600 font-sans whitespace-nowrap">Active</span>
            </div>
            <span className="text-xs text-neutral-400 block hidden sm:block truncate">Workspaces in development</span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 xl:w-12 xl:h-12 bg-cyan-50 rounded-md flex items-center justify-center text-cyan-600 border border-cyan-100 shrink-0">
            <i className="bx bx-pencil text-base xl:text-xl"></i>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-neutral-200 rounded-md p-3 sm:p-4 xl:p-5 flex items-center justify-between">
          <div className="space-y-0.5 min-w-0">
            <span className="text-xs font-medium text-neutral-400 block truncate">Total Logged</span>
            <div className="flex items-baseline space-x-1">
              <span className="kpi-number text-neutral-900 font-sans">{stats.totalProjects}</span>
              <span className="text-xs font-medium text-indigo-600 font-sans whitespace-nowrap">Projects</span>
            </div>
            <span className="text-xs text-neutral-400 block hidden sm:block truncate">Registered index</span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 xl:w-12 xl:h-12 bg-indigo-50 rounded-md flex items-center justify-center text-indigo-600 border border-indigo-100 shrink-0">
            <i className="bx bx-folder-open text-base xl:text-xl"></i>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border border-neutral-200 rounded-md p-3 sm:p-4 xl:p-5 flex items-center justify-between">
          <div className="space-y-0.5 min-w-0">
            <span className="text-xs font-medium text-neutral-400 block truncate">Completed</span>
            <div className="flex items-baseline space-x-1">
              <span className="kpi-number text-neutral-900 font-sans">{stats.completedProjects}</span>
              <span className="text-xs font-medium text-emerald-600 font-sans whitespace-nowrap">Delivered</span>
            </div>
            <span className="text-xs text-neutral-400 block hidden sm:block truncate">Approved &amp; closed</span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 xl:w-12 xl:h-12 bg-emerald-50 rounded-md flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0">
            <i className="bx bx-badge-check text-base xl:text-xl"></i>
          </div>
        </div>

      </div>

      {/* Main Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Left 2 Columns: Financial Overview Chart & Info breakdown */}
        <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-md p-5 flex flex-col space-y-4">
          <div className="flex justify-between items-start pb-3 border-b border-neutral-100">
            <div>
              <h3 className="text-sm font-medium text-neutral-900">Revenue Analytics</h3>
              <p className="text-sm text-neutral-450 mt-0.5">Comparing current year turnover vs previous year (in Lakhs)</p>
            </div>
          </div>

          {/* Premium Diagonal-Striped Rounded Column Chart */}
          <div className="flex space-x-3 items-stretch mt-3 w-full h-80">

            {/* Left Y-axis labels */}
            <div className="flex flex-col justify-between text-xs text-neutral-400 font-medium text-right w-8 pb-8 pt-6 shrink-0">
              <span>₹40L</span>
              <span>₹30L</span>
              <span>₹20L</span>
              <span>₹10L</span>
              <span>₹0</span>
            </div>

            {/* Main chart rendering area — overflow-hidden clips the tooltip inside the card */}
            <div className="flex-1 flex flex-col justify-between relative min-w-0 overflow-hidden">

              {/* Chart Grid Area (Horizontal background lines) */}
              <div className="absolute inset-x-0 bottom-8 top-6 flex flex-col justify-between pointer-events-none">
                <div className="w-full border-b border-neutral-100"></div>
                <div className="w-full border-b border-neutral-100"></div>
                <div className="w-full border-b border-neutral-100"></div>
                <div className="w-full border-b border-neutral-100"></div>
                <div className="w-full border-b border-neutral-100"></div>
              </div>

              {/* Rounded Striped Columns Area */}
              <div className="relative z-10 flex-1 flex items-end justify-between px-1 pt-6 h-full">
                {revenuePoints.map((pt) => {
                  const curHeight = (pt.value / maxVal) * 75;
                  const isActive = activeMonth === pt.month;

                  return (
                    <div
                      key={pt.month}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative mx-0.5 cursor-pointer"
                      onMouseEnter={() => setActiveMonth(pt.month)}
                    >
                      {/* Tooltip: stays inside chart, clamped so it doesn't go above the container */}
                      {isActive && (
                        <div
                          className="absolute flex flex-col items-center z-20 -translate-x-1/2 left-1/2"
                          style={{ bottom: `calc(${curHeight}% + 6px)` }}
                        >
                          <span className="bg-neutral-900 text-white text-xs font-medium px-2 py-1 rounded font-sans whitespace-nowrap">
                            ₹{pt.value.toFixed(1)}L
                          </span>
                          <span className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-neutral-900"></span>
                        </div>
                      )}

                      {/* Bar */}
                      <div
                        className={`w-full max-w-[32px] rounded-t-[4px] transition-all duration-300 relative border ${isActive ? 'bg-amber-500 border-amber-600' : 'bg-neutral-100 border-neutral-200/60 hover:bg-neutral-200/50'}`}
                        style={{
                          height: `${curHeight}%`,
                          backgroundImage: isActive
                            ? 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255, 255, 255, 0.2) 4px, rgba(255, 255, 255, 0.2) 8px)'
                            : 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0, 0, 0, 0.04) 4px, rgba(0, 0, 0, 0.04) 8px)'
                        }}
                      ></div>
                    </div>
                  );
                })}
              </div>

              {/* X-axis labels (months) */}
              <div className="relative z-10 flex justify-between text-xs font-medium text-neutral-400 pt-2 mt-1 px-1">
                {revenuePoints.map((pt) => {
                  const isActive = activeMonth === pt.month;
                  return (
                    <span
                      key={pt.month}
                      className={`flex-1 text-center py-0.5 transition-all duration-200 cursor-pointer whitespace-nowrap ${isActive ? 'text-amber-600 font-medium' : ''}`}
                      onMouseEnter={() => setActiveMonth(pt.month)}
                    >
                      {pt.month}
                    </span>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Right 1 Column: Distribution and Progress Status */}
        <div className="bg-white border border-neutral-200 rounded-md p-5 flex flex-col justify-between space-y-4">
          <div className="pb-3 border-b border-neutral-100">
            <h3 className="text-sm font-medium text-neutral-900">Status Distribution</h3>
            <p className="text-sm text-neutral-450 mt-0.5">Project states allocation index</p>
          </div>
          {/* Pure HTML/CSS Concentric Target Donut Chart — scaled down to fit card */}
          <div className="flex justify-center items-center my-4 relative">

            {/* Floating Tooltip Indicator */}
            {hoveredRing && (
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-xs font-medium px-2.5 py-1.5 rounded z-20 flex items-center space-x-2 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full shrink-0" style={{
                  backgroundColor: hoveredRing === 'approved' ? '#10b981' : hoveredRing === 'indesign' ? '#06b6d4' : '#3b82f6'
                }}></span>
                <span>
                  {hoveredRing === 'approved' ? 'Approved' : hoveredRing === 'indesign' ? 'In Design' : 'Under Review'}:{' '}
                  {hoveredRing === 'approved'
                    ? `${stats.approvedCount}/${stats.totalProjects} (${stats.approvedPercent}%)`
                    : hoveredRing === 'indesign'
                      ? `${stats.inDesignProjects}/${stats.totalProjects} (${stats.inDesignPercent}%)`
                      : `${stats.underReviewProjects}/${stats.totalProjects} (${stats.underReviewPercent}%)`}
                </span>
              </div>
            )}

            <div className="relative w-44 h-44 flex items-center justify-center">

              {/* Outermost Ring: Approved */}
              <div
                className={`absolute w-44 h-44 rounded-full cursor-pointer transition-all duration-300 ${hoveredRing && hoveredRing !== 'approved' ? 'opacity-25 scale-95' : 'opacity-100 scale-100'}`}
                style={{
                  background: `conic-gradient(#10b981 0% ${stats.approvedPercent}%, #f1f5f9 ${stats.approvedPercent}% 100%)`
                }}
                onMouseEnter={() => setHoveredRing('approved')}
                onMouseLeave={() => setHoveredRing(null)}
              ></div>

              {/* Outer Mask */}
              <div className="absolute w-[142px] h-[142px] bg-white rounded-full pointer-events-none"></div>

              {/* Middle Ring: In Design */}
              <div
                className={`absolute w-[118px] h-[118px] rounded-full cursor-pointer transition-all duration-300 ${hoveredRing && hoveredRing !== 'indesign' ? 'opacity-25 scale-95' : 'opacity-100 scale-100'}`}
                style={{
                  background: `conic-gradient(#06b6d4 0% ${stats.inDesignPercent}%, #f1f5f9 ${stats.inDesignPercent}% 100%)`
                }}
                onMouseEnter={() => setHoveredRing('indesign')}
                onMouseLeave={() => setHoveredRing(null)}
              ></div>

              {/* Middle Mask */}
              <div className="absolute w-[92px] h-[92px] bg-white rounded-full pointer-events-none"></div>

              {/* Innermost Ring: Under Review */}
              <div
                className={`absolute w-[68px] h-[68px] rounded-full cursor-pointer transition-all duration-300 ${hoveredRing && hoveredRing !== 'underreview' ? 'opacity-25 scale-95' : 'opacity-100 scale-100'}`}
                style={{
                  background: `conic-gradient(#3b82f6 0% ${stats.underReviewPercent}%, #f1f5f9 ${stats.underReviewPercent}% 100%)`
                }}
                onMouseEnter={() => setHoveredRing('underreview')}
                onMouseLeave={() => setHoveredRing(null)}
              ></div>

              {/* Center Mask & Core Value Display */}
              <div className="absolute w-[44px] h-[44px] bg-white rounded-full flex items-center justify-center pointer-events-none">
                <span className="text-sm font-medium text-neutral-900 font-sans">{stats.totalProjects}</span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2 pt-3 border-t border-neutral-100">
            {[
              { key: 'approved', label: 'Approved', color: '#10b981', count: stats.approvedCount, pct: stats.approvedPercent },
              { key: 'indesign', label: 'In Design', color: '#06b6d4', count: stats.inDesignProjects, pct: stats.inDesignPercent },
              { key: 'underreview', label: 'Under Review', color: '#3b82f6', count: stats.underReviewProjects, pct: stats.underReviewPercent },
            ].map((item) => (
              <div
                key={item.key}
                className={`flex items-center justify-between text-xs font-medium cursor-pointer px-2 py-1.5 rounded transition-colors ${hoveredRing === item.key ? 'bg-neutral-50' : 'hover:bg-neutral-50/50'}`}
                onMouseEnter={() => setHoveredRing(item.key)}
                onMouseLeave={() => setHoveredRing(null)}
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <span className="w-3 h-3 rounded-[3px] shrink-0" style={{ backgroundColor: item.color }}></span>
                  <span className="text-neutral-700 font-medium whitespace-nowrap">{item.label}</span>
                </div>
                <div className="flex items-center space-x-3 font-sans shrink-0 ml-2">
                  <span className="text-neutral-400 whitespace-nowrap">{item.count}/{stats.totalProjects}</span>
                  <span className="text-neutral-900 font-medium w-8 text-right whitespace-nowrap">{item.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Row 3: Project Directory Tracking & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Project Directory Table Card */}
        <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-md p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
              <div>
                <h3 className="text-sm font-medium text-neutral-900">Active Workspace</h3>
                <p className="text-sm text-neutral-450 mt-0.5">Status overview of client accounts and active scopes</p>
              </div>
              <Link
                href="/admin/projects"
                className="text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors flex items-center space-x-0.5"
              >
                <span>View Full List</span>
                <i className="bx bx-right-arrow-alt text-sm"></i>
              </Link>
            </div>

            <div className="overflow-x-auto mt-3 border border-neutral-100 rounded-md">
              <table className="w-full text-left border-collapse min-w-[480px]">
                <thead>
                  <tr className="bg-neutral-50/60 border-b border-neutral-100 text-neutral-450 font-normal text-xs">
                    <th className="py-2.5 px-4 first:pl-5 last:pr-5 whitespace-nowrap">Project</th>
                    <th className="py-2.5 px-4 first:pl-5 last:pr-5 whitespace-nowrap hidden sm:table-cell">Client</th>
                    <th className="py-2.5 px-4 first:pl-5 last:pr-5 whitespace-nowrap hidden lg:table-cell">Area</th>
                    <th className="py-2.5 px-4 first:pl-5 last:pr-5 whitespace-nowrap">Status</th>
                    <th className="py-2.5 px-4 first:pl-5 last:pr-5 text-right whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50 text-neutral-700 font-normal">
                  {recentProjects.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-50/40 transition-colors">
                      <td className="py-3 px-4 first:pl-5 last:pr-5 text-neutral-900 text-sm font-medium max-w-[160px] xl:max-w-none"><span className="block truncate">{p.project_name}</span></td>
                      <td className="py-3 px-4 first:pl-5 last:pr-5 text-neutral-500 text-xs hidden sm:table-cell max-w-[120px]"><span className="block truncate">{p.client_name}</span></td>
                      <td className="py-3 px-4 first:pl-5 last:pr-5 text-neutral-400 font-sans text-xs hidden lg:table-cell whitespace-nowrap">{Number(p.area_sq_ft).toLocaleString()} sq ft</td>
                      <td className="py-3 px-4 first:pl-5 last:pr-5">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border whitespace-nowrap ${p.status === 'Approved' || p.status === 'Closed' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : p.status === 'In Design' ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : p.status === 'Under Review' ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-neutral-50 border-neutral-200 text-neutral-600'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 first:pl-5 last:pr-5 text-right">
                        <Link
                          href={`/admin/projects/${p.id}`}
                          className="text-xs font-medium text-neutral-800 hover:text-amber-600 transition-colors whitespace-nowrap"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Last Approved Projects Card */}
        <div className="bg-white border border-neutral-200 rounded-md p-5 space-y-4 flex flex-col justify-between">
          <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
            <div>
              <h3 className="text-sm font-medium text-neutral-900 font-sans">Last Approved Projects</h3>
              <p className="text-xs text-neutral-450 mt-0.5">Recently completed layout approvals</p>
            </div>
            <Link href="/admin/projects?status=Approved" className="text-xs font-medium text-blue-600 hover:underline">
              View All
            </Link>
          </div>

          {/* List */}
          <div className="space-y-3 flex-1 mt-2 text-sm">
            {approvedProjects.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-400 font-medium space-y-2">
                <i className="bx bx-check-circle text-3xl text-neutral-200 block mb-2"></i>
                <p className="font-medium">No approved projects yet.</p>
                <p className="text-neutral-300 font-normal">Projects approved by admin will appear here.</p>
              </div>
            ) : (
              approvedProjects.map((p) => {
                const approvedDate = p.updated_at ? new Date(p.updated_at) : null;
                const now = new Date();
                const diffMs = approvedDate ? now.getTime() - approvedDate.getTime() : 0;
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                const timeAgo = !approvedDate
                  ? ''
                  : diffDays === 0
                    ? 'Today'
                    : diffDays === 1
                      ? 'Yesterday'
                      : `${diffDays}d ago`;

                return (
                  <Link
                    key={p.id}
                    href={`/admin/projects/${p.id}`}
                    className="flex items-start justify-between py-2.5 px-3 rounded-md hover:bg-neutral-50 border border-transparent hover:border-neutral-100 transition-all group"
                  >
                    <div className="space-y-0.5 min-w-0 pr-3 flex-1">
                      <div className="flex items-center space-x-1.5 min-w-0">
                        <span
                          className="font-medium text-neutral-800 text-sm group-hover:text-amber-600 transition-colors truncate block"
                          title={p.project_name}
                        >
                          {p.project_name}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 truncate">
                        {p.client_name}
                        {p.project_type ? ` · ${p.project_type}` : ''}
                        {p.area_sq_ft ? ` · ${Number(p.area_sq_ft).toLocaleString()} sq ft` : ''}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-1 shrink-0">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${p.status === 'Closed' ? 'bg-neutral-50 border-neutral-200 text-neutral-600' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                        {p.status === 'Closed' ? 'Closed' : 'Approved'}
                      </span>
                      {timeAgo && (
                        <span className="text-xs text-neutral-350 font-medium">{timeAgo}</span>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Reject Project Modal */}
      {showRejectModal && (
        <Portal>
          <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
            <div className="bg-white border border-neutral-200 rounded-md max-w-md w-full p-6 space-y-4">
              <div>
                <h3 className="text-lg font-medium text-neutral-900">Reject Project Creation</h3>
                <p className="text-sm text-neutral-450 mt-1">Specify why this project cannot be approved. This feedback will be displayed to the submitting architect.</p>
              </div>

              <form onSubmit={handleRejectProject} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1.5">Rejection Reason *</label>
                  <textarea
                    required
                    rows={4}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Please specify correct area dimensions in sq ft and attach updated layout drawings."
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm focus:outline-none focus:bg-white focus:border-rose-500 transition-colors font-medium resize-none"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectingProjId(null);
                      setRejectReason('');
                    }}
                    className="px-4 py-2 border border-neutral-200 hover:bg-neutral-50 rounded-md text-sm font-medium text-neutral-600 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-sm font-medium transition-colors cursor-pointer"
                  >
                    Submit Rejection
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
