'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from '@/utils/supabase/client';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Statuses where client can take action (approve)
const REVIEW_READY_STATUSES = ['Ready for Client Review', 'Revision Requested', 'Approved'];

export default function ClientProjectApprovalPage({ params }: PageProps) {
  const { id } = use(params);
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any | null>(null);
  const [remarks, setRemarks] = useState<any | null>(null);
  const [preferences, setPreferences] = useState<any[]>([]);
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [architectProfile, setArchitectProfile] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'Overview' | 'Deliverables'>('Overview');

  // Approve modal state
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [clientNameInput, setClientNameInput] = useState('');
  const [approvalNoteInput, setApprovalNoteInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchProjectDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);

      const { data: proj, error: projError } = await supabase
        .from('projects')
        .select('*, pricing_plans(name)')
        .eq('id', id)
        .single();

      if (projError) throw projError;
      setProject(proj);
      if (proj?.client_name) setClientNameInput(proj.client_name);

      if (proj?.architect_id) {
        const { data: arch } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', proj.architect_id)
          .single();
        setArchitectProfile(arch);
      }

      const { data: rems } = await supabase
        .from('project_remarks')
        .select('*')
        .eq('project_id', id)
        .single();
      setRemarks(rems);

      const { data: prefs } = await supabase
        .from('project_lighting_preferences')
        .select('preference_name')
        .eq('project_id', id);
      setPreferences(prefs || []);

      const { data: filesData } = await supabase
        .from('project_files')
        .select('*, profiles:uploaded_by(role)')
        .eq('project_id', id);

      if (filesData) {
        setDeliverables(filesData.filter((f: any) => f.category === 'deliverable' || f.profiles?.role === 'designer'));
      }

    } catch (err: any) {
      console.error('Error loading client project portal:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const getFileIcon = (category: string) => {
    switch (category) {
      case 'deliverable_report': return 'bx bxs-file-pdf text-red-600';
      case 'deliverable_lux': return 'bx bxs-pie-chart-alt-2 text-blue-600';
      case 'deliverable_boq': return 'bx bxs-spreadsheet text-amber-600';
      case 'deliverable_layout': return 'bx bxs-image text-purple-600';
      default: return 'bx bxs-file text-neutral-500';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'deliverable_report': return 'Design Report';
      case 'deliverable_lux': return 'Lux Simulation';
      case 'deliverable_boq': return 'BOQ Schedule';
      case 'deliverable_layout': return 'Layout CAD / Image';
      default: return 'Asset File';
    }
  };

  const getDownloadUrl = (filePath: string) => {
    return supabase.storage.from('project-assets').getPublicUrl(filePath).data.publicUrl;
  };

  const handleApproveDesign = async () => {
    setIsSubmitting(true);
    setToastMessage(null);
    try {
      const res = await fetch('/api/client/approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: id,
          action: 'approve',
          clientName: clientNameInput || project?.client_name || 'Homeowner',
          feedbackNotes: approvalNoteInput
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record approval');
      setToastMessage({ type: 'success', text: 'Design approved successfully! Your approval has been sent to the architect.' });
      setShowApproveModal(false);
      setApprovalNoteInput('');
      await fetchProjectDetails();
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to submit approval.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col justify-center items-center p-6 font-sans">
        <div className="flex items-center space-x-3 text-neutral-600">
          <svg className="animate-spin h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-semibold text-neutral-700">Loading Design Portal...</span>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6 font-sans">
        <div className="bg-white border border-neutral-200 rounded-xl p-10 max-w-md text-center space-y-4 shadow-sm">
          <i className="bx bx-error-circle text-5xl text-rose-400"></i>
          <h2 className="text-lg font-bold text-neutral-900">Project Not Found</h2>
          <p className="text-xs text-neutral-500">The design presentation link may be invalid or expired. Please verify with your architect.</p>
        </div>
      </div>
    );
  }

  const isApproved = project.status === 'Approved';
  const isReadyForReview = REVIEW_READY_STATUSES.includes(project.status);

  // ── Design Not Ready ─────────────────────────────────────────────────────
  if (!isReadyForReview) {
    const statusLabel: Record<string, { icon: string; label: string; desc: string; color: string }> = {
      'Submitted': {
        icon: 'bx-check-circle',
        label: 'Project Submitted',
        desc: 'Your project has been submitted and is waiting for the team to begin the review process.',
        color: 'blue'
      },
      'Payment Pending': {
        icon: 'bx-credit-card',
        label: 'Payment Pending',
        desc: 'Your project is on hold pending payment confirmation from your architect.',
        color: 'amber'
      },
      'Under Review': {
        icon: 'bx-search-alt',
        label: 'Under Review',
        desc: 'Our team is reviewing your project brief and technical requirements.',
        color: 'blue'
      },
      'In Design': {
        icon: 'bx-palette',
        label: 'Design In Progress',
        desc: 'Our lighting design team is actively working on your project. We\'ll notify you when the design is ready for your review.',
        color: 'violet'
      },
      'Closed': {
        icon: 'bx-archive',
        label: 'Project Closed',
        desc: 'This project has been closed. Please contact your architect for more information.',
        color: 'neutral'
      },
    };

    const statusInfo = statusLabel[project.status] || {
      icon: 'bx-time-five',
      label: 'Design In Progress',
      desc: 'Your project is being worked on. You\'ll be notified when the design is ready for your review.',
      color: 'blue'
    };

    const colorMap: Record<string, string> = {
      blue: 'bg-blue-50 border-blue-200 text-blue-700',
      amber: 'bg-amber-50 border-amber-200 text-amber-700',
      violet: 'bg-violet-50 border-violet-200 text-violet-700',
      neutral: 'bg-neutral-100 border-neutral-200 text-neutral-600',
    };

    const iconBg: Record<string, string> = {
      blue: 'bg-blue-50 border-blue-200 text-blue-500',
      amber: 'bg-amber-50 border-amber-200 text-amber-500',
      violet: 'bg-violet-50 border-violet-200 text-violet-500',
      neutral: 'bg-neutral-100 border-neutral-200 text-neutral-500',
    };

    const dotColor: Record<string, string> = {
      blue: 'bg-blue-500',
      amber: 'bg-amber-500',
      violet: 'bg-violet-500',
      neutral: 'bg-neutral-400',
    };

    return (
      <div className="min-h-screen bg-neutral-50/70 font-sans flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-neutral-200/80 px-6 py-4 sticky top-0 z-30 shadow-xs">
          <div className="max-w-3xl mx-auto flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center text-white shadow-sm shadow-amber-500/20 font-black text-lg">
              <i className="bx bxs-bulb"></i>
            </div>
            <div>
              <h1 className="text-base font-bold text-neutral-900 tracking-tight leading-tight">{project.project_name}</h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                Homeowner Review Portal · Architect: <span className="font-semibold text-neutral-700">{architectProfile?.name || 'Architect Partner'}</span>
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full space-y-4">
            {/* Status card */}
            <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />
              <div className="p-8 text-center space-y-4">
                <div className={`w-16 h-16 rounded-2xl border mx-auto flex items-center justify-center ${iconBg[statusInfo.color]}`}>
                  <i className={`bx ${statusInfo.icon} text-3xl`}></i>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-center space-x-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${colorMap[statusInfo.color]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse ${dotColor[statusInfo.color]}`}></span>
                      {project.status}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-neutral-900 mt-2">{statusInfo.label}</h2>
                  <p className="text-sm text-neutral-500 leading-relaxed max-w-sm mx-auto">{statusInfo.desc}</p>
                </div>
              </div>
            </div>

            {/* Project info mini card */}
            <div className="bg-white border border-neutral-200 rounded-xl p-4 space-y-3">
              <p className="text-[11px] font-bold text-neutral-400 tracking-wide uppercase">Project Details</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Client', val: project.client_name },
                  { label: 'Plan', val: project.pricing_plans?.name || 'Standard' },
                  { label: 'Type', val: project.project_type || 'Residential' },
                  { label: 'Location', val: project.site_location || 'N/A' },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-[10px] text-neutral-400 font-medium">{item.label}</p>
                    <p className="text-xs font-semibold text-neutral-800 mt-0.5">{item.val}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-center text-xs text-neutral-400">
              You'll receive a notification from your architect once the design is ready for review.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // ── Main Review Portal (design is ready or approved) ─────────────────────
  return (
    <div className="min-h-screen bg-neutral-50/70 text-neutral-800 font-sans selection:bg-amber-500 selection:text-white flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-neutral-200/80 px-6 py-4 sticky top-0 z-30 shadow-xs flex-shrink-0">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center text-white shadow-sm shadow-amber-500/20 font-black text-lg">
              <i className="bx bxs-bulb"></i>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-semibold text-neutral-900 tracking-tight leading-tight">{project.project_name}</h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 border border-amber-150 text-amber-700">
                  {project.pricing_plans?.name || 'Standard Plan'}
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Homeowner Review Portal · Architect: <span className="font-semibold text-neutral-700">{architectProfile?.name || 'Architect Partner'}</span>
              </p>
            </div>
          </div>

          {/* Single header action */}
          {isApproved ? (
            <div className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-sm text-xs font-bold flex items-center space-x-1.5">
              <i className="bx bxs-check-circle text-base text-emerald-600"></i>
              <span>Design Approved</span>
            </div>
          ) : (
            <button
              onClick={() => setShowApproveModal(true)}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-sm text-xs font-semibold transition-all shadow-sm shadow-amber-500/10 flex items-center space-x-1.5 cursor-pointer"
            >
              <i className="bx bx-check-circle text-base"></i>
              <span>Approve Design</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">

        {/* Toast */}
        {toastMessage && (
          <div className={`p-4 rounded-sm border text-xs font-semibold flex items-center justify-between ${
            toastMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <div className="flex items-center space-x-2">
              <i className={`bx ${toastMessage.type === 'success' ? 'bx-check-circle text-emerald-600' : 'bx-error-circle text-rose-600'} text-base`}></i>
              <span>{toastMessage.text}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-neutral-500 hover:text-neutral-900 p-1">
              <i className="bx bx-x text-lg"></i>
            </button>
          </div>
        )}

        {/* Status Banner */}
        <div className={`bg-white border rounded-sm p-6 shadow-xs relative overflow-hidden ${
          isApproved ? 'border-emerald-300 bg-emerald-50/20' : 'border-amber-200 bg-amber-50/10'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2.5">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  isApproved
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : 'bg-amber-50 border border-amber-200 text-amber-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isApproved ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
                  {isApproved ? 'Approved by Client' : 'Ready for Your Approval'}
                </span>
                <span className="text-xs text-neutral-400">
                  Updated: {new Date(project.updated_at || project.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <h2 className="text-lg font-bold text-neutral-900">
                {isApproved ? 'Lighting Design Finalized & Approved' : 'Review & Approve Your Lighting Design'}
              </h2>
              <p className="text-xs text-neutral-500 max-w-2xl leading-relaxed">
                {isApproved
                  ? 'Thank you for approving the lighting design package! The design team and architect are executing final technical documentation and site schedules.'
                  : 'Examine the lighting layout CADs, Lux simulation renders, and BOQ schedule below. Once you\'re satisfied, click "Approve Design" to finalize.'}
              </p>
            </div>

            {!isApproved && (
              <button
                onClick={() => setShowApproveModal(true)}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-sm transition-all shadow-sm shadow-amber-500/10 flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
              >
                <i className="bx bx-check-circle text-base"></i>
                <span>Approve Design</span>
              </button>
            )}
          </div>
        </div>

        {/* Tabs Card */}
        <div className="bg-white border border-neutral-200 rounded-sm py-6 pt-0 font-sans">
          {/* Tab bar */}
          <div className="border-b border-neutral-200 mb-6 bg-white flex items-center pl-6 pr-3 h-14">
            <div className="flex space-x-8 h-full -mb-px">
              {(['Overview', 'Deliverables'] as const).map((tab) => {
                const isCurrent = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`h-full text-sm font-semibold transition-all relative flex items-center space-x-1.5 border-b-2 cursor-pointer ${
                      isCurrent ? 'text-amber-600 border-amber-600' : 'text-neutral-500 hover:text-neutral-800 border-transparent'
                    }`}
                  >
                    <span>{tab}</span>
                    {tab === 'Deliverables' && deliverables.length > 0 && (
                      <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-medium rounded-full ${isCurrent ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 text-neutral-600'}`}>
                        {deliverables.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="px-6">
            {activeTab === 'Overview' && (
              <div className="space-y-6">
                {/* Project params grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                  {[
                    { label: 'Homeowner / Client', val: project.client_name },
                    { label: 'Project Type', val: project.project_type || 'Residential' },
                    { label: 'Site Location', val: project.site_location || 'N/A' },
                    { label: 'Area', val: project.area_sq_ft ? `${Number(project.area_sq_ft).toLocaleString()} sq.ft.` : 'N/A' },
                    { label: 'Assigned Architect', val: architectProfile?.name || 'Architect Partner' },
                  ].map((item) => (
                    <div key={item.label}>
                      <span className="text-xs text-neutral-400 font-medium block">{item.label}</span>
                      <span className="text-sm font-semibold text-neutral-800 mt-1 block">{item.val}</span>
                    </div>
                  ))}
                  <div>
                    <span className="text-xs text-neutral-400 font-medium block">Approval Status</span>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        isApproved ? 'bg-emerald-50 border border-emerald-150 text-emerald-600' : 'bg-amber-50 border border-amber-150 text-amber-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isApproved ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                        {isApproved ? 'Approved' : project.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lighting Preferences */}
                <div className="pt-6 border-t border-neutral-100">
                  <span className="text-xs font-bold text-neutral-450 tracking-wide block mb-3">Lighting Preferences</span>
                  {preferences.length === 0 ? (
                    <p className="text-xs text-neutral-400 italic">No specific preferences selected.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {preferences.map((pref) => (
                        <span
                          key={pref.preference_name}
                          className="px-3.5 py-1.5 border border-amber-500/30 text-amber-650 rounded-full text-xs font-semibold bg-amber-50/30"
                        >
                          {pref.preference_name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Additional Design Remarks */}
                {remarks && (
                  <div className="pt-6 border-t border-neutral-100">
                    <span className="text-xs font-bold text-neutral-450 tracking-wide block mb-4">Additional Design Remarks</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                      {[
                        { label: 'Lighting Mood', val: remarks.lighting_mood },
                        { label: 'Expectations', val: remarks.expectations },
                        { label: 'Inspiration Ideas', val: remarks.inspiration_ideas },
                        { label: 'Functional Requirements', val: remarks.functional_requirements }
                      ].filter(item => item.val).map((item, idx) => (
                        <div key={idx}>
                          <span className="text-xs text-neutral-400 font-medium block">{item.label}</span>
                          <span className="text-sm font-semibold text-neutral-800 mt-1 block whitespace-pre-line">{item.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Deliverables quick summary */}
                <div className="pt-6 border-t border-neutral-100">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-neutral-450 tracking-wide">Design Deliverables Summary</span>
                    <button
                      onClick={() => setActiveTab('Deliverables')}
                      className="text-xs text-amber-600 hover:text-amber-700 font-semibold flex items-center space-x-1"
                    >
                      <span>View All ({deliverables.length})</span>
                      <i className="bx bx-chevron-right"></i>
                    </button>
                  </div>
                  {deliverables.length === 0 ? (
                    <p className="text-xs text-neutral-400 italic">No deliverables available yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {deliverables.slice(0, 4).map((file) => (
                        <div key={file.id} className="flex justify-between items-center p-3 bg-neutral-50 border border-neutral-200 rounded-sm hover:border-neutral-300 transition-colors">
                          <div className="flex items-center space-x-3 overflow-hidden">
                            <div className="w-9 h-9 bg-white border border-neutral-200 rounded-lg flex items-center justify-center flex-shrink-0">
                              <i className={`${getFileIcon(file.category)} text-lg`}></i>
                            </div>
                            <div className="overflow-hidden min-w-0">
                              <p className="font-semibold text-neutral-800 text-xs truncate">{file.file_name}</p>
                              <p className="text-[9px] text-neutral-400 mt-0.5 font-medium">{getCategoryLabel(file.category)}</p>
                            </div>
                          </div>
                          <a
                            href={getDownloadUrl(file.file_path)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 font-semibold text-xs rounded-sm transition-colors flex-shrink-0 cursor-pointer"
                          >
                            Download
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'Deliverables' && (
              <div className="space-y-4">
                {deliverables.length === 0 ? (
                  <div className="py-12 text-center text-sm text-neutral-450 font-medium space-y-2 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                    <i className="bx bx-file-blank text-3xl text-neutral-300"></i>
                    <p className="font-medium">Deliverables will appear here once ready.</p>
                    <p className="text-xs text-neutral-400">Our design team is preparing the deliverables for your review.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {deliverables.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-4 bg-neutral-50 border border-neutral-200 rounded-xl hover:border-amber-300 transition-all">
                        <div className="flex items-center space-x-3 overflow-hidden">
                          <div className="w-10 h-10 rounded-lg bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0">
                            <i className={`${getFileIcon(file.category)} text-xl`}></i>
                          </div>
                          <div className="overflow-hidden min-w-0">
                            <p className="font-semibold text-neutral-800 text-sm truncate">{file.file_name}</p>
                            <p className="text-[10px] text-neutral-450 mt-0.5 font-medium">{getCategoryLabel(file.category)}</p>
                          </div>
                        </div>
                        <a
                          href={getDownloadUrl(file.file_path)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg flex items-center justify-center text-neutral-600 hover:text-neutral-900 transition-colors flex-shrink-0 cursor-pointer"
                          title="Download Deliverable"
                        >
                          <i className="bx bx-download text-sm"></i>
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Approve Design Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white border border-neutral-200 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />
            <div className="p-6 space-y-5">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">Approve Lighting Design</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Confirm design approval for {project.project_name}</p>
                </div>
                <button
                  onClick={() => setShowApproveModal(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-neutral-100 text-neutral-500 transition-colors cursor-pointer"
                >
                  <i className="bx bx-x text-lg"></i>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">Homeowner / Client Name</label>
                  <input
                    type="text"
                    value={clientNameInput}
                    onChange={(e) => setClientNameInput(e.target.value)}
                    placeholder="e.g., Client Name"
                    className="w-full bg-white border border-neutral-200 rounded-md px-3 py-2 text-xs text-neutral-800 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">Note for Architect <span className="font-normal text-neutral-400">(Optional)</span></label>
                  <textarea
                    rows={3}
                    value={approvalNoteInput}
                    onChange={(e) => setApprovalNoteInput(e.target.value)}
                    placeholder="e.g., The layout and lux simulation look great. Approved!"
                    className="w-full bg-white border border-neutral-200 rounded-md p-3 text-xs text-neutral-800 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                  />
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3 text-xs text-emerald-800 leading-relaxed font-medium">
                  Confirming approval notifies your architect that the design package is finalized.
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-1">
                <button
                  onClick={() => setShowApproveModal(false)}
                  className="flex-1 py-2.5 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 font-bold text-xs rounded-sm transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApproveDesign}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-sm transition-all shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  {isSubmitting ? (
                    <span>Submitting...</span>
                  ) : (
                    <>
                      <i className="bx bx-check text-base"></i>
                      <span>Confirm Approval</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
