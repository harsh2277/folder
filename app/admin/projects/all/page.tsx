'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function RedirectToProjects() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    router.replace(query ? `/admin/projects?${query}` : '/admin/projects');
  }, [router, searchParams]);

  return null;
}

export default function AdminProjectsAllRedirect() {
  return (
    <Suspense fallback={null}>
      <RedirectToProjects />
    </Suspense>
  );
}
