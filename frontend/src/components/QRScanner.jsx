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
        (errorMsg) => {
          // Suppress "QR code not found" noise
          if (!errorMsg?.includes('NotFoundException')) {
            onError?.(errorMsg);
          }
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
    <div className="w-full max-w-sm mx-auto">
      {err && (
        <p className="text-red-600 text-sm mb-2 text-center">
          ⚠️ ไม่สามารถเปิดกล้องได้: {err}
        </p>
      )}
      {!started && !err && (
        <p className="text-gray-500 text-sm mb-2 text-center animate-pulse">
          กำลังเปิดกล้อง…
        </p>
      )}
      {/* html5-qrcode renders its video here */}
      <div id={containerId} className="rounded-2xl overflow-hidden border-2 border-gray-300 shadow" />
    </div>
  );
}
