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

interface ArchitectProfile {
  id: string;
  name: string;
  email: string;
}

const UI_PLANS = [
  {
    id: 'essential',
    name: 'Amplex Essential',
    sqft: 'UP TO 1,500 SQ.FT.',
    discount: '50% off',
    price: 4999,
    originalPrice: 10000,
    features: ['Lighting Layout', 'Fixture Suggestions', 'Lux Guidance'],
    bottomFeatures: ['1 Revision'],
  },
  {
    id: 'professional',
    name: 'Amplex Professional',
    sqft: '1,501 - 5,000 SQ.FT.',
    discount: '50% off',
    popular: true,
    price: 9999,
    originalPrice: 20000,
    features: ['Detailed Lighting Layout', 'Fixture Suggestions', 'Lux Calculations', 'BOQ'],
    bottomFeatures: ['2 Revisions'],
  },
  {
    id: 'premium',
    name: 'Amplex Premium',
    sqft: '5,001 - 10,000 SQ.FT.',
    discount: '50% off',
    price: 24999,
    originalPrice: 50000,
    features: ['Detailed Lighting Layout', 'Lux Calculations', 'BOQ', 'Fixture Schedule'],
    bottomFeatures: ['3 Revisions', '2 Site Visits'],
  },
  {
    id: 'enterprise',
    name: 'Amplex Enterprise',
    sqft: 'ABOVE 10,000 SQ.FT.',
    customQuote: true,
    features: ['Complete Lighting Design Support', 'All Deliverables', 'Dedicated Designer', 'Custom BOQ'],
    bottomFeatures: ['Multiple Revisions', 'As per requirements'],
  }
];

const ADDONS_DATA = [
  { id: '3d_vis', name: '3D Lighting Visualization', description: 'Photorealistic 3D render', price: 5000 },
  { id: 'site_visit', name: 'Additional Site Visit', description: 'On-site consultation', price: 2500 }
];

export default function AdminProjectCreationWizard() {
  const router = useRouter();
  const supabase = createClient();

  const [activeStep, setActiveStep] = useState(1);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [architects, setArchitects] = useState<ArchitectProfile[]>([]);
  const [designers, setDesigners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [selectedPlanId, setSelectedPlanId] = useState('professional'); // Default popular
  const [assignedArchitectId, setAssignedArchitectId] = useState('');
  const [assignedDesignerId, setAssignedDesignerId] = useState('');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  const [projectDetails, setProjectDetails] = useState({
    projectName: '',
    clientName: '',
    projectType: '',
    siteLocation: '',
    areaSqFt: '',
    budgetRange: '',
    timeline: '',
    stylePreference: '',
    notes: '',
  });

  const [lightingPreferences, setLightingPreferences] = useState<string[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileCategory, setFileCategory] = useState('layout');

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch plans
        const { data: plansData, error: plansError } = await supabase
          .from('pricing_plans')
          .select('*')
          .eq('is_active', true);

        if (plansError) throw plansError;
        setPlans(plansData || []);

        // Fetch architects
        const { data: archsData, error: archsError } = await supabase
          .from('profiles')
          .select('id, name, email')
          .eq('role', 'architect');

        if (archsError) throw archsError;
        setArchitects(archsData || []);

        // Fetch designers
        const { data: desData, error: desError } = await supabase
          .from('profiles')
          .select('id, name, email')
          .eq('role', 'designer');

        if (desError) throw desError;
        setDesigners(desData || []);
      } catch (err: any) {
        console.error('Error loading initialization data:', err);
        setPlans([
          { id: '19acfba5-8ffc-47cf-b1d0-e8cb8ad9ce0d', name: 'Basic Lighting Plan', description: 'Includes basic light layout.', base_price_per_sq_ft: '15.00', min_sq_ft: '500.00' },
          { id: '3b147280-ebd7-4e61-97b2-a96b7e767888', name: 'Premium Design Plan', description: 'Custom lighting layouts.', base_price_per_sq_ft: '25.00', min_sq_ft: '500.00' },
          { id: 'aeed1171-ee5b-4456-83b5-c456df6133ff', name: 'BOQ + Design Package', description: 'Complete lighting design.', base_price_per_sq_ft: '40.00', min_sq_ft: '1000.00' },
        ]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [supabase]);

  const getDbPlanId = () => {
    if (plans.length === 0) return selectedPlanId;
    if (selectedPlanId === 'essential') return plans[0]?.id || '';
    if (selectedPlanId === 'professional') return plans[1]?.id || plans[0]?.id || '';
    if (selectedPlanId === 'premium') return plans[2]?.id || plans[0]?.id || '';
    if (selectedPlanId === 'enterprise') return plans[3]?.id || plans[0]?.id || '';
    return selectedPlanId;
  };

  const calculateTotalPrice = () => {
    const plan = UI_PLANS.find(p => p.id === selectedPlanId);
    if (!plan || plan.customQuote) return 0;
    const planPrice = plan.price || 0;
    const addonsPrice = selectedAddons.reduce((sum, addonId) => {
      const addon = ADDONS_DATA.find(a => a.id === addonId);
      return sum + (addon ? addon.price : 0);
    }, 0);
    return planPrice + addonsPrice;
  };

  const handleNext = () => {
    setErrorMsg('');
    if (activeStep === 1) {
      if (!selectedPlanId) {
        setErrorMsg('Please select a pricing plan.');
        return;
      }
      setActiveStep(2);
    } else if (activeStep === 2) {
      if (!projectDetails.projectName || !projectDetails.clientName || !projectDetails.projectType || !projectDetails.siteLocation || !projectDetails.areaSqFt || !projectDetails.timeline) {
        setErrorMsg('Please complete all required fields (*).');
        return;
      }
      setActiveStep(3);
    }
  };

  const handleAddonToggle = (addonId: string) => {
    setSelectedAddons(prev =>
      prev.includes(addonId) ? prev.filter(id => id !== addonId) : [...prev, addonId]
    );
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

      const serial = `KL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const clientUsername = `client_${projectDetails.clientName.toLowerCase().replace(/\s+/g, '')}_${Math.floor(100 + Math.random() * 905)}`;
      const totalCost = calculateTotalPrice();

      // 1. Insert Project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          project_id_serial: serial,
          architect_id: assignedArchitectId || null,
          assigned_designer_id: assignedDesignerId || null,
          project_name: projectDetails.projectName,
          client_name: projectDetails.clientName,
          project_type: projectDetails.projectType,
          site_location: projectDetails.siteLocation,
          area_sq_ft: Number(projectDetails.areaSqFt) || 0,
          budget_range: projectDetails.budgetRange || 'Standard',
          timeline: projectDetails.timeline,
          pricing_plan_id: getDbPlanId(),
          calculated_price: totalCost,
          payment_status: isPaid ? 'paid' : 'pending',
          status: 'In Design',
          client_username: clientUsername,
          client_password_hash: 'kelvinlightings',
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

      // 3. Insert Remarks / Notes
      const { error: remarksError } = await supabase
        .from('project_remarks')
        .insert({
          project_id: project.id,
          lighting_mood: projectDetails.stylePreference || '',
          expectations: projectDetails.notes || '',
          inspiration_ideas: selectedAddons.join(', '),
          functional_requirements: '',
        });
      if (remarksError) throw remarksError;

      // 4. Upload File if any
      if (uploadedFile) {
        const fileExt = uploadedFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `projects/${project.id}/${fileName}`;

        const { error: storageError } = await supabase.storage
          .from('project-assets')
          .upload(filePath, uploadedFile);

        if (storageError) {
          console.error('Storage upload error:', storageError);
        } else {
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
          amount: totalCost,
          status: isPaid ? 'completed' : 'pending',
          transaction_id: isPaid ? `manual_${Date.now()}` : null,
          invoice_number: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        });
      if (paymentError) throw paymentError;

      router.push('/admin/projects');
    } catch (err: any) {
      console.error('Error saving project:', err);
      setErrorMsg(err.message || 'Something went wrong while saving the project.');
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    setErrorMsg('');
    if (!selectedPlanId) {
      setErrorMsg('Please select a pricing plan.');
      return;
    }
    if (!projectDetails.projectName || !projectDetails.clientName || !projectDetails.projectType || !projectDetails.siteLocation || !projectDetails.areaSqFt || !projectDetails.timeline) {
      setErrorMsg('Please complete all required fields (*) in the Project Details step.');
      return;
    }
    const plan = UI_PLANS.find(p => p.id === selectedPlanId);
    if (plan?.customQuote) {
      setSubmitting(true);
      await saveProject(false);
    } else {
      setShowPaymentModal(true);
    }
  };

  const stepsList = [
    { num: 1, label: 'Select Plan' },
    { num: 2, label: 'Project Details' },
    { num: 3, label: 'Preferences & Blueprint' }
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

  const selectedPlan = UI_PLANS.find(p => p.id === selectedPlanId);

  return (
    <div className="max-w-7xl mx-auto space-y-8 font-sans pb-12 pt-2">

      {/* Top Clean Heading (No Breadcrumbs) */}
      <div className="text-center">
        <h2 className="text-xl font-semibold text-neutral-900 tracking-tight">Configure New Project Layout</h2>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-55 border border-red-200 rounded-xl text-red-800 text-sm font-semibold flex items-center space-x-2 max-w-3xl mx-auto">
          <i className="bx bx-error-circle text-lg animate-pulse"></i>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Premium Progress Stepper Line */}
      <div className="max-w-xl mx-auto pb-6">
        <div className="relative flex items-center justify-between">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-neutral-200 z-0">
            <div
              className="h-full bg-amber-500 transition-all duration-300"
              style={{ width: `${((activeStep - 1) / (stepsList.length - 1)) * 100}%` }}
            />
          </div>
          {stepsList.map((s) => {
            const isActive = activeStep === s.num;
            const isCompleted = activeStep > s.num;
            return (
              <button
                key={s.num}
                onClick={() => {
                  if (s.num < activeStep || (s.num === 2 && selectedPlanId) || (s.num === 3 && selectedPlanId && projectDetails.projectName)) {
                    setActiveStep(s.num);
                  }
                }}
                disabled={s.num > activeStep}
                className="relative z-10 flex flex-col items-center focus:outline-none"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 border-2 ${isActive
                    ? 'bg-neutral-950 border-neutral-950 text-amber-500 shadow-sm ring-4 ring-neutral-950/10'
                    : isCompleted
                      ? 'bg-amber-500 border-amber-500 text-neutral-950'
                      : 'bg-white border-neutral-200 text-neutral-400'
                  }`}>
                  {isCompleted ? <i className="bx bx-check text-sm"></i> : s.num}
                </div>
                <span className={`absolute top-10 text-sm uppercase tracking-wider font-semibold whitespace-nowrap transition-colors duration-300 ${isActive ? 'text-neutral-900 font-semibold' : 'text-neutral-400'
                  }`}>
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split-Screen Configurator Workspace */}
      <div className={activeStep === 1 ? "block pt-4" : "grid grid-cols-1 lg:grid-cols-3 gap-8 items-start pt-4"}>

        {/* Left Side: Active Step Card Only / Full Width for Step 1 */}
        <div className={activeStep === 1 ? "w-full space-y-4" : "lg:col-span-2 space-y-4"}>
          <div className="bg-white border border-neutral-200 rounded-md p-6.5 shadow-xs min-h-[420px] transition-all duration-300">
            {/* STEP 1: Select Plan */}
            {activeStep === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900 font-sans">Choose Your Amplex Plan</h2>
                  <p className="text-sm text-neutral-450 mt-0.5">Select a plan based on your project size. Pricing is auto-calculated — no negotiations.</p>
                </div>

                {/* 4 Columns Grid of Pricing Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                  {UI_PLANS.map((p) => {
                    const isSelected = selectedPlanId === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPlanId(p.id)}
                        className={`border rounded-lg p-6 bg-white flex flex-col justify-between space-y-6 hover:shadow-md transition-all duration-200 relative h-full cursor-pointer ${
                          isSelected ? 'border-amber-500 ring-1 ring-amber-500' : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        {p.popular && (
                          <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-sm bg-amber-500 text-white px-2.5 py-0.5 rounded font-semibold uppercase tracking-wider z-10 whitespace-nowrap shadow-sm">
                            Most Popular
                          </span>
                        )}

                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-semibold text-neutral-400 tracking-wider uppercase">{p.sqft}</span>
                            {p.discount && (
                              <span className="px-2 py-0.5 rounded text-sm font-semibold border bg-emerald-50 border-emerald-100 text-emerald-700">
                                {p.discount}
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm font-semibold text-neutral-900 leading-snug">{p.name}</h3>

                          <div className="pt-4 border-t border-neutral-100 space-y-1">
                            <span className="text-sm text-neutral-400 font-semibold uppercase tracking-wider block">Rate</span>
                            {p.customQuote ? (
                              <span className="text-lg font-semibold text-neutral-900">Custom Quote</span>
                            ) : (
                              <div className="space-y-0.5">
                                <div className="flex items-baseline gap-1">
                                  <span className="text-[24px] font-semibold text-neutral-900 leading-none">₹{p.price?.toLocaleString()}</span>
                                  <span className="text-sm text-neutral-400 font-medium"> / flat</span>
                                </div>
                                {p.originalPrice && (
                                  <span className="text-sm text-neutral-400/80 line-through block">₹{p.originalPrice.toLocaleString()}</span>
                                )}
                              </div>
                            )}
                          </div>

                          <ul className="space-y-2.5 pt-4 border-t border-neutral-100">
                            {p.features.map((f, i) => (
                              <li key={i} className="text-sm text-neutral-500 font-medium flex items-start space-x-1.5">
                                <i className="bx bx-check text-emerald-600 text-sm mt-0.5 flex-shrink-0"></i>
                                <span className="leading-tight">{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          {p.bottomFeatures && (
                            <div className="border-t border-neutral-100 pt-3 mt-4 text-left">
                              {p.bottomFeatures.map((bf, idx) => (
                                <div key={idx} className="text-sm text-neutral-500 font-semibold flex items-center justify-start gap-1.5 mt-0.5">
                                  <i className="bx bx-sync text-neutral-400 text-sm"></i>
                                  <span>{bf}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="mt-5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPlanId(p.id);
                              }}
                              className={`w-full py-2 text-sm font-semibold rounded transition-colors cursor-pointer text-center ${
                                isSelected
                                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200'
                              }`}
                            >
                              {isSelected ? 'Selected' : 'Select Plan'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add-ons Row */}
                <div className="border-t border-neutral-100 pt-6 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900 font-sans">Add-on Services</h3>
                    <p className="text-sm text-neutral-450 mt-0.5">Optional services to enhance your project delivery.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ADDONS_DATA.map((addon) => {
                      const isChecked = selectedAddons.includes(addon.id);
                      return (
                        <div
                          key={addon.id}
                          onClick={() => handleAddonToggle(addon.id)}
                          className={`border rounded-lg p-4 flex items-center justify-between cursor-pointer transition-all duration-200 ${
                            isChecked
                              ? 'border-amber-500 bg-amber-50/20'
                              : 'border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          <div className="flex items-center space-x-3.5">
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                              isChecked ? 'bg-amber-500 border-amber-500 text-white' : 'border-neutral-300'
                            }`}>
                              {isChecked && <i className="bx bx-check text-sm"></i>}
                            </div>
                            <div>
                              <span className="text-sm font-semibold text-neutral-700 block">{addon.name}</span>
                              <span className="text-sm text-neutral-400 mt-0.5 block">
                                {addon.id === '3d_vis' ? 'Photorealistic 3D render of lighting design' : 'On-site consultation with our lighting expert'}
                              </span>
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-amber-600">
                            +₹{addon.price.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {!selectedPlanId && (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold rounded-md flex items-center space-x-2">
                    <i className="bx bx-info-circle text-lg"></i>
                    <span>Please select a plan to continue to project details.</span>
                  </div>
                )}

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!selectedPlanId}
                    className={`px-4 py-2 text-sm font-semibold rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm ${
                      selectedPlanId
                        ? 'bg-amber-500 hover:bg-amber-600 text-white'
                        : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                    }`}
                  >
                    <span>Continue to Project Details</span>
                    <i className="bx bx-chevron-right text-sm"></i>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Project Specifications */}
            {activeStep === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-800 uppercase tracking-wider">2. Project Details</h3>
                  <p className="text-sm text-neutral-450 mt-0.5">Provide client layout specifications and dimensions.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-neutral-600">Project Name *</label>
                    <input
                      type="text"
                      value={projectDetails.projectName}
                      onChange={(e) => setProjectDetails(prev => ({ ...prev, projectName: e.target.value }))}
                      placeholder="e.g. Oberoi Residency"
                      className="w-full px-3 py-2 bg-neutral-50/50 border border-neutral-200 rounded-md text-sm placeholder-neutral-455 focus:outline-none focus:bg-white focus:border-amber-500 transition-colors font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-neutral-600">Client Name *</label>
                    <input
                      type="text"
                      value={projectDetails.clientName}
                      onChange={(e) => setProjectDetails(prev => ({ ...prev, clientName: e.target.value }))}
                      placeholder="e.g. Mr. Aditya Oberoi"
                      className="w-full px-3 py-2 bg-neutral-50/50 border border-neutral-200 rounded-md text-sm placeholder-neutral-455 focus:outline-none focus:bg-white focus:border-amber-500 transition-colors font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-600 mb-1">Assign Architect</label>
                      <select
                        value={assignedArchitectId}
                        onChange={(e) => setAssignedArchitectId(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-50/50 border border-neutral-200 rounded-md text-sm focus:outline-none focus:border-amber-500 transition-colors font-semibold cursor-pointer"
                      >
                        <option value="">Unassigned</option>
                        {architects.map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-neutral-600 mb-1">Assign Designer</label>
                      <select
                        value={assignedDesignerId}
                        onChange={(e) => setAssignedDesignerId(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-50/50 border border-neutral-200 rounded-md text-sm focus:outline-none focus:border-amber-500 transition-colors font-semibold cursor-pointer"
                      >
                        <option value="">Unassigned</option>
                        {designers.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-neutral-600">Project Type *</label>
                    <select
                      value={projectDetails.projectType}
                      onChange={(e) => setProjectDetails(prev => ({ ...prev, projectType: e.target.value }))}
                      className="w-full px-3 py-2 bg-neutral-50/50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-amber-500 transition-colors font-semibold cursor-pointer"
                    >
                      <option value="">Select type...</option>
                      <option value="Residential Villa">Residential Villa</option>
                      <option value="Residential Apartment">Residential Apartment</option>
                      <option value="Office Space">Office Space</option>
                      <option value="Retail Store">Retail Store</option>
                      <option value="Hotel / Hospitality">Hotel / Hospitality</option>
                      <option value="Restaurant / Café">Restaurant / Café</option>
                      <option value="Showroom">Showroom</option>
                      <option value="Industrial / Warehouse">Industrial / Warehouse</option>
                      <option value="Healthcare Facility">Healthcare Facility</option>
                      <option value="Educational Institution">Educational Institution</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-neutral-600">Site Location *</label>
                    <input
                      type="text"
                      value={projectDetails.siteLocation}
                      onChange={(e) => setProjectDetails(prev => ({ ...prev, siteLocation: e.target.value }))}
                      placeholder="City, State"
                      className="w-full px-3 py-2 bg-neutral-50/50 border border-neutral-200 rounded-md text-sm placeholder-neutral-455 focus:outline-none focus:bg-white focus:border-amber-500 transition-colors font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-neutral-600">Total Area (sq.ft.) *</label>
                    <input
                      type="number"
                      value={projectDetails.areaSqFt}
                      onChange={(e) => setProjectDetails(prev => ({ ...prev, areaSqFt: e.target.value }))}
                      placeholder="e.g. 2500"
                      className="w-full px-3 py-2 bg-neutral-50/50 border border-neutral-200 rounded-md text-sm placeholder-neutral-455 focus:outline-none focus:bg-white focus:border-amber-500 transition-colors font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-neutral-600">Fixture Budget Range</label>
                    <select
                      value={projectDetails.budgetRange}
                      onChange={(e) => setProjectDetails(prev => ({ ...prev, budgetRange: e.target.value }))}
                      className="w-full px-3 py-2 bg-neutral-50/50 border border-neutral-200 rounded-md text-sm focus:outline-none focus:border-amber-550 transition-colors font-semibold cursor-pointer"
                    >
                      <option value="">Select range...</option>
                      <option value="Under ₹5 Lakhs">Under ₹5 Lakhs</option>
                      <option value="₹5 – 15 Lakhs">₹5 – 15 Lakhs</option>
                      <option value="₹15 – 30 Lakhs">₹15 – 30 Lakhs</option>
                      <option value="₹30 – 60 Lakhs">₹30 – 60 Lakhs</option>
                      <option value="₹60 Lakhs – 1 Crore">₹60 Lakhs – 1 Crore</option>
                      <option value="Above ₹1 Crore">Above ₹1 Crore</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-neutral-600">Delivery Timeline *</label>
                    <select
                      value={projectDetails.timeline}
                      onChange={(e) => setProjectDetails(prev => ({ ...prev, timeline: e.target.value }))}
                      className="w-full px-3 py-2 bg-neutral-50/50 border border-neutral-200 rounded-md text-sm focus:outline-none focus:border-amber-555 transition-colors font-semibold cursor-pointer"
                    >
                      <option value="">Select timeline...</option>
                      <option value="Within 1 week">Within 1 week</option>
                      <option value="1 – 2 weeks">1 – 2 weeks</option>
                      <option value="2 – 4 weeks">2 – 4 weeks</option>
                      <option value="1 – 2 months">1 – 2 months</option>
                      <option value="Flexible">Flexible</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-neutral-600">Style Preference</label>
                    <select
                      value={projectDetails.stylePreference}
                      onChange={(e) => setProjectDetails(prev => ({ ...prev, stylePreference: e.target.value }))}
                      className="w-full px-3 py-2 bg-neutral-50/50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-amber-500 transition-colors font-semibold cursor-pointer"
                    >
                      <option value="">Select style...</option>
                      <option value="Modern">Modern</option>
                      <option value="Minimalist">Minimalist</option>
                      <option value="Luxury">Luxury</option>
                      <option value="Industrial">Industrial</option>
                      <option value="Traditional">Traditional</option>
                      <option value="Scandinavian">Scandinavian</option>
                      <option value="Art Deco">Art Deco</option>
                      <option value="Mid-Century Modern">Mid-Century Modern</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="block text-sm font-semibold text-neutral-600">Notes / Remarks</label>
                  <textarea
                    rows={3}
                    value={projectDetails.notes}
                    onChange={(e) => setProjectDetails(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Share details or requirements..."
                    className="w-full px-3.5 py-2.5 bg-neutral-50/50 border border-neutral-200 rounded-md text-sm focus:outline-none focus:bg-white focus:border-amber-500 transition-colors font-semibold"
                  />
                </div>

                <div className="pt-3 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveStep(1)}
                    className="px-4 py-2 border border-neutral-200 hover:bg-neutral-50 rounded-md text-sm font-semibold text-neutral-600 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-neutral-950 text-sm font-semibold rounded-md transition-colors shadow-xs cursor-pointer"
                  >
                    Continue to Preferences
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Preferences & Files */}
            {activeStep === 3 && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-800 uppercase tracking-wider">3. Preferences & Attachments</h3>
                  <p className="text-sm text-neutral-450 mt-0.5">Submit architectural blueprints and design criteria preferences.</p>
                </div>

                <div className="space-y-3.5">
                  <span className="text-sm font-semibold text-neutral-555 block">Design Concepts (Select all that apply)</span>
                  <div className="flex flex-wrap gap-2">
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
                        <button
                          key={pref}
                          type="button"
                          onClick={() => handlePreferenceToggle(pref)}
                          className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-all cursor-pointer ${isChecked
                              ? 'bg-amber-500 text-neutral-950 border-amber-500'
                              : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border-neutral-200'
                            }`}
                        >
                          {pref}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-neutral-100 pt-4 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <span className="text-sm font-semibold text-neutral-555 block">Attach Floor Layout Plan / Blueprints</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-neutral-500 font-semibold whitespace-nowrap">File Category:</span>
                      <select
                        value={fileCategory}
                        onChange={(e) => setFileCategory(e.target.value)}
                        className="px-3 py-1.5 bg-white border border-neutral-200 rounded-md text-sm focus:outline-none focus:border-amber-500 transition-colors font-semibold cursor-pointer"
                      >
                        <option value="layout">Architectural Layout</option>
                        <option value="electrical">Electrical Grid Map</option>
                        <option value="moodboard">Moodboard Reference</option>
                        <option value="other">Other Reference File</option>
                      </select>
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-neutral-200 hover:border-amber-500 transition-colors rounded-md p-8 text-center bg-neutral-50/50 flex flex-col items-center justify-center min-h-[160px] relative cursor-pointer group">
                    <input
                      type="file"
                      onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <i className="bx bx-cloud-upload text-4xl text-neutral-400 mb-2 group-hover:text-amber-500 transition-colors"></i>
                    {uploadedFile ? (
                      <div>
                        <p className="text-sm font-semibold text-neutral-800">{uploadedFile.name}</p>
                        <p className="text-sm text-neutral-400 mt-0.5">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-semibold text-neutral-700">Drag & Drop blueprint layout files or browse</p>
                        <p className="text-sm text-neutral-400 mt-0.5">Supports PDF, DWG, DXF, PNG, JPG (Max 25MB)</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    className="px-4 py-2 border border-neutral-200 hover:bg-neutral-50 rounded-md text-sm font-semibold text-neutral-600 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-neutral-955 font-semibold text-sm rounded-md transition-colors shadow-sm cursor-pointer flex items-center space-x-1.5"
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-neutral-955" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <i className="bx bx-check-circle text-sm"></i>
                        <span>Confirm & Create Project</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Side: STICKY Live Summary & Pricing Sidebar */}
        {activeStep !== 1 && (
          <div className="lg:col-span-1 lg:sticky lg:top-6">
            <div className="bg-neutral-900 text-white rounded-md p-6.5 shadow-md border border-neutral-800 space-y-5">

              <div className="border-b border-white/10 pb-3 flex justify-between items-center">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Live Summary</h3>
                <span className="text-sm bg-amber-500 text-neutral-950 font-semibold px-2 py-0.5 rounded-full uppercase">Configurator</span>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-sm text-neutral-400 font-semibold uppercase tracking-wider block">Package Selection</span>
                  <div className="flex justify-between items-center bg-white/5 p-3 rounded-md border border-white/10">
                    <span className="text-sm font-semibold text-white">{selectedPlan?.name}</span>
                    <span className="text-sm text-amber-400 font-semibold">{selectedPlan?.sqft}</span>
                  </div>
                </div>

                {/* Live Project specs */}
                {(projectDetails.projectName || projectDetails.clientName || projectDetails.areaSqFt || assignedArchitectId || assignedDesignerId) && (
                  <div className="space-y-2 bg-white/[0.02] p-3.5 rounded-md border border-white/5 text-sm space-y-2.5">
                    {projectDetails.projectName && (
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Project Name:</span>
                        <span className="font-semibold text-white">{projectDetails.projectName}</span>
                      </div>
                    )}
                    {projectDetails.clientName && (
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Client:</span>
                        <span className="font-semibold text-white">{projectDetails.clientName}</span>
                      </div>
                    )}
                    {projectDetails.areaSqFt && (
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Dimensions:</span>
                        <span className="font-semibold text-white">{Number(projectDetails.areaSqFt).toLocaleString()} sq ft</span>
                      </div>
                    )}
                    {assignedArchitectId && (
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Architect:</span>
                        <span className="font-semibold text-white">
                          {architects.find(a => a.id === assignedArchitectId)?.name || 'Assigned'}
                        </span>
                      </div>
                    )}
                    {assignedDesignerId && (
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Designer:</span>
                        <span className="font-semibold text-white">
                          {designers.find(d => d.id === assignedDesignerId)?.name || 'Assigned'}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Selected Add-ons */}
                {selectedAddons.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm text-neutral-455 font-semibold uppercase tracking-wider block">Add-ons Selected</span>
                    <div className="space-y-1.5">
                      {selectedAddons.map(id => {
                        const item = ADDONS_DATA.find(a => a.id === id);
                        return (
                          <div key={id} className="flex justify-between items-center text-sm bg-white/5 px-2.5 py-1.5 rounded-md border border-white/10">
                            <span className="text-neutral-300 font-medium">{item?.name}</span>
                            <span className="text-neutral-200 font-semibold">₹{item?.price.toLocaleString()}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Final Estimates */}
                <div className="border-t border-white/10 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-neutral-450">
                    <span>Subtotal Fee:</span>
                    <span>{selectedPlan?.customQuote ? 'Quote Pending' : `₹${selectedPlan?.price?.toLocaleString()}`}</span>
                  </div>

                  {selectedAddons.length > 0 && (
                    <div className="flex justify-between text-neutral-450">
                      <span>Add-ons Subtotal:</span>
                      <span>₹{selectedAddons.reduce((sum, id) => sum + (ADDONS_DATA.find(a => a.id === id)?.price || 0), 0).toLocaleString()}</span>
                    </div>
                  )}

                  {!selectedPlan?.customQuote && (
                    <div className="flex justify-between text-neutral-450">
                      <span>Estimated GST (18%):</span>
                      <span>₹{Math.round(calculateTotalPrice() * 0.18).toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-sm font-semibold text-white border-t border-white/5 pt-3.5">
                    <span>Grand Total Estimate:</span>
                    {selectedPlan?.customQuote ? (
                      <span className="text-amber-400 font-semibold">Custom Quote</span>
                    ) : (
                      <span className="text-amber-400 font-semibold">₹{Math.round(calculateTotalPrice() * 1.18).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Payment Confirmation Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white border border-neutral-200 rounded-md max-w-md w-full p-6 shadow-2xl space-y-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-55/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-3 border border-amber-100">
                <i className="bx bx-credit-card-front text-2xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900">Verify Project Payment</h3>
              <p className="text-sm text-neutral-455 mt-1">Confirm the payment status for <strong>{projectDetails.projectName}</strong> before submitting.</p>
            </div>

            <div className="bg-neutral-50 rounded-md p-4 border border-neutral-100 flex justify-between items-center text-sm">
              <div>
                <span className="text-sm text-neutral-400 font-semibold uppercase tracking-wider block">Plan Amount</span>
                <span className="text-sm font-semibold text-neutral-800">{selectedPlan?.name}</span>
              </div>
              <span className="text-sm font-semibold text-neutral-900">₹{calculateTotalPrice().toLocaleString()}</span>
            </div>

            <div className="flex flex-col space-y-2">
              <button
                onClick={async () => {
                  setShowPaymentModal(false);
                  setSubmitting(true);
                  await saveProject(true);
                }}
                disabled={submitting}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-neutral-955 font-semibold text-sm rounded-md transition-colors shadow-sm flex items-center justify-center space-x-1.5"
              >
                <i className="bx bx-check-circle text-sm"></i>
                <span>Yes, Payment Completed</span>
              </button>

              <button
                onClick={async () => {
                  setShowPaymentModal(false);
                  setSubmitting(true);
                  await saveProject(false);
                }}
                disabled={submitting}
                className="w-full py-2.5 bg-white border border-neutral-200 hover:bg-neutral-55 text-neutral-700 font-semibold text-sm rounded-md transition-colors flex items-center justify-center space-x-1.5"
              >
                <i className="bx bx-time text-sm"></i>
                <span>No, Pay Later (Pending)</span>
              </button>

              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={submitting}
                className="w-full py-2 text-sm font-semibold text-neutral-450 hover:text-neutral-600 transition-colors text-center"
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
