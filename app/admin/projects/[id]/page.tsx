interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Admin Project Detail Page (ID: {id})</h1>
      <p className="mt-2 text-gray-600">Status, notes, assign designer, deadlines</p>
    </div>
  );
}
