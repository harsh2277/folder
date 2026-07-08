interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ArchitectRevisionRequestPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Architect Revision Request Page (Project ID: {id})</h1>
      <p className="mt-2 text-gray-600">Submit comment + reference upload</p>
    </div>
  );
}
