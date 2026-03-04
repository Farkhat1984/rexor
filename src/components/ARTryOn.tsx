"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { IconX } from "@/components/Icons";

interface ARTryOnProps {
  imageUrl: string;
  onClose: () => void;
}

type Status = "loading" | "ready" | "no-hand" | "tracking" | "error";

declare global {
  interface Window {
    Hands: any;
  }
}

const MEDIAPIPE_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240";

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.crossOrigin = "anonymous";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

/** Remove white/light background from product image */
function removeBackground(img: HTMLImageElement): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, c.width, c.height);
    const data = imageData.data;

    const THRESHOLD = 235;
    const SOFT_MIN = 210;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const maxCh = Math.max(r, g, b);
      const minCh = Math.min(r, g, b);
      const sat = maxCh > 0 ? (maxCh - minCh) / maxCh : 0;

      if (r > THRESHOLD && g > THRESHOLD && b > THRESHOLD && sat < 0.08) {
        data[i + 3] = 0;
      } else if (r > SOFT_MIN && g > SOFT_MIN && b > SOFT_MIN && sat < 0.12) {
        const avg = (r + g + b) / 3;
        const factor = 1 - (avg - SOFT_MIN) / (THRESHOLD - SOFT_MIN);
        data[i + 3] = Math.round(255 * Math.max(0, Math.min(1, factor)));
      }
    }

    const w = c.width;
    const copy = new Uint8ClampedArray(data);
    for (let y = 1; y < c.height - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = (y * w + x) * 4;
        if (copy[idx + 3] === 0) continue;
        let tn = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            if (copy[((y + dy) * w + (x + dx)) * 4 + 3] === 0) tn++;
          }
        }
        if (tn >= 6) data[idx + 3] = 0;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Clear top-left corner where brand logo sits (~30% x 20%)
    ctx.clearRect(0, 0, c.width * 0.3, c.height * 0.2);

    const result = new Image();
    result.onload = () => resolve(result);
    result.src = c.toDataURL("image/png");
  });
}

// Smoothing
interface SmoothedLandmark { x: number; y: number }
const SMOOTHING = 0.5;

function smoothLandmarks(
  prev: SmoothedLandmark[] | null,
  curr: any[]
): SmoothedLandmark[] {
  if (!prev) return curr.map((l: any) => ({ x: l.x, y: l.y }));
  return curr.map((l: any, i: number) => ({
    x: prev[i].x * SMOOTHING + l.x * (1 - SMOOTHING),
    y: prev[i].y * SMOOTHING + l.y * (1 - SMOOTHING),
  }));
}

export default function ARTryOn({ imageUrl, onClose }: ARTryOnProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const handsRef = useRef<any>(null);
  const rafRef = useRef<number>(0);
  const smoothedRef = useRef<SmoothedLandmark[] | null>(null);
  const lastSeenRef = useRef<number>(0);
  const watchImgRef = useRef<HTMLImageElement | null>(null);

  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (handsRef.current) {
      try { handsRef.current.close(); } catch {}
      handsRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!imageUrl) {
      setStatus("error");
      setErrorMsg("Нет изображения товара");
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = async () => {
      const cleaned = await removeBackground(img);
      watchImgRef.current = cleaned;
    };
    img.onerror = () => {
      setStatus("error");
      setErrorMsg("Не удалось загрузить изображение часов");
    };

    let cancelled = false;

    async function init() {
      try {
        await loadScript(`${MEDIAPIPE_CDN}/hands.js`);
        if (cancelled) return;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;

        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();
        if (cancelled) return;

        const canvas = canvasRef.current!;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = video.videoWidth * dpr;
        canvas.height = video.videoHeight * dpr;

        const ctx = canvas.getContext("2d")!;
        ctx.scale(dpr, dpr);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        const drawW = video.videoWidth;
        const drawH = video.videoHeight;

        const hands = new window.Hands({
          locateFile: (file: string) => `${MEDIAPIPE_CDN}/${file}`,
        });
        handsRef.current = hands;

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.4,
          minTrackingConfidence: 0.3,
        });

        hands.onResults((results: any) => {
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            smoothedRef.current = smoothLandmarks(
              smoothedRef.current,
              results.multiHandLandmarks[0]
            );
            lastSeenRef.current = performance.now();
            setStatus("tracking");
          } else {
            if (performance.now() - lastSeenRef.current > 600) {
              smoothedRef.current = null;
              setStatus("no-hand");
            }
          }
        });

        await hands.initialize();
        if (cancelled) return;

        setStatus("no-hand");

        let lastSendTime = 0;
        const SEND_INTERVAL = 50;

        function renderLoop() {
          if (cancelled) return;
          const canvas = canvasRef.current;
          const video = videoRef.current;
          if (!canvas || !video || video.readyState < 2) {
            rafRef.current = requestAnimationFrame(renderLoop);
            return;
          }

          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(video, 0, 0, drawW, drawH);

          const lm = smoothedRef.current;
          const watchImg = watchImgRef.current;
          if (lm && watchImg) {
            drawWatch(ctx, lm, watchImg, drawW, drawH);
          }

          const now = performance.now();
          if (now - lastSendTime > SEND_INTERVAL && handsRef.current) {
            lastSendTime = now;
            handsRef.current.send({ image: video }).catch(() => {});
          }

          rafRef.current = requestAnimationFrame(renderLoop);
        }

        renderLoop();
      } catch (err: any) {
        if (cancelled) return;
        setStatus("error");
        if (err.name === "NotAllowedError") {
          setErrorMsg("Разрешите доступ к камере");
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          setErrorMsg("Камера не найдена");
        } else if (err.message?.includes("Failed to load")) {
          setErrorMsg("Не удалось загрузить модель AR");
        } else {
          setErrorMsg("Не удалось запустить камеру");
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      cleanup();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleClose = () => {
    cleanup();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black">
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={canvasRef} className="w-full h-full object-cover" />

      <button
        onClick={handleClose}
        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-black/50 text-white rounded-full z-10"
      >
        <IconX className="w-6 h-6" />
      </button>

      {status === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
          <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin mb-4" />
          <p className="text-white text-sm">Загрузка AR...</p>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 px-8">
          <p className="text-white text-base text-center mb-4">{errorMsg}</p>
          <button
            onClick={handleClose}
            className="px-6 py-2.5 bg-white text-brand-900 text-sm font-medium rounded"
          >
            Закрыть
          </button>
        </div>
      )}

      {status === "no-hand" && (
        <div className="absolute bottom-20 left-0 right-0 flex justify-center pointer-events-none">
          <div className="bg-black/60 text-white text-sm px-5 py-2.5 rounded-full">
            Наведите камеру на руку
          </div>
        </div>
      )}

      {status === "tracking" && (
        <div className="absolute bottom-20 left-0 right-0 flex justify-center pointer-events-none">
          <div className="bg-black/40 text-white/70 text-xs px-4 py-1.5 rounded-full">
            Примерка AR
          </div>
        </div>
      )}
    </div>
  );
}

function drawWatch(
  ctx: CanvasRenderingContext2D,
  landmarks: SmoothedLandmark[],
  watchImg: HTMLImageElement,
  canvasW: number,
  canvasH: number
) {
  // Key landmarks
  const wrist = landmarks[0];       // WRIST
  const middleMcp = landmarks[9];   // MIDDLE_FINGER_MCP — center of hand base
  const indexMcp = landmarks[5];     // INDEX_FINGER_MCP
  const pinkyMcp = landmarks[17];   // PINKY_MCP

  // Pixel coordinates
  const wx = wrist.x * canvasW;
  const wy = wrist.y * canvasH;
  const mx = middleMcp.x * canvasW;
  const my = middleMcp.y * canvasH;
  const ix = indexMcp.x * canvasW;
  const iy = indexMcp.y * canvasH;
  const px = pinkyMcp.x * canvasW;
  const py = pinkyMcp.y * canvasH;

  // === ROTATION ===
  // Hand direction: from wrist toward middle finger MCP
  // This is the ARM axis — the watch strap runs along this direction
  // Product photo has strap vertical (12 o'clock = top), so we rotate
  // the image so its top points toward fingers
  const handAngle = Math.atan2(my - wy, mx - wx);
  // Image top is at -PI/2 in canvas coords, we want it at handAngle
  const rotation = 0;

  // === SIZE ===
  // Wrist width = distance between index MCP and pinky MCP
  const wristWidth = Math.hypot(ix - px, iy - py);
  // Watch dial ~= wrist width, total with strap is larger
  const watchSize = wristWidth * 1.8;

  // === POSITION ===
  // Place watch ON the wrist — slightly offset from wrist point
  // toward the forearm (opposite of finger direction)
  const centerX = wx - Math.cos(handAngle) * wristWidth * 0.1;
  const centerY = wy - Math.sin(handAngle) * wristWidth * 0.1;

  // Aspect ratio
  const aspectRatio = watchImg.naturalWidth / watchImg.naturalHeight;
  let drawW: number, drawH: number;
  if (aspectRatio > 1) {
    // Landscape image (unusual for watches)
    drawW = watchSize;
    drawH = watchSize / aspectRatio;
  } else {
    // Portrait image (typical: strap top-bottom)
    drawH = watchSize;
    drawW = watchSize * aspectRatio;
  }

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(rotation);

  // Shadow for depth
  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur = watchSize * 0.06;
  ctx.shadowOffsetY = watchSize * 0.02;

  ctx.drawImage(watchImg, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();
}
