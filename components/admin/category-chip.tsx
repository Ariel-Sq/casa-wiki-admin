'use client';

import { X } from 'lucide-react';
import { toast } from 'sonner';
import { useTransition } from 'react';
import { deleteCategory } from '@/lib/admin-api';

/**
 * Category chip with a delete cross that appears on hover. Deleting a category
 * doesn't delete products: they simply stay without it.
 */
export function CategoryChip({
  id,
  name,
  onDeleted,
}: {
  id: string;
  name: string;
  onDeleted: () => void;
}) {
  const [pending, startTransition] = useTransition();

  const remove = () => {
    const ok = window.confirm(
      `¿Eliminar la categoría “${name}”?\n\nLos productos que la tengan no se borran: quedan sin esa categoría.`
    );
    if (!ok) return;

    startTransition(async () => {
      try {
        const result = await deleteCategory(id);
        toast.success(
          result.products > 0
            ? `Categoría eliminada. ${result.products} producto(s) quedaron sin categoría.`
            : 'Categoría eliminada'
        );
        onDeleted();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'No se pudo eliminar'
        );
      }
    });
  };

  return (
    <span className="group inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 hover:bg-destructive/10">
      <span className={pending ? 'opacity-50' : undefined}>{name}</span>
      <button
        type="button"
        aria-label={`Eliminar categoría ${name}`}
        title="Eliminar categoría"
        onClick={(event) => {
          // The chip lives inside a <label> with a checkbox: don't toggle it.
          event.preventDefault();
          event.stopPropagation();
          remove();
        }}
        onMouseDown={(event) => event.preventDefault()}
        disabled={pending}
        className="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/15 hover:text-destructive focus:opacity-100 group-hover:opacity-100 disabled:opacity-30"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}
