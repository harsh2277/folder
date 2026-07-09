'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminProjectDetail() {
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any | null>(null);
  const [remarks, setRemarks] = useState<any | null>(null);
  const [preferences, setPreferences] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
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
          .select('*')
          .eq('project_id', id);
        setFiles(filesData || []);

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

  return (
    <div className="space-y-8">
      {/* Navigation Header */}
      <div className="flex justify-between items-center">
        <div>
          <Link href="/admin/projects" className="inline-flex items-center space-x-1 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors">
            <i className="bx bx-left-arrow-alt text-sm"></i>
            <span>Back to Directory</span>
          </Link>
          <div className="flex items-center space-x-3 mt-2">
            <h2 className="text-xl font-bold text-neutral-900">{project.project_name}</h2>
            <span className="font-mono text-xs px-2 py-0.5 bg-neutral-100 border border-neutral-300 text-neutral-600 rounded-md font-semibold">
              {project.project_id_serial}
            </span>
          </div>
        </div>
        
        <Link
          href={`/admin/projects/${project.id}/deliverables`}
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-md transition-colors"
        >
          <i className="bx bx-folder"></i>
          <span>Manage Deliverables</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Columns - Onboarding & Remarks details */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Project Details Block */}
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

            {project.project_notes && (
              <div className="pt-4 border-t border-neutral-100 text-sm">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Project Notes</p>
                <p className="text-neutral-700 bg-neutral-50 p-4 rounded-md border border-neutral-200 leading-relaxed">
                  {project.project_notes}
                </p>
              </div>
            )}
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

          {/* Additional Remarks Block */}
          {remarks && (
            <div className="bg-white border border-neutral-200 rounded-md p-6 space-y-6">
              <h3 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-3 uppercase tracking-wider">
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

          {/* Uploaded Files / Site Assets */}
          <div className="bg-white border border-neutral-200 rounded-md p-6 space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-3 uppercase tracking-wider">
              Uploaded Onboarding Files
            </h3>
            
            {files.length === 0 ? (
              <p className="text-sm text-neutral-400">No onboarding documents uploaded.</p>
            ) : (
              <div className="divide-y divide-neutral-100">
                {files.map((file) => (
                  <div key={file.id} className="py-3 flex justify-between items-center text-sm">
                    <div className="flex items-center space-x-3">
                      <i className="bx bx-file text-neutral-400 text-lg"></i>
                      <div>
                        <p className="font-bold text-neutral-800">{file.file_name}</p>
                        <p className="text-xs text-neutral-400 uppercase">{file.file_type} • {file.category}</p>
                      </div>
                    </div>
                    <a
                      href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${file.file_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                    >
                      Download
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column - Management & Assignment controls */}
        <div className="space-y-6">
          <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-6 shadow-sm">
            <h3 className="text-sm font-extrabold text-neutral-900 border-b border-neutral-100 pb-3 uppercase tracking-wider flex items-center space-x-1.5">
              <i className="bx bx-cog text-neutral-400 text-base"></i>
              <span>Management Controls</span>
            </h3>

            {saveMessage && (
              <div className={`p-3 rounded-md text-xs font-semibold ${
                saveMessage.startsWith('Error') 
                  ? 'bg-rose-50 border border-rose-200 text-rose-800' 
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              }`}>
                {saveMessage}
              </div>
            )}

            <form onSubmit={handleSaveChanges} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2">
                  Project Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm text-neutral-800 focus:outline-none focus:bg-white focus:border-amber-500 transition-colors font-semibold cursor-pointer"
                >
                  <option value="Submitted">Submitted</option>
                  <option value="Payment Pending">Payment Pending</option>
                  <option value="Under Review">Under Review</option>
                  <option value="In Design">In Design</option>
                  <option value="Ready for Client Review">Ready for Client Review</option>
                  <option value="Revision Requested">Revision Requested</option>
                  <option value="Approved">Approved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2">
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm text-neutral-800 focus:outline-none focus:bg-white focus:border-amber-500 transition-colors font-semibold cursor-pointer"
                >
                  <option value="pending">Pending (Pay Later)</option>
                  <option value="paid">Paid (Mark Completed)</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2">
                  Assign Architect
                </label>
                <select
                  value={architectId}
                  onChange={(e) => setArchitectId(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm text-neutral-800 focus:outline-none focus:bg-white focus:border-amber-500 transition-colors font-semibold cursor-pointer"
                >
                  <option value="">Unassigned</option>
                  {architects.map((arc) => (
                    <option key={arc.id} value={arc.id}>
                      {arc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2">
                  Assign Designer
                </label>
                <select
                  value={assignedDesignerId}
                  onChange={(e) => setAssignedDesignerId(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm text-neutral-800 focus:outline-none focus:bg-white focus:border-amber-500 transition-colors font-semibold cursor-pointer"
                >
                  <option value="">Unassigned</option>
                  {designers.map((des) => (
                    <option key={des.id} value={des.id}>
                      {des.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2">
                  Target Deadline
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm text-neutral-800 focus:outline-none focus:bg-white focus:border-amber-500 transition-colors font-semibold"
                />
              </div>

              <button
                type="submit"
                disabled={updating}
                className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-md transition-colors duration-200 disabled:opacity-50 cursor-pointer shadow-sm uppercase tracking-wider"
              >
                {updating ? 'Saving...' : 'Save Configuration'}
              </button>
            </form>
          </div>

          {/* End Client Access Details */}
          <div className="bg-white border border-neutral-200 rounded-md p-6 space-y-4 text-sm">
            <h3 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-3 uppercase tracking-wider">
              Client Portal Access
            </h3>
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">End Client Login ID</p>
              <p className="font-mono text-xs bg-neutral-50 p-2 border border-neutral-200 rounded-md text-neutral-800 mt-1 select-all font-semibold">
                {project.client_username}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Onboarding Password</p>
              <p className="text-neutral-500 italic text-xs mt-1">Generated and encrypted on submission.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
