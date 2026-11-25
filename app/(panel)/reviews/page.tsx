import Link from 'next/link';
import { getAdminMe, listAdminReviews } from '@/lib/admin-api';
import { ReviewsTable } from '@/components/admin/reviews-table';
import { requireRole } from '@/lib/guards';

export const dynamic = 'force-dynamic';

const FILTERS = [
  { value: 'pending', label: 'Pendientes' },
  { value: 'approved', label: 'Aprobadas' },
  { value: 'rejected', label: 'Rechazadas' },
  { value: 'all', label: 'Todas' },
];

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole(['owner', 'admin', 'editor', 'sales']);
  const me = await getAdminMe();

  const { status } = await searchParams;
  const current = status ?? 'all';
  const reviews = await listAdminReviews(current);
  const pendingCount = (await listAdminReviews('pending')).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reseñas</h1>
        <p className="text-sm text-muted-foreground">
          {pendingCount > 0
            ? `${pendingCount} esperando aprobación. Solo las aprobadas se ven en la tienda.`
            : 'Todo al día. Solo las aprobadas se ven en la tienda.'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Link
            key={filter.value}
            href={
              filter.value === 'all'
                ? '/reviews'
                : `/reviews?status=${filter.value}`
            }
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              current === filter.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/70'
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      <ReviewsTable
        reviews={reviews}
        canDelete={me.isOwner || me.role === 'admin'}
      />
    </div>
  );
}
