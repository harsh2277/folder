'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function AdminPricingManagement() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states for editing
  const [basePrice, setBasePrice] = useState('');
  const [minSqFt, setMinSqFt] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  async function fetchPlans() {
    try {
      const { data, error } = await supabase
        .from('pricing_plans')
        .select('id, name, description, base_price_per_sq_ft, min_sq_ft, is_active')
        .order('name', { ascending: true });

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

  const startEditing = (plan: any) => {
    setEditingPlan(plan);
    setBasePrice(plan.base_price_per_sq_ft.toString());
    setMinSqFt(plan.min_sq_ft.toString());
    setDescription(plan.description || '');
    setIsActive(plan.is_active);
  };

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    try {
      const updatedData = {
        base_price_per_sq_ft: parseFloat(basePrice),
        min_sq_ft: parseFloat(minSqFt),
        description,
        is_active: isActive
      };

      const { error } = await supabase
        .from('pricing_plans')
        .update(updatedData)
        .eq('id', editingPlan.id);

      if (error) throw error;

      setSuccessMsg(`Successfully updated plan: ${editingPlan.name}`);
      setEditingPlan(null);
      fetchPlans();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Error updating plan:', err);
      setErrorMsg('Failed to update pricing plan.');
      setTimeout(() => setErrorMsg(null), 3000);
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

  return (
    <div className="space-y-4">
      {/* Configuration Header */}
      <div className="bg-white border border-neutral-200 rounded-md p-5">
        <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 font-sans">Pricing & Rate Architectures</h2>
            <p className="text-sm text-neutral-400 mt-0.5">Control pricing plan defaults, rate per square foot parameters, and active packages.</p>
          </div>
        </div>

        {successMsg && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-sm font-semibold">
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded text-rose-800 text-sm font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`border rounded-md p-5 flex flex-col justify-between space-y-4 bg-white transition-all duration-200 ${
                plan.is_active ? 'border-neutral-250 hover:shadow-sm' : 'border-neutral-200 opacity-60'
              }`}
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-neutral-900">{plan.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                    plan.is_active ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-neutral-100 border-neutral-250 text-neutral-500'
                  }`}>
                    {plan.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 line-clamp-3 leading-relaxed">{plan.description}</p>
              </div>

              <div className="pt-3 border-t border-neutral-50">
                <div className="flex justify-between items-baseline mb-3">
                  <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Base Rate</span>
                  <span className="text-2xl font-black text-neutral-900 font-sans">₹{plan.base_price_per_sq_ft.toFixed(2)}<span className="text-xs text-neutral-400 font-semibold">/sq ft</span></span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold text-neutral-500 mb-4">
                  <span>Minimum Area</span>
                  <span className="font-sans text-neutral-800">{Number(plan.min_sq_ft).toLocaleString()} sq ft</span>
                </div>
                <button
                  onClick={() => startEditing(plan)}
                  className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-md transition-colors"
                >
                  Edit Configuration
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Form Modal/Drawer Area */}
      {editingPlan && (
        <div className="bg-white border border-neutral-200 rounded-md p-5 mt-4">
          <div className="pb-3 border-b border-neutral-100 flex justify-between items-center">
            <h3 className="text-base font-bold text-neutral-900">Modify Plan: {editingPlan.name}</h3>
            <button
              onClick={() => setEditingPlan(null)}
              className="text-neutral-400 hover:text-neutral-600 font-bold text-sm"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleUpdatePlan} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Base Price (₹ per sq ft)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm text-neutral-900 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Minimum Sq Ft Threshold</label>
                <input
                  type="number"
                  required
                  value={minSqFt}
                  onChange={(e) => setMinSqFt(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm text-neutral-900 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Plan Description</label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm text-neutral-900 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div className="flex items-center space-x-3 py-2">
              <input
                type="checkbox"
                id="is_active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-neutral-300 cursor-pointer"
              />
              <label htmlFor="is_active" className="text-xs font-bold text-neutral-700 uppercase tracking-wider cursor-pointer">
                Toggle Package Status Active
              </label>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs rounded-md transition-colors"
            >
              Save Configuration
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
