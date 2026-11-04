'use client';

import { useState, useTransition } from 'react';
import { Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  deleteReview,
  setReviewStatus,
  type AdminReviewRow,
  type ReviewStatus,
} from '@/lib/admin-api';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  hidden: 'Oculta',
};

const STATUS_CLASS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-900',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  hidden: 'bg-muted text-muted-foreground',
};

/**
 * Review moderation: approve what goes live on the product page, reject or
 * hide the rest. Sales and admins can moderate; only owner/admin can delete.
 */
export function ReviewsTable({
  reviews,
  canDelete,
}: {
  reviews: AdminReviewRow[];
  canDelete: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<Record<string, ReviewStatus>>({});

  const change = (review: AdminReviewRow, status: ReviewStatus) => {
    setDraft((prev) => ({ ...prev, [review.id]: status }));
    startTransition(async () => {
      try {
        await setReviewStatus(review.id, status);
        toast.success(
          status === 'approved' ? 'Reseña aprobada' : 'Reseña actualizada'
        );
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'No se pudo actualizar'
        );
        setDraft((prev) => ({ ...prev, [review.id]: review.status }));
      }
    });
  };

  const remove = (review: AdminReviewRow) => {
    if (!window.confirm('¿Eliminar esta reseña para siempre?')) return;
    startTransition(async () => {
      try {
        await deleteReview(review.id);
        toast.success('Reseña eliminada');
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'No se pudo eliminar'
        );
      }
    });
  };

  if (reviews.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
        No hay reseñas con este filtro.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => {
        const status = draft[review.id] ?? review.status;
        return (
          <article key={review.id} className="rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={`h-4 w-4 ${
                          n <= review.rating
                            ? 'fill-primary text-primary'
                            : 'text-muted-foreground/40'
                        }`}
                      />
                    ))}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[status] ?? ''}`}
                  >
                    {STATUS_LABEL[status] ?? status}
                  </span>
                  {review.isVerifiedPurchase && (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                      compra verificada
                    </span>
                  )}
                </div>
                <h3 className="mt-1 font-semibold">{review.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {review.authorName ?? review.userEmail ?? 'Anónimo'} ·{' '}
                  {new Date(review.createdAt).toLocaleDateString('es-AR')}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {review.product}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  disabled={pending || status === 'approved'}
                  onClick={() => change(review, 'approved')}
                >
                  Aprobar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending || status === 'rejected'}
                  onClick={() => change(review, 'rejected')}
                >
                  Rechazar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending || status === 'pending'}
                  onClick={() => change(review, 'pending')}
                  title="Volver a pendiente"
                >
                  Pendiente
                </Button>
                {canDelete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    disabled={pending}
                    onClick={() => remove(review)}
                    aria-label="Eliminar reseña"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <p className="mt-3 whitespace-pre-line text-sm">{review.content}</p>
          </article>
        );
      })}
    </div>
  );
}
