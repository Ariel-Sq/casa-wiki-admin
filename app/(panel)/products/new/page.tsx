import Link from 'next/link';
import { listAdminCategories } from '@/lib/admin-api';
import { NewProductForm } from '@/components/admin/new-product-form';
import { requireRole } from '@/lib/guards';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  await requireRole(['owner', 'admin', 'editor']);
  const categories = await listAdminCategories();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-primary hover:underline">
          ← Volver a productos
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Nuevo producto</h1>
        <p className="text-sm text-muted-foreground">
          Después de crearlo vas a poder agregar variantes (medidas y precios) y
          fotos.
        </p>
      </div>

      <NewProductForm categories={categories} />
    </div>
  );
}
