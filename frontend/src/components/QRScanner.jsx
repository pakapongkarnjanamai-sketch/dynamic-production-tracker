import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

/**
 * QRScanner — wraps html5-qrcode for mobile camera scanning.
 *
 * Props:
 *   onScan(decodedText: string) — called on each successful decode
 *   onError?(errorMessage: string)
 *   fps? (default 10)
 *   qrbox? (default 250)
 */
export default function QRScanner({ onScan, onError, fps = 10, qrbox = 250 }) {
  const containerId = 'qr-reader';
  const scannerRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [err, setErr]         = useState(null);

  useEffect(() => {
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps, qrbox: { width: qrbox, height: qrbox } },
        (decodedText) => {
          onScan(decodedText);
        },
        () => {
          // Per-frame "no QR found" errors are normal — suppress all of them
        }
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
    <div className="h-full w-full relative">
      {/* Force html5-qrcode video to fill the container */}
      <style>{`
        #qr-reader { height: 100% !important; width: 100% !important; border: none !important; padding: 0 !important; }
        #qr-reader video { width: 100% !important; height: 100% !important; object-fit: cover; display: block; }
        #qr-reader__scan_region { height: 100% !important; }
        #qr-reader__scan_region img { display: none !important; }
        #qr-reader__dashboard { display: none !important; }
      `}</style>
      {err && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10 p-6">
          <p className="text-red-400 text-sm text-center">⚠️ ไม่สามารถเปิดกล้องได้: {err}</p>
        </div>
      )}
      {!started && !err && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <p className="text-white/60 text-sm animate-pulse">กำลังเปิดกล้อง…</p>
        </div>
      )}
      <div id={containerId} className="h-full w-full" />
    </div>
  );
}
