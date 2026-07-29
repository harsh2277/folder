export default function AuthWelcome({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md p-8 bg-white border border-neutral-200 rounded-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-full mb-5">
          <i className="bx bx-check text-3xl text-emerald-600" />
        </div>
        <h1 className="text-xl font-medium text-neutral-900">{title}</h1>
        <p className="mt-3 text-sm text-neutral-500 leading-relaxed">{subtitle}</p>
        <div className="mt-6 flex justify-center">
          <span className="w-5 h-5 border-2 border-neutral-200 border-t-amber-500 rounded-full animate-spin" />
        </div>
      </div>
    </div>
  );
}
