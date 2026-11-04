'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { CategoryChip } from '@/components/admin/category-chip';
import {
  createCategory,
  createVariation,
  deleteVariation,
  deleteImage,
  deleteProduct,
  setMainImage,
  updateProduct,
  updateVariation,
  uploadProductImage,
  type AdminCategory,
  type AdminProduct,
  type AdminVariation,
} from '@/lib/admin-api';

const money = (value: string | number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number(value));

interface VariationDraft {
  name: string;
  price: string;
  isActive: boolean;
}

function toDraft(variation: AdminVariation): VariationDraft {
  return {
    name: variation.name,
    price: String(Number(variation.price)),
    isActive: variation.is_active,
  };
}

export function ProductEditor({
  product,
  categories,
}: {
  product: AdminProduct;
  categories: AdminCategory[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Product fields
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description ?? '');
  const [isActive, setIsActive] = useState(product.is_active);
  const [isFeatured, setIsFeatured] = useState(product.is_featured);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    product.categories.map((c) => c.id)
  );
  const [newCategory, setNewCategory] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  // Local copy so a category created here is selectable without a reload.
  const [categoryList, setCategoryList] = useState<AdminCategory[]>(categories);

  // Variation fields — edited locally and saved with the main button.
  const [drafts, setDrafts] = useState<Record<string, VariationDraft>>(() =>
    Object.fromEntries(product.variations.map((v) => [v.id, toDraft(v)]))
  );

  // New variation form
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newMedida, setNewMedida] = useState('');
  const [newPrice, setNewPrice] = useState('');

  const addCategory = () => {
    const value = newCategory.trim();
    if (value.length < 2) {
      toast.error('Poné un nombre de al menos 2 letras');
      return;
    }
    setCreatingCategory(true);
    startTransition(async () => {
      try {
        const created = await createCategory(value);
        setCategoryList((prev) =>
          prev.some((c) => c.id === created.id)
            ? prev
            : [
                ...prev,
                { id: created.id, name: created.name, slug: created.slug },
              ]
        );
        setSelectedCategories((prev) => [...prev, created.id]);
        setNewCategory('');
        toast.success(`Categoría “${created.name}” creada`);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'No se pudo crear'
        );
      } finally {
        setCreatingCategory(false);
      }
    });
  };

  const updateDraft = (id: string, patch: Partial<VariationDraft>) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const hasVariationChanges = product.variations.some((variation) => {
    const draft = drafts[variation.id];
    if (!draft) return false;
    return (
      draft.name !== variation.name ||
      Number(draft.price) !== Number(variation.price) ||
      draft.isActive !== variation.is_active
    );
  });

  const saveAll = () => {
    startTransition(async () => {
      try {
        await updateProduct(product.id, {
          name,
          description,
          is_active: isActive,
          is_featured: isFeatured,
          categoryIds: selectedCategories,
        });

        const changed = product.variations.filter((variation) => {
          const draft = drafts[variation.id];
          if (!draft) return false;
          return (
            draft.name !== variation.name ||
            Number(draft.price) !== Number(variation.price) ||
            draft.isActive !== variation.is_active
          );
        });

        for (const variation of changed) {
          const draft = drafts[variation.id];
          await updateVariation(variation.id, {
            name: draft.name,
            price: Number(draft.price),
            is_active: draft.isActive,
          });
        }

        toast.success('Cambios guardados');
        router.push('/');
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'No se pudo guardar'
        );
      }
    });
  };

  /** One upload → the photo is attached to every variant. */
  const uploadPhoto = (files: FileList) => {
    const list = Array.from(files).slice(0, Math.max(0, 6 - photos.length));
    if (list.length === 0) return;

    startTransition(async () => {
      try {
        for (const file of list) {
          const formData = new FormData();
          formData.append('file', file);
          await uploadProductImage(product.id, formData);
        }
        toast.success('Foto subida a todas las variantes');
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'No se pudo subir la foto'
        );
      }
    });
  };

  const removeVariation = (variationId: string, name: string) => {
    startTransition(async () => {
      try {
        await deleteVariation(variationId);
        toast.success(`Variante “${name}” eliminada`);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'No se pudo eliminar'
        );
      }
    });
  };

  // Photos are shared, so the same path repeats once per variant: collapse it
  // into a single gallery.
  const photos = (() => {
    const byPath = new Map<
      string,
      { id: string; path: string; url: string; isMain: boolean }
    >();
    for (const variation of product.variations) {
      for (const image of variation.images) {
        const existing = byPath.get(image.path);
        if (existing) {
          existing.isMain = existing.isMain || image.isMain;
        } else {
          byPath.set(image.path, {
            id: image.id,
            path: image.path,
            url: image.url,
            isMain: image.isMain,
          });
        }
      }
    }
    return [...byPath.values()];
  })();

  const makeMain = (imageId: string) => {
    startTransition(async () => {
      try {
        await setMainImage(imageId, product.id);
        toast.success('Foto principal actualizada');
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudo cambiar');
      }
    });
  };

  const removeImage = (imageId: string) => {
    startTransition(async () => {
      try {
        await deleteImage(imageId, product.id);
        toast.success('Foto eliminada');
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudo borrar');
      }
    });
  };

  const addVariation = () => {
    const price = Number(newPrice);
    if (!Number.isFinite(price) || price <= 0) {
      toast.error('Poné un precio válido');
      return;
    }
    startTransition(async () => {
      try {
        await createVariation(product.id, {
          medida: newMedida.trim(),
          price,
        });
        toast.success('Variante creada');
        setNewMedida('');
        setNewPrice('');
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'No se pudo crear'
        );
      }
    });
  };

  return (
    <div className="space-y-8 pb-28">
      {/* Product data */}
      <section className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Datos del producto</h2>
        <div className="grid gap-4">
          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Incluye el bloque &ldquo;INFORMACION IMPORTANTE&rdquo; tal como se
              muestra en la ficha.
            </p>
          </div>
          <div>
            <Label>Categorías</Label>
            <div className="mt-2 flex flex-wrap gap-4">
              {categoryList.map((category) => (
                <label
                  key={category.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <Checkbox
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={(checked) =>
                      setSelectedCategories((prev) =>
                        checked === true
                          ? [...prev, category.id]
                          : prev.filter((id) => id !== category.id)
                      )
                    }
                  />
                  <CategoryChip
                    id={category.id}
                    name={category.name}
                    onDeleted={() => {
                      setCategoryList((prev) =>
                        prev.filter((c) => c.id !== category.id)
                      );
                      setSelectedCategories((prev) =>
                        prev.filter((id) => id !== category.id)
                      );
                      router.refresh();
                    }}
                  />
                </label>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-end gap-2">
              <div className="grow sm:max-w-xs">
                <Label htmlFor="editor-new-category" className="text-xs">
                  Crear categoría nueva
                </Label>
                <Input
                  id="editor-new-category"
                  placeholder="Sábanas, Deco, Exterior…"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCategory();
                    }
                  }}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={creatingCategory || newCategory.trim().length < 2}
                onClick={addCategory}
              >
                {creatingCategory ? 'Creando…' : 'Crear y usar'}
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={isActive}
                onCheckedChange={(v) => setIsActive(v === true)}
              />
              Visible en la tienda
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={isFeatured}
                onCheckedChange={(v) => setIsFeatured(v === true)}
              />
              Destacado en la home
            </label>
          </div>
        </div>
      </section>

      {/* Product photos (shared by every variant) */}
      <section className="rounded-xl border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Fotos del producto</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Se usan en todas las variantes: subís una vez y listo. Hasta 6.
            </p>
          </div>
          <label
            className={`rounded-lg border px-4 py-2 text-sm font-medium ${
              pending || product.variations.length === 0 || photos.length >= 6
                ? 'cursor-not-allowed opacity-50'
                : 'cursor-pointer hover:bg-muted'
            }`}
          >
            {photos.length >= 6 ? 'Máximo 6 fotos' : 'Subir foto'}
            <input
              type="file"
              accept="image/webp,image/jpeg,image/png"
              className="hidden"
              multiple
              disabled={
                pending || product.variations.length === 0 || photos.length >= 6
              }
              onChange={(e) => {
                const files = e.target.files;
                if (files) uploadPhoto(files);
                e.target.value = '';
              }}
            />
          </label>
        </div>

        {product.variations.length === 0 && (
          <p className="mt-3 rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
            Agregá al menos una variante (por ejemplo «Único») y después subí
            las fotos.
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          {photos.map((photo) => (
            <div key={photo.path} className="w-28">
              <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt=""
                  className="h-full w-full object-cover"
                />
                {photo.isMain && (
                  <span className="absolute left-1 top-1 rounded bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    principal
                  </span>
                )}
              </div>
              <div className="mt-1 flex justify-between text-[11px]">
                {!photo.isMain && (
                  <button
                    type="button"
                    onClick={() => makeMain(photo.id)}
                    className="text-primary hover:underline"
                  >
                    Principal
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(photo.id)}
                  className="text-destructive hover:underline"
                >
                  Borrar
                </button>
              </div>
            </div>
          ))}
          {photos.length === 0 && product.variations.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Sin fotos todavía.
            </p>
          )}
        </div>
      </section>

      {/* Variations */}
      <section className="rounded-xl border bg-card p-6">
        <h2 className="mb-1 text-lg font-semibold">Variantes y precios</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Las fotos se suben dentro de cada variante. Con una sola variante usá
          «Único».
        </p>
        <div className="space-y-6">
          {product.variations.map((variation, index) => {
            const draft = drafts[variation.id] ?? toDraft(variation);
            return (
              <div
                key={variation.id}
                className="rounded-lg border p-4"
                id={`variation-${variation.id}`}
              >
                <div className="grid gap-3 sm:grid-cols-[1fr_140px_100px_auto] sm:items-end">
                  <div>
                    <Label htmlFor={`vname-${variation.id}`}>Nombre</Label>
                    <Input
                      id={`vname-${variation.id}`}
                      value={draft.name}
                      onChange={(e) =>
                        updateDraft(variation.id, { name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor={`price-${variation.id}`}>
                      Precio (efectivo)
                    </Label>
                    <Input
                      id={`price-${variation.id}`}
                      type="number"
                      value={draft.price}
                      onChange={(e) =>
                        updateDraft(variation.id, { price: e.target.value })
                      }
                    />
                  </div>
                  <label className="flex items-center gap-2 pb-2 text-sm">
                    <Checkbox
                      checked={draft.isActive}
                      onCheckedChange={(v) =>
                        updateDraft(variation.id, { isActive: v === true })
                      }
                    />
                    Activa
                  </label>
                </div>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    SKU {variation.sku} · con tarjeta:{' '}
                    {money(Number(draft.price || 0) * 1.15)}
                  </p>
                  {product.variations.length > 1 && (
                    <button
                      type="button"
                      className="text-xs text-destructive hover:underline"
                      onClick={() => {
                        if (
                          window.confirm(
                            `¿Eliminar la variante “${variation.name}”? Las fotos del producto se mantienen.`
                          )
                        ) {
                          removeVariation(variation.id, variation.name);
                        }
                      }}
                    >
                      Eliminar variante
                    </button>
                  )}
                </div>

                {index < product.variations.length - 1 && (
                  <hr className="mt-6" />
                )}
              </div>
            );
          })}

          {/* New variation */}
          <div className="rounded-lg border border-dashed p-4">
            <p className="mb-3 text-sm font-medium">Agregar variante</p>
            <div className="grid gap-3 sm:grid-cols-[1fr_140px_100px_auto] sm:items-end">
              <div>
                <Label htmlFor="new-medida">Variante</Label>
                <Input
                  id="new-medida"
                  placeholder="100x60 · 2 plazas · Único · King"
                  value={newMedida}
                  onChange={(e) => setNewMedida(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="new-price">Precio (efectivo)</Label>
                <Input
                  id="new-price"
                  type="number"
                  placeholder="399000"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                />
              </div>
              <Button
                type="button"
                disabled={pending || !newMedida.trim() || !newPrice}
                onClick={addVariation}
              >
                Agregar
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Texto libre: sirve para medidas (100x60), tamaños (2 plazas) o
              cualquier variante. El precio es obligatorio.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Se guarda al instante (el SKU y el nombre se generan solos). Los
              demás cambios se guardan con el botón de abajo.
            </p>
          </div>
        </div>
      </section>

      {/* Danger zone */}
      <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <h2 className="text-lg font-semibold text-destructive">
          Eliminar producto
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Se borra el producto con sus variantes y fotos. Los pedidos ya hechos
          no se modifican.
        </p>
        <div className="mt-3">
          {confirmDelete ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium">¿Seguro?</span>
              <Button
                variant="destructive"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    try {
                      await deleteProduct(product.id);
                      toast.success('Producto eliminado');
                      router.push('/');
                    } catch (error) {
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : 'No se pudo eliminar'
                      );
                    }
                  })
                }
              >
                Sí, eliminar
              </Button>
              <Button
                variant="outline"
                onClick={() => setConfirmDelete(false)}
                disabled={pending}
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="text-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              Eliminar este producto
            </Button>
          )}
        </div>
      </section>

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
          <span className="text-sm text-muted-foreground">
            {hasVariationChanges
              ? 'Hay cambios sin guardar en las variantes'
              : 'Los cambios de fotos y variantes nuevas se guardan al instante'}
          </span>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              disabled={pending}
            >
              Volver sin guardar
            </Button>
            <Button onClick={saveAll} disabled={pending}>
              {pending ? 'Guardando…' : 'Guardar y volver al panel'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
