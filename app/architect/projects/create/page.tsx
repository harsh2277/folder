'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  base_price_per_sq_ft: string;
  min_sq_ft: string;
}

export default function ArchitectProjectCreationWizard() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [projectDetails, setProjectDetails] = useState({
    projectName: '',
    clientName: '',
    projectType: 'Residential',
    siteLocation: '',
    areaSqFt: 500,
    budgetRange: 'Standard',
    timeline: '1-3 months',
    deadline: '',
  });
  
  const [lightingPreferences, setLightingPreferences] = useState<string[]>([]);
  
  const [remarks, setRemarks] = useState({
    lightingMood: '',
    expectations: '',
    inspirationIdeas: '',
    functionalRequirements: '',
  });

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileCategory, setFileCategory] = useState('layout');

  useEffect(() => {
    async function loadPlans() {
      try {
        const { data, error } = await supabase
          .from('pricing_plans')
          .select('*')
          .eq('is_active', true);

        if (error) throw error;
        setPlans(data || []);
        if (data && data.length > 0) {
          setSelectedPlanId(data[0].id);
        }
      } catch (err: any) {
        console.error('Error loading plans:', err);
        // Fallback plans
        setPlans([
          { id: '19acfba5-8ffc-47cf-b1d0-e8cb8ad9ce0d', name: 'Basic Lighting Plan', description: 'Includes basic light layout and luminaire recommendations.', base_price_per_sq_ft: '15.00', min_sq_ft: '500.00' },
          { id: '3b147280-ebd7-4e61-97b2-a96b7e767888', name: 'Premium Design Plan', description: 'Custom lighting layouts, product selections, and mood boards.', base_price_per_sq_ft: '25.00', min_sq_ft: '500.00' },
          { id: 'aeed1171-ee5b-4456-83b5-c456df6133ff', name: 'BOQ + Design Package', description: 'Complete lighting design, power blueprints, Dialux simulation, and BOQ.', base_price_per_sq_ft: '40.00', min_sq_ft: '1000.00' },
        ]);
        setSelectedPlanId('19acfba5-8ffc-47cf-b1d0-e8cb8ad9ce0d');
      } finally {
        setLoading(false);
      }
    }
    loadPlans();
  }, [supabase]);

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  // Calculate Price
  const calculatePrice = () => {
    if (!selectedPlan) return 0;
    const rate = parseFloat(selectedPlan.base_price_per_sq_ft);
    const minArea = parseFloat(selectedPlan.min_sq_ft);
    const area = Math.max(projectDetails.areaSqFt, minArea);
    return area * rate;
  };

  const handleNext = () => {
    if (step === 2) {
      if (!projectDetails.projectName || !projectDetails.clientName || !projectDetails.areaSqFt) {
        setErrorMsg('Please fill in all required fields (Project Name, Client Name, Area).');
        return;
      }
    }
    setErrorMsg('');
    setStep(prev => Math.min(prev + 1, 6));
  };

  const handleBack = () => {
    setErrorMsg('');
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handlePreferenceToggle = (pref: string) => {
    setLightingPreferences(prev => 
      prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
    );
  };

  const saveProject = async (isPaid: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User session not found.');

      // Generate random serial
      const serial = `KL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const clientUsername = `client_${projectDetails.clientName.toLowerCase().replace(/\s+/g, '')}_${Math.floor(100 + Math.random() * 900)}`;

      // 1. Insert Project
      const calculatedPrice = calculatePrice();
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          project_id_serial: serial,
          architect_id: user.id,
          project_name: projectDetails.projectName,
          client_name: projectDetails.clientName,
          project_type: projectDetails.projectType,
          site_location: projectDetails.siteLocation,
          area_sq_ft: projectDetails.areaSqFt,
          budget_range: projectDetails.budgetRange,
          timeline: projectDetails.timeline,
          deadline: projectDetails.deadline ? new Date(projectDetails.deadline).toISOString() : null,
          pricing_plan_id: selectedPlanId,
          calculated_price: calculatedPrice,
          payment_status: isPaid ? 'paid' : 'pending',
          status: 'Submitted',
          client_username: clientUsername,
          client_password_hash: 'kelvinlightings', // default password
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // 2. Insert Lighting Preferences
      if (lightingPreferences.length > 0) {
        const prefInserts = lightingPreferences.map(pref => ({
          project_id: project.id,
          preference_name: pref
        }));
        const { error: prefError } = await supabase
          .from('project_lighting_preferences')
          .insert(prefInserts);
        if (prefError) throw prefError;
      }

      // 3. Insert Remarks
      const { error: remarksError } = await supabase
        .from('project_remarks')
        .insert({
          project_id: project.id,
          lighting_mood: remarks.lightingMood,
          expectations: remarks.expectations,
          inspiration_ideas: remarks.inspirationIdeas,
          functional_requirements: remarks.functionalRequirements,
        });
      if (remarksError) throw remarksError;

      // 4. Upload File if any
      if (uploadedFile) {
        const fileExt = uploadedFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `projects/${project.id}/${fileName}`;

        // Upload to storage bucket
        const { error: storageError } = await supabase.storage
          .from('project-assets')
          .upload(filePath, uploadedFile);

        if (storageError) {
          console.error('Storage upload error:', storageError);
        } else {
          // Insert file record
          await supabase
            .from('project_files')
            .insert({
              project_id: project.id,
              uploaded_by: user.id,
              file_name: uploadedFile.name,
              file_path: filePath,
              file_size: uploadedFile.size,
              file_type: uploadedFile.type,
              category: fileCategory,
            });
        }
      }

      // 5. Create Payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          project_id: project.id,
          amount: calculatedPrice,
          status: isPaid ? 'completed' : 'pending',
          transaction_id: isPaid ? `manual_${Date.now()}` : null,
          invoice_number: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        });
      if (paymentError) throw paymentError;

      router.push('/architect/projects');
    } catch (err: any) {
      console.error('Error saving project:', err);
      setErrorMsg(err.message || 'Something went wrong while saving the project.');
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    setErrorMsg('');
    setShowPaymentModal(true);
  };

  const stepsList = [
    { num: 1, label: 'Plan Selection' },
    { num: 2, label: 'Project Details' },
    { num: 3, label: 'Preferences' },
    { num: 4, label: 'Remarks' },
    { num: 5, label: 'Blueprint Upload' },
    { num: 6, label: 'Review & Submit' }
  ];

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Step Indicator Header */}
      <div className="bg-white border border-neutral-200 rounded-md p-5 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Add New Project</h2>
            <p className="text-sm text-neutral-400 mt-0.5">Step {step} of 6: {stepsList[step - 1].label}</p>
          </div>
          {/* Breadcrumb line for steps */}
          <div className="flex items-center space-x-2.5">
            {stepsList.map((s) => (
              <div key={s.num} className="flex items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step === s.num
                    ? 'bg-cyan-600 text-white'
                    : step > s.num
                    ? 'bg-cyan-100 text-cyan-700'
                    : 'bg-neutral-100 text-neutral-400'
                }`}>
                  {s.num}
                </div>
                {s.num < 6 && (
                  <div className={`w-4 h-0.5 ml-2.5 ${step > s.num ? 'bg-cyan-300' : 'bg-neutral-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm font-semibold flex items-center space-x-2">
          <i className="bx bx-error-circle text-lg"></i>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Form Body */}
      <div className="bg-white border border-neutral-200 rounded-md p-6 shadow-sm min-h-[400px] flex flex-col justify-between">
        <div className="space-y-6">
          {/* STEP 1: Plan Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-neutral-900 border-b border-neutral-100 pb-2">Select a Design Plan</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plans.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlanId(p.id)}
                    className={`border p-5 rounded-md cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                      selectedPlanId === p.id
                        ? 'border-cyan-600 bg-cyan-50/20 ring-1 ring-cyan-600 shadow-sm'
                        : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/30'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-neutral-900 text-base">{p.name}</h4>
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          selectedPlanId === p.id ? 'border-cyan-600 bg-cyan-600 text-white' : 'border-neutral-300'
                        }`}>
                          {selectedPlanId === p.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 font-medium mb-4">{p.description}</p>
                    </div>
                    <div className="pt-3 border-t border-neutral-100/60 flex justify-between items-center">
                      <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Rate per sq ft</span>
                      <span className="text-sm font-extrabold text-neutral-800">₹{p.base_price_per_sq_ft} <span className="text-xs text-neutral-400 font-medium">/ sq ft</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Project Details */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-neutral-900 border-b border-neutral-100 pb-2">Project Specifications</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1.5 uppercase tracking-wider">Project Name *</label>
                  <input
                    type="text"
                    required
                    value={projectDetails.projectName}
                    onChange={(e) => setProjectDetails(prev => ({ ...prev, projectName: e.target.value }))}
                    placeholder="e.g. Modern duplex villa"
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-cyan-500 transition-colors font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1.5 uppercase tracking-wider">Client Representative Name *</label>
                  <input
                    type="text"
                    required
                    value={projectDetails.clientName}
                    onChange={(e) => setProjectDetails(prev => ({ ...prev, clientName: e.target.value }))}
                    placeholder="e.g. Vikram Shah"
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-cyan-500 transition-colors font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1.5 uppercase tracking-wider">Site Location</label>
                  <input
                    type="text"
                    value={projectDetails.siteLocation}
                    onChange={(e) => setProjectDetails(prev => ({ ...prev, siteLocation: e.target.value }))}
                    placeholder="e.g. Bandra, Mumbai"
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-cyan-500 transition-colors font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1.5 uppercase tracking-wider">Area (Sq Ft) *</label>
                  <input
                    type="number"
                    min="50"
                    required
                    value={projectDetails.areaSqFt}
                    onChange={(e) => setProjectDetails(prev => ({ ...prev, areaSqFt: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm focus:outline-none focus:bg-white focus:border-cyan-500 transition-colors font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1.5 uppercase tracking-wider">Project Type</label>
                  <select
                    value={projectDetails.projectType}
                    onChange={(e) => setProjectDetails(prev => ({ ...prev, projectType: e.target.value }))}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm focus:outline-none focus:border-cyan-500 transition-colors font-semibold"
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Retail">Retail</option>
                    <option value="Hospitality">Hospitality</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1.5 uppercase tracking-wider">Timeline / Duration</label>
                  <input
                    type="text"
                    value={projectDetails.timeline}
                    onChange={(e) => setProjectDetails(prev => ({ ...prev, timeline: e.target.value }))}
                    placeholder="e.g. 1-3 months"
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-cyan-500 transition-colors font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1.5 uppercase tracking-wider">Preferred Deadline</label>
                  <input
                    type="date"
                    value={projectDetails.deadline}
                    onChange={(e) => setProjectDetails(prev => ({ ...prev, deadline: e.target.value }))}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm focus:outline-none focus:bg-white focus:border-cyan-500 transition-colors font-semibold"
                  />
                </div>



                <div className="bg-cyan-50/30 border border-cyan-100 rounded-md p-4 flex flex-col justify-center">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">Estimated Cost Breakdown</span>
                  <span className="text-xl font-extrabold text-cyan-700">₹{calculatePrice().toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  <span className="text-[10px] text-neutral-400 mt-1 font-medium">({projectDetails.areaSqFt} sq ft × ₹{selectedPlan?.base_price_per_sq_ft} / sq ft)</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Lighting Preferences */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-neutral-900 border-b border-neutral-100 pb-2">Lighting Design Preferences</h3>
              <p className="text-xs text-neutral-400">Select all lighting concept preferences that match the design requirements.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  'Ambient General Lighting',
                  'Accent / Highlight Lighting',
                  'Task-oriented Lighting',
                  'Decorative Fixtures & Chandeliers',
                  'Facade & Exterior Lighting',
                  'Landscape & Garden Lighting',
                  'Smart Dimming Controls & Automation',
                  'High Energy Efficiency (LEED)',
                  'Indirect / Cove Lighting',
                  'RGB / Dynamic Color Lighting'
                ].map((pref) => {
                  const isChecked = lightingPreferences.includes(pref);
                  return (
                    <div
                      key={pref}
                      onClick={() => handlePreferenceToggle(pref)}
                      className={`border p-3.5 rounded-md cursor-pointer transition-all duration-200 flex items-center space-x-3 ${
                        isChecked
                          ? 'border-cyan-600 bg-cyan-50/15 text-cyan-800 font-bold'
                          : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/20'
                      }`}
                    >
                      <div className={`w-4.5 h-4.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                        isChecked ? 'bg-cyan-600 border-cyan-600 text-white' : 'border-neutral-300'
                      }`}>
                        {isChecked && <i className="bx bx-check text-xs"></i>}
                      </div>
                      <span className="text-xs font-semibold">{pref}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Additional Remarks */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-neutral-900 border-b border-neutral-100 pb-2">Remarks & Expectations</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1.5 uppercase tracking-wider">Lighting Mood (Vibe)</label>
                  <textarea
                    rows={3}
                    value={remarks.lightingMood}
                    onChange={(e) => setRemarks(prev => ({ ...prev, lightingMood: e.target.value }))}
                    placeholder="e.g. Cozy warm lighting, minimalistic look, luxury feel..."
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-cyan-500 transition-colors font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1.5 uppercase tracking-wider">Expectations / Outcome</label>
                  <textarea
                    rows={3}
                    value={remarks.expectations}
                    onChange={(e) => setRemarks(prev => ({ ...prev, expectations: e.target.value }))}
                    placeholder="e.g. Detailed DWG layout map, product specs list, Dialux reporting..."
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-cyan-500 transition-colors font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1.5 uppercase tracking-wider">Inspiration Ideas / References</label>
                  <textarea
                    rows={3}
                    value={remarks.inspirationIdeas}
                    onChange={(e) => setRemarks(prev => ({ ...prev, inspirationIdeas: e.target.value }))}
                    placeholder="e.g. Scandinavian clean lines, hidden light strips, smart control hubs..."
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-cyan-500 transition-colors font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1.5 uppercase tracking-wider">Functional Requirements</label>
                  <textarea
                    rows={3}
                    value={remarks.functionalRequirements}
                    onChange={(e) => setRemarks(prev => ({ ...prev, functionalRequirements: e.target.value }))}
                    placeholder="e.g. Waterproof fixtures for bathrooms, emergency backup lights..."
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-cyan-500 transition-colors font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: File Upload */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-neutral-900 border-b border-neutral-100 pb-2">Upload Layout Blueprint</h3>
              <p className="text-xs text-neutral-400">Upload CAD drawings, layout plans (PDF/DWG/Images) to assist Kelvin designers.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <div className="border-2 border-dashed border-neutral-200 hover:border-cyan-500 transition-colors rounded-md p-8 text-center bg-neutral-50/50 flex flex-col items-center justify-center min-h-[200px] relative">
                    <input
                      type="file"
                      onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <i className="bx bx-cloud-upload text-4xl text-neutral-400 mb-2"></i>
                    {uploadedFile ? (
                      <div>
                        <p className="text-sm font-bold text-neutral-800">{uploadedFile.name}</p>
                        <p className="text-xs text-neutral-450 mt-1">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-bold text-neutral-700">Drag & Drop or Click to Upload</p>
                        <p className="text-xs text-neutral-400 mt-1">Supports PDF, DWG, DXF, PNG, JPG (Max 25MB)</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1.5 uppercase tracking-wider">File Category</label>
                    <select
                      value={fileCategory}
                      onChange={(e) => setFileCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm focus:outline-none focus:border-cyan-500 transition-colors font-semibold"
                    >
                      <option value="layout">Architectural Layout</option>
                      <option value="electrical">Electrical Grid Map</option>
                      <option value="moodboard">Moodboard Reference</option>
                      <option value="other">Other Reference File</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Review & Submit */}
          {step === 6 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-neutral-900 border-b border-neutral-100 pb-2">Final Review</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-neutral-50/40 p-5 rounded-md border border-neutral-200/60">
                <div className="space-y-3.5">
                  <div>
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Selected Plan</span>
                    <span className="text-sm font-extrabold text-neutral-900">{selectedPlan?.name}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Project Name</span>
                      <span className="text-xs font-bold text-neutral-800">{projectDetails.projectName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Client Representative</span>
                      <span className="text-xs font-bold text-neutral-800">{projectDetails.clientName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Total Area</span>
                      <span className="text-xs font-bold text-neutral-800">{projectDetails.areaSqFt} sq ft</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Timeline</span>
                      <span className="text-xs font-bold text-neutral-800">{projectDetails.timeline}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3.5 border-t md:border-t-0 md:border-l border-neutral-200/60 md:pl-6">
                  <div>
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Lighting Preferences Selected</span>
                    {lightingPreferences.length === 0 ? (
                      <span className="text-xs text-neutral-400 font-medium italic">None selected</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {lightingPreferences.map(p => (
                          <span key={p} className="px-2 py-0.5 bg-neutral-100 border border-neutral-200 rounded text-[10px] font-semibold text-neutral-600">{p}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Uploaded Blueprint</span>
                    <span className="text-xs font-bold text-neutral-800 block mt-0.5">
                      {uploadedFile ? `${uploadedFile.name} (${(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)` : 'No file uploaded'}
                    </span>
                  </div>

                  <div className="bg-cyan-600 text-white rounded-md p-4 mt-4 shadow-sm flex justify-between items-center">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider font-bold opacity-80 block">Grand Total Plan Cost</span>
                      <span className="text-lg font-extrabold">₹{calculatePrice().toLocaleString()}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 bg-white/10 rounded-full border border-white/20">Payment Pending</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Buttons Controls */}
        <div className="flex justify-between items-center pt-6 border-t border-neutral-100 mt-8">
          <button
            onClick={handleBack}
            disabled={step === 1 || submitting}
            className="px-4 py-2 border border-neutral-200 hover:bg-neutral-50 rounded-md text-sm font-bold text-neutral-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Back
          </button>
          
          {step < 6 ? (
            <button
              onClick={handleNext}
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md text-sm font-bold transition-colors shadow-sm"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md text-sm font-bold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Submitting Project...</span>
                </>
              ) : (
                <span>Confirm & Submit Project</span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Payment Confirmation Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white border border-neutral-200 rounded-lg max-w-md w-full p-6 shadow-xl space-y-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-full flex items-center justify-center mx-auto mb-3 border border-cyan-100">
                <i className="bx bx-credit-card-front text-2xl"></i>
              </div>
              <h3 className="text-lg font-bold text-neutral-900">Verify Project Payment</h3>
              <p className="text-xs text-neutral-450 mt-1">Confirm the payment status for <strong>{projectDetails.projectName}</strong> before submitting.</p>
            </div>

            <div className="bg-neutral-50 rounded-md p-4 border border-neutral-100 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Plan Amount</span>
                <span className="text-xs font-bold text-neutral-800">{selectedPlan?.name}</span>
              </div>
              <span className="text-base font-extrabold text-neutral-900">₹{calculatePrice().toLocaleString()}</span>
            </div>

            <div className="flex flex-col space-y-2">
              <button
                onClick={async () => {
                  setShowPaymentModal(false);
                  setSubmitting(true);
                  await saveProject(true);
                }}
                disabled={submitting}
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm rounded-md transition-colors shadow-sm flex items-center justify-center space-x-1.5"
              >
                <i className="bx bx-check-circle text-base"></i>
                <span>Yes, Payment Completed</span>
              </button>

              <button
                onClick={async () => {
                  setShowPaymentModal(false);
                  setSubmitting(true);
                  await saveProject(false);
                }}
                disabled={submitting}
                className="w-full py-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-bold text-sm rounded-md transition-colors flex items-center justify-center space-x-1.5"
              >
                <i className="bx bx-time text-base"></i>
                <span>No, Pay Later (Pending)</span>
              </button>

              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={submitting}
                className="w-full py-2 text-xs font-semibold text-neutral-400 hover:text-neutral-600 transition-colors text-center"
              >
                Cancel & Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
