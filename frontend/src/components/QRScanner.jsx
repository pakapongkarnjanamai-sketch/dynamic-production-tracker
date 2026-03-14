import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QRScanner({ onScan, onError, fps = 10 }) {
  const containerId = 'qr-reader';
  const scannerRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
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
    <div>
      <style>{`
        #qr-reader { border: none !important; }
        #qr-reader__dashboard { display: none !important; }
      `}</style>

      {err && (
        <p className="text-red-500 text-sm text-center p-4">⚠️ ไม่สามารถเปิดกล้องได้: {err}</p>
      )}
      {!started && !err && (
        <p className="text-gray-400 text-sm text-center p-4 animate-pulse">กำลังเปิดกล้อง…</p>
      )}

      <div id={containerId} />
    </div>
  );
}
