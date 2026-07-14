'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ArchitectProjectDetail({ params }: PageProps) {
  const { id } = use(params);
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any | null>(null);
  const [remarks, setRemarks] = useState<any | null>(null);
  const [preferences, setPreferences] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'Overview' | 'Deliverables' | 'Revisions'>('Overview');

  const [designer, setDesigner] = useState<any | null>(null);
  const [payment, setPayment] = useState<any | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [userProfile, setUserProfile] = useState<{ name: string; email: string } | null>(null);

  const steps = [
    { name: 'Submitted', statusKey: 'Submitted' },
    { name: 'Payment Pending', statusKey: 'Payment Pending' },
    { name: 'Under Review', statusKey: 'Under Review' },
    { name: 'In Design', statusKey: 'In Design' },
    { name: 'Ready for Review', statusKey: 'Ready for Client Review' },
    { name: 'Revision Requested', statusKey: 'Revision Requested' },
    { name: 'Approved', statusKey: 'Approved' },
    { name: 'Closed', statusKey: 'Closed' }
  ];

  const getActiveStepIndex = () => {
    if (!project) return 0;
    switch (project.status) {
      case 'Submitted': return 0;
      case 'Payment Pending': return 1;
      case 'Under Review': return 2;
      case 'In Design': return 3;
      case 'Ready for Client Review': return 4;
      case 'Revision Requested': return 5;
      case 'Approved': return 6;
      case 'Closed': return 7;
      default: return 0;
    }
  };
  const activeStepIndex = getActiveStepIndex();

  useEffect(() => {
    // Dynamic load Razorpay checkout script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    if (!id) return;

    async function fetchDetails() {
      try {
        // Fetch current user details for Razorpay prefill
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userProf } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', user.id)
            .single();
          if (userProf) {
            setUserProfile(userProf);
          }
        }

        // Fetch project
        const { data: proj, error: projError } = await supabase
          .from('projects')
          .select('*, pricing_plans(name)')
          .eq('id', id)
          .single();

        if (projError) throw projError;
        setProject(proj);

        // Fetch designer name if assigned
        if (proj.assigned_designer_id) {
          const { data: des } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', proj.assigned_designer_id)
            .single();
          setDesigner(des);
        } else {
          setDesigner(null);
        }

        // Fetch payment record
        const { data: pay } = await supabase
          .from('payments')
          .select('*')
          .eq('project_id', id)
          .maybeSingle();
        setPayment(pay);

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
          .select('*, profiles:uploaded_by(role)')
          .eq('project_id', id);
        setFiles(filesData || []);

        // Filter out design deliverables
        if (filesData) {
          setDeliverables(filesData.filter(f => f.profiles?.role === 'designer'));
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

    return () => {
      document.body.removeChild(script);
    };
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

  const getCategoryLabel = (category: string, role?: string) => {
    if (role && role !== 'designer') {
      switch (category) {
        case 'deliverable_layout': return 'Architectural Layout';
        case 'deliverable_boq': return 'Electrical Grid Map';
        case 'deliverable_lux': return 'Moodboard Reference';
        case 'deliverable_report': return 'Other Reference File';
        default: return 'Asset File';
      }
    }
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

  const handleMockPayment = async () => {
    if (typeof (window as any).Razorpay === 'undefined') {
      alert('Razorpay SDK is loading, please wait a moment.');
      return;
    }

    setIsProcessingPayment(true);

    const options = {
      key: "rzp_test_TBHxoNcpPx7OW9",
      amount: Number(payment?.amount || 5899) * 100, // Amount in paise
      currency: "INR",
      name: "LightLab",
      description: `Payment for ${project?.project_name || 'Project'}`,
      handler: async function (response: any) {
        try {
          // 1. Update project status and payment status in supabase
          const { error: projectError } = await supabase
            .from('projects')
            .update({
              payment_status: 'paid',
              status: 'Under Review'
            })
            .eq('id', id);

          if (projectError) throw projectError;

          // 2. Update payment status in payments table
          const { error: paymentError } = await supabase
            .from('payments')
            .update({
              status: 'completed',
              transaction_id: response.razorpay_payment_id
            })
            .eq('project_id', id);

          if (paymentError) throw paymentError;

          // 3. Update local states
          setProject((prev: any) => ({
            ...prev,
            payment_status: 'paid',
            status: 'Under Review'
          }));
          setPayment((prev: any) => ({
            ...prev,
            status: 'completed',
            transaction_id: response.razorpay_payment_id
          }));
          setCheckoutOpen(false);
          router.push(`/architect/payments/success?project_id=${id}&transaction_id=${response.razorpay_payment_id}`);
        } catch (err) {
          console.error('Payment callback error:', err);
          router.push(`/architect/payments/failed?project_id=${id}&amount=${payment?.amount || 5899}`);
        } finally {
          setIsProcessingPayment(false);
        }
      },
      prefill: {
        name: userProfile?.name || "",
        email: userProfile?.email || "",
      },
      theme: {
        color: "#F59E0B"
      },
      modal: {
        ondismiss: function () {
          setIsProcessingPayment(false);
          router.push(`/architect/payments/failed?project_id=${id}&amount=${payment?.amount || 5899}`);
        }
      }
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
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
      <div className="p-8 text-center text-sm text-neutral-450 font-medium bg-white rounded-2xl border border-neutral-200">
        Project not found.
      </div>
    );
  }

  return (
    <>
      {/* Secondary Top Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between bg-white border-b border-neutral-200/80 px-6 py-4 gap-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center space-x-3">
            <Link
              href="/architect/projects"
              className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-500 hover:text-neutral-955 transition-colors flex items-center justify-center flex-shrink-0"
              title="Back to projects"
            >
              <i className="bx bx-chevron-left text-2xl"></i>
            </Link>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-semibold text-neutral-900 tracking-tight leading-tight">{project.project_name}</h2>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Project Plan: {project.pricing_plans?.name || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Right side: Scaled-down Workflow Progress Stepper */}
        <div className="flex-1 w-full lg:w-auto animate-fade-in">
          <div className="flex items-start justify-end overflow-x-auto gap-6">
            {steps.map((step, idx) => {
              const isCompleted = idx < activeStepIndex;
              const isActive = idx === activeStepIndex;
              return (
                <div key={step.name} className="flex-none w-[100px] lg:w-[110px] flex flex-col items-center relative">
                  {/* Connecting Line to next step (behind circles) */}
                  {idx < steps.length - 1 && (
                    <div className={`absolute top-[16px] left-[50%] w-[calc(100%+24px)] h-[2px] z-0 ${idx < activeStepIndex ? 'bg-amber-600' : 'bg-neutral-200'}`} />
                  )}
                  {/* Circle Dot */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-sans text-xs font-semibold relative z-10 transition-all duration-300 ${isActive
                    ? 'bg-amber-600 border-amber-600 text-white ring-4 ring-amber-600/10 shadow-sm shadow-amber-600/10'
                    : isCompleted
                      ? 'bg-amber-600 border-amber-600 text-white'
                      : 'bg-white border-neutral-200 text-neutral-400'
                    }`}>
                    {isCompleted ? <i className="bx bx-check text-xs"></i> : idx + 1}
                  </div>
                  <span className={`text-xs mt-2 font-semibold transition-colors duration-200 text-center relative z-10 whitespace-nowrap ${isActive ? 'text-amber-700 font-bold' : isCompleted ? 'text-amber-600' : 'text-neutral-400'
                    }`}>
                    {step.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Section */}
      <main className="flex-1 overflow-y-auto p-4 bg-neutral-50/70">
        <div className="content-container">
          {/* Tab Container Card */}
          <div className="bg-white border border-neutral-200 rounded-sm py-6 pt-0 font-sans text-neutral-800">
            {/* Tabs Menu */}
            <div className="border-b border-neutral-200 mb-6 bg-white flex items-center justify-between pl-6 pr-3 h-14">
              <div className="flex space-x-8 h-full -mb-px">
                {['Overview', 'Deliverables', 'Revisions'].map((tab) => {
                  const isCurrent = activeTab === tab;
                  const isDisabled = project?.status === 'Submitted' && tab !== 'Overview';
                  return (
                    <button
                      key={tab}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => setActiveTab(tab as any)}
                      className={`h-full text-sm font-semibold transition-all relative flex items-center space-x-1.5 border-b-2 ${isDisabled
                        ? 'opacity-40 cursor-not-allowed text-neutral-400 border-transparent'
                        : 'cursor-pointer'
                        } ${isCurrent
                          ? 'text-amber-600 border-amber-600'
                          : isDisabled
                            ? ''
                            : 'text-neutral-500 hover:text-neutral-800 border-transparent hover:border-neutral-350'
                        }`}
                    >
                      <span>{tab}</span>
                      {tab === 'Deliverables' && deliverables.length > 0 && (
                        <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-medium rounded-full ${isCurrent ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 text-neutral-600'}`}>
                          {deliverables.length}
                        </span>
                      )}
                      {tab === 'Revisions' && revisions.length > 0 && (
                        <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-medium rounded-full ${isCurrent ? 'bg-rose-100 text-rose-700' : 'bg-neutral-100 text-neutral-600'}`}>
                          {revisions.length}
                        </span>
                      )}
                      {isDisabled && (
                        <i className="bx bx-lock text-[10px] text-neutral-400"></i>
                      )}
                    </button>
                  );
                })}
              </div>

              {activeTab === 'Revisions' && (
                <div className="flex items-center h-full">
                  <Link
                    href={`/architect/projects/${id}/revision-request`}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 rounded-sm text-sm font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer shadow-sm shadow-amber-500/10"
                  >
                    <i className="bx bx-comment-edit text-base"></i>
                    <span>Request Revision</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Tab content */}
            <div className="">
              {activeTab === 'Overview' && (
                <div className="space-y-6">
                  {/* Payment Required banner if pending payment */}
                  {project.payment_status !== 'paid' && (
                    <div className="px-6">
                      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-sm animate-fade-in font-sans">
                        {/* Title Bar */}
                        <div className="bg-neutral-50 px-6 py-3.5 border-b border-neutral-200 flex items-center justify-between">
                          <div className="flex items-center space-x-2.5">
                            <i className="bx bx-receipt text-neutral-500 text-lg"></i>
                            <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">Pending Invoice — {payment?.invoice_number || `INV-${new Date().getFullYear()}-001`}</span>
                          </div>
                          <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-100 text-[10px] font-extrabold uppercase rounded-sm tracking-wider">Awaiting Payment</span>
                        </div>

                        {/* Invoice Body Grid */}
                        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Col 1: Invoice metadata */}
                          <div className="lg:col-span-2 space-y-4">
                            <div>
                              <h4 className="text-base font-bold text-neutral-900">{project.project_name}</h4>
                              <p className="text-xs text-neutral-450 mt-0.5">Lighting Design Project Invoice</p>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-neutral-100 pt-4 text-xs">
                              <div>
                                <span className="text-neutral-400 font-semibold block">Client</span>
                                <span className="text-neutral-700 font-bold block mt-1">{project.client_name}</span>
                              </div>
                              <div>
                                <span className="text-neutral-400 font-semibold block">Billing Plan</span>
                                <span className="text-neutral-700 font-bold block mt-1">{project.pricing_plans?.name || 'Standard Plan'}</span>
                              </div>
                              <div>
                                <span className="text-neutral-400 font-semibold block">Date Issued</span>
                                <span className="text-neutral-700 font-bold block mt-1">
                                  {payment?.created_at 
                                    ? new Date(payment.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Col 2: Pricing Summary Column */}
                          <div className="lg:border-l lg:border-dashed lg:border-neutral-200 lg:pl-6 flex flex-col justify-between space-y-5 lg:space-y-0">
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between text-neutral-500">
                                <span>Subtotal:</span>
                                <span className="font-semibold text-neutral-800">₹{Number(payment?.amount || 5899).toLocaleString('en-IN')}</span>
                              </div>
                              <div className="flex justify-between text-neutral-500">
                                <span>Estimated GST (18%):</span>
                                <span className="font-semibold text-neutral-800">₹{Math.round(Number(payment?.amount || 5899) * 0.18).toLocaleString('en-IN')}</span>
                              </div>
                              <div className="flex justify-between border-t border-neutral-200/60 pt-2 text-sm font-bold">
                                <span className="text-neutral-900">Grand Total:</span>
                                <span className="text-amber-600">₹{Math.round(Number(payment?.amount || 5899) * 1.18).toLocaleString('en-IN')}</span>
                              </div>
                            </div>

                            <button
                              onClick={handleMockPayment}
                              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-sm transition-all shadow-md shadow-amber-500/10 active:scale-[0.98] cursor-pointer text-center"
                            >
                              Pay Invoice
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3-column parameter grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4 px-6">
                    <div>
                      <span className="text-xs text-neutral-400 font-medium block">Client</span>
                      <span className="text-sm font-semibold text-neutral-800 mt-1 block">{project.client_name}</span>
                    </div>
                    <div>
                      <span className="text-xs text-neutral-400 font-medium block">Project Type</span>
                      <span className="text-sm font-semibold text-neutral-800 mt-1 block">{project.project_type || 'N/A'}</span>
                    </div>

                    <div>
                      <span className="text-xs text-neutral-400 font-medium block">Site Location</span>
                      <span className="text-sm font-semibold text-neutral-800 mt-1 block">{project.site_location || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-neutral-400 font-medium block">Area</span>
                      <span className="text-sm font-semibold text-neutral-800 mt-1 block">{project.area_sq_ft ? `${Number(project.area_sq_ft).toLocaleString()} sq.ft.` : 'N/A'}</span>
                    </div>

                    <div>
                      <span className="text-xs text-neutral-400 font-medium block">Assigned Designer</span>
                      <span className="text-sm font-semibold text-neutral-800 mt-1 block">{designer?.name || 'Unassigned'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-neutral-400 font-medium block">Deadline</span>
                      <span className="text-sm font-semibold text-neutral-800 mt-1 block">
                        {project.deadline
                          ? new Date(project.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '25 Jun 2026'}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs text-neutral-400 font-medium block">Files Uploaded</span>
                      <span className="text-sm font-semibold text-neutral-800 mt-1 block">
                        {files.filter(f => f.profiles?.role !== 'designer').length} file{files.filter(f => f.profiles?.role !== 'designer').length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-neutral-400 font-medium block">Last Updated</span>
                      <span className="text-sm font-semibold text-neutral-800 mt-1 block">
                        {project.updated_at
                          ? new Date(project.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                          : new Date(project.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs text-neutral-400 font-medium block">Project Status</span>
                      <div className="mt-1.5 block">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 border border-blue-150 text-blue-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-1.5"></span>
                          {project.status === 'Submitted' ? 'Submitted' : project.status}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-neutral-400 font-medium block">Payment Status</span>
                      <div className="mt-1.5 block">
                        {project.payment_status === 'paid' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-150 text-emerald-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                            Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 border border-amber-150 text-amber-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
                            Payment Due
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Lighting preferences pills */}
                  <div className="pt-6 border-t border-neutral-100 px-6">
                    <span className="text-[10px] font-bold text-neutral-450 uppercase tracking-widest block mb-3">LIGHTING PREFERENCES</span>
                    {preferences.length === 0 ? (
                      <p className="text-xs text-neutral-400 italic">No specific preferences selected.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {preferences.map((pref) => (
                          <span
                            key={pref.preference_name}
                            className="px-3.5 py-1.5 border border-amber-500/30 text-amber-650 rounded-full text-xs font-semibold bg-transparent"
                          >
                            {pref.preference_name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Additional notes/remarks if any */}
                  {project.project_notes && (
                    <div className="pt-6 border-t border-neutral-100 px-6">
                      <span className="text-[10px] font-bold text-neutral-450 uppercase tracking-widest block mb-2">Project Notes</span>
                      <div className="bg-neutral-50/50 border border-neutral-200/80 rounded-xl p-4 text-xs text-neutral-600 font-medium leading-relaxed">
                        {project.project_notes}
                      </div>
                    </div>
                  )}

                  {/* Onboarding Files List */}
                  <div className="pt-6 border-t border-neutral-100 px-6">
                    <span className="text-[10px] font-bold text-neutral-450 uppercase tracking-widest block mb-3">Uploaded Onboarding Files</span>
                    {files.filter(f => f.profiles?.role !== 'designer').length === 0 ? (
                      <p className="text-xs text-neutral-400 italic">No onboarding documents uploaded.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {files.filter(f => f.profiles?.role !== 'designer').map((file) => (
                          <div key={file.id} className="flex justify-between items-center p-3 bg-neutral-50 border border-neutral-200 rounded-sm hover:border-neutral-300 transition-colors">
                            <div className="flex items-center space-x-3 overflow-hidden">
                              <div className="w-9 h-9 bg-white border border-neutral-100 rounded-lg flex items-center justify-center text-neutral-450 flex-shrink-0">
                                <i className="bx bx-file text-lg"></i>
                              </div>
                              <div className="overflow-hidden min-w-0">
                                <p className="font-semibold text-neutral-800 text-xs truncate">{file.file_name}</p>
                                <p className="text-[9px] text-neutral-400 mt-0.5 font-medium">{file.file_type} &middot; {getCategoryLabel(file.category, file.profiles?.role)}</p>
                              </div>
                            </div>
                            <a
                              href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${file.file_path}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 font-semibold text-xs rounded-sm transition-colors flex-shrink-0 cursor-pointer"
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
                <div className="space-y-4 px-6">
                  {deliverables.length === 0 ? (
                    <div className="py-12 text-center text-sm text-neutral-450 font-medium space-y-2 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                      <i className="bx bx-file-blank text-3xl text-neutral-300"></i>
                      <p className="font-medium">Deliverables will appear here once ready.</p>
                      <p className="text-xs text-neutral-400">Our design team is preparing the deliverables for your review.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {deliverables.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-4 bg-neutral-50 border border-neutral-200 rounded-xl hover: border-l-4 border-amber-500 transition-all">
                          <div className="flex items-center space-x-3 overflow-hidden">
                            <div className="w-10 h-10 rounded-lg bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0">
                              <i className={`${getFileIcon(file.category)} text-xl`}></i>
                            </div>
                            <div className="overflow-hidden min-w-0">
                              <p className="font-semibold text-neutral-800 text-sm truncate">{file.file_name}</p>
                              <p className="text-[10px] text-neutral-405 mt-0.5 font-medium">{getCategoryLabel(file.category, file.profiles?.role)}</p>
                            </div>
                          </div>
                          <a
                            href={getDownloadUrl(file.file_path)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg flex items-center justify-center text-neutral-600 hover:text-neutral-900 transition-colors flex-shrink-0 cursor-pointer"
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
                  {revisions.length === 0 ? (
                    <div className="py-12 text-center text-sm text-neutral-450 font-medium space-y-2 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                      <i className="bx bx-comment-detail text-3xl text-neutral-300"></i>
                      <p className="font-medium">No revision requests have been filed.</p>
                      <p className="text-xs text-neutral-400">If changes are needed, click 'Request Revision' above.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {revisions.map((rev) => {
                        const [architectRequest, designerNotesPart] = (rev.description || '').split('\n\n=== DESIGNER_RESOLUTION ===\n');
                        const isCompleted = !!designerNotesPart;
                        const isPending = rev.status === 'pending';

                        return (
                          <div key={rev.id} className="space-y-3 px-6 border-b border-neutral-200 pb-6 last:border-b-0 last:pb-0">
                            {/* Header row: Date + Status */}
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-neutral-400 font-medium">
                                Requested: {new Date(rev.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-md font-semibold border ${isPending
                                ? 'bg-amber-50 border-amber-100 text-amber-700'
                                : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                }`}>
                                {isPending ? 'Awaiting Review' : 'Resolved'}
                              </span>
                            </div>

                            {/* Request content */}
                            <div className="space-y-1">
                              <span className="text-sm font-medium text-neutral-400 block">Your Request</span>
                              <p className="text-md text-neutral-800 font-medium leading-relaxed">{architectRequest}</p>
                            </div>

                            {/* Designer Response if resolved */}
                            {isCompleted ? (
                              <div className="pl-4 border-l-2 border-amber-500/80 space-y-1 mt-2">
                                <span className="text-sm font-semibold text-amber-600 block">Designer's Response</span>
                                <p className="text-md text-neutral-600 font-semibold leading-relaxed">{designerNotesPart}</p>
                              </div>
                            ) : (
                              <p className="text-sm text-neutral-450 font-medium italic mt-1.5 pl-4 border-l-2 border-amber-500/40">
                                Awaiting designer response...
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Razorpay Checkout Modal Overlay */}
      {checkoutOpen && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white border border-neutral-200 rounded-2xl max-w-md w-full overflow-hidden shadow-xl p-6 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">Secure Checkout</h3>
                <p className="text-xs text-neutral-450 mt-1">Complete your project payment securely via Razorpay</p>
              </div>
              <button
                onClick={() => setCheckoutOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-neutral-100 text-neutral-500 transition-colors"
              >
                <i className="bx bx-x text-lg"></i>
              </button>
            </div>

            <div className="space-y-4 bg-neutral-50/50 rounded-xl p-4 border border-neutral-200/50">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-500 font-medium">Project</span>
                <span className="text-neutral-800 font-semibold text-right max-w-[200px] truncate">{project.project_name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-neutral-500 font-medium">Invoice Number</span>
                <span className="text-neutral-850 font-semibold">{payment?.invoice_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-neutral-500 font-medium">Plan Tier</span>
                <span className="text-neutral-850 font-semibold">{project.pricing_plans?.name || 'N/A'}</span>
              </div>
              <div className="pt-3 border-t border-neutral-200 flex justify-between items-baseline">
                <span className="text-sm font-semibold text-neutral-800">Total Amount</span>
                <span className="text-lg font-bold text-neutral-900">₹{Number(payment?.amount || 5899).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              onClick={handleMockPayment}
              disabled={isProcessingPayment}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {isProcessingPayment ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Connecting to Razorpay...</span>
                </>
              ) : (
                <span>Pay Now with Razorpay</span>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
