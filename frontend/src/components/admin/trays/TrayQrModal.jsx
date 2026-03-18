import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button, ErrorState, LoadingState, Modal } from "../AdminUI";
import { buildTrayQrLabel, downloadQrImage, printQrImage } from "./trayShared";

export default function TrayQrModal({ tray, isOpen, onClose }) {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !tray?.qr_code) {
      setQrDataUrl("");
      setError("");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const generate = async () => {
      try {
        setLoading(true);
        setError("");
        const dataUrl = await QRCode.toDataURL(tray.qr_code, {
          width: 320,
          margin: 1,
          color: {
            dark: "#0f172a",
            light: "#ffffff",
          },
        });
        if (!cancelled) {
          setQrDataUrl(dataUrl);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "สร้างรูป QR ไม่สำเร็จ");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    generate();

    return () => {
      cancelled = true;
    };
  }, [isOpen, tray]);

  const fileName = `${tray?.qr_code || "tray"}.png`;
  const label = buildTrayQrLabel(tray);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="QR Code"
      description={tray?.qr_code || ""}
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>
            ปิด
          </Button>
          <Button
            variant="secondary"
            onClick={() => printQrImage(qrDataUrl, label)}
            disabled={!qrDataUrl || loading}
          >
            พิมพ์
          </Button>
          <Button
            onClick={() => downloadQrImage(qrDataUrl, fileName)}
            disabled={!qrDataUrl || loading}
          >
            ดาวน์โหลด
          </Button>
        </div>
      }
    >
      {loading ? (
        <LoadingState message="กำลังสร้างรูป QR..." />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <div className="space-y-4 text-center">
          <div className="rounded-[24px] border border-neutral-200 bg-neutral-50 p-4">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={label}
                className="mx-auto w-full max-w-[280px] rounded-[16px] bg-white p-3"
              />
            ) : null}
          </div>
          <div>
            <div className="font-mono text-base font-black text-neutral-900">
              {tray?.qr_code}
            </div>
            <div className="mt-1 text-sm text-neutral-500">
              {tray?.product || "ไม่มีชื่อสินค้า"}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
