'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import CustomSelect from '../../../../components/ui/CustomSelect';
import Portal from '@/components/ui/Portal';

export default function AdminProjectDetail() {
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any | null>(null);
  const [remarks, setRemarks] = useState<any | null>(null);
  const [preferences, setPreferences] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'Overview' | 'Deliverables' | 'Revisions'>('Overview');
  const [architects, setArchitects] = useState<any[]>([]);
  const [designers, setDesigners] = useState<any[]>([]);

  // Form states
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [architectId, setArchitectId] = useState('');
  const [assignedDesignerId, setAssignedDesignerId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [updating, setUpdating] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (!id) return;

    async function fetchProjectDetails() {
      try {
        // 1. Fetch project primary details
        const { data: proj, error: projError } = await supabase
          .from('projects')
          .select('*, pricing_plans(name)')
          .eq('id', id)
          .single();

        if (projError) throw projError;
        setProject(proj);
        setStatus(proj.status);
        setPaymentStatus(proj.payment_status || 'pending');
        setArchitectId(proj.architect_id || '');
        setAssignedDesignerId(proj.assigned_designer_id || '');
        setDeadline(proj.deadline ? new Date(proj.deadline).toISOString().substring(0, 10) : '');

        // 2. Fetch remarks
        const { data: rems } = await supabase
          .from('project_remarks')
          .select('*')
          .eq('project_id', id)
          .single();
        setRemarks(rems);

        // 3. Fetch lighting preferences
        const { data: prefs } = await supabase
          .from('project_lighting_preferences')
          .select('preference_name')
          .eq('project_id', id);
        setPreferences(prefs || []);

        // 4. Fetch uploaded files
        const { data: filesData } = await supabase
          .from('project_files')
          .select('*, profiles:uploaded_by(role)')
          .eq('project_id', id);
        setFiles(filesData || []);

        if (filesData) {
          setDeliverables(filesData.filter(f => f.profiles?.role === 'designer'));
        }

        // Fetch revision requests
        const { data: revs } = await supabase
          .from('revision_requests')
          .select('*')
          .eq('project_id', id)
          .order('created_at', { ascending: false });
        setRevisions(revs || []);

        // 5. Fetch profiles who can be assigned as architects (role: architect)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, role')
          .eq('role', 'architect');
        setArchitects(profiles || []);

        // 6. Fetch profiles who can be assigned as designers (role: designer)
        const { data: designerProfiles } = await supabase
          .from('profiles')
          .select('id, name, role')
          .eq('role', 'designer');
        setDesigners(designerProfiles || []);

      } catch (err) {
        console.error('Error fetching project detail:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProjectDetails();
  }, [id, supabase]);

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setSaveMessage('');

    try {
      // 1. Update project details
      const { error } = await supabase
        .from('projects')
        .update({
          status: status,
          architect_id: architectId || null,
          assigned_designer_id: assignedDesignerId || null,
          deadline: deadline ? new Date(deadline).toISOString() : null,
          payment_status: paymentStatus,
        })
        .eq('id', id);

      if (error) throw error;

      // 2. Update payments table status
      await supabase
        .from('payments')
        .update({
          status: paymentStatus === 'paid' ? 'completed' : 'pending',
          transaction_id: paymentStatus === 'paid' ? `manual_${Date.now()}` : null,
        })
        .eq('project_id', id);

      setSaveMessage('Changes saved successfully!');

      // Update local project object
      setProject((prev: any) => ({
        ...prev,
        status,
        payment_status: paymentStatus,
        architect_id: architectId || null,
        assigned_designer_id: assignedDesignerId || null,
        deadline: deadline ? new Date(deadline).toISOString() : null,
      }));
    } catch (err: any) {
      setSaveMessage(`Error: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleApprove = async () => {
    if (!assignedDesignerId) {
      alert('Please select and assign a designer before approving the project.');
      return;
    }
    setUpdating(true);
    setSaveMessage('');
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          status: 'Under Review',
          assigned_designer_id: assignedDesignerId
        })
        .eq('id', id);

      if (error) throw error;

      setStatus('Under Review');
      setProject((prev: any) => ({
        ...prev,
        status: 'Under Review',
        assigned_designer_id: assignedDesignerId
      }));
      setSaveMessage('Project approved and designer assigned successfully!');
    } catch (err: any) {
      setSaveMessage('Error: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) return;

    setUpdating(true);
    setSaveMessage('');
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          status: 'Revision Requested',
          project_notes: `Rejection Reason: ${rejectReason}`
        })
        .eq('id', id);

      if (error) throw error;

      setStatus('Revision Requested');
      setProject((prev: any) => ({
        ...prev,
        status: 'Revision Requested',
        project_notes: `Rejection Reason: ${rejectReason}`
      }));
      setSaveMessage('Revision requested successfully!');
      setShowRejectModal(false);
      setRejectReason('');
    } catch (err: any) {
      setSaveMessage('Error: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleApproveRevision = async (revId: string) => {
    setUpdating(true);
    setSaveMessage('');
    try {
      const { error: revErr } = await supabase
        .from('revision_requests')
        .update({ status: 'approved' })
        .eq('id', revId);
      if (revErr) throw revErr;

      const { error: projErr } = await supabase
        .from('projects')
        .update({ status: 'In Design' })
        .eq('id', id);
      if (projErr) throw projErr;

      setStatus('In Design');
      setProject((prev: any) => ({ ...prev, status: 'In Design' }));
      setRevisions(prev => prev.map((r: any) => r.id === revId ? { ...r, status: 'approved' } : r));
      setSaveMessage('Revision approved — designer has been notified to work on changes.');
    } catch (err: any) {
      setSaveMessage('Error: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeclineRevision = async (revId: string) => {
    setUpdating(true);
    setSaveMessage('');
    try {
      const { error } = await supabase
        .from('revision_requests')
        .update({ status: 'declined' })
        .eq('id', revId);
      if (error) throw error;

      setRevisions(prev => prev.map((r: any) => r.id === revId ? { ...r, status: 'declined' } : r));
      setSaveMessage('Revision request declined.');
    } catch (err: any) {
      setSaveMessage('Error: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const getFileIcon = (category: string) => {
    switch (category) {
      case 'deliverable_report': return 'bx bxs-file-pdf text-red-600';
      case 'deliverable_lux': return 'bx bxs-pie-chart-alt-2 text-blue-600';
      case 'deliverable_boq': return 'bx bxs-spreadsheet text-emerald-600';
      case 'deliverable_layout': return 'bx bxs-image text-purple-600';
      default: return 'bx bxs-file text-neutral-605';
    }
  };

  const getCategoryLabel = (category: string, role?: string) => {
    if (role && role !== 'designer') {
      switch (category) {
        case 'deliverable_layout': return 'Architectural Layout';
        case 'deliverable_boq': return 'Electrical Grid Map';
        case 'deliverable_lux': return 'Moodboard Reference';
        case 'deliverable_report': return 'Other Reference File';
        default: return 'Asset File';
      }
    }
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

  if (!project) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 text-red-800 rounded-md text-sm">
        Project not found or you are not authorized to view it.
      </div>
    );
  }

  const steps = [
    { name: 'Onboarded', statusKey: 'Submitted' },
    { name: 'Reviewing', statusKey: 'Under Review' },
    { name: 'Designing', statusKey: 'In Design' },
    { name: 'Client Feedback', statusKey: 'Ready for Client Review' },
    { name: 'Completed', statusKey: 'Approved' }
  ];

  const getActiveStepIndex = () => {
    switch (status) {
      case 'Submitted': return 0;
      case 'Payment Pending': return 0;
      case 'Under Review': return 1;
      case 'In Design': return 2;
      case 'Revision Requested': return 2;
      case 'Ready for Client Review': return 3;
      case 'Approved': return 4;
      case 'Closed': return 4;
      default: return 0;
    }
  };
  const activeStepIndex = getActiveStepIndex();

  return (
    <div className="space-y-6">
      {/* Secondary Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border-b border-neutral-100 px-6 py-4 gap-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/admin/projects"
            className="w-9 h-9 rounded-md border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:border-neutral-350 hover:bg-neutral-55 transition-all cursor-pointer"
            title="Back to Directory"
          >
            <i className="bx bx-arrow-back text-lg"></i>
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-medium text-neutral-900 font-sans tracking-tight">{project.project_name}</h2>
              <span className="text-xs px-2.5 py-0.5 bg-neutral-100 border border-neutral-200 text-neutral-600 rounded-md font-medium">
                {project.project_id_serial || 'KL-XXXX'}
              </span>
            </div>
            <p className="text-xs text-neutral-450 font-medium mt-0.5">Project ID: {project.id}</p>
          </div>
        </div>

        <Link
          href={`/admin/projects/${project.id}/deliverables`}
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-medium text-sm rounded-md transition-all cursor-pointer"
        >
          <i className="bx bx-folder-open text-base"></i>
          <span>Manage Deliverables</span>
        </Link>
      </div>

      {status === 'Submitted' && (
        <div className="bg-amber-50/20 border border-amber-200/80 rounded-md p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-amber-950 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span>Pending Project Approval</span>
            </h3>
            <p className="text-xs text-amber-800 font-medium font-sans">This project creation request requires approval. Assign a designer to approve and move to layout phase, or request revisions.</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
            <div className="w-48">
              <CustomSelect
                value={assignedDesignerId}
                onChange={setAssignedDesignerId}
                options={[
                  { value: '', label: 'Select Designer...' },
                  ...designers.map((des) => ({ value: des.id, label: des.name }))
                ]}
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleApprove}
                disabled={updating || !assignedDesignerId}
                className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-md text-xs font-medium transition-colors disabled:opacity-50 flex items-center space-x-1 cursor-pointer"
              >
                <i className="bx bx-check text-sm"></i>
                <span>Approve & Assign</span>
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={updating}
                className="px-3.5 py-2 border border-rose-200 hover:bg-rose-50 text-rose-700 rounded-md text-xs font-medium transition-colors disabled:opacity-50 flex items-center space-x-1 cursor-pointer"
              >
                <i className="bx bx-x text-sm"></i>
                <span>Request Revision</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {status === 'Revision Requested' && (
        <div className="bg-rose-50 border border-rose-200 rounded-md p-4 flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-full bg-rose-500 text-white flex items-center justify-center flex-shrink-0">
            <i className="bx bx-x text-lg"></i>
          </div>
          <div>
            <h4 className="text-sm font-medium text-rose-950">Project Revision Requested (Rejected)</h4>
            <p className="text-xs text-rose-700 font-medium font-sans mt-0.5">
              {project.project_notes && project.project_notes.startsWith('Rejection Reason:')
                ? project.project_notes.replace('Rejection Reason:', '').trim()
                : project.project_notes || 'Revision feedback provided to submitting architect.'}
            </p>
          </div>
        </div>
      )}

      {(status === 'Approved' || status === 'Closed') && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-md p-4 flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
            <i className="bx bx-check text-lg"></i>
          </div>
          <div>
            <h4 className="text-sm font-medium text-emerald-950">Project Approved</h4>
            <p className="text-xs text-emerald-700 font-medium font-sans mt-0.5">This design project has been finalized and approved by the administrator.</p>
          </div>
        </div>
      )}

      {/* Workflow Progress Stepper */}
      <div className="bg-white border border-neutral-200 rounded-md p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex-shrink-0">
            <span className="text-md font-medium text-neutral-800 block">Workflow Milestone</span>
            <div className="flex items-center mt-1.5 space-x-2">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${status === 'Approved' || status === 'Closed' ? 'bg-emerald-50 border-emerald-200/60 text-emerald-700' : status === 'Revision Requested' ? 'bg-rose-50 border-rose-200/60 text-rose-700' : 'bg-amber-50 border-amber-200/60 text-amber-700'}`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status === 'Approved' || status === 'Closed' ? 'bg-emerald-500 animate-pulse' : status === 'Revision Requested' ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'}`}></span>
                {status}
              </span>
              {status === 'Payment Pending' && (
                <span className="text-xs text-rose-600 font-medium flex items-center bg-rose-50/50 border border-rose-100 rounded-md px-2.5 py-1">
                  <i className="bx bx-error-circle mr-1 text-sm"></i> Awaiting Payment
                </span>
              )}
            </div>
          </div>
          <div className="flex-1 max-w-3xl flex items-center justify-between relative py-4 overflow-x-auto no-scrollbar">
            {steps.map((step, idx) => {
              const isCompleted = idx < activeStepIndex;
              const isActive = idx === activeStepIndex;
              return (
                <div key={step.name} className="flex-1 flex flex-col items-center relative min-w-[70px]">
                  {/* Connecting Line to next step */}
                  {idx < steps.length - 1 && (
                    <div className={`absolute top-[16px] left-[50%] w-full h-[2px] z-0 ${idx < activeStepIndex ? 'bg-amber-500' : 'bg-neutral-200'}`} />
                  )}
                  {/* Circle Dot */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-sans text-xs font-medium relative z-10 transition-all duration-300 ${isCompleted ? 'bg-amber-500 border-amber-500 text-white' : isActive ? 'bg-neutral-900 border-neutral-900 text-white ring-4 ring-neutral-900/10' : 'bg-white border-neutral-200 text-neutral-400'}`}>
                    {isCompleted ? <i className="bx bx-check text-base"></i> : idx + 1}
                  </div>
                  <span className={`text-[10px] sm:text-xs mt-2 font-medium transition-colors duration-200 text-center relative z-10 ${isActive ? 'text-neutral-900 font-medium' : isCompleted ? 'text-neutral-600 font-medium' : 'text-neutral-400 font-medium'}`}>
                    {step.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Grid: Split Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Details & Tab Container */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-neutral-200 rounded-md overflow-hidden">
            {/* Tabs Header */}
            <div className="border-b border-neutral-200 bg-neutral-50/10 px-4">
              <div className="flex space-x-6 -mb-px">
                {['Overview', 'Deliverables', 'Revisions'].map((tab) => {
                  const isCurrent = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab as any)}
                      className={`py-3.5 px-1 text-sm font-medium transition-all cursor-pointer border-b-2 relative flex items-center space-x-1.5 ${isCurrent ? 'text-amber-600 border-amber-500' : 'text-neutral-500 hover:text-neutral-900 border-transparent hover:border-neutral-200'}`}
                    >
                      <span>{tab}</span>
                      {tab === 'Deliverables' && deliverables.length > 0 && (
                        <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-medium rounded-full transition-colors ${isCurrent ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 text-neutral-600'}`}>
                          {deliverables.length}
                        </span>
                      )}
                      {tab === 'Revisions' && revisions.length > 0 && (
                        <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-medium rounded-full transition-colors ${isCurrent ? 'bg-rose-100 text-rose-700' : 'bg-neutral-100 text-neutral-600'}`}>
                          {revisions.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'Overview' && (
                <div className="space-y-6">
                  {/* Parameter Grid */}
                  <div>
                    <div className="flex items-center space-x-2 border-b border-neutral-100 pb-3 mb-4">
                      <i className="bx bx-slider text-neutral-400 text-lg"></i>
                      <h3 className="text-xs font-medium text-neutral-450">
                        Project Parameters
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: 'End Client Name', val: project.client_name, icon: 'bx-user' },
                        { label: 'Project Type', val: project.project_type || 'N/A', icon: 'bx-category-alt' },
                        { label: 'Site Location', val: project.site_location || 'N/A', icon: 'bx-map' },
                        { label: 'Delivery Timeline', val: project.timeline || 'N/A', icon: 'bx-time-five' },
                        { label: 'Total Area', val: project.area_sq_ft ? `${Number(project.area_sq_ft).toLocaleString()} sq ft` : 'N/A', icon: 'bx-area' },
                        { label: 'Budget Range', val: project.budget_range || 'N/A', icon: 'bx-wallet' },
                        { label: 'Style Preference', val: project.style_preference || 'N/A', icon: 'bx-palette' },
                        { label: 'Pricing Tier', val: project.pricing_plans?.name || 'N/A', icon: 'bx-crown' }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-neutral-50/50 border border-neutral-200/60 rounded-md p-4 flex items-center space-x-3.5 hover: transition-all duration-200">
                          <div className="w-10 h-10 rounded-md bg-white border border-neutral-200/60 flex items-center justify-center text-neutral-500 flex-shrink-0">
                            <i className={`bx ${item.icon} text-lg`}></i>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-medium text-neutral-400">{item.label}</p>
                            <p className="font-medium text-neutral-800 mt-0.5 truncate text-sm" title={String(item.val)}>{item.val}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {project.project_notes && (
                      <div className="mt-6 pt-5 border-t border-neutral-100">
                        <p className="text-[10px] font-medium text-neutral-450 mb-3 flex items-center">
                          <i className="bx bx-note mr-1 text-sm"></i> Project Notes
                        </p>
                        <div className="bg-amber-50/10 border-l-4 border-amber-500 rounded-r-md p-4 text-sm font-medium text-neutral-700 leading-relaxed bg-neutral-50/30">
                          {project.project_notes}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Additional Remarks Block */}
                  {remarks && (
                    <div className="pt-6 border-t border-neutral-100">
                      <div className="flex items-center space-x-2 pb-3 mb-4">
                        <i className="bx bx-comment-detail text-neutral-400 text-lg"></i>
                        <h3 className="text-xs font-medium text-neutral-450">
                          Additional Design Remarks
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { label: 'Lighting Mood', val: remarks.lighting_mood, icon: 'bx-bulb' },
                          { label: 'Expectations', val: remarks.expectations, icon: 'bx-compass' },
                          { label: 'Inspiration Ideas', val: remarks.inspiration_ideas, icon: 'bx-heart' },
                          { label: 'Functional Requirements', val: remarks.functional_requirements, icon: 'bx-list-check' }
                        ].filter(item => item.val).map((item, idx) => (
                          <div key={idx} className="bg-neutral-50/40 p-4 rounded-md border border-neutral-200/60 relative overflow-hidden group hover:bg-neutral-50/70 transition-colors">
                            <i className={`bx ${item.icon} absolute right-3.5 top-3.5 text-neutral-200 text-2xl group-hover:text-amber-500/20 transition-colors`}></i>
                            <p className="text-[10px] font-medium text-neutral-400">{item.label}</p>
                            <p className="text-neutral-750 mt-2 leading-relaxed text-sm font-medium whitespace-pre-line">{item.val}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lighting Preferences Tags */}
                  <div className="pt-6 border-t border-neutral-100">
                    <h3 className="text-xs font-medium text-neutral-450 pb-3 flex items-center">
                      <i className="bx bx-tag mr-1 text-sm"></i> Lighting Preferences
                    </h3>

                    {preferences.length === 0 ? (
                      <p className="text-sm text-neutral-400 font-medium italic bg-neutral-50 border border-neutral-100 rounded-md p-3">No specific lighting preferences selected.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {preferences.map((pref) => (
                          <span
                            key={pref.preference_name}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-md text-xs font-medium text-neutral-700 hover:border-amber-500/40 transition-colors"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            <span>{pref.preference_name}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Uploaded Onboarding Files */}
                  <div className="pt-6 border-t border-neutral-100">
                    <h3 className="text-xs font-medium text-neutral-450 pb-3 flex items-center">
                      <i className="bx bx-paperclip mr-1 text-sm"></i> Uploaded Onboarding Files
                    </h3>

                    {files.filter(f => f.profiles?.role !== 'designer').length === 0 ? (
                      <p className="text-sm text-neutral-400 font-medium italic bg-neutral-50 border border-neutral-100 rounded-md p-3">No onboarding documents uploaded.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {files.filter(f => f.profiles?.role !== 'designer').map((file) => (
                          <div key={file.id} className="flex justify-between items-center p-3.5 bg-neutral-50 border border-neutral-200/70 rounded-md hover:border-neutral-300 transition-colors">
                            <div className="flex items-center space-x-3 overflow-hidden">
                              <div className="w-9 h-9 bg-white border border-neutral-100 rounded-md flex items-center justify-center text-neutral-450 flex-shrink-0">
                                <i className="bx bx-file text-xl"></i>
                              </div>
                              <div className="overflow-hidden min-w-0">
                                <p className="font-medium text-neutral-800 text-sm truncate">{file.file_name}</p>
                                <p className="text-[10px] text-neutral-405 mt-0.5 font-medium">
                                  {file.file_type} • {getCategoryLabel(file.category, file.profiles?.role)}
                                </p>
                              </div>
                            </div>
                            <a
                              href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${file.file_path}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 font-medium text-xs rounded-md transition-colors flex-shrink-0 cursor-pointer"
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
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4">
                    <h3 className="text-xs font-medium text-neutral-450">
                      Design Deliverables
                    </h3>
                    <Link
                      href={`/admin/projects/${project.id}/deliverables`}
                      className="text-xs font-medium text-amber-600 hover:text-amber-700 flex items-center space-x-1"
                    >
                      <i className="bx bx-edit"></i>
                      <span>Edit Deliverables</span>
                    </Link>
                  </div>
                  {deliverables.length === 0 ? (
                    <div className="py-12 text-center text-sm text-neutral-450 font-medium space-y-2 bg-neutral-50/50 rounded-md border border-dashed border-neutral-200">
                      <i className="bx bx-file-blank text-3xl text-neutral-300"></i>
                      <p className="font-medium">No deliverables uploaded yet.</p>
                      <p className="text-xs text-neutral-400">Upload reports, BOQs, lux simulations, or CAD layouts.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {deliverables.map((file) => {
                        const getCategoryBorder = (cat: string) => {
                          switch (cat) {
                            case 'deliverable_report': return 'border-l-4 border-red-500';
                            case 'deliverable_lux': return 'border-l-4 border-blue-500';
                            case 'deliverable_boq': return 'border-l-4 border-emerald-500';
                            case 'deliverable_layout': return 'border-l-4 border-purple-500';
                            default: return 'border-l-4 border-neutral-450';
                          }
                        };
                        return (
                          <div key={file.id} className={`flex items-center justify-between p-4 bg-neutral-50/50 border border-neutral-200 rounded-md hover: transition-all ${getCategoryBorder(file.category)}`}>
                            <div className="flex items-center space-x-3 overflow-hidden">
                              <div className="w-10 h-10 rounded-md bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0">
                                <i className={`${getFileIcon(file.category)} text-xl`}></i>
                              </div>
                              <div className="overflow-hidden min-w-0">
                                <p className="font-medium text-neutral-800 text-sm truncate">{file.file_name}</p>
                                <p className="text-[10px] text-neutral-405 mt-0.5 font-medium">{getCategoryLabel(file.category, file.profiles?.role)}</p>
                              </div>
                            </div>
                            <a
                              href={getDownloadUrl(file.file_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-8 h-8 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-md flex items-center justify-center text-neutral-600 hover:text-neutral-900 transition-colors flex-shrink-0 cursor-pointer"
                              title="Download Deliverable"
                            >
                              <i className="bx bx-download text-sm"></i>
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'Revisions' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-medium text-neutral-450 border-b border-neutral-100 pb-3 mb-4">
                    Revision Requests
                  </h3>
                  {revisions.length === 0 ? (
                    <div className="py-12 text-center text-sm text-neutral-450 font-medium space-y-2 bg-neutral-50/50 rounded-md border border-dashed border-neutral-200">
                      <i className="bx bx-comment-detail text-3xl text-neutral-300"></i>
                      <p className="font-medium">No revision requests submitted.</p>
                      <p className="text-xs text-neutral-400">Requests from architects will appear here in chronological order.</p>
                    </div>
                  ) : (
                    <div className="relative pl-6 border-l-2 border-neutral-100 space-y-6">
                      {revisions.map((rev) => {
                        const [architectRequest, designerNotesPart] = (rev.description || '').split('\n\n=== DESIGNER_RESOLUTION ===\n');
                        const isResolved = !!designerNotesPart;
                        const isPending = rev.status === 'pending';
                        const isApprovedForwarded = rev.status === 'approved' && !isResolved;

                        return (
                          <div key={rev.id} className={`relative border p-4 rounded-md space-y-3 transition-colors ${isPending ? 'bg-amber-50/30 border-amber-200 hover:border-amber-300' : isResolved ? 'bg-emerald-50/20 border-emerald-100' : 'bg-neutral-50/50 border-neutral-200'}`}>
                            {/* Dot Accent */}
                            <div className={`absolute -left-[31px] top-4 w-2.5 h-2.5 rounded-full ring-4 ring-white ${isPending ? 'bg-amber-500 animate-pulse' : isResolved ? 'bg-emerald-500' : isApprovedForwarded ? 'bg-blue-400' : 'bg-neutral-400'}`}></div>

                            <div className="flex justify-between items-start text-xs">
                              <div className="space-y-0.5">
                                <span className="font-medium text-neutral-500 block">Requested: {new Date(rev.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              </div>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border uppercase tracking-wide ${isPending ? 'bg-amber-50 border-amber-100 text-amber-700' : isResolved ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : isApprovedForwarded ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                                {isPending ? '⏳ Pending Review' : isResolved ? '✓ Resolved by Designer' : isApprovedForwarded ? '→ Forwarded to Designer' : 'Declined'}
                              </span>
                            </div>

                            {/* Architect's revision request */}
                            <div className="bg-white border border-neutral-100 rounded-md p-3 space-y-1">
                              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide block">Architect's Request</span>
                              <p className="font-medium text-neutral-800 leading-relaxed text-sm">{architectRequest}</p>
                            </div>

                            {/* Designer's resolution note */}
                            {designerNotesPart && (
                              <div className="bg-emerald-50 border border-emerald-100 rounded-md p-3 space-y-1">
                                <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide block">Designer's Resolution Note</span>
                                <p className="text-sm text-emerald-800 font-medium leading-relaxed">{designerNotesPart}</p>
                              </div>
                            )}

                            {/* Approve / Decline buttons for pending revisions */}
                            {rev.status === 'pending' && (
                              <div className="flex items-center space-x-2 pt-1">
                                <button
                                  onClick={() => handleApproveRevision(rev.id)}
                                  disabled={updating}
                                  className="flex-1 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-md transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                                >
                                  <i className="bx bx-check text-sm"></i>
                                  <span>Approve & Forward to Designer</span>
                                </button>
                                <button
                                  onClick={() => handleDeclineRevision(rev.id)}
                                  disabled={updating}
                                  className="px-3 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-medium rounded-md transition-colors flex items-center space-x-1 disabled:opacity-50 cursor-pointer"
                                >
                                  <i className="bx bx-x text-sm"></i>
                                  <span>Decline</span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Actions & Configuration Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-neutral-200 rounded-md p-6 space-y-6 sticky top-4">
            <div className="flex items-center space-x-2 border-b border-neutral-100 pb-3">
              <i className="bx bx-cog text-neutral-450 text-base"></i>
              <h3 className="text-sm font-medium text-neutral-900">
                Management Controls
              </h3>
            </div>

            {saveMessage && (
              <div className={`p-3.5 rounded-md text-xs font-medium border ${saveMessage.startsWith('Error') ? 'bg-rose-50 border-rose-250 text-rose-800' : 'bg-emerald-50 border-emerald-250 text-emerald-800'}`}>
                <div className="flex items-center space-x-1.5">
                  <i className={`bx ${saveMessage.startsWith('Error') ? 'bx-error-circle' : 'bx-check-circle'} text-base`}></i>
                  <span>{saveMessage}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveChanges} className="space-y-5">
              <div>
                <label className="block text-[10px] font-medium text-neutral-500 mb-1.5">
                  Project Status
                </label>
                <CustomSelect
                  value={status}
                  onChange={setStatus}
                  options={[
                    { value: 'Submitted', label: 'Submitted' },
                    { value: 'Payment Pending', label: 'Payment Pending' },
                    { value: 'Under Review', label: 'Under Review' },
                    { value: 'In Design', label: 'In Design' },
                    { value: 'Ready for Client Review', label: 'Ready for Client Review' },
                    { value: 'Revision Requested', label: 'Revision Requested' },
                    { value: 'Approved', label: 'Approved' },
                    { value: 'Closed', label: 'Closed' }
                  ]}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-neutral-500 mb-1.5">
                  Payment Status
                </label>
                <CustomSelect
                  value={paymentStatus}
                  onChange={setPaymentStatus}
                  options={[
                    { value: 'pending', label: 'Pending (Pay Later)' },
                    { value: 'paid', label: 'Paid (Mark Completed)' },
                    { value: 'failed', label: 'Failed' }
                  ]}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-neutral-500 mb-1.5">
                  Assign Architect
                </label>
                <CustomSelect
                  value={architectId}
                  onChange={setArchitectId}
                  options={[
                    { value: '', label: 'Unassigned' },
                    ...architects.map((arc) => ({ value: arc.id, label: arc.name }))
                  ]}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-neutral-500 mb-1.5">
                  Assign Designer
                </label>
                <CustomSelect
                  value={assignedDesignerId}
                  onChange={setAssignedDesignerId}
                  options={[
                    { value: '', label: 'Unassigned' },
                    ...designers.map((des) => ({ value: des.id, label: des.name }))
                  ]}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-neutral-500 mb-1.5">
                  Target Deadline
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm text-neutral-800 focus:outline-none focus:bg-white focus:border-amber-500 transition-all font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={updating}
                className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs rounded-md transition-all duration-200 disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-1.5 active:scale-[0.99]"
              >
                {updating ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <i className="bx bx-save text-base"></i>
                    <span>Save Configuration</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {showRejectModal && (
        <Portal>
          <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
            <div className="bg-white border border-neutral-200 rounded-md max-w-md w-full p-6 space-y-4">
              <div>
                <h3 className="text-lg font-medium text-neutral-900">Reject Project Creation</h3>
                <p className="text-sm text-neutral-455 mt-1">Specify why this project cannot be approved. This feedback will be displayed to the submitting architect.</p>
              </div>

              <form onSubmit={handleRejectSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1.5">Rejection Reason *</label>
                  <textarea
                    required
                    rows={4}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Please specify correct area dimensions in sq ft and attach updated layout drawings."
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm focus:outline-none focus:bg-white focus:border-rose-550 transition-colors font-medium resize-none"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRejectModal(false);
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
