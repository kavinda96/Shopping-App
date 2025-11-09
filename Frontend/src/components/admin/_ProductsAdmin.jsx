// src/pages/admin/_ProductsAdmin.jsx
import React from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../../context/AuthContext";
import {
  adminListProducts,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminUploadImage,
} from "../../api/admin";
import toast from "react-hot-toast";

export default function ProductsAdmin({ shop }) {
  const { token } = useAuth();
  const [items, setItems] = React.useState([]);

  // NEW PRODUCT
  const newForm = useForm();
  const [newImages, setNewImages] = React.useState([]);

  // EDIT PRODUCT
  const editForm = useForm();
  const [editingId, setEditingId] = React.useState(null);
  const [editImages, setEditImages] = React.useState([]);

  const load = React.useCallback(async () => {
    const list = await adminListProducts(shop.id, token);
    setItems(list);
  }, [shop.id, token]);

  React.useEffect(() => {
    load().catch(() => {});
  }, [load]);

  // ---- uploads (shared) ----
  const uploadImages = async (files, setter) => {
    const urls = [];
    for (const f of files) {
      const uploaded = await adminUploadImage(f, token);
      urls.push(uploaded.url);
    }
    setter((prev) => [...prev, ...urls]);
    toast.success("Images uploaded");
  };
  const onUploadNew = (e) => uploadImages(Array.from(e.target.files), setNewImages);
  const onUploadEdit = (e) => uploadImages(Array.from(e.target.files), setEditImages);

  // ---- create ----
  const onCreate = newForm.handleSubmit(async (data) => {
    await adminCreateProduct(
      {
        name: data.name,
        price_cents: Number(data.price_cents),
        description: data.description || "",
        shop_id: shop.id,
        is_active: data.is_active ? 1 : 0,
        photo_url: newImages.join(","), // multiple images merged
      },
      token
    );
    toast.success("Product added");
    newForm.reset();
    setNewImages([]);
    await load();
  });

  // ---- edit open/save ----
  const openEdit = (p) => {
    setEditingId(p.id);
    const imgs = (p.photo_url || "").split(",").filter(Boolean);
    setEditImages(imgs);
    editForm.reset({
      name: p.name,
      price_cents: p.price_cents,
      description: p.description,
      is_active: p.is_active ? 1 : 0,
    });
  };

  const onSaveEdit = editForm.handleSubmit(async (data) => {
    await adminUpdateProduct(
      editingId,
      {
        name: data.name,
        price_cents: Number(data.price_cents),
        description: data.description || "",
        shop_id: shop.id,
        is_active: data.is_active ? 1 : 0,
        photo_url: editImages.join(","), // save merged list
      },
      token
    );
    toast.success("Changes saved");
    setEditingId(null);
    setEditImages([]);
    await load();
  });

  const cancelEdit = () => {
    setEditingId(null);
    setEditImages([]);
  };

  // ---- delete ----
  const onDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    await adminDeleteProduct(id, token);
    toast.success("Deleted");
    if (editingId === id) cancelEdit();
    await load();
  };

  return (
    <div>
      <h2 className="mb-2 font-semibold">Products in {shop.name}</h2>

      <ul className="mb-6 divide-y rounded border">
        {items.map((p) => {
          const isEditing = editingId === p.id;
          return (
            <li key={p.id} className="p-3">
              {/* Row: two columns (info | actions) */}
              <div className="grid grid-cols-[1fr_auto] items-start gap-3">
                {/* left: info */}
                <div className="min-w-0">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-gray-500">
                    #{p.id} • ${(p.price_cents / 100).toFixed(2)} • {p.is_active ? "active" : "inactive"}
                  </div>
                  {p.photo_url && (
                    <div className="mt-1 text-xs text-gray-500 truncate">
                      {p.photo_url}
                    </div>
                  )}
                </div>

                {/* right: actions (never wraps) */}
                <div className="flex shrink-0 gap-2">
                  {!isEditing ? (
                    <>
                      <button
                        className="rounded border px-2 py-1 text-xs"
                        onClick={() => openEdit(p)}
                      >
                        Edit
                      </button>
                      <button
                        className="rounded border px-2 py-1 text-xs"
                        onClick={() => onDelete(p.id)}
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <button
                      className="rounded border px-2 py-1 text-xs"
                      onClick={cancelEdit}
                    >
                      Close
                    </button>
                  )}
                </div>
              </div>

              {/* Edit panel */}
              {isEditing && (
                <form
                  onSubmit={onSaveEdit}
                  className="mt-3 grid gap-2 rounded border bg-gray-50 p-3"
                >
                  <div className="grid gap-2 md:grid-cols-2">
                    <input
                      {...editForm.register("name", { required: true })}
                      placeholder="Name"
                      className="rounded border px-2 py-1"
                    />
                    <input
                      {...editForm.register("price_cents", { valueAsNumber: true })}
                      placeholder="Price (cents)"
                      className="rounded border px-2 py-1"
                    />
                    <textarea
                      {...editForm.register("description")}
                      placeholder="Description"
                      className="md:col-span-2 rounded border px-2 py-1"
                    />
                  </div>

                  <label className="text-xs font-medium">
                    Upload more images:
                    <input type="file" multiple onChange={onUploadEdit} className="ml-2" />
                  </label>

                  <div className="flex flex-wrap gap-2">
                    {editImages.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt=""
                        className="h-16 w-16 rounded border object-cover"
                      />
                    ))}
                  </div>

                  <label className="mt-1 text-sm">
                    <input type="checkbox" {...editForm.register("is_active")} /> Active
                  </label>

                  <div className="mt-1 flex justify-end gap-2">
                    <button
                      type="button"
                      className="rounded border px-3 py-1 text-sm"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </button>
                    <button className="rounded bg-gray-900 px-3 py-1 text-sm text-white">
                      Save changes
                    </button>
                  </div>
                </form>
              )}
            </li>
          );
        })}

        {items.length === 0 && (
          <li className="p-3 text-sm text-gray-500">No products yet.</li>
        )}
      </ul>

      {/* New product */}
      <h3 className="font-semibold">New Product</h3>
      <form onSubmit={onCreate} className="mt-2 grid gap-2 md:grid-cols-2">
        <input
          {...newForm.register("name", { required: true })}
          placeholder="Name"
          className="rounded border px-2 py-1"
        />
        <input
          {...newForm.register("price_cents", { valueAsNumber: true })}
          placeholder="Price (cents)"
          className="rounded border px-2 py-1"
        />
        <textarea
          {...newForm.register("description")}
          placeholder="Description"
          className="md:col-span-2 rounded border px-2 py-1"
        />

        <label className="text-xs font-medium md:col-span-2">
          Upload images:
          <input type="file" multiple onChange={onUploadNew} className="ml-2" />
        </label>

        <div className="md:col-span-2 flex flex-wrap gap-2">
          {newImages.map((url, i) => (
            <img key={i} src={url} alt="" className="h-16 w-16 rounded border object-cover" />
          ))}
        </div>

        <label className="text-sm">
          <input type="checkbox" {...newForm.register("is_active")} defaultChecked /> Active
        </label>

        <div className="md:justify-self-end">
          <button className="rounded bg-gray-900 px-3 py-1 text-sm text-white">
            Add product
          </button>
        </div>
      </form>
    </div>
  );
}
