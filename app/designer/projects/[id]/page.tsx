'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import CustomSelect from '../../../../components/ui/CustomSelect';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DesignerProjectDetail({ params }: PageProps) {
  const { id } = use(params);
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any | null>(null);
  const [remarks, setRemarks] = useState<any | null>(null);
  const [preferences, setPreferences] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'Overview' | 'Deliverables' | 'Revisions'>('Overview');

  // Management / Upload states
  const [status, setStatus] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'deliverable_report' | 'deliverable_boq' | 'deliverable_lux' | 'deliverable_layout'>('deliverable_report');
  
  // Designer revision submit states
  const [designerNotes, setDesignerNotes] = useState('');
  const [submittingRevision, setSubmittingRevision] = useState(false);

  // Confirm delete states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<{ id: string; filePath: string } | null>(null);

  useEffect(() => {
    if (!id) return;

    async function fetchProjectDetails() {
      try {
        const res = await fetch(`/api/designer/projects/${id}`);
        const resData = await res.json();

        if (resData.error) throw new Error(resData.error);

        setProject(resData.project);
        setStatus(resData.project.status);
        setRemarks(resData.remarks);
        setPreferences(resData.preferences);
        setFiles(resData.files);

        setDeliverables(resData.files.filter((f: any) => f.profiles?.role === 'designer'));
        setRevisions(resData.revisions);
      } catch (err: any) {
        console.error('Error fetching designer project detail:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProjectDetails();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true);
    setActionMessage('');
    try {
      const res = await fetch('/api/designer/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: id, status: newStatus })
      });
      const resData = await res.json();

      if (resData.error) throw new Error(resData.error);

      setStatus(newStatus);
      setProject((prev: any) => ({ ...prev, status: newStatus }));
      setActionMessage('Status updated successfully!');
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err: any) {
      console.error('Error updating status:', err);
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSubmitRevisionNotes = async (e: React.FormEvent, revId: string) => {
    e.preventDefault();
    if (!designerNotes.trim()) return;

    setSubmittingRevision(true);
    setActionMessage('');

    try {
      const res = await fetch(`/api/designer/projects/${id}/revision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revisionId: revId, designerNotes: designerNotes.trim() })
      });
      const resData = await res.json();

      if (resData.error) throw new Error(resData.error);

      // Local state updates — status stays 'approved', resolution tracked via description
      setRevisions(prev =>
        prev.map(r =>
          r.id === revId
            ? { ...r, description: `${r.description || ''}\n\n=== DESIGNER_RESOLUTION ===\n${designerNotes.trim()}` }
            : r
        )
      );
      setStatus('Ready for Client Review');
      setProject((prev: any) => ({ ...prev, status: 'Ready for Client Review' }));
      setDesignerNotes('');
      setActionMessage('Revision submitted! Project is now Ready for Client Review.');
    } catch (err: any) {
      console.error('Error submitting revision notes:', err);
      setActionMessage(`Error: ${err.message || 'Failed to submit'}`);
    } finally {
      setSubmittingRevision(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setActionMessage('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('category', selectedCategory);

      const res = await fetch(`/api/designer/projects/${id}/upload`, {
        method: 'POST',
        body: formData,
      });
      const resData = await res.json();

      if (resData.error) throw new Error(resData.error);

      setDeliverables((prev) => [...prev, resData.fileRecord]);
      setActionMessage('Deliverable uploaded successfully!');
      setSelectedFile(null);

      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (err: any) {
      console.error(err);
      setActionMessage(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDeliverable = (fileId: string, filePath: string) => {
    setFileToDelete({ id: fileId, filePath });
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    const { id: fileId, filePath } = fileToDelete;
    setActionMessage('');

    try {
      const res = await fetch(`/api/designer/projects/${id}/upload`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId, filePath }),
      });
      const resData = await res.json();

      if (resData.error) throw new Error(resData.error);

      setDeliverables((prev) => prev.filter((d) => d.id !== fileId));
      setActionMessage('Deliverable deleted successfully!');
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err: any) {
      setActionMessage(`Delete error: ${err.message}`);
    } finally {
      setFileToDelete(null);
      setDeleteConfirmOpen(false);
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
    <div className="space-y-6 font-sans">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border-b border-neutral-100 px-6 py-4 mx-[-12px] md:mx-[-16px] mt-[-12px] md:mt-[-16px] gap-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/designer/projects"
            className="w-9 h-9 rounded-md border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:border-neutral-350 hover:bg-neutral-55 transition-all cursor-pointer"
            title="Back to Directory"
          >
            <i className="bx bx-arrow-back text-lg"></i>
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-medium text-neutral-900 tracking-tight">{project.project_name}</h1>
              <span className="text-xs px-2.5 py-0.5 bg-neutral-100 border border-neutral-200 text-neutral-600 rounded-md font-medium">
                {project.project_id_serial || 'Generating ID...'}
              </span>
            </div>
            <p className="text-xs text-neutral-450 font-medium mt-0.5">Client: {project.client_name}</p>
          </div>
        </div>

        <Link
          href="/designer/projects"
          className="px-4 py-2 bg-neutral-950 hover:bg-neutral-850 text-white font-medium text-sm rounded-md transition-all flex items-center space-x-1.5 cursor-pointer active:scale-[0.98]"
        >
          <i className="bx bx-arrow-back text-sm"></i>
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Workflow Progress Stepper */}
      <div className="bg-white border border-neutral-200 rounded-md p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex-shrink-0">
            <span className="text-sm font-medium text-neutral-800 block">Workflow Milestone</span>
            <div className="flex items-center mt-1.5 space-x-2">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${
                project.status === 'Approved' || project.status === 'Closed' 
                  ? 'bg-emerald-50 border-emerald-200/60 text-emerald-700' 
                  : project.status === 'Revision Requested' 
                  ? 'bg-rose-50 border-rose-200/60 text-rose-700' 
                  : 'bg-amber-50 border-amber-200/60 text-amber-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                  project.status === 'Approved' || project.status === 'Closed' 
                    ? 'bg-emerald-500 animate-pulse' 
                    : project.status === 'Revision Requested' 
                    ? 'bg-rose-500' 
                    : 'bg-amber-500 animate-pulse'
                }`}></span>
                {project.status === 'Submitted' ? 'Pending' : project.status}
              </span>
              {project.status === 'Payment Pending' && (
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
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-sans text-xs font-medium relative z-10 transition-all duration-300 ${ isCompleted ? 'bg-amber-500 border-amber-500 text-white' : isActive ? 'bg-neutral-900 border-neutral-900 text-white ring-4 ring-neutral-900/10' : 'bg-white border-neutral-200 text-neutral-400' }`}>
                    {isCompleted ? <i className="bx bx-check text-base"></i> : idx + 1}
                  </div>
                  <span className={`text-[10px] sm:text-xs mt-2 font-medium transition-colors duration-200 text-center relative z-10 ${ isActive ? 'text-neutral-900 font-medium' : isCompleted ? 'text-neutral-600 font-medium' : 'text-neutral-400 font-medium' }`}>
                    {step.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* Revision Notification Alert */}
      {revisions.some((r) => r.status === 'approved') && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex items-start space-x-3.5 animate-pulse-subtle">
          <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center flex-shrink-0">
            <i className="bx bx-error-alt text-lg"></i>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-amber-900">Action Required: Project Revision Requested</h4>
            <p className="text-xs text-amber-700 font-medium font-sans mt-0.5">
              The admin has approved a revision request from the architect. Please inspect the requirements in the 
              <button 
                onClick={() => setActiveTab('Revisions')} 
                className="text-amber-800 underline font-semibold hover:text-amber-950 ml-1"
              >
                Revisions Tab
              </button>, update the layout/files accordingly, and submit your revision notes to notify the client.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Specifications and tabs */}
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
                      className={`py-3.5 px-1 text-sm font-medium transition-all cursor-pointer border-b-2 relative flex items-center space-x-1.5 ${ isCurrent ? 'text-amber-600 border-amber-500' : 'text-neutral-500 hover:text-neutral-900 border-transparent hover:border-neutral-200' }`}
                    >
                      <span>{tab}</span>
                      {tab === 'Deliverables' && deliverables.length > 0 && (
                        <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-medium rounded-full transition-colors ${ isCurrent ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 text-neutral-600' }`}>
                          {deliverables.length}
                        </span>
                      )}
                      {tab === 'Revisions' && revisions.length > 0 && (
                        <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-medium rounded-full transition-colors ${ isCurrent ? 'bg-rose-100 text-rose-700' : 'bg-neutral-100 text-neutral-600' }`}>
                          {revisions.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab content */}
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
                            <p className="font-medium text-neutral-805 mt-0.5 truncate text-sm" title={String(item.val)}>{item.val}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {project.project_notes && (
                      <div className="mt-6 pt-5 border-t border-neutral-100">
                        <p className="text-[10px] font-medium text-neutral-455 mb-3 flex items-center">
                          <i className="bx bx-note mr-1 text-sm"></i> Project Notes
                        </p>
                        <div className="bg-amber-50/10 border-l-4 border-amber-500 rounded-r-md p-4 text-sm font-medium text-neutral-700 leading-relaxed bg-neutral-50/30">
                          {project.project_notes}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Lighting Preferences Tags */}
                  <div className="pt-6 border-t border-neutral-100">
                    <h3 className="text-xs font-medium text-neutral-450 pb-3 flex items-center">
                      <i className="bx bx-tag mr-1 text-sm"></i> Lighting Preferences
                    </h3>
                    
                    {preferences.length === 0 ? (
                      <p className="text-sm text-neutral-450 font-medium italic bg-neutral-50 border border-neutral-100 rounded-md p-3">No specific lighting preferences selected.</p>
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

                  {/* Uploaded Onboarding Files */}
                  <div className="pt-6 border-t border-neutral-100">
                    <h3 className="text-xs font-medium text-neutral-450 pb-3 flex items-center">
                      <i className="bx bx-paperclip mr-1 text-sm"></i> Uploaded Onboarding Files
                    </h3>
                    
                    {files.filter(f => f.profiles?.role !== 'designer').length === 0 ? (
                      <p className="text-sm text-neutral-455 font-medium italic bg-neutral-50 border border-neutral-100 rounded-md p-3">No onboarding documents uploaded.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {files.filter(f => f.profiles?.role !== 'designer').map((file) => (
                          <div key={file.id} className="flex justify-between items-center p-3.5 bg-neutral-50 border border-neutral-200/70 rounded-md hover:border-neutral-300 transition-colors">
                            <div className="flex items-center space-x-3 overflow-hidden">
                              <div className="w-9 h-9 bg-white border border-neutral-100 rounded-md flex items-center justify-center text-neutral-455 flex-shrink-0">
                                <i className="bx bx-file text-xl"></i>
                              </div>
                              <div className="overflow-hidden min-w-0">
                                <p className="font-medium text-neutral-805 text-sm truncate">{file.file_name}</p>
                                <p className="text-[10px] text-neutral-405 mt-0.5 font-medium">{file.file_type} • {getCategoryLabel(file.category, file.profiles?.role)}</p>
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
                <div className="space-y-6">
                  {/* Upload Deliverable Section */}
                  <div className="bg-neutral-50/30 border border-neutral-200 rounded-md p-5 space-y-4">
                    <h4 className="text-xs font-medium text-neutral-800 flex items-center">
                      <i className="bx bx-upload mr-1.5 text-base text-amber-500"></i>
                      Upload Design Deliverable
                    </h4>

                    <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                      <div className="md:col-span-4">
                        <label className="block text-[10px] font-medium text-neutral-500 mb-1.5">
                          Deliverable Category
                        </label>
                        <CustomSelect
                          value={selectedCategory}
                          onChange={(val) => setSelectedCategory(val as any)}
                          options={[
                            { value: 'deliverable_report', label: 'Design Report (PDF)' },
                            { value: 'deliverable_lux', label: 'Lux Simulation (PDF)' },
                            { value: 'deliverable_boq', label: 'BOQ Schedule (Excel/PDF)' },
                            { value: 'deliverable_layout', label: 'Layout CAD / Image' }
                          ]}
                          className="w-full"
                        />
                      </div>

                      <div className="md:col-span-5">
                        <label className="block text-[10px] font-medium text-neutral-500 mb-1.5">
                          Select Document
                        </label>
                        <input
                          id="file-input"
                          type="file"
                          required
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                          className="w-full text-xs text-neutral-700 bg-white border border-neutral-200 rounded-md p-2 focus:outline-none file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-neutral-900 file:text-white hover:file:bg-neutral-800 transition-colors"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <button
                          type="submit"
                          disabled={uploading || !selectedFile}
                          className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-medium text-xs rounded-md transition-colors flex items-center justify-center space-x-1.5 active:scale-[0.98] cursor-pointer"
                        >
                          {uploading ? (
                            <>
                              <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                              </svg>
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <i className="bx bx-cloud-upload text-sm"></i>
                              <span>Upload Asset</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>

                  <h3 className="text-xs font-medium text-neutral-450 border-b border-neutral-100 pb-3 pt-2">
                    Current Deliverables
                  </h3>

                  {deliverables.length === 0 ? (
                    <div className="py-12 text-center text-sm text-neutral-455 font-medium space-y-2 bg-neutral-50/50 rounded-md border border-dashed border-neutral-200">
                      <i className="bx bx-file-blank text-3xl text-neutral-300"></i>
                      <p className="font-medium">No deliverables uploaded yet.</p>
                      <p className="text-xs text-neutral-400">Add documents using the form above.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {deliverables.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-4 bg-neutral-50 border border-neutral-200 rounded-md hover: transition-all border-l-4 border-amber-500">
                          <div className="flex items-center space-x-3 overflow-hidden">
                            <div className="w-10 h-10 rounded-md bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0">
                              <i className={`${getFileIcon(file.category)} text-xl`}></i>
                            </div>
                            <div className="overflow-hidden min-w-0">
                              <p className="font-medium text-neutral-805 text-sm truncate">{file.file_name}</p>
                              <p className="text-[10px] text-neutral-455 mt-0.5 font-medium">{getCategoryLabel(file.category, file.profiles?.role)}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <a
                              href={getDownloadUrl(file.file_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-8 h-8 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-md flex items-center justify-center text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
                              title="Download"
                            >
                              <i className="bx bx-download text-sm"></i>
                            </a>
                            <button
                              onClick={() => handleDeleteDeliverable(file.id, file.file_path)}
                              className="w-8 h-8 bg-white hover:bg-red-50 hover:text-red-600 border border-neutral-200 hover:border-red-200 rounded-md flex items-center justify-center text-neutral-455 transition-all cursor-pointer"
                              title="Delete Deliverable"
                            >
                              <i className="bx bx-trash text-sm"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'Revisions' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-medium text-neutral-450 border-b border-neutral-100 pb-3 mb-4">
                    Revision Requests & Feedback
                  </h3>
                  {revisions.length === 0 ? (
                    <div className="py-12 text-center text-sm text-neutral-450 font-medium space-y-2 bg-neutral-50/50 rounded-md border border-dashed border-neutral-200">
                      <i className="bx bx-comment-detail text-3xl text-neutral-300"></i>
                      <p className="font-medium">No revision requests received.</p>
                      <p className="text-xs text-neutral-400">Requests from the architect or client will be displayed here.</p>
                    </div>
                  ) : (
                    <div className="relative pl-6 border-l-2 border-neutral-100 space-y-6">
                      {revisions.map((rev) => {
                        const [architectRequest, designerNotesPart] = (rev.description || '').split('\n\n=== DESIGNER_RESOLUTION ===\n');
                        const isResolved = !!designerNotesPart;
                        const isApproved = rev.status === 'approved' && !isResolved;
                        
                        return (
                          <div 
                            key={rev.id} 
                            className={`relative border p-4 rounded-md space-y-4 transition-colors ${
                              isApproved 
                                ? 'bg-amber-50/30 border-amber-200 ring-2 ring-amber-500/10' 
                                : isResolved 
                                ? 'bg-emerald-50/20 border-emerald-100' 
                                : 'bg-neutral-50/50 border-neutral-200'
                            }`}
                          >
                            {/* Dot Accent */}
                            <div className={`absolute -left-[31px] top-4.5 w-2.5 h-2.5 rounded-full ring-4 ring-white ${
                              isApproved ? 'bg-amber-500 animate-pulse' : isResolved ? 'bg-emerald-500' : 'bg-neutral-400'
                            }`}></div>
                            
                            <div className="flex justify-between items-start text-xs">
                              <div className="space-y-0.5">
                                <span className="font-medium text-neutral-400 block">
                                  Requested: {new Date(rev.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-semibold border uppercase tracking-wider ${
                                isApproved 
                                  ? 'bg-amber-50 border-amber-100 text-amber-700' 
                                  : isResolved 
                                  ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                                  : rev.status === 'declined' 
                                  ? 'bg-rose-50 border-rose-100 text-rose-700' 
                                  : 'bg-neutral-50 border-neutral-200 text-neutral-600'
                              }`}>
                                {isApproved ? '⚠️ Action Required' : isResolved ? '✓ Resolved' : rev.status}
                              </span>
                            </div>

                            {/* Architect request description */}
                            <div className="bg-white border border-neutral-100 rounded-md p-3">
                              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide block mb-1">Architect's Request</span>
                              <p className="font-medium text-neutral-800 leading-relaxed text-sm">{architectRequest}</p>
                            </div>

                            {/* Designer Notes if completed */}
                            {designerNotesPart && (
                              <div className="bg-emerald-50/50 border border-emerald-100 rounded-md p-3">
                                <span className="text-[10px] font-bold text-emerald-650 uppercase tracking-wide block mb-1">Your Fixes / Response</span>
                                <p className="text-sm text-emerald-800 font-medium leading-relaxed">{designerNotesPart}</p>
                              </div>
                            )}

                            {/* Submit form if revision is active & approved */}
                            {isApproved && (
                              <form onSubmit={(e) => handleSubmitRevisionNotes(e, rev.id)} className="space-y-3 pt-1 border-t border-amber-100/50">
                                <div>
                                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wide mb-1.5">
                                    Describe your changes / fixes *
                                  </label>
                                  <textarea
                                    required
                                    rows={3}
                                    value={designerNotes}
                                    onChange={(e) => setDesignerNotes(e.target.value)}
                                    placeholder="Explain what has been fixed (e.g. Updated layout CAD, revised lux levels, replaced fixture coordinates)..."
                                    className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-md text-sm focus:outline-none focus:border-amber-500 transition-colors font-medium resize-none"
                                  />
                                </div>
                                <div className="flex justify-end">
                                  <button
                                    type="submit"
                                    disabled={submittingRevision || !designerNotes.trim()}
                                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs rounded-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center space-x-1.5 cursor-pointer"
                                  >
                                    {submittingRevision ? (
                                      <>
                                        <svg className="animate-spin h-3.5 w-3.5 text-neutral-950" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                        </svg>
                                        <span>Submitting...</span>
                                      </>
                                    ) : (
                                      <>
                                        <i className="bx bx-check-circle text-sm"></i>
                                        <span>Submit Revision Notes & Mark Resolved</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </form>
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
                Designer Milestones
              </h3>
            </div>

            {actionMessage && (
              <div className={`p-3.5 rounded-md text-xs font-medium border ${ actionMessage.startsWith('Error') || actionMessage.includes('error') ? 'bg-rose-50 border-rose-250 text-rose-800' : 'bg-emerald-50 border-emerald-250 text-emerald-800' }`}>
                <div className="flex items-center space-x-1.5">
                  <i className={`bx ${actionMessage.startsWith('Error') || actionMessage.includes('error') ? 'bx-error-circle' : 'bx-check-circle'} text-base`}></i>
                  <span>{actionMessage}</span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-medium text-neutral-500 mb-1.5">
                  Update Design Status
                </label>
                <div className="relative">
                  <CustomSelect
                    value={status}
                    onChange={handleStatusChange}
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
                {updatingStatus && (
                  <p className="text-[10px] text-neutral-400 font-medium italic mt-1 flex items-center">
                    <svg className="animate-spin h-3.5 w-3.5 text-neutral-400 mr-1" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Syncing status with workspace...
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-neutral-100 space-y-4 text-sm font-medium">
                <div className="flex justify-between items-center py-1">
                  <span className="text-neutral-500">Project Type</span>
                  <span className="text-neutral-800">{project.project_type || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-neutral-500">Selected Plan</span>
                  <span className="text-neutral-805 text-xs font-medium">{project.pricing_plans?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-neutral-500">Target Deadline</span>
                  <span className="text-neutral-800 font-medium">{project.deadline ? new Date(project.deadline).toLocaleDateString() : 'TBD'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="Delete Deliverable"
        message="Are you sure you want to delete this deliverable asset? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setFileToDelete(null);
        }}
      />
    </div>
  );
}
