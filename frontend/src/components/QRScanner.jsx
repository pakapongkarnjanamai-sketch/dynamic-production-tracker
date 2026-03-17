import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function QRScanner({ onScan, onError, fps = 10 }) {
  const containerId = "qr-reader";
  const scannerRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps, qrbox: 200 },
        (decodedText) => onScan(decodedText),
        () => {},
      )
      .then(() => setStarted(true))
      .catch((e) => {
        setErr(e?.message ?? String(e));
        onError?.(e?.message ?? String(e));
      });

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative h-full w-full">
      <style>{`
        #qr-reader {
          border: none !important;
          width: 100% !important;
          height: 100% !important;
        }
        #qr-reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
        #qr-reader__dashboard { display: none !important; }
      `}</style>

      {err && (
        <p className="absolute inset-x-2 top-2 z-10 rounded-lg bg-black/70 px-3 py-2 text-danger-300 text-xs text-center">
          ⚠️ ไม่สามารถเปิดกล้องได้: {err}
        </p>
      )}
      {!started && !err && (
        <p className="absolute inset-x-2 top-2 z-10 rounded-lg bg-black/70 px-3 py-2 text-neutral-200 text-xs text-center animate-pulse">
          กำลังเปิดกล้อง…
        </p>
      )}

      <div id={containerId} className="h-full w-full" />
    </div>
  );
}
