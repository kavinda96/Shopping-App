import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getOrderByPI } from "../pay";
import { useAuth } from "../context/AuthContext";
import useCart from "../hooks/UseCart";

// currency helper
const fmtCurrency = (cents, cur = "AUD") =>
  (cents ?? 0) >= 0
    ? new Intl.NumberFormat("en-AU", {
        style: "currency",
        currency: (cur || "AUD").toUpperCase(),
      }).format((cents || 0) / 100)
    : "-";

export default function OrderSuccess() {
  const [params] = useSearchParams();
  const { token, user } = useAuth();
  const { clear } = useCart();
  const pi = params.get("payment_intent");

  const [state, setState] = React.useState({
    loading: true,
    error: "",
    data: null,
  });

  // Fetch invoice, clear cart when found
  React.useEffect(() => {
    let mounted = true;

    async function load() {
      if (!pi) {
        setState({ loading: false, error: "Missing payment_intent", data: null });
        return;
      }
      try {
        const res = await getOrderByPI(pi, token);
        if (mounted) {
          clear(); // clear cart when invoice persisted
          setState({ loading: false, error: "", data: res });
        }
      } catch {
        // give webhook a moment to persist invoice; retry once
        setTimeout(async () => {
          try {
            const res2 = await getOrderByPI(pi, token);
            if (mounted) {
              clear();
              setState({ loading: false, error: "", data: res2 });
            }
          } catch {
            if (mounted) {
              setState({
                loading: false,
                error:
                  "We couldn’t find your invoice yet. Please refresh in a moment.",
                data: null,
              });
            }
          }
        }, 1500);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [pi, token, clear]);

  // -------- Vector PDF export (mobile-friendly, no clipping) --------
  const onDownloadPdf = async () => {
    let jsPDF, autoTable;
    try {
      ({ jsPDF } = await import("jspdf"));
      autoTable = (await import("jspdf-autotable")).default;
    } catch {
      alert("Run: npm i jspdf jspdf-autotable");
      return;
    }

    const inv = state?.data?.invoice;
    const items = state?.data?.items || [];
    if (!inv) return;

    const currency = (inv.currency || "AUD").toUpperCase();
    const issued = new Date(inv.created_at || Date.now()).toLocaleString();

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Invoice", 40, 40);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Issued: ${issued}`, pageW - 40, 30, { align: "right" });
    doc.text(`Invoice #: ${inv.id}`, pageW - 40, 44, { align: "right" });
    if (inv.stripe_pi_id) {
      doc.text(`PaymentIntent: ${inv.stripe_pi_id}`, pageW - 40, 58, { align: "right" });
    }

    // Status pill
    const status = String(inv.status || "succeeded").toUpperCase();
    doc.setDrawColor(40, 167, 69);
    doc.setTextColor(40, 167, 69);
    doc.roundedRect(pageW - 160, 70, 120, 22, 8, 8);
    doc.text(status, pageW - 100, 85, { align: "center" });
    doc.setTextColor(0, 0, 0);

    // Parties
    const yBase = 110;
    doc.setFont("helvetica", "bold");
    doc.text("BILLED TO", 40, yBase);
    doc.text("FROM", pageW / 2 + 20, yBase);

    doc.setFont("helvetica", "normal");
    doc.text(user?.email || "Customer", 40, yBase + 18);
    doc.text(`User ID: ${inv.user_id}`, 40, yBase + 34);

    doc.text("Mini Shop Pty Ltd", pageW / 2 + 20, yBase + 18);
    doc.text("ABN 00 000 000 000", pageW / 2 + 20, yBase + 34);

    // Items table
    const tableY = yBase + 60;
    const rows = items.map((it) => [
      `${it.name}  (#${it.product_id})`,
      String(it.qty || 0),
      fmtCurrency(it.price_cents, currency),
      fmtCurrency((it.price_cents || 0) * (it.qty || 0), currency),
    ]);

    autoTable(doc, {
      startY: tableY,
      head: [["Item", "Qty", "Unit", "Line Total"]],
      body: rows,
      styles: { font: "helvetica", fontSize: 10, cellPadding: 6, lineColor: [230, 230, 230] },
      headStyles: { fillColor: [249, 250, 251], textColor: [75, 85, 99] },
      theme: "grid",
      columnStyles: {
        1: { halign: "right", cellWidth: 50 },
        2: { halign: "right", cellWidth: 80 },
        3: { halign: "right", cellWidth: 90 },
      },
    });

    // Totals box
    const endY = doc.lastAutoTable.finalY + 12;
    const subtotal = items.reduce((s, it) => s + (it.price_cents || 0) * (it.qty || 0), 0);
    const discount = inv.discount_cents || Math.max(0, subtotal - (inv.amount_cents ?? 0));
    const total = inv.amount_cents ?? subtotal;

    const rightX = pageW - 40;
    doc.setFont("helvetica", "normal");
    doc.text("Subtotal", rightX - 150, endY);
    doc.text(fmtCurrency(subtotal, currency), rightX, endY, { align: "right" });

    if (discount > 0) {
      doc.text("Discount", rightX - 150, endY + 18);
      doc.text(`- ${fmtCurrency(discount, currency)}`, rightX, endY + 18, { align: "right" });
    }

    doc.setFont("helvetica", "bold");
    doc.text("Total", rightX - 150, endY + (discount > 0 ? 36 : 18));
    doc.text(fmtCurrency(total, currency), rightX, endY + (discount > 0 ? 36 : 18), {
      align: "right",
    });

    doc.save(`invoice_${inv.id}.pdf`);
  };

  // ------- UI states -------
  if (state.loading) {
    return (
      <main className="mx-auto max-w-3xl p-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm">
          <span className="animate-pulse h-2 w-2 rounded-full bg-emerald-500" />
          Finalizing your order…
        </div>
      </main>
    );
  }

  if (state.error) {
    return (
      <main className="mx-auto max-w-lg p-6 text-center">
        <h1 className="text-2xl font-semibold mb-2">Payment received</h1>
        <p className="text-gray-600 mb-6">{state.error}</p>
        <Link
          to="/"
          className="rounded-lg bg-gray-900 text-white px-4 py-2 text-sm hover:bg-gray-800"
        >
          Back to home
        </Link>
      </main>
    );
  }

  const inv = state.data.invoice;
  const items = state.data.items || [];
  const currency = (inv?.currency || "aud").toUpperCase();

  // derived totals
  const subtotalCents = items.reduce(
    (s, it) => s + (it.price_cents || 0) * (it.qty || 0),
    0
  );
  const discountCents =
    inv?.discount_cents ||
    Math.max(0, subtotalCents - (inv?.amount_cents ?? 0));
  const totalCents = inv?.amount_cents ?? subtotalCents;

  return (
    <main className="mx-auto max-w-4xl p-6 print:p-0">
      <div className="rounded-2xl border shadow-sm bg-white p-6 print:shadow-none print:border-0 print:rounded-none">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gray-900 text-white grid place-items-center">
              🧾
            </div>
            <div>
              <h1 className="text-xl font-semibold leading-tight">Invoice</h1>
              <p className="text-xs text-gray-500">Mini Shop Pty Ltd</p>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 text-xs font-medium border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {String(inv?.status || "succeeded").toUpperCase()}
            </span>
            <div className="mt-2 text-xs text-gray-500">
              <div>
                Issued: {new Date(inv?.created_at || Date.now()).toLocaleString()}
              </div>
              <div>
                Invoice #: <span className="font-medium text-gray-700">{inv?.id}</span>
              </div>
              {inv?.stripe_pi_id && (
                <div>
                  PaymentIntent: <span className="font-mono">{inv.stripe_pi_id}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Parties */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-lg border p-4">
            <div className="text-xs font-semibold uppercase text-gray-500 mb-1">
              Billed To
            </div>
            <div className="text-sm text-gray-800">
              {user?.email || "Customer"}
            </div>
            <div className="text-xs text-gray-500">User ID: {inv?.user_id}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-xs font-semibold uppercase text-gray-500 mb-1">
              From
            </div>
            <div className="text-sm text-gray-800">Mini Shop Pty Ltd</div>
            <div className="text-xs text-gray-500">ABN 00 000 000 000</div>
          </div>
        </div>

        {/* Items */}
        <div className="mt-6 overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Item</th>
                <th className="px-4 py-2 text-right font-medium">Qty</th>
                <th className="px-4 py-2 text-right font-medium">Unit</th>
                <th className="px-4 py-2 text-right font-medium">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const line = (it.price_cents || 0) * (it.qty || 0);
                return (
                  <tr key={`${it.product_id}-${it.name}`} className="border-t">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{it.name}</div>
                      <div className="text-xs text-gray-500">#{it.product_id}</div>
                    </td>
                    <td className="px-4 py-3 text-right">{it.qty}</td>
                    <td className="px-4 py-3 text-right">
                      {fmtCurrency(it.price_cents, currency)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {fmtCurrency(line, currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-6 flex flex-col items-end gap-1">
          <div className="w-full sm:w-80">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">
                {fmtCurrency(subtotalCents, currency)}
              </span>
            </div>

            {discountCents > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount</span>
                <span className="font-medium">
                  − {fmtCurrency(discountCents, currency)}
                </span>
              </div>
            )}

            <div className="mt-2 border-t pt-2 flex justify-between text-base">
              <span className="font-semibold">Total</span>
              <span className="font-semibold">
                {fmtCurrency(totalCents, currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="text-xs text-gray-500">
          A receipt has been issued for this payment. Keep this invoice for your
          records.
        </div>
        <div className="flex gap-2">
          <button
            onClick={onDownloadPdf}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Download PDF
          </button>
          <button
            onClick={() => window.print()}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Print
          </button>
          <Link
            to="/"
            className="rounded-lg bg-gray-900 text-white px-4 py-2 text-sm hover:bg-gray-800"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
