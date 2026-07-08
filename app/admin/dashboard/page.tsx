'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function AdminDashboard() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState('Super Admin');
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [activeMonth, setActiveMonth] = useState('May');
  const [hoveredRing, setHoveredRing] = useState<string | null>(null);

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

        const { data: projects } = await supabase
          .from('projects')
          .select('id, project_name, client_name, status, created_at, area_sq_ft')
          .order('created_at', { ascending: false })
          .limit(5);

        if (projects && projects.length > 0) {
          setRecentProjects(projects);
        } else {
          setRecentProjects([
            { id: '1', project_name: 'Lotus Penthouse', client_name: 'Vikram Shah', status: 'In Design', area_sq_ft: 1800 },
            { id: '2', project_name: 'Vertex IT Hub', client_name: 'Vertex Corp', status: 'Under Review', area_sq_ft: 12500 },
            { id: '3', project_name: 'Zoya Boutique', client_name: 'Zoya Lifestyle', status: 'Submitted', area_sq_ft: 2200 },
            { id: '4', project_name: 'Orion Workspace', client_name: 'Orion Enterprises', status: 'Approved', area_sq_ft: 8500 },
            { id: '5', project_name: 'Azure Residences', client_name: 'BlueWave Developments', status: 'In Design', area_sq_ft: 4500 }
          ]);
        }
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

  return (
    <div className="space-y-4">

      {/* Top Banner / Hero Card */}
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 text-white rounded-md p-6 flex flex-col md:flex-row md:items-center justify-between border border-neutral-800">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Good morning, {adminName}</h2>
          <p className="text-sm text-neutral-400">
            Today is {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}. You have 3 critical deadlines remaining.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <Link
            href="/admin/projects"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-neutral-950 rounded-md text-sm font-bold transition-all flex items-center space-x-2"
          >
            <i className="bx bx-plus-circle text-base"></i>
            <span>Add Project</span>
          </Link>
          <Link
            href="/admin/users"
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-md text-sm font-semibold border border-neutral-700 transition-all flex items-center space-x-2"
          >
            <i className="bx bx-user-plus text-base"></i>
            <span>Invite Designer</span>
          </Link>
        </div>
      </div>

      {/* Grid of Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        {/* KPI 1 */}
        <div className="bg-white border border-neutral-200 rounded-md p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm font-bold text-neutral-400 block">Revenue Turnover</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl font-black text-neutral-900 font-sans">₹18.6L</span>
              <span className="text-sm font-bold text-emerald-600 font-sans">+14%</span>
            </div>
            <span className="text-sm text-neutral-400 block">vs. ₹16.2L last month</span>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-md flex items-center justify-center text-blue-600 border border-blue-100">
            <i className="bx bx-trending-up text-xl"></i>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-neutral-200 rounded-md p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm font-bold text-neutral-400 block">Design Pipeline</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl font-black text-neutral-900 font-sans">38</span>
              <span className="text-sm font-bold text-cyan-600 font-sans">Active</span>
            </div>
            <span className="text-sm text-neutral-400 block">8 assigned this week</span>
          </div>
          <div className="w-12 h-12 bg-cyan-50 rounded-md flex items-center justify-center text-cyan-600 border border-cyan-100">
            <i className="bx bx-pencil text-xl"></i>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-neutral-200 rounded-md p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm font-bold text-neutral-400 block">Total Logged</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl font-black text-neutral-900 font-sans">247</span>
              <span className="text-sm font-bold text-indigo-600 font-sans">+18 new</span>
            </div>
            <span className="text-sm text-neutral-400 block">Across 12 designers</span>
          </div>
          <div className="w-12 h-12 bg-indigo-50 rounded-md flex items-center justify-center text-indigo-600 border border-indigo-100">
            <i className="bx bx-folder-open text-xl"></i>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border border-neutral-200 rounded-md p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm font-bold text-neutral-400 block">Completed Jobs</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl font-black text-neutral-900 font-sans">189</span>
              <span className="text-sm font-bold text-emerald-600 font-sans">98% rate</span>
            </div>
            <span className="text-sm text-neutral-400 block">Satisfactory delivery rating</span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-md flex items-center justify-center text-emerald-600 border border-emerald-100">
            <i className="bx bx-badge-check text-xl"></i>
          </div>
        </div>

      </div>

      {/* Main Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Left 2 Columns: Financial Overview Chart & Info breakdown */}
        <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-md p-5 flex flex-col space-y-4">
          <div className="flex justify-between items-start pb-3 border-b border-neutral-100">
            <div>
              <h3 className="text-base font-bold text-neutral-900">Revenue Analytics</h3>
              <p className="text-sm text-neutral-400 mt-0.5">Comparing current year turnover vs previous year (in Lakhs)</p>
            </div>
            <div className="flex items-center space-x-3 text-sm font-bold text-neutral-500 mt-0.5">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: '#2563eb' }}></span>
                <span>Current Year</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: '#e2e8f0' }}></span>
                <span>Previous Year</span>
              </div>
            </div>
          </div>

          {/* Premium Diagonal-Striped Rounded Column Chart */}
          <div className="flex space-x-4 items-stretch mt-3 w-full h-94">

            {/* Left Y-axis labels */}
            <div className="flex flex-col justify-between text-xs text-neutral-400 font-bold text-right w-10 pb-8 pt-6">
              <span>₹40L</span>
              <span>₹30L</span>
              <span>₹20L</span>
              <span>₹10L</span>
              <span>₹0</span>
            </div>

            {/* Main chart rendering area */}
            <div className="flex-1 flex flex-col justify-between relative min-w-0">

              {/* Chart Grid Area (Horizontal background lines) */}
              <div className="absolute inset-x-0 bottom-8 top-6 flex flex-col justify-between pointer-events-none">
                <div className="w-full border-b border-neutral-100"></div>
                <div className="w-full border-b border-neutral-100"></div>
                <div className="w-full border-b border-neutral-100"></div>
                <div className="w-full border-b border-neutral-100"></div>
                <div className="w-full border-b border-neutral-100"></div>
              </div>

              {/* Rounded Striped Columns Area */}
              <div className="relative z-10 flex-1 flex items-end justify-between px-2 pt-6 h-full">
                {revenuePoints.map((pt) => {
                  const curHeight = (pt.value / maxVal) * 75;
                  const isActive = activeMonth === pt.month;

                  return (
                    <div
                      key={pt.month}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative mx-1 md:mx-1.5 cursor-pointer"
                      onMouseEnter={() => setActiveMonth(pt.month)}
                    >
                      {/* Active Month Center Value text & Dot Indicator positioned relative to the top of the bar */}
                      {isActive && (
                        <div
                          className="absolute flex flex-col items-center z-35 -translate-x-1/2 left-1/2 mb-1"
                          style={{ bottom: `${curHeight}%` }}
                        >
                          <span className="bg-white text-neutral-900 text-sm font-bold px-2 py-0.5 rounded border border-neutral-200 shadow-sm font-sans whitespace-nowrap">
                            ₹{pt.value.toFixed(1)}L
                          </span>
                          <span className="w-2 h-2 rounded-full bg-blue-500 border-2 border-white ring-1 ring-blue-500 mt-1"></span>
                        </div>
                      )}

                      {/* Pill Shaped Column Bar with repeating pattern */}
                      <div
                        className={`w-4 md:w-12 rounded-[6px] transition-all duration-300 relative border ${isActive
                          ? 'bg-blue-500 border-blue-600 shadow-[0_4px_12px_rgba(59,130,246,0.2)]'
                          : 'bg-neutral-100 border-neutral-200/60 hover:bg-neutral-200/50'
                          }`}
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
              <div className="relative z-10 flex justify-between text-xs font-bold text-neutral-400 pt-2 border-neutral-100 mt-1 px-2">
                {revenuePoints.map((pt) => {
                  const isActive = activeMonth === pt.month;
                  return (
                    <span
                      key={pt.month}
                      className={`flex-1 text-center py-0.5 transition-all duration-200 cursor-pointer ${isActive ? ' text-blue-600 rounded-full font-bold scale-105' : ''
                        }`}
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
            <h3 className="text-base font-bold text-neutral-900">Status Distribution</h3>
            <p className="text-sm text-neutral-400 mt-0.5">Project states allocation index</p>
          </div>
          {/* Pure HTML/CSS Concentric Target Donut Chart */}
          <div className="flex justify-center items-center my-6 h-60 relative">

            {/* Floating Tooltip Indicator */}
            {hoveredRing && (
              <div className="absolute top-2 bg-neutral-900 text-white text-[11px] font-bold px-2.5 py-1.5 rounded shadow-lg z-45 flex items-center space-x-2 whitespace-nowrap transition-all duration-200">
                <span className="w-2.5 h-2.5 rounded-full" style={{
                  backgroundColor: hoveredRing === 'approved' ? '#10b981' : hoveredRing === 'indesign' ? '#06b6d4' : '#3b82f6'
                }}></span>
                <span>
                  {hoveredRing === 'approved' ? 'Approved' : hoveredRing === 'indesign' ? 'In Design' : 'Under Review'}:{' '}
                  {hoveredRing === 'approved' ? '111/247 (45%)' : hoveredRing === 'indesign' ? '37/247 (15%)' : '27/247 (11%)'}
                </span>
              </div>
            )}

            <div className="relative w-56 h-56 flex items-center justify-center">

              {/* Outermost Ring: Approved (45%) */}
              <div
                className={`absolute w-56 h-56 rounded-full cursor-pointer transition-all duration-300 ${hoveredRing && hoveredRing !== 'approved' ? 'opacity-25 scale-95' : 'opacity-100 scale-100 shadow-[0_2px_8px_rgba(16,185,129,0.15)]'
                  }`}
                style={{
                  background: 'conic-gradient(#10b981 0% 45%, #f1f5f9 45% 100%)'
                }}
                onMouseEnter={() => setHoveredRing('approved')}
                onMouseLeave={() => setHoveredRing(null)}
              ></div>

              {/* Outer Mask */}
              <div className="absolute w-[184px] h-[184px] bg-white rounded-full pointer-events-none"></div>

              {/* Middle Ring: In Design (15%) */}
              <div
                className={`absolute w-[152px] h-[152px] rounded-full cursor-pointer transition-all duration-300 ${hoveredRing && hoveredRing !== 'indesign' ? 'opacity-25 scale-95' : 'opacity-100 scale-100 shadow-[0_2px_8px_rgba(6,182,212,0.15)]'
                  }`}
                style={{
                  background: 'conic-gradient(#06b6d4 0% 15%, #f1f5f9 15% 100%)'
                }}
                onMouseEnter={() => setHoveredRing('indesign')}
                onMouseLeave={() => setHoveredRing(null)}
              ></div>

              {/* Middle Mask */}
              <div className="absolute w-[120px] h-[120px] bg-white rounded-full pointer-events-none"></div>

              {/* Innermost Ring: Under Review (11%) */}
              <div
                className={`absolute w-[88px] h-[88px] rounded-full cursor-pointer transition-all duration-300 ${hoveredRing && hoveredRing !== 'underreview' ? 'opacity-25 scale-95' : 'opacity-100 scale-100 shadow-[0_2px_8px_rgba(59,130,246,0.15)]'
                  }`}
                style={{
                  background: 'conic-gradient(#3b82f6 0% 11%, #f1f5f9 11% 100%)'
                }}
                onMouseEnter={() => setHoveredRing('underreview')}
                onMouseLeave={() => setHoveredRing(null)}
              ></div>

              {/* Center Mask & Core Value Display */}
              <div className="absolute w-[56px] h-[56px] bg-white rounded-full flex items-center justify-center shadow-sm pointer-events-none">
                <span className="text-[11px] font-black text-neutral-900 font-sans">247</span>
              </div>
            </div>
          </div>

          {/* Clean Vertical Legend Stack matching mockup formatting */}
          <div className="space-y-3 pt-3 border-t border-neutral-100">
            <div
              className={`flex justify-between items-center text-sm font-semibold cursor-pointer p-1 rounded transition-colors ${hoveredRing === 'approved' ? 'bg-neutral-50' : 'hover:bg-neutral-50/50'
                }`}
              onMouseEnter={() => setHoveredRing('approved')}
              onMouseLeave={() => setHoveredRing(null)}
            >
              <div className="flex items-center space-x-3">
                <span className="w-3.5 h-3.5 rounded-[4px]" style={{ backgroundColor: '#10b981' }}></span>
                <span className="text-neutral-800 font-medium">Approved</span>
              </div>
              <div className="flex items-center space-x-8 font-sans">
                <span className="text-neutral-400">111/247</span>
                <span className="text-neutral-905 font-bold w-10 text-right">45%</span>
              </div>
            </div>
            <div
              className={`flex justify-between items-center text-sm font-semibold cursor-pointer p-1 rounded transition-colors ${hoveredRing === 'indesign' ? 'bg-neutral-50' : 'hover:bg-neutral-50/50'
                }`}
              onMouseEnter={() => setHoveredRing('indesign')}
              onMouseLeave={() => setHoveredRing(null)}
            >
              <div className="flex items-center space-x-3">
                <span className="w-3.5 h-3.5 rounded-[4px]" style={{ backgroundColor: '#06b6d4' }}></span>
                <span className="text-neutral-800 font-medium">In Design</span>
              </div>
              <div className="flex items-center space-x-8 font-sans">
                <span className="text-neutral-400">37/247</span>
                <span className="text-neutral-905 font-bold w-10 text-right">15%</span>
              </div>
            </div>
            <div
              className={`flex justify-between items-center text-sm font-semibold cursor-pointer p-1 rounded transition-colors ${hoveredRing === 'underreview' ? 'bg-neutral-50' : 'hover:bg-neutral-50/50'
                }`}
              onMouseEnter={() => setHoveredRing('underreview')}
              onMouseLeave={() => setHoveredRing(null)}
            >
              <div className="flex items-center space-x-3">
                <span className="w-3.5 h-3.5 rounded-[4px]" style={{ backgroundColor: '#3b82f6' }}></span>
                <span className="text-neutral-800 font-medium">Under Review</span>
              </div>
              <div className="flex items-center space-x-8 font-sans">
                <span className="text-neutral-400">27/247</span>
                <span className="text-neutral-905 font-bold w-10 text-right">11%</span>
              </div>
            </div>
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
                <h3 className="text-sm font-bold text-neutral-900">Active Workspace</h3>
                <p className="text-sm text-neutral-400 mt-0.5">Status overview of client accounts and active scopes</p>
              </div>
              <Link
                href="/admin/projects"
                className="text-sm font-bold text-amber-600 hover:text-amber-700 transition-colors flex items-center space-x-0.5"
              >
                <span>View Full List</span>
                <i className="bx bx-right-arrow-alt text-base"></i>
              </Link>
            </div>

            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 text-neutral-400 font-bold tracking-wider">
                    <th className="pb-3">Project Title</th>
                    <th className="pb-3">Client Representative</th>
                    <th className="pb-3">Total Area</th>
                    <th className="pb-3">Status Pill</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50 text-neutral-700 font-semibold">
                  {recentProjects.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-50/40 transition-colors">
                      <td className="py-3.5 font-bold text-neutral-900">{p.project_name}</td>
                      <td className="py-3.5 text-neutral-500 font-medium">{p.client_name}</td>
                      <td className="py-3.5 text-neutral-400 font-sans">{Number(p.area_sq_ft).toLocaleString()} sq ft</td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded text-sm font-bold border ${p.status === 'Approved' || p.status === 'Closed'
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                          : p.status === 'In Design'
                            ? 'bg-indigo-50 border-indigo-100 text-indigo-700'
                            : p.status === 'Under Review'
                              ? 'bg-blue-50 border-blue-100 text-blue-700'
                              : 'bg-neutral-50 border-neutral-200 text-neutral-600'
                          }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <Link
                          href={`/admin/projects/${p.id}`}
                          className="text-sm font-bold text-neutral-800 hover:text-amber-600 transition-colors"
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

        {/* Live Activity Timeline Feed Card */}
        <div className="bg-white border border-neutral-200 rounded-md p-5 space-y-4 flex flex-col justify-between">
          <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
            <div>
              <h3 className="text-base font-bold text-neutral-900">Live System Logs</h3>
              <p className="text-sm text-neutral-400 mt-0.5">Real-time actions audit feed</p>
            </div>
            <Link href="/admin/notifications" className="text-sm font-bold text-blue-600 hover:underline">
              Audit Logs
            </Link>
          </div>

          {/* Timeline */}
          <div className="relative pl-6 space-y-5 flex-1 mt-2 text-sm">
            <div className="absolute left-[9px] top-2 bottom-2 w-px bg-neutral-100"></div>

            {/* Event 1 */}
            <div className="relative flex items-start space-x-3">
              <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white ring-2 ring-emerald-50"></span>
              <div className="flex-1">
                <p className="font-bold text-neutral-850 text-sm">Blueprints upload synchronized</p>
                <p className="text-sm text-neutral-500 mt-0.5">Lotus Penthouse - lighting calculations added</p>
                <span className="text-sm text-neutral-400 block mt-0.5 font-sans">4 min ago</span>
              </div>
            </div>

            {/* Event 2 */}
            <div className="relative flex items-start space-x-3">
              <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white ring-2 ring-blue-50"></span>
              <div className="flex-1">
                <p className="font-bold text-neutral-850 text-sm">Initial checkout settlement</p>
                <p className="text-sm text-neutral-500 mt-0.5">Payment received ₹8.5L from client Vikram Shah</p>
                <span className="text-sm text-neutral-400 block mt-0.5 font-sans">1 hr ago</span>
              </div>
            </div>

            {/* Event 3 */}
            <div className="relative flex items-start space-x-3">
              <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-white ring-2 ring-amber-50"></span>
              <div className="flex-1">
                <p className="font-bold text-neutral-850 text-sm">Project status shifted to In Design</p>
                <p className="text-sm text-neutral-500 mt-0.5">Assigned to design supervisor Rohan Varma</p>
                <span className="text-sm text-neutral-400 block mt-0.5 font-sans">3 hrs ago</span>
              </div>
            </div>

            {/* Event 4 */}
            <div className="relative flex items-start space-x-3">
              <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-neutral-900 border-2 border-white ring-2 ring-neutral-100"></span>
              <div className="flex-1">
                <p className="font-bold text-neutral-850 text-sm">New onboarding invitation</p>
                <p className="text-sm text-neutral-500 mt-0.5">Access sent to end client for onboarding setup</p>
                <span className="text-sm text-neutral-400 block mt-0.5 font-sans">7 hrs ago</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
