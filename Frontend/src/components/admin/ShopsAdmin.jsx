import React from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../../context/AuthContext";
import {
  adminListShops,
  adminCreateShop,
  adminUpdateShop,
  adminDeleteShop,
} from "../../api/admin";
import toast, { Toaster } from "react-hot-toast";
import ProductsAdmin from "./_ProductsAdmin";

export default function ShopsAdmin() {
  const { token } = useAuth();

  const [shops, setShops] = React.useState([]);
  const [selectedShop, setSelectedShop] = React.useState(null);
  const [showEditor, setShowEditor] = React.useState(false); // ← hidden until “Edit” clicked

  // create form
  const {
    register: regCreate,
    handleSubmit: submitCreate,
    reset: resetCreate,
  } = useForm();

  // edit form – we’ll re-fill when “Edit” is clicked
  const {
    register: regEdit,
    handleSubmit: submitEdit,
    reset: resetEdit,
  } = useForm();

  const load = React.useCallback(async () => {
    const list = await adminListShops(token);
    setShops(list);
    // keep selection if possible, otherwise pick first
    if (list.length) {
      const keep = selectedShop && list.find((s) => s.id === selectedShop.id);
      setSelectedShop(keep || list[0]);
    } else {
      setSelectedShop(null);
      setShowEditor(false);
    }
  }, [token]); // eslint-disable-line

  React.useEffect(() => {
    load().catch(() => {});
  }, [load]);

  // --- Create a shop
  const onCreate = submitCreate(async (data) => {
    await adminCreateShop(
      {
        name: data.name,
        photo_url: data.photo_url || "",
        address: data.address || "",
        description: data.description || "",
        is_active: 1, // default active; you asked to hide the toggle from UI
      },
      token
    );
    toast.success("Shop created");
    resetCreate();
    await load();
  });

  // --- Start editing a shop
  const startEdit = (shop) => {
    setSelectedShop(shop);
    resetEdit({
      name: shop.name || "",
      photo_url: shop.photo_url || "",
      address: shop.address || "",
      description: shop.description || "",
    });
    setShowEditor(true);
  };

  // --- Save edit
  const onSaveEdit = submitEdit(async (data) => {
    if (!selectedShop) return;

    await adminUpdateShop(
      selectedShop.id,
      {
        name: data.name,
        photo_url: data.photo_url || "",
        address: data.address || "",
        description: data.description || "",
      },
      token
    );

    toast.success("Shop updated");

    await load();

    //  Auto-hide editor after successful update
    setShowEditor(false);
  });

  // --- Delete
  const onDelete = async (id) => {
    if (!confirm("Delete this shop?")) return;
    await adminDeleteShop(id, token);
    toast.success("Shop deleted");
    if (selectedShop?.id === id) {
      setSelectedShop(null);
      setShowEditor(false);
    }
    await load();
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <Toaster />

      {/* Left: shop list + create */}
      <section className="md:col-span-1">
        <h2 className="mb-2 font-semibold">Shops</h2>

        <ul className="divide-y rounded border">
          {shops.map((s) => {
            const selected = selectedShop?.id === s.id;
            return (
              <li
                key={s.id}
                className={`p-3 cursor-pointer ${
                  selected ? "bg-gray-50 ring-2 ring-gray-900/10" : ""
                }`}
                onClick={() => setSelectedShop(s)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{s.name}</div>
                    {s.address && (
                      <div className="truncate text-xs text-gray-600">
                        {s.address}
                      </div>
                    )}
                    {s.photo_url && (
                      <div className="truncate text-xs text-gray-400">
                        {s.photo_url}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 space-x-2">
                    <button
                      className="rounded border px-2 py-1 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(s);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="rounded border px-2 py-1 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(s.id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <h3 className="mt-6 font-semibold">New shop</h3>
        <form onSubmit={onCreate} className="mt-2 space-y-2">
          <input
            {...regCreate("name", { required: true })}
            placeholder="Name"
            className="w-full rounded border px-2 py-1"
          />
          <input
            {...regCreate("photo_url")}
            placeholder="Photo URL"
            className="w-full rounded border px-2 py-1"
          />
          <input
            {...regCreate("address")}
            placeholder="Address"
            className="w-full rounded border px-2 py-1"
          />
          <textarea
            {...regCreate("description")}
            placeholder="Description"
            className="w-full rounded border px-2 py-1"
          />
          <button className="rounded bg-gray-900 px-3 py-1 text-sm text-white">
            Create
          </button>
        </form>
      </section>

      {/* Right: conditional editor + products */}
      <section className="md:col-span-2 space-y-6">
        {/* Edit panel only visible after clicking Edit */}
        {showEditor && selectedShop && (
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Edit shop</h3>
              <button
                className="text-sm text-gray-600 hover:underline"
                onClick={() => setShowEditor(false)}
              >
                Close
              </button>
            </div>

            <form onSubmit={onSaveEdit} className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-1">
                <label className="mb-1 block text-xs text-gray-500">Name</label>
                <input
                  {...regEdit("name", { required: true })}
                  className="w-full rounded border px-2 py-1"
                />
              </div>

              <div className="md:col-span-1">
                <label className="mb-1 block text-xs text-gray-500">
                  Photo URL
                </label>
                <input
                  {...regEdit("photo_url")}
                  className="w-full rounded border px-2 py-1"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-xs text-gray-500">
                  Address
                </label>
                <input
                  {...regEdit("address")}
                  className="w-full rounded border px-2 py-1"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-xs text-gray-500">
                  Description
                </label>
                <textarea
                  {...regEdit("description")}
                  className="w-full rounded border px-2 py-1"
                />
              </div>

              <div className="md:col-span-2">
                <button className="rounded bg-gray-900 px-3 py-1 text-sm text-white">
                  Save changes
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Products block stays; it uses the currently selected shop */}
        {selectedShop ? (
          <ProductsAdmin shop={selectedShop} />
        ) : (
          <div className="text-gray-500">Select a shop to manage products.</div>
        )}
      </section>
    </div>
  );
}
