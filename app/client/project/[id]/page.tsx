'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ClientProjectApprovalPage({ params }: PageProps) {
  const { id } = use(params);
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any | null>(null);
  const [remarks, setRemarks] = useState<any | null>(null);
  const [preferences, setPreferences] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [architectProfile, setArchitectProfile] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'Overview' | 'Deliverables' | 'Feedback'>('Overview');

  // Modals & form state
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [clientNameInput, setClientNameInput] = useState('');
  const [feedbackNotesInput, setFeedbackNotesInput] = useState('');
  const [approvalNoteInput, setApprovalNoteInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchProjectDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);

      // Fetch project data
      const { data: proj, error: projError } = await supabase
        .from('projects')
        .select('*, pricing_plans(name)')
        .eq('id', id)
        .single();

      if (projError) throw projError;
      setProject(proj);
      if (proj?.client_name) {
        setClientNameInput(proj.client_name);
      }

      // Fetch architect info if available
      if (proj?.architect_id) {
        const { data: arch } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', proj.architect_id)
          .single();
        setArchitectProfile(arch);
      }

      // Fetch project remarks
      const { data: rems } = await supabase
        .from('project_remarks')
        .select('*')
        .eq('project_id', id)
        .single();
      setRemarks(rems);

      // Fetch lighting preferences
      const { data: prefs } = await supabase
        .from('project_lighting_preferences')
        .select('preference_name')
        .eq('project_id', id);
      setPreferences(prefs || []);

      // Fetch files and filter deliverables
      const { data: filesData } = await supabase
        .from('project_files')
        .select('*, profiles:uploaded_by(role)')
        .eq('project_id', id);
      setFiles(filesData || []);

      if (filesData) {
        setDeliverables(filesData.filter((f: any) => f.profiles?.role === 'designer'));
      }

      // Fetch revisions / feedback log
      const { data: revs } = await supabase
        .from('revision_requests')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false });
      setRevisions(revs || []);

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

      if (!res.ok) {
        throw new Error(data.error || 'Failed to record approval');
      }

      setToastMessage({ type: 'success', text: 'Design approved successfully! Your approval has been sent to the architect.' });
      setShowApproveModal(false);
      setApprovalNoteInput('');
      await fetchProjectDetails();

    } catch (err: any) {
      console.error('Approval submission error:', err);
      setToastMessage({ type: 'error', text: err.message || 'Failed to submit approval.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackNotesInput.trim()) {
      setToastMessage({ type: 'error', text: 'Please enter your feedback comments.' });
      return;
    }

    setIsSubmitting(true);
    setToastMessage(null);

    try {
      const res = await fetch('/api/client/approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: id,
          action: 'feedback',
          clientName: clientNameInput || project?.client_name || 'Homeowner',
          feedbackNotes: feedbackNotesInput
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit client feedback');
      }

      setToastMessage({ type: 'success', text: 'Your feedback has been sent directly to your architect!' });
      setShowFeedbackModal(false);
      setFeedbackNotesInput('');
      await fetchProjectDetails();

    } catch (err: any) {
      console.error('Feedback submission error:', err);
      setToastMessage({ type: 'error', text: err.message || 'Failed to submit feedback.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col justify-center items-center p-6 font-sans">
        <div className="flex items-center space-x-3 text-neutral-600">
          <svg className="animate-spin h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-semibold text-neutral-700">Loading Client Approval Portal...</span>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6 font-sans">
        <div className="bg-white border border-neutral-200 rounded-sm p-8 max-w-md text-center space-y-4 shadow-xs">
          <i className="bx bx-error-circle text-4xl text-rose-500"></i>
          <h2 className="text-lg font-bold text-neutral-900">Project Not Found</h2>
          <p className="text-xs text-neutral-500">The design presentation link may be invalid or expired. Please verify with your architect.</p>
        </div>
      </div>
    );
  }

  const isApproved = project.status === 'Approved';
  const hasSubmittedFeedback = project.status === 'Revision Requested' || revisions.some(r => r.description?.includes('CLIENT FEEDBACK:'));

  return (
    <div className="min-h-screen bg-neutral-50/70 text-neutral-800 font-sans selection:bg-amber-500 selection:text-white flex flex-col">
      {/* Top Bar Header */}
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
                Homeowner Review Portal &bull; Architect: <span className="font-semibold text-neutral-700">{architectProfile?.name || 'Architect Partner'}</span>
              </p>
            </div>
          </div>

          {/* Quick Actions Header Buttons */}
          <div className="flex items-center space-x-3">
            {isApproved ? (
              <div className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-sm text-xs font-bold flex items-center space-x-1.5">
                <i className="bx bxs-check-circle text-base text-emerald-600"></i>
                <span>Design Approved</span>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setShowFeedbackModal(true)}
                  className="px-3.5 py-1.5 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 rounded-sm text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <i className="bx bx-comment-detail text-sm text-amber-600"></i>
                  <span>Submit Feedback</span>
                </button>
                <button
                  onClick={() => setShowApproveModal(true)}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-sm text-xs font-semibold transition-all shadow-sm shadow-amber-500/10 flex items-center space-x-1.5 cursor-pointer"
                >
                  <i className="bx bx-check-circle text-base"></i>
                  <span>Approve Design</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">

        {/* Toast Notification Banner */}
        {toastMessage && (
          <div className={`p-4 rounded-sm border text-xs font-semibold flex items-center justify-between animate-fade-in ${
            toastMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <div className="flex items-center space-x-2">
              <i className={`bx ${toastMessage.type === 'success' ? 'bx-check-circle text-base text-emerald-600' : 'bx-error-circle text-base text-rose-600'}`}></i>
              <span>{toastMessage.text}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-neutral-500 hover:text-neutral-900 p-1">
              <i className="bx bx-x text-lg"></i>
            </button>
          </div>
        )}

        {/* Top Status Callout Banner */}
        <div className={`bg-white border rounded-sm p-6 shadow-xs relative overflow-hidden font-sans ${
          isApproved ? 'border-emerald-300 bg-emerald-50/20' : hasSubmittedFeedback ? 'border-amber-300 bg-amber-50/20' : 'border-neutral-200'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2.5">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  isApproved
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : hasSubmittedFeedback
                    ? 'bg-amber-50 border border-amber-200 text-amber-700'
                    : 'bg-blue-50 border border-blue-200 text-blue-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isApproved ? 'bg-emerald-500' : hasSubmittedFeedback ? 'bg-amber-500' : 'bg-blue-500'}`}></span>
                  {isApproved ? 'Approved by Client' : hasSubmittedFeedback ? 'Client Feedback Pending Review' : 'Ready for Client Approval'}
                </span>
                <span className="text-xs text-neutral-400">
                  Updated: {new Date(project.updated_at || project.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <h2 className="text-lg font-bold text-neutral-900">
                {isApproved
                  ? 'Lighting Design Finalized & Approved'
                  : hasSubmittedFeedback
                  ? 'Your feedback is being reviewed by your architect.'
                  : 'Review & Approve Your Lighting Concept'}
              </h2>
              <p className="text-xs text-neutral-500 max-w-2xl leading-relaxed">
                {isApproved
                  ? 'Thank you for approving the lighting design package! The design team and architect are executing final technical documentation and site schedules.'
                  : 'Examine the lighting layout CADs, Lux simulation renders, and BOQ schedule below. Click "Approve Design" to approve, or submit client feedback directly to your architect.'}
              </p>
            </div>

            {!isApproved && (
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <button
                  onClick={() => setShowFeedbackModal(true)}
                  className="px-3.5 py-2 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 font-semibold text-xs rounded-sm transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <i className="bx bx-comment-detail text-sm text-amber-600"></i>
                  <span>Submit Feedback</span>
                </button>
                <button
                  onClick={() => setShowApproveModal(true)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-sm transition-all shadow-sm shadow-amber-500/10 flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <i className="bx bx-check-circle text-base"></i>
                  <span>Approve Design</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Container Card matching Architect Project view */}
        <div className="bg-white border border-neutral-200 rounded-sm py-6 pt-0 font-sans">
          {/* Tabs Menu */}
          <div className="border-b border-neutral-200 mb-6 bg-white flex items-center justify-between pl-6 pr-3 h-14">
            <div className="flex space-x-8 h-full -mb-px">
              {(['Overview', 'Deliverables', 'Feedback'] as const).map((tab) => {
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
                    <span>{tab === 'Feedback' ? 'Feedback Log' : tab}</span>
                    {tab === 'Deliverables' && deliverables.length > 0 && (
                      <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-medium rounded-full ${isCurrent ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 text-neutral-600'}`}>
                        {deliverables.length}
                      </span>
                    )}
                    {tab === 'Feedback' && revisions.length > 0 && (
                      <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-medium rounded-full ${isCurrent ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 text-neutral-600'}`}>
                        {revisions.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {!isApproved && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowApproveModal(true)}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-sm text-xs font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer shadow-sm shadow-amber-500/10"
                >
                  <i className="bx bx-check-circle text-sm"></i>
                  <span>Approve Design</span>
                </button>
              </div>
            )}
          </div>

          {/* Tab Content */}
          <div className="px-6">
            {activeTab === 'Overview' && (
              <div className="space-y-6">
                {/* 3-column parameter grid matching app design system */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                  <div>
                    <span className="text-xs text-neutral-400 font-medium block">Homeowner / Client</span>
                    <span className="text-sm font-semibold text-neutral-800 mt-1 block">{project.client_name}</span>
                  </div>
                  <div>
                    <span className="text-xs text-neutral-400 font-medium block">Project Type</span>
                    <span className="text-sm font-semibold text-neutral-800 mt-1 block">{project.project_type || 'Residential'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-neutral-400 font-medium block">Site Location</span>
                    <span className="text-sm font-semibold text-neutral-800 mt-1 block">{project.site_location || 'N/A'}</span>
                  </div>

                  <div>
                    <span className="text-xs text-neutral-400 font-medium block">Area</span>
                    <span className="text-sm font-semibold text-neutral-800 mt-1 block">{project.area_sq_ft ? `${Number(project.area_sq_ft).toLocaleString()} sq.ft.` : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-neutral-400 font-medium block">Assigned Architect</span>
                    <span className="text-sm font-semibold text-neutral-800 mt-1 block">{architectProfile?.name || 'Architect Partner'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-neutral-400 font-medium block">Approval Status</span>
                    <div className="mt-1 block">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        isApproved ? 'bg-emerald-50 border border-emerald-150 text-emerald-600' : 'bg-blue-50 border border-blue-150 text-blue-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isApproved ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                        {isApproved ? 'Approved' : project.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lighting preferences pills */}
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

                {/* Quick Deliverable Summary */}
                <div className="pt-6 border-t border-neutral-100">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-neutral-450 tracking-wide">Design Deliverables Summary</span>
                    <button
                      onClick={() => setActiveTab('Deliverables')}
                      className="text-xs text-amber-600 hover:text-amber-700 font-semibold flex items-center space-x-1"
                    >
                      <span>View All Deliverables ({deliverables.length})</span>
                      <i className="bx bx-chevron-right"></i>
                    </button>
                  </div>

                  {deliverables.length === 0 ? (
                    <p className="text-xs text-neutral-400 italic">No deliverables available for review yet.</p>
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
                      <div key={file.id} className="flex items-center justify-between p-4 bg-neutral-50 border border-neutral-200 rounded-xl hover:border-l-4 border-amber-500 transition-all">
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

            {activeTab === 'Feedback' && (
              <div className="space-y-4">
                {revisions.length === 0 ? (
                  <div className="py-12 text-center text-sm text-neutral-450 font-medium space-y-2 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                    <i className="bx bx-comment-detail text-3xl text-neutral-300"></i>
                    <p className="font-medium">No client feedback submitted yet.</p>
                    <p className="text-xs text-neutral-400">If you have suggestions or changes, click 'Submit Feedback' above.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {revisions.map((rev) => (
                      <div key={rev.id} className="p-4 bg-neutral-50 border border-neutral-200 rounded-sm space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-neutral-450 font-medium">
                            Submitted: {new Date(rev.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-semibold border ${
                            rev.status === 'resolved' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'
                          }`}>
                            {rev.status === 'resolved' ? 'Addressed by Architect' : 'Under Review'}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-800 font-medium leading-relaxed bg-white p-3 rounded border border-neutral-200 whitespace-pre-line">
                          {rev.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal 1: Approve Design Confirmation */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
          <div className="bg-white border border-neutral-200 rounded-xl max-w-md w-full overflow-hidden shadow-xl p-6 space-y-5">
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
                <label className="text-xs font-semibold text-neutral-700 block mb-1">Appreciation Note for Architect (Optional)</label>
                <textarea
                  rows={3}
                  value={approvalNoteInput}
                  onChange={(e) => setApprovalNoteInput(e.target.value)}
                  placeholder="e.g., The living room moodboard and lighting layout CADs look great! Approved."
                  className="w-full bg-white border border-neutral-200 rounded-md p-3 text-xs text-neutral-800 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                />
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3 text-xs text-emerald-800 leading-relaxed font-medium">
                Confirming approval notifies your architect that the design package is finalized.
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
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
      )}

      {/* Modal 2: Submit Client Feedback */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
          <div className="bg-white border border-neutral-200 rounded-xl max-w-lg w-full overflow-hidden shadow-xl p-6 space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">Submit Client Feedback</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Send design feedback directly to your architect</p>
              </div>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-neutral-100 text-neutral-500 transition-colors cursor-pointer"
              >
                <i className="bx bx-x text-lg"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">Your Name</label>
                <input
                  type="text"
                  value={clientNameInput}
                  onChange={(e) => setClientNameInput(e.target.value)}
                  placeholder="e.g., Homeowner Name"
                  className="w-full bg-white border border-neutral-200 rounded-md px-3 py-2 text-xs text-neutral-800 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">Feedback Comments *</label>
                <textarea
                  rows={4}
                  value={feedbackNotesInput}
                  onChange={(e) => setFeedbackNotesInput(e.target.value)}
                  placeholder="Describe your feedback (e.g., 'We prefer 3000K warm lights in the living room', 'Can we add strip accent lights under the kitchen cabinets?')"
                  className="w-full bg-white border border-neutral-200 rounded-md p-3 text-xs text-neutral-800 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-xs text-amber-800 leading-relaxed font-medium">
                Your architect will review your feedback and coordinate updates with the lighting design team.
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="flex-1 py-2.5 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 font-bold text-xs rounded-sm transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitFeedback}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider rounded-sm transition-all shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-1.5"
              >
                {isSubmitting ? (
                  <span>Sending...</span>
                ) : (
                  <>
                    <i className="bx bx-send text-base"></i>
                    <span>Send to Architect</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
