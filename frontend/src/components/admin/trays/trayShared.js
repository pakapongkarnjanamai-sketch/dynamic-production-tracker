export const TRAY_STATUSES = [
  "pending",
  "in_progress",
  "completed",
  "ng",
  "on_hold",
];

export const STATUS_LABELS = {
  pending: "รอทำ",
  in_progress: "กำลังทำ",
  completed: "เสร็จสิ้น",
  ng: "NG",
  on_hold: "รอแก้ไข",
};

export const STATUS_COLORS = {
  pending: "gray",
  in_progress: "amber",
  completed: "green",
  ng: "red",
  on_hold: "red",
};

export const EMPTY_TRAY_FORM = {
  qr_code: "",
  line_id: "",
  product: "",
  batch_no: "",
  qty: "1",
  status: "pending",
  due_date: "",
};

export function buildTrayQrLabel(tray) {
  if (!tray) return "";
  return tray.product ? `${tray.qr_code} • ${tray.product}` : tray.qr_code;
}

export function buildTrayFormValues(tray) {
  if (!tray) {
    return EMPTY_TRAY_FORM;
  }

  return {
    qr_code: tray.qr_code || "",
    line_id: tray.line_id ? String(tray.line_id) : "",
    product: tray.product || "",
    batch_no: tray.batch_no || "",
    qty: String(tray.qty || 1),
    status: tray.status || "pending",
    due_date: tray.due_date
      ? new Date(tray.due_date).toISOString().slice(0, 16)
      : "",
  };
}

export function buildTrayPayload(form) {
  return {
    ...form,
    line_id: form.line_id ? Number(form.line_id) : null,
    qty: Number(form.qty) || 1,
    due_date: form.due_date || null,
  };
}

export function downloadQrImage(dataUrl, fileName) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  link.click();
}

export function printQrImage(dataUrl, title) {
  const printWindow = window.open("", "_blank", "width=720,height=860");
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body {
            margin: 0;
            padding: 32px;
            font-family: "Noto Sans Thai", "Segoe UI", sans-serif;
            color: #0f172a;
          }
          .wrap {
            display: flex;
            min-height: calc(100vh - 64px);
            align-items: center;
            justify-content: center;
          }
          .card {
            width: 100%;
            max-width: 420px;
            border: 1px solid #e5e7eb;
            border-radius: 24px;
            padding: 24px;
            text-align: center;
          }
          img {
            width: 100%;
            max-width: 280px;
            height: auto;
          }
          h1 {
            margin: 0 0 16px;
            font-size: 20px;
          }
          p {
            margin: 12px 0 0;
            color: #475569;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="wrap">
          <div class="card">
            <h1>${title}</h1>
            <img src="${dataUrl}" alt="${title}" />
            <p>${title}</p>
          </div>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
