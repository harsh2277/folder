'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function AdminPricingManagement() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Add Plan form state
  const [newPlan, setNewPlan] = useState({
    name: '',
    description: '',
    basePrice: '',
    minSqFt: '',
    isActive: true
  });

  // Edit Plan form state
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
      setPlans(data || []);
    } catch (err) {
      console.error('Error fetching plans:', err);
      // Fallback mock data
      setPlans([
        { id: '1', name: 'Basic Layout Plan', description: 'Includes 2D conceptual lighting layouts, basic luxury recommendations, and hardware BOQ schedules.', base_price_per_sq_ft: 15.00, min_sq_ft: 1000, is_active: true },
        { id: '2', name: 'Premium Design Plan', description: 'Adds full 3D Lux calculation simulation reports, fixture model selections, and custom wiring guides.', base_price_per_sq_ft: 35.00, min_sq_ft: 1500, is_active: true },
        { id: '3', name: 'Luxe Autorevision Plan', description: 'Adds dedicated project designer, 3 iterations revision window, and on-call site coordination.', base_price_per_sq_ft: 65.00, min_sq_ft: 2000, is_active: true }
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPlans();
  }, [supabase]);

  // Notification helper
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
          base_price_per_sq_ft: parseFloat(newPlan.basePrice),
          min_sq_ft: parseFloat(newPlan.minSqFt),
          is_active: newPlan.isActive
        });

      if (error) throw error;

      triggerNotification('Pricing plan added successfully!', null);
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
          base_price_per_sq_ft: parseFloat(editForm.basePrice),
          min_sq_ft: parseFloat(editForm.minSqFt),
          is_active: editForm.isActive
        })
        .eq('id', editingPlan.id);

      if (error) throw error;

      triggerNotification('Pricing plan updated successfully!', null);
      setShowEditModal(false);
      setEditingPlan(null);
      fetchPlans();
    } catch (err: any) {
      triggerNotification(null, err.message || 'Failed to update plan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlan = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the plan "${name}"? This action cannot be undone.`)) {
      return;
    }

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
      basePrice: plan.base_price_per_sq_ft.toString(),
      minSqFt: plan.min_sq_ft.toString(),
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
    <div className="space-y-4">
      {/* Notifications */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold rounded-md flex items-center space-x-2">
          <i className="bx bx-check-circle text-lg"></i>
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold rounded-md flex items-center space-x-2">
          <i className="bx bx-error-circle text-lg"></i>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Configuration Header */}
      <div className="bg-white border border-neutral-200 rounded-md p-5 shadow-sm">
        <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 font-sans">Pricing & Rate Architecture</h2>
            <p className="text-sm text-neutral-400 mt-0.5">Control pricing plan defaults, rate per square foot parameters, and active design packages.</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-md transition-colors shadow-sm cursor-pointer"
          >
            <i className="bx bx-plus text-sm mr-1.5"></i>
            <span>Add Plan</span>
          </button>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`border rounded-lg p-6 bg-white flex flex-col justify-between space-y-6 hover:shadow-md transition-all duration-200 ${
                plan.is_active ? 'border-neutral-200' : 'border-neutral-100 opacity-60'
              }`}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-extrabold text-neutral-900 leading-snug">{plan.name}</h3>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                    plan.is_active ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-neutral-100 border-neutral-200 text-neutral-400'
                  }`}>
                    {plan.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 font-medium leading-relaxed min-h-[48px] line-clamp-3">{plan.description}</p>
              </div>

              <div className="pt-4 border-t border-neutral-100 space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] text-neutral-450 font-bold uppercase tracking-wider">Base Rate</span>
                  <span className="text-2xl font-black text-neutral-800 font-sans">
                    ₹{Number(plan.base_price_per_sq_ft).toFixed(2)}
                    <span className="text-xs text-neutral-400 font-semibold"> / sq ft</span>
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs font-semibold text-neutral-500">
                  <span>Minimum Area Threshold</span>
                  <span className="font-sans text-neutral-800">{Number(plan.min_sq_ft).toLocaleString()} sq ft</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => startEditing(plan)}
                    className="py-2 bg-neutral-550/10 hover:bg-neutral-100 text-neutral-800 font-bold text-xs rounded border border-neutral-250/20 transition-colors cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeletePlan(plan.id, plan.name)}
                    className="py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded border border-rose-100 transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Plan Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white border border-neutral-200 rounded-lg max-w-md w-full p-6 shadow-xl space-y-4 animate-fade-in">
            <div>
              <h3 className="text-lg font-bold text-neutral-900">Add Pricing Plan</h3>
              <p className="text-xs text-neutral-400">Introduce a new design package, rate configuration, or minimum threshold.</p>
            </div>

            <form onSubmit={handleAddPlan} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-600 mb-1.5 uppercase tracking-wider">Plan Name *</label>
                <input
                  type="text"
                  required
                  value={newPlan.name}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Standard 3D Layout"
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm focus:outline-none focus:bg-white focus:border-amber-500 transition-colors font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1.5 uppercase tracking-wider">Price (₹/sq ft) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newPlan.basePrice}
                    onChange={(e) => setNewPlan(prev => ({ ...prev, basePrice: e.target.value }))}
                    placeholder="25.00"
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm focus:outline-none focus:bg-white focus:border-amber-500 transition-colors font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1.5 uppercase tracking-wider">Min Sq Ft *</label>
                  <input
                    type="number"
                    required
                    value={newPlan.minSqFt}
                    onChange={(e) => setNewPlan(prev => ({ ...prev, minSqFt: e.target.value }))}
                    placeholder="500"
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm focus:outline-none focus:bg-white focus:border-amber-500 transition-colors font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 mb-1.5 uppercase tracking-wider">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={newPlan.description}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Summarize the plan features, deliverables, and targets..."
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm focus:outline-none focus:bg-white focus:border-amber-500 transition-colors font-semibold"
                />
              </div>

              <div className="flex items-center space-x-2 py-1">
                <input
                  type="checkbox"
                  id="new_is_active"
                  checked={newPlan.isActive}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4.5 h-4.5 text-amber-500 border-neutral-350 rounded cursor-pointer"
                />
                <label htmlFor="new_is_active" className="text-xs font-bold text-neutral-700 uppercase tracking-wider cursor-pointer">
                  Activate Package Immediately
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={submitting}
                  className="px-4 py-2 border border-neutral-200 hover:bg-neutral-50 rounded-md text-xs font-bold text-neutral-600 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-xs font-bold transition-colors shadow-sm cursor-pointer disabled:opacity-55"
                >
                  {submitting ? 'Adding...' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Plan Modal */}
      {showEditModal && editingPlan && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white border border-neutral-200 rounded-lg max-w-md w-full p-6 shadow-xl space-y-4 animate-fade-in">
            <div>
              <h3 className="text-lg font-bold text-neutral-900">Edit Pricing Plan</h3>
              <p className="text-xs text-neutral-400">Update rates, minimum dimensions, or descriptions for <strong>{editingPlan.name}</strong>.</p>
            </div>

            <form onSubmit={handleUpdatePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-600 mb-1.5 uppercase tracking-wider">Plan Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm focus:outline-none focus:bg-white focus:border-amber-500 transition-colors font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1.5 uppercase tracking-wider">Price (₹/sq ft) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editForm.basePrice}
                    onChange={(e) => setEditForm({ ...editForm, basePrice: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm focus:outline-none focus:bg-white focus:border-amber-500 transition-colors font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1.5 uppercase tracking-wider">Min Sq Ft *</label>
                  <input
                    type="number"
                    required
                    value={editForm.minSqFt}
                    onChange={(e) => setEditForm({ ...editForm, minSqFt: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm focus:outline-none focus:bg-white focus:border-amber-500 transition-colors font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 mb-1.5 uppercase tracking-wider">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm focus:outline-none focus:bg-white focus:border-amber-500 transition-colors font-semibold"
                />
              </div>

              <div className="flex items-center space-x-2 py-1">
                <input
                  type="checkbox"
                  id="edit_is_active"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                  className="w-4.5 h-4.5 text-amber-500 border-neutral-350 rounded cursor-pointer"
                />
                <label htmlFor="edit_is_active" className="text-xs font-bold text-neutral-700 uppercase tracking-wider cursor-pointer">
                  Toggle Plan Status Active
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingPlan(null);
                  }}
                  disabled={submitting}
                  className="px-4 py-2 border border-neutral-200 hover:bg-neutral-50 rounded-md text-xs font-bold text-neutral-600 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-xs font-bold transition-colors shadow-sm cursor-pointer disabled:opacity-55"
                >
                  {submitting ? 'Saving...' : 'Save Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
