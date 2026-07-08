'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function AdminProjectDeliverables() {
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any | null>(null);
  const [deliverables, setDeliverables] = useState<any[]>([]);

  // Upload states
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'deliverable_report' | 'deliverable_boq' | 'deliverable_lux' | 'deliverable_layout'>('deliverable_report');

  useEffect(() => {
    if (!id) return;

    async function fetchData() {
      try {
        const { data: proj, error: projError } = await supabase
          .from('projects')
          .select('id, project_name, project_id_serial')
          .eq('id', id)
          .single();

        if (projError) throw projError;
        setProject(proj);

        // Fetch deliverables
        const { data: files, error: filesError } = await supabase
          .from('project_files')
          .select('*')
          .eq('project_id', id)
          .in('category', ['deliverable_report', 'deliverable_boq', 'deliverable_lux', 'deliverable_layout']);

        if (filesError) throw filesError;
        setDeliverables(files || []);
      } catch (err) {
        console.error('Error fetching deliverables details:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id, supabase]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setMessage('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `deliverables/${id}/${selectedCategory}-${Date.now()}.${fileExt}`;

      // Upload file to Supabase storage bucket "project-assets"
      let uploadError = null;
      try {
        const { error } = await supabase.storage
          .from('project-assets')
          .upload(filePath, selectedFile, { cacheControl: '3600', upsert: true });
        
        if (error) uploadError = error;
      } catch (storageErr) {
        uploadError = storageErr;
      }

      // Insert record into project_files table
      const { data: fileRecord, error: dbError } = await supabase
        .from('project_files')
        .insert({
          project_id: id,
          uploaded_by: user?.id || null,
          file_name: selectedFile.name,
          file_path: filePath,
          file_size: selectedFile.size,
          file_type: fileExt || '',
          category: selectedCategory,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setDeliverables((prev) => [...prev, fileRecord]);
      setMessage('Deliverable file uploaded successfully!');
      setSelectedFile(null);
      
      // Reset input element
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (err: any) {
      console.error(err);
      setMessage(`Upload error: ${err.message || 'Storage bucket project-assets needs to be created in Supabase Dashboard.'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId: string, filePath: string) => {
    if (!confirm('Are you sure you want to delete this deliverable?')) return;

    try {
      // Delete from storage
      await supabase.storage.from('project-assets').remove([filePath]);

      // Delete from DB
      const { error } = await supabase
        .from('project_files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;

      setDeliverables((prev) => prev.filter((d) => d.id !== fileId));
      setMessage('Deliverable deleted successfully!');
    } catch (err: any) {
      setMessage(`Delete error: ${err.message}`);
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
        Project not found.
      </div>
    );
  }

  const categoryLabels = {
    deliverable_report: 'Lighting Report',
    deliverable_boq: 'BOQ File',
    deliverable_lux: 'Lux Calculation',
    deliverable_layout: 'Layout Drawing',
  };

  return (
    <div className="space-y-8">
      {/* Navigation */}
      <div>
        <Link href={`/admin/projects/${project.id}`} className="inline-flex items-center space-x-1 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors">
          <i className="bx bx-left-arrow-alt text-sm"></i>
          <span>Back to Project Specifications</span>
        </Link>
        <div className="flex items-center space-x-3 mt-2">
          <h2 className="text-xl font-bold text-neutral-900">Manage Project Deliverables</h2>
          <span className="font-mono text-xs px-2 py-0.5 bg-neutral-100 border border-neutral-300 text-neutral-600 rounded-md font-semibold">
            {project.project_id_serial}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Upload new deliverable */}
        <div className="bg-white border border-neutral-200 rounded-md p-6 space-y-6">
          <h3 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-3 uppercase tracking-wider">
            Upload Deliverable
          </h3>

          {message && (
            <div className={`p-3 rounded-md text-xs font-semibold ${
              message.startsWith('Upload error') || message.startsWith('Delete error')
                ? 'bg-red-50 border border-red-200 text-red-800' 
                : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-2">
                Deliverable Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as any)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm text-neutral-800 focus:outline-none focus:bg-white focus:border-amber-500 transition-colors"
              >
                <option value="deliverable_report">Lighting Report</option>
                <option value="deliverable_boq">BOQ (Bill of Quantities)</option>
                <option value="deliverable_lux">Lux Calculations</option>
                <option value="deliverable_layout">Layout Drawing / PDF</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-2">
                Select File
              </label>
              <input
                id="file-input"
                type="file"
                required
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm text-neutral-800 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-neutral-900 file:text-white hover:file:bg-neutral-800 transition-colors"
              />
              <p className="text-xs text-neutral-400 mt-2">Supported types: PDF, DWG, ZIP, Images, Excel</p>
            </div>

            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm rounded-md transition-colors duration-200 disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload File'}
            </button>
          </form>
        </div>

        {/* Right Side: List of current deliverables */}
        <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-md p-6 space-y-6">
          <h3 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-3 uppercase tracking-wider">
            Current Deliverables
          </h3>

          {deliverables.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-8">No design deliverables uploaded for this project yet.</p>
          ) : (
            <div className="divide-y divide-neutral-200">
              {deliverables.map((del) => (
                <div key={del.id} className="py-4 flex justify-between items-center text-sm">
                  <div className="flex items-start space-x-3">
                    <i className="bx bx-file text-neutral-400 text-lg mt-0.5"></i>
                    <div>
                      <p className="font-bold text-neutral-800">{del.file_name}</p>
                      <p className="text-xs text-neutral-400 uppercase">
                        {categoryLabels[del.category as keyof typeof categoryLabels]} • {del.file_type} • {(Number(del.file_size) / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <a
                      href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${del.file_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-amber-600 hover:underline"
                    >
                      Download
                    </a>
                    <button
                      onClick={() => handleDelete(del.id, del.file_path)}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
