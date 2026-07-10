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
  const [activeTab, setActiveTab] = useState<'Overview' | 'Deliverables' | 'Revisions'>('Overview');

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
      case 'deliverable_boq': return 'bx bxs-spreadsheet text-amber-600';
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
      <div className="p-8 text-center text-sm text-neutral-450 font-medium">
        Project not found.
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans">

      {/* Header Panel */}
      <div className="bg-white border border-neutral-200 rounded-md p-5 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <span className="font-mono text-sm font-semibold text-neutral-400 block uppercase tracking-wider">{project.project_id_serial || 'Generating ID...'}</span>
          <h1 className="text-xl font-semibold text-neutral-900 tracking-tight mt-1">{project.project_name}</h1>
          <p className="text-sm text-neutral-500 mt-1 font-semibold uppercase tracking-wider">Client Name: {project.client_name}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            href={`/architect/projects/${id}/revision-request`}
            className="px-4 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-semibold text-sm rounded transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <i className="bx bx-comment-detail text-sm"></i>
            <span>Request Revision</span>
          </Link>
          <Link
            href="/architect/projects"
            className="px-4 py-2 bg-neutral-950 hover:bg-neutral-850 text-white font-semibold text-sm rounded transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <i className="bx bx-chevron-left text-sm"></i>
            <span>Back</span>
          </Link>
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="bg-white border border-neutral-200 rounded-md p-5">
        <h2 className="text-sm uppercase font-semibold text-neutral-450 tracking-wider mb-6">Workspace Progress</h2>
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-neutral-100 -translate-y-1/2 hidden md:block z-0"></div>

          {[
            { stage: 'Onboarding', status: 'completed' },
            { stage: 'In Design', status: project.status === 'In Design' ? 'active' : (project.status === 'Submitted' || project.status === 'Revision Requested' ? 'pending' : 'completed') },
            { stage: 'Under Review', status: project.status === 'Under Review' ? 'active' : (project.status === 'Approved' || project.status === 'Closed' ? 'completed' : 'pending') },
            { stage: 'Approved', status: project.status === 'Approved' || project.status === 'Closed' ? 'completed' : 'pending' }
          ].map((step, idx) => (
            <div key={idx} className="flex items-center md:flex-col md:text-center space-x-3 md:space-x-0 md:space-y-2 relative z-10 flex-1 w-full">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-semibold text-sm ${step.status === 'completed'
                  ? 'bg-amber-500 border-emerald-500 text-white'
                  : step.status === 'active'
                    ? 'bg-amber-500 border-amber-500 text-neutral-950 font-semibold'
                    : 'bg-white border-neutral-200 text-neutral-400'
                }`}>
                {step.status === 'completed' ? <i className="bx bx-check text-sm"></i> : idx + 1}
              </div>
              <span className={`text-sm font-semibold ${step.status === 'active' ? 'text-neutral-900 font-semibold' : 'text-neutral-500'}`}>{step.stage}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Unified Card Container */}
      <div className="bg-white border border-neutral-200 rounded-md overflow-hidden shadow-sm">
        {/* Tabs Header */}
        <div className="border-b border-neutral-200 bg-neutral-50/20">
          <div className="flex -mb-px">
            {['Overview', 'Deliverables', 'Revisions'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 py-3 text-sm font-semibold transition-colors cursor-pointer text-center border-b-2 ${
                  activeTab === tab
                    ? 'text-amber-600 border-amber-500 bg-white'
                    : 'text-neutral-500 hover:text-neutral-900 border-transparent hover:bg-neutral-50/50'
                }`}
              >
                {tab}
                {tab === 'Deliverables' && deliverables.length > 0 && (
                  <span className="ml-1.5 text-xs bg-amber-50 text-amber-700 rounded-full px-1.5 py-0.5">
                    {deliverables.length}
                  </span>
                )}
                {tab === 'Revisions' && revisions.length > 0 && (
                  <span className="ml-1.5 text-xs bg-rose-50 text-rose-700 rounded-full px-1.5 py-0.5">
                    {revisions.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === 'Overview' && (
            <div className="space-y-6">
              {/* Project Specification Block */}
              <div>
                <h3 className="text-xs font-semibold text-neutral-400 border-b border-neutral-100 pb-2 uppercase tracking-wider mb-4">
                  Project Specification
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">End Client Name</p>
                    <p className="font-semibold text-neutral-800 mt-1">{project.client_name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Project Type</p>
                    <p className="font-semibold text-neutral-800 mt-1">{project.project_type || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Site Location</p>
                    <p className="font-semibold text-neutral-800 mt-1">{project.site_location || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Area / Square Footage</p>
                    <p className="font-semibold text-neutral-800 mt-1">{Number(project.area_sq_ft).toLocaleString()} sq ft</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Budget Range</p>
                    <p className="font-semibold text-neutral-800 mt-1">{project.budget_range || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Timeline</p>
                    <p className="font-semibold text-neutral-800 mt-1">{project.timeline || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Style Preference</p>
                    <p className="font-semibold text-neutral-800 mt-1">{project.style_preference || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Selected Plan</p>
                    <p className="font-semibold text-neutral-800 mt-1">{project.pricing_plans?.name || 'N/A'}</p>
                  </div>
                </div>

                {project.project_notes && (
                  <div className="pt-4 border-t border-neutral-100 text-sm mt-4">
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Project Notes</p>
                    <p className="text-neutral-700 bg-neutral-50 p-4 rounded-md border border-neutral-200 leading-relaxed">
                      {project.project_notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Lighting Preferences Block */}
              <div className="pt-6 border-t border-neutral-100">
                <h3 className="text-xs font-semibold text-neutral-400 pb-2 uppercase tracking-wider mb-3">
                  Lighting Preferences
                </h3>
                
                {preferences.length === 0 ? (
                  <p className="text-sm text-neutral-450">No specific lighting preferences selected.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {preferences.map((pref) => (
                      <span
                        key={pref.preference_name}
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-neutral-100 border border-neutral-200 rounded-md text-sm font-medium text-neutral-700"
                      >
                        <i className="bx bx-bulb text-neutral-400"></i>
                        <span>{pref.preference_name}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Additional Remarks Block */}
              {remarks && (
                <div className="pt-6 border-t border-neutral-100">
                  <h3 className="text-xs font-semibold text-neutral-400 pb-2 uppercase tracking-wider mb-3">
                    Additional Design Remarks
                  </h3>
                  
                  <div className="space-y-4 text-sm">
                    {remarks.lighting_mood && (
                      <div>
                        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Lighting Mood</p>
                        <p className="text-neutral-800 mt-1 leading-relaxed">{remarks.lighting_mood}</p>
                      </div>
                    )}
                    {remarks.expectations && (
                      <div>
                        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Expectations</p>
                        <p className="text-neutral-800 mt-1 leading-relaxed">{remarks.expectations}</p>
                      </div>
                    )}
                    {remarks.inspiration_ideas && (
                      <div>
                        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Inspiration Ideas</p>
                        <p className="text-neutral-800 mt-1 leading-relaxed">{remarks.inspiration_ideas}</p>
                      </div>
                    )}
                    {remarks.functional_requirements && (
                      <div>
                        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Functional Requirements</p>
                        <p className="text-neutral-800 mt-1 leading-relaxed">{remarks.functional_requirements}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Uploaded Onboarding Files */}
              <div className="pt-6 border-t border-neutral-100">
                <h3 className="text-xs font-semibold text-neutral-400 pb-2 uppercase tracking-wider mb-3">
                  Uploaded Onboarding Files
                </h3>
                
                {files.filter(f => !['deliverable_report', 'deliverable_boq', 'deliverable_lux', 'deliverable_layout'].includes(f.category)).length === 0 ? (
                  <p className="text-sm text-neutral-450">No onboarding documents uploaded.</p>
                ) : (
                  <div className="divide-y divide-neutral-100">
                    {files.filter(f => !['deliverable_report', 'deliverable_boq', 'deliverable_lux', 'deliverable_layout'].includes(f.category)).map((file) => (
                      <div key={file.id} className="py-3 flex justify-between items-center text-sm">
                        <div className="flex items-center space-x-3">
                          <i className="bx bx-file text-neutral-400 text-lg"></i>
                          <div>
                            <p className="font-semibold text-neutral-800">{file.file_name}</p>
                            <p className="text-xs text-neutral-405 mt-0.5 font-semibold uppercase">{file.file_type} • {file.category}</p>
                          </div>
                        </div>
                        <a
                          href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${file.file_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-amber-605 hover:text-amber-700 transition-colors"
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
              <h3 className="text-xs font-semibold text-neutral-400 border-b border-neutral-100 pb-2 uppercase tracking-wider mb-4">
                Design Deliverables
              </h3>
              {deliverables.length === 0 ? (
                <div className="py-12 text-center text-sm text-neutral-450 font-medium space-y-2">
                  <i className="bx bx-file-blank text-3xl text-neutral-300"></i>
                  <p>Deliverables will appear here once ready.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {deliverables.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-4 bg-neutral-50 border border-neutral-200 rounded-md">
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <i className={`${getFileIcon(file.category)} text-2xl flex-shrink-0`}></i>
                        <div className="overflow-hidden">
                          <p className="font-semibold text-neutral-800 text-sm truncate">{file.file_name}</p>
                          <p className="text-xs text-neutral-405 mt-0.5 font-semibold uppercase">{getCategoryLabel(file.category)}</p>
                        </div>
                      </div>
                      <a
                        href={getDownloadUrl(file.file_path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 bg-white hover:bg-neutral-100 border border-neutral-200 rounded flex items-center justify-center text-neutral-600 hover:text-neutral-900 transition-colors flex-shrink-0 cursor-pointer"
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

          {activeTab === 'Revisions' && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-neutral-400 border-b border-neutral-100 pb-2 uppercase tracking-wider mb-4">
                Revision History
              </h3>
              {revisions.length === 0 ? (
                <div className="py-12 text-center text-sm text-neutral-450 font-medium space-y-2">
                  <i className="bx bx-comment-detail text-3xl text-neutral-300"></i>
                  <p>No revision requests have been filed for this project.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {revisions.map((rev) => (
                    <div key={rev.id} className="p-4 bg-neutral-50 border border-neutral-200 rounded-md space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-xs font-semibold text-neutral-400">Requested: {new Date(rev.created_at).toLocaleDateString()}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase border ${rev.status === 'approved'
                            ? 'bg-amber-50 border-amber-100 text-amber-700'
                            : rev.status === 'declined'
                              ? 'bg-rose-50 border-rose-100 text-rose-700'
                              : 'bg-amber-50 border-amber-100 text-amber-700'
                          }`}>
                          {rev.status}
                        </span>
                      </div>
                      <p className="font-semibold text-neutral-800 leading-relaxed">{rev.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
