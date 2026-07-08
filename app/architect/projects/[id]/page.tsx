interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ArchitectProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Architect Project Detail Page (ID: {id})</h1>
      <p className="mt-2 text-gray-600">Status tracking, view deliverables, download files</p>
    </div>
  );
}
