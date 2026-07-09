'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ArchitectProjectDetail({ params }: PageProps) {
  const { id } = use(params);
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any | null>(null);
  const [remarks, setRemarks] = useState<any | null>(null);
  const [preferences, setPreferences] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [revisions, setRevisions] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;

    async function fetchDetails() {
      try {
        // Fetch project
        const { data: proj, error: projError } = await supabase
          .from('projects')
          .select('*, pricing_plans(name)')
          .eq('id', id)
          .single();

        if (projError) throw projError;
        setProject(proj);

        // Fetch remarks (brief/mood etc)
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

        // Fetch uploaded files
        const { data: filesData } = await supabase
          .from('project_files')
          .select('*')
          .eq('project_id', id);
        setFiles(filesData || []);

        // Filter out design deliverables
        if (filesData) {
          const deliverableCategories = ['deliverable_report', 'deliverable_boq', 'deliverable_lux', 'deliverable_layout'];
          setDeliverables(filesData.filter(f => deliverableCategories.includes(f.category)));
        }

        // Fetch revision requests
        const { data: revs } = await supabase
          .from('revision_requests')
          .select('*')
          .eq('project_id', id)
          .order('created_at', { ascending: false });
        setRevisions(revs || []);

      } catch (err) {
        console.error('Error fetching project detail details:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDetails();
  }, [id, supabase]);

  const getFileIcon = (category: string) => {
    switch (category) {
      case 'deliverable_report': return 'bx bxs-file-pdf text-red-600';
      case 'deliverable_lux': return 'bx bxs-pie-chart-alt-2 text-blue-600';
      case 'deliverable_boq': return 'bx bxs-spreadsheet text-emerald-600';
      case 'deliverable_layout': return 'bx bxs-image text-purple-600';
      default: return 'bx bxs-file text-neutral-605';
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
      <div className="p-8 text-center text-sm text-neutral-400 font-medium">
        Project not found.
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans">
      
      {/* Header Panel */}
      <div className="bg-white border border-neutral-200 rounded-md p-5 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <span className="font-mono text-xs font-bold text-neutral-400 block uppercase tracking-wider">{project.project_id_serial || 'Generating ID...'}</span>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight mt-1">{project.project_name}</h1>
          <p className="text-xs text-neutral-500 mt-1 font-semibold uppercase tracking-wider">Client Representative: {project.client_name}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            href={`/architect/projects/${id}/revision-request`}
            className="px-4 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-bold text-xs rounded transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <i className="bx bx-comment-detail text-sm"></i>
            <span>Request Revision</span>
          </Link>
          <Link
            href="/architect/projects"
            className="px-4 py-2 bg-neutral-950 hover:bg-neutral-850 text-white font-bold text-xs rounded transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <i className="bx bx-chevron-left text-sm"></i>
            <span>Back</span>
          </Link>
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="bg-white border border-neutral-200 rounded-md p-5">
        <h2 className="text-xs uppercase font-bold text-neutral-450 tracking-wider mb-6">Workspace Progress</h2>
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-neutral-100 -translate-y-1/2 hidden md:block z-0"></div>
          
          {[
            { stage: 'Onboarding', status: 'completed' },
            { stage: 'In Design', status: project.status === 'In Design' ? 'active' : (project.status === 'Submitted' || project.status === 'Revision Requested' ? 'pending' : 'completed') },
            { stage: 'Under Review', status: project.status === 'Under Review' ? 'active' : (project.status === 'Approved' || project.status === 'Closed' ? 'completed' : 'pending') },
            { stage: 'Approved', status: project.status === 'Approved' || project.status === 'Closed' ? 'completed' : 'pending' }
          ].map((step, idx) => (
            <div key={idx} className="flex items-center md:flex-col md:text-center space-x-3 md:space-x-0 md:space-y-2 relative z-10 flex-1 w-full">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-bold text-xs ${
                step.status === 'completed'
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : step.status === 'active'
                  ? 'bg-amber-500 border-amber-500 text-neutral-950 font-black'
                  : 'bg-white border-neutral-200 text-neutral-400'
              }`}>
                {step.status === 'completed' ? <i className="bx bx-check text-sm"></i> : idx + 1}
              </div>
              <span className={`text-[11px] font-bold ${step.status === 'active' ? 'text-neutral-900 font-extrabold' : 'text-neutral-500'}`}>{step.stage}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left Columns - Project Info & Brief */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Project Specification Block */}
          <div className="bg-white border border-neutral-200 rounded-md p-6 space-y-6">
            <h3 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-3 uppercase tracking-wider">
              Project Specification
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">End Client Name</p>
                <p className="font-bold text-neutral-800 mt-1">{project.client_name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Project Type</p>
                <p className="font-bold text-neutral-800 mt-1">{project.project_type || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Site Location</p>
                <p className="font-bold text-neutral-800 mt-1">{project.site_location || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Area / Square Footage</p>
                <p className="font-bold text-neutral-800 mt-1">{Number(project.area_sq_ft).toLocaleString()} sq ft</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Budget Range</p>
                <p className="font-bold text-neutral-800 mt-1">{project.budget_range || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Timeline</p>
                <p className="font-bold text-neutral-800 mt-1">{project.timeline || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Style Preference</p>
                <p className="font-bold text-neutral-800 mt-1">{project.style_preference || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Selected Plan</p>
                <p className="font-bold text-neutral-800 mt-1">{project.pricing_plans?.name || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Lighting Preferences Block */}
          <div className="bg-white border border-neutral-200 rounded-md p-6 space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-3 uppercase tracking-wider">
              Lighting Preferences
            </h3>
            
            {preferences.length === 0 ? (
              <p className="text-sm text-neutral-400">No specific lighting preferences selected.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {preferences.map((pref) => (
                  <span
                    key={pref.preference_name}
                    className="inline-flex items-center space-x-1 px-3 py-1 bg-neutral-100 border border-neutral-200 rounded-md text-xs font-medium text-neutral-700"
                  >
                    <i className="bx bx-bulb text-neutral-400"></i>
                    <span>{pref.preference_name}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Design Brief & Mood Remarks Block */}
          <div className="bg-white border border-neutral-200 rounded-md p-6 space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-3 uppercase tracking-wider">Design Brief & Mood</h3>
            
            {remarks ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-1">
                  <span className="font-semibold text-neutral-400 uppercase text-xs tracking-wider block">Lighting Mood</span>
                  <p className="font-bold text-neutral-800 leading-relaxed">{remarks.lighting_mood || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-neutral-400 uppercase text-xs tracking-wider block">Expectations</span>
                  <p className="font-bold text-neutral-800 leading-relaxed">{remarks.expectations || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-neutral-400 uppercase text-xs tracking-wider block">Inspirations</span>
                  <p className="font-bold text-neutral-800 leading-relaxed">{remarks.inspiration_ideas || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-neutral-400 uppercase text-xs tracking-wider block">Functional Brief</span>
                  <p className="font-bold text-neutral-800 leading-relaxed">{remarks.functional_requirements || 'N/A'}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-neutral-400 font-medium py-4">No specific brief notes found.</p>
            )}
          </div>

          {/* Revision Logs */}
          <div className="bg-white border border-neutral-200 rounded-md p-6 space-y-4">
            <h2 className="text-xs uppercase font-bold text-neutral-400 tracking-widest pb-3 border-b border-neutral-100">Revision Requests</h2>
            
            {revisions.length === 0 ? (
              <p className="text-xs text-neutral-400 font-medium py-4">No revisions requested yet.</p>
            ) : (
              <div className="space-y-4 divide-y divide-neutral-100">
                {revisions.map((rev) => (
                  <div key={rev.id} className="pt-4 first:pt-0 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[10px] font-bold text-neutral-400">{new Date(rev.created_at).toLocaleDateString()}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                        rev.status === 'approved'
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                          : rev.status === 'declined'
                          ? 'bg-rose-50 border-rose-100 text-rose-700'
                          : 'bg-amber-50 border-amber-100 text-amber-700'
                      }`}>
                        {rev.status}
                      </span>
                    </div>
                    <p className="font-medium text-neutral-750">{rev.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Deliverables */}
        <div className="space-y-4">
          
          <div className="bg-white border border-neutral-200 rounded-md p-6 space-y-4">
            <h2 className="text-xs uppercase font-bold text-neutral-400 tracking-widest pb-3 border-b border-neutral-100">Design Deliverables</h2>
            
            {deliverables.length === 0 ? (
              <div className="py-6 text-center text-xs text-neutral-400 font-medium space-y-1">
                <i className="bx bx-file-blank text-2xl text-neutral-300"></i>
                <p>Deliverables will appear here once ready.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {deliverables.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-neutral-50 border border-neutral-200 rounded-md">
                    <div className="flex items-center space-x-2.5 overflow-hidden">
                      <i className={`${getFileIcon(file.category)} text-xl flex-shrink-0`}></i>
                      <div className="overflow-hidden">
                        <p className="font-bold text-neutral-800 text-[11px] truncate">{file.file_name}</p>
                        <p className="text-[9px] text-neutral-400 mt-0.5 font-bold uppercase">{getCategoryLabel(file.category)}</p>
                      </div>
                    </div>
                    <a
                      href={getDownloadUrl(file.file_path)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 bg-white hover:bg-neutral-100 border border-neutral-200 rounded flex items-center justify-center text-neutral-600 hover:text-neutral-900 transition-colors flex-shrink-0 cursor-pointer"
                      title="Download Deliverable"
                    >
                      <i className="bx bx-download text-sm"></i>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-neutral-900 text-white rounded-md p-6 space-y-3 border border-neutral-850">
            <h3 className="text-xs uppercase font-black text-amber-400 tracking-widest">Pricing Plan</h3>
            <p className="font-black text-base">{project.pricing_plans?.name || 'Onboarding Package Fee'}</p>
            <div className="text-xs text-neutral-400 space-y-1 font-medium">
              <p>Area: <span className="text-white font-bold">{Number(project.area_sq_ft).toLocaleString()} sq ft</span></p>
              <p>Payment: <span className={`font-bold uppercase ${project.payment_status === 'paid' ? 'text-emerald-400' : 'text-amber-400'}`}>{project.payment_status || 'Pending'}</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
