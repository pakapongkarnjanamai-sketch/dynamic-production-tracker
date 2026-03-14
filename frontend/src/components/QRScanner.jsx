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
        // qrbox เป็น function คืน full-frame เสมอ ไม่ว่าจะหมุนหรือขนาดใด
        { fps, qrbox: (w, h) => ({ width: w, height: h }) },
        (decodedText) => {
          onScan(decodedText);
        },
        () => {
          // ซ่อน Error ยิบย่อยระหว่างที่กำลังสแกนหา QR
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
    <div className="absolute inset-0 w-full h-full bg-black">
      {/* บังคับให้ Video Cover เต็มพื้นที่ 100% */}
      <style>{`
        #qr-reader { width: 100% !important; height: 100% !important; border: none !important; }
        #qr-reader__scan_region { width: 100% !important; height: 100% !important; }
        #qr-reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          position: absolute;
          top: 0; left: 0;
        }
        #qr-reader__dashboard { display: none !important; }
        #qr-reader__scan_region > img { display: none !important; }
        #qr-reader__scan_region > canvas { position: absolute; opacity: 0; pointer-events: none; }
      `}</style>

      {err && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20 p-6">
          <p className="text-red-400 text-sm text-center">⚠️ ไม่สามารถเปิดกล้องได้: {err}</p>
        </div>
      )}
      {!started && !err && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <p className="text-white/60 text-sm animate-pulse">กำลังเปิดกล้อง…</p>
        </div>
      )}

      <div id={containerId} className="w-full h-full" />
    </div>
  );
}
