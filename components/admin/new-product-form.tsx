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
  createProduct,
  type AdminCategory,
} from '@/lib/admin-api';

export function NewProductForm({ categories }: { categories: AdminCategory[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  // Local copy so a category created here shows up without a reload.
  const [list, setList] = useState<AdminCategory[]>(categories);
  if (categories !== list && categories.length !== list.length) {
    setList(categories);
  }

  // A product can be created without a category (it still shows in the shop);
  // the category is only needed for the filters.
  const canSave = name.trim().length >= 3;

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
        setList((prev) =>
          prev.some((c) => c.id === created.id)
            ? prev
            : [...prev, { id: created.id, name: created.name, slug: created.slug }]
        );
        setSelected((prev) => [...prev, created.id]);
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

  const save = () => {
    startTransition(async () => {
      try {
        const created = await createProduct({
          name: name.trim(),
          description: description.trim() || undefined,
          categoryIds: selected,
          is_active: isActive,
          is_featured: isFeatured,
        });
        toast.success('Producto creado. Ahora agregá las variantes y las fotos.');
        router.push(`/products/${created.id}`);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'No se pudo crear el producto'
        );
      }
    });
  };

  return (
    <div className="max-w-2xl space-y-6 rounded-xl border bg-card p-6">
      <div>
        <Label htmlFor="new-name">
          Nombre <span className="text-destructive">*</span>
        </Label>
        <Input
          id="new-name"
          placeholder="Mesa auxiliar de álamo"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          El slug (URL) se genera solo a partir del nombre.
        </p>
      </div>

      <div>
        <Label>Categorías</Label>
        <div className="mt-2 flex flex-wrap gap-4">
          {list.map((category) => (
            <label
              key={category.id}
              className="flex items-center gap-2 text-sm"
            >
              <Checkbox
                checked={selected.includes(category.id)}
                onCheckedChange={(checked) =>
                  setSelected((prev) =>
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
                  setList((prev) => prev.filter((c) => c.id !== category.id));
                  setSelected((prev) => prev.filter((id) => id !== category.id));
                  router.refresh();
                }}
              />
            </label>
          ))}
          {list.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Todavía no hay categorías. Creá la primera acá abajo.
            </p>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div className="grow sm:max-w-xs">
            <Label htmlFor="new-category" className="text-xs">
              Crear categoría nueva
            </Label>
            <Input
              id="new-category"
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
            onClick={addCategory}
            disabled={creatingCategory || newCategory.trim().length < 2}
          >
            {creatingCategory ? 'Creando…' : 'Crear y usar'}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Podés crear el producto sin categoría; después se la agregás desde el
          editor.
        </p>
      </div>

      <div>
        <Label htmlFor="new-description">Descripción (opcional)</Label>
        <Textarea
          id="new-description"
          rows={6}
          placeholder="La descripción principal y el bloque INFORMACION IMPORTANTE se pueden completar después, en el editor."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
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

      <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
        El producto se crea sin variantes. Al guardar te llevo al editor para
        que agregues las medidas, precios y fotos. Hasta que no tenga al menos
        una variante activa, no se muestra en la tienda.
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => router.push('/')}>
          Cancelar
        </Button>
        <Button onClick={save} disabled={!canSave || pending}>
          {pending ? 'Creando…' : 'Crear producto'}
        </Button>
      </div>
    </div>
  );
}
