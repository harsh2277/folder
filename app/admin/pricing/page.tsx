'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Portal from '@/components/ui/Portal';

export default function AdminPricingManagement() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Additional Revenue Add-ons rates state
  const [addonRates, setAddonRates] = useState({
    vis3dFee: '₹5,000+',
    siteVisitFee: 'Extra'
  });
  const [showAddonModal, setShowAddonModal] = useState(false);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [newPlan, setNewPlan] = useState({
    name: '',
    sqft: '',
    basePrice: '',
    originalPrice: '',
    discount: '50% off',
    features: '',
    bottomFeatures: '',
    isActive: true
  });

  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    sqft: '',
    basePrice: '',
    originalPrice: '',
    discount: '',
    features: '',
    bottomFeatures: '',
    isActive: true
  });

  const defaultPlans = [
    {
      id: 'essential',
      name: 'Amplex Essential',
      sqft: 'UP TO 1,500 SQ.FT.',
      price: 4999,
      originalPrice: 10000,
      discount: '50% off',
      features: ['Lighting Layout', 'Fixture Suggestions'],
      bottomFeatures: ['1 Revision'],
      is_active: true
    },
    {
      id: 'professional',
      name: 'Amplex Professional',
      sqft: '1,501 - 5,000 SQ.FT.',
      price: 9999,
      originalPrice: 20000,
      discount: '50% off',
      popular: true,
      features: ['Lighting Layout', 'Fixture Suggestions', 'Lux Guidance'],
      bottomFeatures: ['2 Revisions'],
      is_active: true
    },
    {
      id: 'premium',
      name: 'Amplex Premium',
      sqft: '5,001 - 10,000 SQ.FT.',
      price: 24999,
      originalPrice: 50000,
      discount: '50% off',
      features: ['Detailed Lighting Layout', 'Lux Calculations'],
      bottomFeatures: ['3 Revisions', '2 Site Visits'],
      is_active: true
    },
    {
      id: 'enterprise',
      name: 'Amplex Enterprise',
      sqft: 'ABOVE 10,000 SQ.FT.',
      price: null,
      customQuote: true,
      features: ['Complete Lighting Design Support', 'Multiple Revisions', 'Dedicated Designer'],
      bottomFeatures: ['Site Visits as per requirements'],
      is_active: true
    }
  ];

  async function fetchPlans() {
    try {
      // Check stored custom overrides
      const storedOverridesStr = typeof window !== 'undefined' ? localStorage.getItem('lightmap_pricing_plan_overrides') : null;
      let storedOverrides: Record<string, any> = {};
      if (storedOverridesStr) {
        try {
          storedOverrides = JSON.parse(storedOverridesStr);
        } catch (e) {
          console.error('Error parsing stored overrides:', e);
        }
      }

      const { data } = await supabase
        .from('pricing_plans')
        .select('id, name, description, base_price_per_sq_ft, min_sq_ft, is_active')
        .order('base_price_per_sq_ft', { ascending: true });

      let currentPlans = defaultPlans.map(p => {
        const ov = storedOverrides[p.id];
        if (ov) {
          return {
            ...p,
            name: ov.name || p.name,
            sqft: ov.sqft || p.sqft,
            price: ov.price !== undefined ? ov.price : p.price,
            originalPrice: ov.originalPrice !== undefined ? ov.originalPrice : p.originalPrice,
            discount: ov.discount !== undefined ? ov.discount : p.discount,
            features: ov.features || p.features,
            bottomFeatures: ov.bottomFeatures || p.bottomFeatures
          };
        }
        return p;
      });

      if (data && data.length > 0) {
        currentPlans = currentPlans.map((p, idx) => {
          const matchedDb = data.find((d: any) => d.name?.toLowerCase().includes(p.id)) || data[idx];
          if (matchedDb && matchedDb.base_price_per_sq_ft && !storedOverrides[p.id]) {
            const dbPrice = Number(matchedDb.base_price_per_sq_ft);
            if (dbPrice > 0) {
              p.price = dbPrice;
            }
          }
          return p;
        });
      }

      setPlans(currentPlans);
    } catch (err) {
      console.error('Error fetching plans:', err);
      setPlans(defaultPlans);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPlans();
  }, []);

  const triggerNotification = (success: string | null, error: string | null) => {
    if (success) {
      setSuccessMsg(success);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
    if (error) {
      setErrorMsg(error);
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  const syncOverridesToStore = (planId: string, updatedPlanData: any) => {
    try {
      const storedOverridesStr = localStorage.getItem('lightmap_pricing_plan_overrides');
      const overrides = storedOverridesStr ? JSON.parse(storedOverridesStr) : {};
      overrides[planId] = updatedPlanData;
      localStorage.setItem('lightmap_pricing_plan_overrides', JSON.stringify(overrides));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Error saving pricing plan overrides:', e);
    }
  };

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const featuresArr = newPlan.features.split(',').map(s => s.trim()).filter(Boolean);
      const bottomFeaturesArr = newPlan.bottomFeatures.split(',').map(s => s.trim()).filter(Boolean);
      const planPrice = newPlan.basePrice ? parseFloat(newPlan.basePrice) : null;
      const planOrigPrice = newPlan.originalPrice ? parseFloat(newPlan.originalPrice) : null;

      const createdPlan = {
        id: `custom_${Date.now()}`,
        name: newPlan.name,
        sqft: newPlan.sqft || 'CUSTOM AREA',
        price: planPrice,
        originalPrice: planOrigPrice,
        discount: newPlan.discount || '50% off',
        features: featuresArr.length > 0 ? featuresArr : ['Lighting Layout'],
        bottomFeatures: bottomFeaturesArr.length > 0 ? bottomFeaturesArr : ['1 Revision'],
        is_active: newPlan.isActive
      };

      await supabase
        .from('pricing_plans')
        .insert({
          name: newPlan.name,
          description: featuresArr.join(', '),
          base_price_per_sq_ft: planPrice || 0,
          min_sq_ft: 1000,
          is_active: newPlan.isActive
        });

      syncOverridesToStore(createdPlan.id, createdPlan);
      setPlans(prev => [...prev, createdPlan]);

      triggerNotification('New Pricing Tier created successfully!', null);
      setShowAddModal(false);
      setNewPlan({ name: '', sqft: '', basePrice: '', originalPrice: '', discount: '50% off', features: '', bottomFeatures: '', isActive: true });
    } catch (err: any) {
      triggerNotification(null, err.message || 'Failed to add plan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const featuresArr = editForm.features.split(',').map(s => s.trim()).filter(Boolean);
      const bottomFeaturesArr = editForm.bottomFeatures.split(',').map(s => s.trim()).filter(Boolean);
      const updatedPrice = editForm.basePrice !== '' ? parseFloat(editForm.basePrice) : null;
      const updatedOrigPrice = editForm.originalPrice !== '' ? parseFloat(editForm.originalPrice) : null;

      const updatedPlanData = {
        name: editForm.name,
        sqft: editForm.sqft,
        price: updatedPrice,
        originalPrice: updatedOrigPrice,
        discount: editForm.discount,
        features: featuresArr,
        bottomFeatures: bottomFeaturesArr
      };

      // Update in Supabase
      await supabase
        .from('pricing_plans')
        .update({
          name: editForm.name,
          description: featuresArr.join(', '),
          base_price_per_sq_ft: updatedPrice || 0,
          is_active: editForm.isActive
        })
        .eq('id', editingPlan.id);

      // Sync overrides for Add Project creation wizards
      syncOverridesToStore(editingPlan.id, updatedPlanData);

      // Update local state
      setPlans(prev => prev.map(p => p.id === editingPlan.id ? { ...p, ...updatedPlanData } : p));

      triggerNotification('Plan & Revisions/Site Visits updated successfully!', null);
      setShowEditModal(false);
    } catch (err: any) {
      triggerNotification(null, err.message || 'Failed to update plan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlan = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await supabase
        .from('pricing_plans')
        .delete()
        .eq('id', id);

      setPlans(prev => prev.filter(p => p.id !== id));
      triggerNotification('Pricing plan removed successfully!', null);
    } catch (err: any) {
      triggerNotification(null, err.message || 'Failed to delete plan');
    }
  };

  const startEditing = (plan: any) => {
    setEditingPlan(plan);
    setEditForm({
      name: plan.name,
      sqft: plan.sqft || '',
      basePrice: plan.price !== null && plan.price !== undefined ? plan.price.toString() : '',
      originalPrice: plan.originalPrice !== null && plan.originalPrice !== undefined ? plan.originalPrice.toString() : '',
      discount: plan.discount || '',
      features: plan.features ? plan.features.join(', ') : '',
      bottomFeatures: plan.bottomFeatures ? plan.bottomFeatures.join(', ') : '',
      isActive: plan.is_active !== undefined ? plan.is_active : true
    });
    setShowEditModal(true);
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

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notifications */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-md flex items-center space-x-2 animate-fade-in">
          <i className="bx bx-check-circle text-base text-emerald-600"></i>
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-md flex items-center space-x-2 animate-fade-in">
          <i className="bx bx-error-circle text-base text-rose-600"></i>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Clean Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200/80">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 tracking-tight">Pricing & Packages</h2>
          <p className="text-xs text-neutral-500 mt-0.5">Control pricing plan defaults, flat project rates, and deliverable packages.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-semibold text-xs rounded-md transition-all cursor-pointer shadow-xs"
        >
          <i className="bx bx-plus text-sm mr-1.5"></i>
          <span>Add Plan Tier</span>
        </button>
      </div>

      {/* 4 COLUMNS CARD GRID MATCHING ADD PROJECT CARD CONTENT & STYLE EXACTLY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        {plans.map((p) => {
          return (
            <div
              key={p.id}
              className={`border rounded-md p-6 bg-white flex flex-col justify-between space-y-6 hover:border-neutral-300 transition-all duration-200 relative h-full cursor-pointer ${
                p.popular ? 'border-amber-500 ring-1 ring-amber-500' : 'border-neutral-200'
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs bg-amber-500 text-white px-2.5 py-0.5 rounded font-medium z-10 whitespace-nowrap shadow-xs">
                  Most Popular
                </span>
              )}

              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-neutral-400">{p.sqft}</span>
                  {p.discount && (
                    <span className="px-2 py-0.5 rounded text-xs font-bold border bg-amber-50 border-amber-100 text-amber-700">
                      {p.discount}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-semibold text-neutral-900 leading-snug">{p.name}</h3>

                <div className="pt-4 border-t border-neutral-100 space-y-1">
                  <span className="text-xs text-neutral-400 font-medium block">Rate</span>
                  {p.customQuote || p.price === null ? (
                    <span className="text-xl font-bold text-neutral-900">Custom Quote</span>
                  ) : (
                    <div className="space-y-0.5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-neutral-900 leading-none">₹{Number(p.price || 0).toLocaleString('en-IN')}</span>
                        <span className="text-xs text-neutral-400 font-medium"> / flat</span>
                      </div>
                      {p.originalPrice && (
                        <span className="text-xs text-neutral-400 line-through block font-medium">₹{Number(p.originalPrice).toLocaleString('en-IN')}</span>
                      )}
                    </div>
                  )}
                </div>

                <ul className="space-y-2.5 pt-4 border-t border-neutral-100">
                  {p.features?.map((f: string, i: number) => (
                    <li key={i} className="text-xs text-neutral-600 font-medium flex items-start space-x-1.5">
                      <i className="bx bx-check text-amber-600 text-sm mt-0.5 flex-shrink-0"></i>
                      <span className="leading-tight">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                {p.bottomFeatures && p.bottomFeatures.length > 0 && (
                  <div className="border-t border-neutral-100 pt-3 mt-4 text-left">
                    {p.bottomFeatures.map((bf: string, idx: number) => (
                      <div key={idx} className="text-xs text-neutral-600 font-medium flex items-center justify-start gap-1.5 mt-1">
                        <i className="bx bx-sync text-neutral-400 text-sm"></i>
                        <span>{bf}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Admin Action Buttons */}
                <div className="pt-4 mt-5 border-t border-neutral-100 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => startEditing(p)}
                    className="py-2 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 font-semibold text-xs rounded-md border border-neutral-200 transition-all cursor-pointer flex items-center justify-center space-x-1 active:scale-[0.98]"
                  >
                    <i className="bx bx-edit text-sm"></i>
                    <span>Edit Plan</span>
                  </button>
                  <button
                    onClick={() => handleDeletePlan(p.id, p.name)}
                    className="py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-md border border-rose-200 transition-all cursor-pointer flex items-center justify-center space-x-1 active:scale-[0.98]"
                  >
                    <i className="bx bx-trash text-sm"></i>
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADDITIONAL REVENUE OPPORTUNITIES SECTION */}
      <div className="bg-white border border-neutral-200 rounded-md p-6 space-y-4 font-sans mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-100">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 tracking-tight">Additional Revenue Opportunities & Services</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Optional add-on services selectable by architects during project creation.</p>
          </div>
          <button
            onClick={() => setShowAddonModal(true)}
            className="px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 text-xs font-semibold rounded-md border border-neutral-200 transition-all flex items-center space-x-1.5 cursor-pointer w-fit"
          >
            <i className="bx bx-edit text-sm"></i>
            <span>Edit Add-on Amounts</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-neutral-200 rounded-md p-4 bg-neutral-50/50 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-sm font-semibold text-neutral-900 block">3D Lighting Visualization</span>
              <span className="text-xs text-neutral-500 block">Photorealistic 3D rendering and false-color lux calculation spreads</span>
            </div>
            <div className="text-right shrink-0">
              <span className="text-base font-bold text-amber-600 font-sans block">{addonRates.vis3dFee}</span>
              <span className="text-[10px] text-neutral-400 font-medium block">Starting Add-on</span>
            </div>
          </div>

          <div className="border border-neutral-200 rounded-md p-4 bg-neutral-50/50 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-sm font-semibold text-neutral-900 block">Site Visit & Consultation</span>
              <span className="text-xs text-neutral-500 block">On-site luminaire positioning & electrical team coordination</span>
            </div>
            <div className="text-right shrink-0">
              <span className="text-base font-bold text-amber-600 font-sans block">{addonRates.siteVisitFee}</span>
              <span className="text-[10px] text-neutral-400 font-medium block">Custom Quote</span>
            </div>
          </div>
        </div>
      </div>

      {/* EDIT ADD-ON RATES MODAL */}
      {showAddonModal && (
        <Portal>
          <div className="fixed inset-0 bg-neutral-950/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans transition-all duration-300">
            <div className="bg-white border border-neutral-200 rounded-md max-w-md w-full p-6 space-y-4 animate-fade-in relative shadow-lg">
              <button
                onClick={() => setShowAddonModal(false)}
                className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-900 transition-colors"
              >
                <i className="bx bx-x text-2xl"></i>
              </button>

              <div>
                <h3 className="text-base font-semibold text-neutral-900">Edit Additional Service Amounts</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Update display fees for optional add-on services.</p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                setShowAddonModal(false);
                triggerNotification('Add-on amounts updated successfully!', null);
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">3D Lighting Visualization Amount</label>
                  <input
                    type="text"
                    required
                    value={addonRates.vis3dFee}
                    onChange={(e) => setAddonRates(prev => ({ ...prev, vis3dFee: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-md text-xs focus:outline-none focus:bg-white focus:border-amber-500 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Site Visit & Consultation Amount</label>
                  <input
                    type="text"
                    required
                    value={addonRates.siteVisitFee}
                    onChange={(e) => setAddonRates(prev => ({ ...prev, siteVisitFee: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-md text-xs focus:outline-none focus:bg-white focus:border-amber-500 transition-all font-medium"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddonModal(false)}
                    className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-md text-xs font-semibold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-xs font-semibold transition-all shadow-xs cursor-pointer"
                  >
                    Save Amounts
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* CREATE PLAN MODAL */}
      {showAddModal && (
        <Portal>
          <div className="fixed inset-0 bg-neutral-950/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans transition-all duration-300">
            <div className="bg-white border border-neutral-200 rounded-md max-w-md w-full p-6 space-y-4 animate-fade-in relative shadow-lg">
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-900 transition-colors"
              >
                <i className="bx bx-x text-2xl"></i>
              </button>

              <div>
                <h3 className="text-base font-semibold text-neutral-900">Create Pricing Plan</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Introduce a new design package or rate configuration.</p>
              </div>

              <form onSubmit={handleAddPlan} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Plan Name *</label>
                  <input
                    type="text"
                    required
                    value={newPlan.name}
                    onChange={(e) => setNewPlan(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Amplex Commercial Deluxe"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-md text-xs focus:outline-none focus:bg-white focus:border-amber-500 transition-all font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Area Range (sq ft) *</label>
                    <input
                      type="text"
                      required
                      value={newPlan.sqft}
                      onChange={(e) => setNewPlan(prev => ({ ...prev, sqft: e.target.value }))}
                      placeholder="e.g. 10,001 - 15,000 SQ.FT."
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-md text-xs focus:outline-none focus:bg-white focus:border-amber-500 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Discount Tag</label>
                    <input
                      type="text"
                      value={newPlan.discount}
                      onChange={(e) => setNewPlan(prev => ({ ...prev, discount: e.target.value }))}
                      placeholder="e.g. 50% off"
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-md text-xs focus:outline-none focus:bg-white focus:border-amber-500 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Offer Rate (₹) *</label>
                    <input
                      type="number"
                      step="1"
                      value={newPlan.basePrice}
                      onChange={(e) => setNewPlan(prev => ({ ...prev, basePrice: e.target.value }))}
                      placeholder="e.g. 4999 (Leave empty for Custom Quote)"
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-md text-xs focus:outline-none focus:bg-white focus:border-amber-500 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Regular Rate (₹)</label>
                    <input
                      type="number"
                      step="1"
                      value={newPlan.originalPrice}
                      onChange={(e) => setNewPlan(prev => ({ ...prev, originalPrice: e.target.value }))}
                      placeholder="e.g. 10000"
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-md text-xs focus:outline-none focus:bg-white focus:border-amber-500 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Features (Checkmark list - comma separated)</label>
                  <input
                    type="text"
                    value={newPlan.features}
                    onChange={(e) => setNewPlan(prev => ({ ...prev, features: e.target.value }))}
                    placeholder="e.g. Lighting Layout, Fixture Suggestions, Lux Guidance"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-md text-xs focus:outline-none focus:bg-white focus:border-amber-500 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Revisions & Site Visits (Bottom list - comma separated)</label>
                  <input
                    type="text"
                    value={newPlan.bottomFeatures}
                    onChange={(e) => setNewPlan(prev => ({ ...prev, bottomFeatures: e.target.value }))}
                    placeholder="e.g. 3 Revisions, 2 Site Visits"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-md text-xs focus:outline-none focus:bg-white focus:border-amber-500 transition-all font-medium"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-md text-xs font-semibold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Creating...' : 'Create Plan Tier'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* EDIT PLAN MODAL */}
      {showEditModal && editingPlan && (
        <Portal>
          <div className="fixed inset-0 bg-neutral-950/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans transition-all duration-300">
            <div className="bg-white border border-neutral-200 rounded-md max-w-md w-full p-6 space-y-4 animate-fade-in relative shadow-lg">
              <button
                onClick={() => setShowEditModal(false)}
                className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-900 transition-colors"
              >
                <i className="bx bx-x text-2xl"></i>
              </button>

              <div>
                <h3 className="text-base font-semibold text-neutral-900">Edit Pricing Plan & Options</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Update rate, features, revisions, and site visits options for {editingPlan.name}</p>
              </div>

              <form onSubmit={handleUpdatePlan} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Plan Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-md text-xs focus:outline-none focus:bg-white focus:border-amber-500 transition-all font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Area Range Label</label>
                    <input
                      type="text"
                      value={editForm.sqft}
                      onChange={(e) => setEditForm(prev => ({ ...prev, sqft: e.target.value }))}
                      placeholder="e.g. UP TO 1,500 SQ.FT."
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-md text-xs focus:outline-none focus:bg-white focus:border-amber-500 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Discount Tag</label>
                    <input
                      type="text"
                      value={editForm.discount}
                      onChange={(e) => setEditForm(prev => ({ ...prev, discount: e.target.value }))}
                      placeholder="e.g. 50% off"
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-md text-xs focus:outline-none focus:bg-white focus:border-amber-500 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Offer Price (₹)</label>
                    <input
                      type="number"
                      step="1"
                      value={editForm.basePrice}
                      onChange={(e) => setEditForm(prev => ({ ...prev, basePrice: e.target.value }))}
                      placeholder="e.g. 4999 (Leave empty for Custom Quote)"
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-md text-xs focus:outline-none focus:bg-white focus:border-amber-500 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Regular Rate (₹)</label>
                    <input
                      type="number"
                      step="1"
                      value={editForm.originalPrice}
                      onChange={(e) => setEditForm(prev => ({ ...prev, originalPrice: e.target.value }))}
                      placeholder="e.g. 10000"
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-md text-xs focus:outline-none focus:bg-white focus:border-amber-500 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Checkmark Features (comma-separated)</label>
                  <input
                    type="text"
                    value={editForm.features}
                    onChange={(e) => setEditForm(prev => ({ ...prev, features: e.target.value }))}
                    placeholder="e.g. Lighting Layout, Fixture Suggestions, Lux Guidance"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-md text-xs focus:outline-none focus:bg-white focus:border-amber-500 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Revisions & Site Visits Options (comma-separated)</label>
                  <input
                    type="text"
                    value={editForm.bottomFeatures}
                    onChange={(e) => setEditForm(prev => ({ ...prev, bottomFeatures: e.target.value }))}
                    placeholder="e.g. 3 Revisions, 2 Site Visits"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-md text-xs focus:outline-none focus:bg-white focus:border-amber-500 transition-all font-medium"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-md text-xs font-semibold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save Changes'}
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
