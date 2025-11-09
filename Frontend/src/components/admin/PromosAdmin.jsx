import React from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../../context/AuthContext";
import { adminListPromos, adminCreatePromo, adminUpdatePromo, adminDeletePromo } from "../../api/admin";
import toast from "react-hot-toast";

export default function PromosAdmin() {
  const { token } = useAuth();
  const [list, setList] = React.useState([]);
  const { register, handleSubmit, reset } = useForm({ defaultValues: { type: 'percent', active: 1 } });

  const load = React.useCallback(async () => {
    setList(await adminListPromos(token));
  }, [token]);

  React.useEffect(()=>{ load().catch(()=>{}); }, [load]);

  const onCreate = handleSubmit(async (data) => {
    data.code = (data.code || '').toUpperCase();
    await adminCreatePromo(data, token);
    toast.success("Promo created");
    reset({ type:'percent', active:1 });
    await load();
  });

  const onDelete = async (id) => {
    if (!confirm("Delete this promo?")) return;
    await adminDeletePromo(id, token);
    toast.success("Deleted");
    await load();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <section>
        <h2 className="font-semibold mb-2">Promos</h2>
        <ul className="divide-y border rounded">
          {list.map(p => (
            <li key={p.id} className="p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{p.code} • {p.type === 'percent' ? `${p.percent || 0}%` : `$${(p.value_cents/100).toFixed(2)}`}</div>
                <div className="text-xs text-gray-500">Active: {p.active ? 'Yes' : 'No'}</div>
              </div>
              <div className="flex gap-2">
                <button className="text-xs rounded border px-2 py-1" onClick={()=>onDelete(p.id)}>Delete</button>
              </div>
            </li>
          ))}
          {list.length===0 && <li className="p-3 text-gray-500">No promos yet.</li>}
        </ul>
      </section>

      <section>
        <h2 className="font-semibold mb-2">New promo</h2>
        <form onSubmit={onCreate} className="space-y-2">
          <input {...register("code", {required:true})} placeholder="CODE" className="w-full rounded border px-2 py-1"/>
          <select {...register("type")} className="w-full rounded border px-2 py-1">
            <option value="percent">Percent (%)</option>
            <option value="fixed">Fixed (cents)</option>
          </select>
          <input {...register("percent", {valueAsNumber:true})} placeholder="Percent (0–100)" className="w-full rounded border px-2 py-1"/>
          <input {...register("value_cents", {valueAsNumber:true})} placeholder="Fixed amount (cents)" className="w-full rounded border px-2 py-1"/>
          <label className="text-sm"><input type="checkbox" {...register("active")} defaultChecked/> Active</label>
          <input type="datetime-local" {...register("starts_at")} className="w-full rounded border px-2 py-1"/>
          <input type="datetime-local" {...register("ends_at")} className="w-full rounded border px-2 py-1"/>
          <button className="rounded bg-gray-900 text-white px-3 py-1 text-sm">Create</button>
        </form>
      </section>
    </div>
  );
}
