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
    description: '',
    basePrice: '',
    minSqFt: '',
    isActive: true
  });

  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    basePrice: '',
    minSqFt: '',
    isActive: true
  });

  async function fetchPlans() {
    try {
      const { data, error } = await supabase
        .from('pricing_plans')
        .select('id, name, description, base_price_per_sq_ft, min_sq_ft, is_active')
        .order('base_price_per_sq_ft', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const normalizedPlans = data.map((plan: any) => {
          let sqft = plan.sqft;
          let price = plan.price;
          let original_price = plan.original_price;
          let discount = plan.discount;
          let deliverables = plan.deliverables;

          if (plan.name?.includes('Essential')) {
            sqft = 'UP TO 1,500 SQ.FT.';
            price = 4999;
            original_price = 10000;
            discount = '50% off';
            deliverables = ['Lighting Layout', 'Fixture Suggestions', '1 Revision'];
          } else if (plan.name?.includes('Professional')) {
            sqft = '1,501 - 5,000 SQ.FT.';
            price = 9999;
            original_price = 20000;
            discount = '50% off';
            deliverables = ['Lighting Layout', 'Fixture Suggestions', 'Lux Guidance', '2 Revisions'];
          } else if (plan.name?.includes('Premium')) {
            sqft = '5,001 - 10,000 SQ.FT.';
            price = 24999;
            original_price = 50000;
            discount = '50% off';
            deliverables = ['Detailed Lighting Layout', 'Lux Calculations', '3 Revisions', '2 Site Visits'];
          } else if (plan.name?.includes('Enterprise')) {
            sqft = 'ABOVE 10,000 SQ.FT.';
            price = null;
            plan.custom_quote = true;
            deliverables = ['Complete Lighting Design Support', 'Multiple Revisions', 'Dedicated Designer', 'Site Visits as per requirements'];
          } else if (!price && plan.base_price_per_sq_ft) {
            price = Number(plan.base_price_per_sq_ft);
          }

          return {
            ...plan,
            sqft: sqft || (plan.min_sq_ft ? `MIN ${plan.min_sq_ft} SQ.FT.` : 'PACKAGE'),
            price,
            original_price,
            discount,
            deliverables: deliverables || (plan.description ? plan.description.split(',') : []),
          };
        });

        setPlans(normalizedPlans);
      } else {
        throw new Error('No DB data');
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
      setPlans([
        {
          id: 'essential',
          name: 'Amplex Essential',
          sqft: 'UP TO 1,500 SQ.FT.',
          price: 4999,
          original_price: 10000,
          discount: '50% off',
          description: 'Includes Lighting Layout, Fixture Suggestions, and 1 Revision.',
          deliverables: ['Lighting Layout', 'Fixture Suggestions', '1 Revision'],
          is_active: true
        },
        {
          id: 'professional',
          name: 'Amplex Professional',
          sqft: '1,501 - 5,000 SQ.FT.',
          price: 9999,
          original_price: 20000,
          discount: '50% off',
          popular: true,
          description: 'Includes Lighting Layout, Fixture Suggestions, Lux Guidance, and 2 Revisions.',
          deliverables: ['Lighting Layout', 'Fixture Suggestions', 'Lux Guidance', '2 Revisions'],
          is_active: true
        },
        {
          id: 'premium',
          name: 'Amplex Premium',
          sqft: '5,001 - 10,000 SQ.FT.',
          price: 24999,
          original_price: 50000,
          discount: '50% off',
          description: 'Includes Detailed Lighting Layout, Lux Calculations, 3 Revisions, and 2 Site Visits.',
          deliverables: ['Detailed Lighting Layout', 'Lux Calculations', '3 Revisions', '2 Site Visits'],
          is_active: true
        },
        {
          id: 'enterprise',
          name: 'Amplex Enterprise',
          sqft: 'ABOVE 10,000 SQ.FT.',
          price: null,
          custom_quote: true,
          description: 'Complete Lighting Design Support, Multiple Revisions, Dedicated Designer, Site Visits as per requirements.',
          deliverables: ['Complete Lighting Design Support', 'Multiple Revisions', 'Dedicated Designer', 'Site Visits as per requirements'],
          is_active: true
        }
      ]);
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

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase
        .from('pricing_plans')
        .insert({
          name: newPlan.name,
          description: newPlan.description,
          base_price_per_sq_ft: parseFloat(newPlan.basePrice || '0'),
          min_sq_ft: parseFloat(newPlan.minSqFt || '0'),
          is_active: newPlan.isActive
        });

      if (error) throw error;

      triggerNotification('Pricing plan created successfully!', null);
      setShowAddModal(false);
      setNewPlan({ name: '', description: '', basePrice: '', minSqFt: '', isActive: true });
      fetchPlans();
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
      const { error } = await supabase
        .from('pricing_plans')
        .update({
          name: editForm.name,
          description: editForm.description,
          base_price_per_sq_ft: parseFloat(editForm.basePrice || '0'),
          min_sq_ft: parseFloat(editForm.minSqFt || '0'),
          is_active: editForm.isActive
        })
        .eq('id', editingPlan.id);

      if (error) throw error;

      triggerNotification('Pricing plan updated successfully!', null);
      setShowEditModal(false);
      fetchPlans();
    } catch (err: any) {
      triggerNotification(null, err.message || 'Failed to update plan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlan = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const { error } = await supabase
        .from('pricing_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;

      triggerNotification('Pricing plan deleted successfully!', null);
      fetchPlans();
    } catch (err: any) {
      triggerNotification(null, err.message || 'Failed to delete plan');
    }
  };

  const startEditing = (plan: any) => {
    setEditingPlan(plan);
    setEditForm({
      name: plan.name,
      description: plan.description || '',
      basePrice: (plan.price || plan.base_price_per_sq_ft || 0).toString(),
      minSqFt: (plan.min_sq_ft || 0).toString(),
      isActive: plan.is_active
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

      {/* 4 COLUMNS CARD GRID ONLY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        {plans.map((p) => {
          const displayPrice = p.custom_quote || !p.price ? 'Custom Quote' : `₹${Number(p.price).toLocaleString('en-IN')}`;
          const originalPriceStr = p.original_price ? `₹${Number(p.original_price).toLocaleString('en-IN')}` : null;
          const deliverablesList = p.deliverables || (p.description ? p.description.split(',') : []);

          return (
            <div
              key={p.id}
              className={`bg-white border rounded-md p-6 flex flex-col justify-between space-y-6 hover:border-neutral-300 transition-all duration-200 relative h-full cursor-pointer ${
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
                  {p.custom_quote ? (
                    <span className="text-xl font-bold text-neutral-900">Custom Quote</span>
                  ) : (
                    <div className="space-y-0.5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-neutral-900 leading-none">{displayPrice}</span>
                        <span className="text-xs text-neutral-400 font-medium"> / flat</span>
                      </div>
                      {originalPriceStr && (
                        <span className="text-xs text-neutral-400 line-through block font-medium">{originalPriceStr}</span>
                      )}
                    </div>
                  )}
                </div>

                <ul className="space-y-2.5 pt-4 border-t border-neutral-100">
                  {deliverablesList.map((item: string, i: number) => (
                    <li key={i} className="text-xs text-neutral-600 font-medium flex items-start space-x-1.5">
                      <i className="bx bx-check text-amber-600 text-sm mt-0.5 flex-shrink-0"></i>
                      <span className="leading-tight">{item.trim()}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-6 border-t border-neutral-100 grid grid-cols-2 gap-2">
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
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Price (₹) *</label>
                    <input
                      type="number"
                      step="1"
                      required
                      value={newPlan.basePrice}
                      onChange={(e) => setNewPlan(prev => ({ ...prev, basePrice: e.target.value }))}
                      placeholder="e.g. 14999"
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-md text-xs focus:outline-none focus:bg-white focus:border-amber-500 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Min Area (sq ft)</label>
                    <input
                      type="number"
                      value={newPlan.minSqFt}
                      onChange={(e) => setNewPlan(prev => ({ ...prev, minSqFt: e.target.value }))}
                      placeholder="e.g. 1000"
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-md text-xs focus:outline-none focus:bg-white focus:border-amber-500 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Description / Deliverables</label>
                  <textarea
                    rows={3}
                    value={newPlan.description}
                    onChange={(e) => setNewPlan(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Separate deliverables with commas (e.g. Lighting Layout, Lux Calculations)"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-md text-xs focus:outline-none focus:bg-white focus:border-amber-500 transition-all font-medium resize-none"
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
                <h3 className="text-base font-semibold text-neutral-900">Edit Pricing Plan</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Update rate parameters for {editingPlan.name}</p>
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
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Price (₹) *</label>
                    <input
                      type="number"
                      step="1"
                      required
                      value={editForm.basePrice}
                      onChange={(e) => setEditForm(prev => ({ ...prev, basePrice: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-md text-xs focus:outline-none focus:bg-white focus:border-amber-500 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Min Area (sq ft)</label>
                    <input
                      type="number"
                      value={editForm.minSqFt}
                      onChange={(e) => setEditForm(prev => ({ ...prev, minSqFt: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-md text-xs focus:outline-none focus:bg-white focus:border-amber-500 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Description / Deliverables</label>
                  <textarea
                    rows={3}
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-md text-xs focus:outline-none focus:bg-white focus:border-amber-500 transition-all font-medium resize-none"
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
