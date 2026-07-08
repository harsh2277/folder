interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminDeliverablesUploadPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Admin Deliverables Upload Page (Project ID: {id})</h1>
      <p className="mt-2 text-gray-600">Deliverables Upload (per project)</p>
    </div>
  );
}
