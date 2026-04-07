/**
 * Passport Photo Editor
 *
 * Upload, remove background, crop/zoom, and print passport photos.
 * Supports Canon Selphy CP1500 and custom country templates.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { toast } from 'react-hot-toast';
import { adminFetch } from '@/lib/adminFetch';
import {
  DEFAULT_TEMPLATES,
  PAPER_SIZES,
  PRINT_DPI,
  BG_COLORS,
  mmToPixels,
  calculatePhotoGrid,
  type PhotoTemplate,
  type PaperSize,
} from '@/data/passportPhotoTemplates';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CropState {
  x: number;
  y: number;
  scale: number;
}

// ─── Background Removal (loaded from CDN at runtime) ─────────────────────────

let bgRemovalPromise: Promise<any> | null = null;

function loadBgRemoval(): Promise<any> {
  if (bgRemovalPromise) return bgRemovalPromise;
  bgRemovalPromise = new Promise((resolve, reject) => {
    const load = new Function('url', 'return import(url)');
    load('https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.5/+esm')
      .then(resolve)
      .catch(() => {
        load('https://esm.sh/@imgly/background-removal@1.5.5').then(resolve).catch(reject);
      });
  });
  return bgRemovalPromise;
}

async function removeBackground(imageBlob: Blob): Promise<Blob> {
  const mod = await loadBgRemoval();
  const removeBg = mod.removeBackground || mod.default?.removeBackground || mod.default;
  return await removeBg(imageBlob, { output: { format: 'image/png', quality: 1 } });
}

// ─── Main Component ──────────────────────────────────────────────────────────

function PhotoEditorPage() {
  // Image state
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [bgRemoved, setBgRemoved] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  // Template state
  const [templates, setTemplates] = useState<PhotoTemplate[]>(DEFAULT_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<PhotoTemplate>(DEFAULT_TEMPLATES[0]);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PhotoTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '', widthMm: 35, heightMm: 45, backgroundColor: 'white' as PhotoTemplate['backgroundColor'], notes: '',
  });

  // Crop/zoom state
  const [crop, setCrop] = useState<CropState>({ x: 0, y: 0, scale: 1 });

  // Image adjustments
  const defaultAdjustments = { brightness: 100, contrast: 100, saturation: 100, temperature: 0, sharpness: 0 };
  const [adjustments, setAdjustments] = useState(defaultAdjustments);

  const getFilterString = (adj: typeof defaultAdjustments) => {
    // Temperature: approximate via sepia + hue-rotate. Positive = warm, negative = cool.
    const temp = adj.temperature;
    const sepiaAmount = Math.abs(temp) / 200; // 0 to 0.5
    const hueRotate = temp > 0 ? -10 : temp < 0 ? 10 : 0;

    let filter = `brightness(${adj.brightness}%) contrast(${adj.contrast}%) saturate(${adj.saturation}%)`;
    if (temp !== 0) {
      filter += ` sepia(${sepiaAmount}) hue-rotate(${hueRotate}deg)`;
    }
    return filter;
  };

  const applySharpness = (ctx: CanvasRenderingContext2D, w: number, h: number, amount: number) => {
    if (amount <= 0) return;
    // Simple unsharp mask via convolution
    const factor = amount / 100;
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const copy = new Uint8ClampedArray(data);
    const stride = w * 4;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = (y * w + x) * 4;
        for (let c = 0; c < 3; c++) {
          const center = copy[i + c] * 5;
          const neighbors = copy[i - 4 + c] + copy[i + 4 + c] + copy[i - stride + c] + copy[i + stride + c];
          const sharpened = center - neighbors;
          data[i + c] = Math.min(255, Math.max(0, copy[i + c] + (sharpened - copy[i + c]) * factor));
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const autoEnhance = () => {
    setAdjustments({ brightness: 105, contrast: 110, saturation: 105, temperature: 0, sharpness: 30 });
  };

  const resetAdjustments = () => {
    setAdjustments(defaultAdjustments);
  };

  // Print state
  const [selectedPaper, setSelectedPaper] = useState<PaperSize>(PAPER_SIZES[0]); // Canon Selphy
  const [photoCount, setPhotoCount] = useState(1);

  // Print queue — saved photos (different people) for combined printing
  const [printQueue, setPrintQueue] = useState<{ id: string; dataUrl: string; label: string }[]>([]);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const rafId = useRef<number>(0);
  const cachedImg = useRef<HTMLImageElement | null>(null);
  const cachedImgSrc = useRef<string | null>(null);

  // Brush state — manual touch-up (erase / restore) on the processed image
  type BrushMode = 'off' | 'erase' | 'restore';
  const [brushMode, setBrushMode] = useState<BrushMode>('off');
  const [brushSize, setBrushSize] = useState(30);
  const isPainting = useRef(false);
  const lastBrushPos = useRef<{ x: number; y: number } | null>(null);
  const workCanvasRef = useRef<HTMLCanvasElement | null>(null); // full-res processed image (mutated by brush)
  const originalImgRef = useRef<HTMLImageElement | null>(null); // full-res original (source for restore brush)
  const brushUndoStack = useRef<string[]>([]); // dataUrls of work canvas states for undo
  const [brushCursorPos, setBrushCursorPos] = useState<{ x: number; y: number } | null>(null);

  const currentImage = processedImage || originalImage;

  // ─── Load custom templates from Firestore ────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const res = await adminFetch('/api/admin/photo-templates');
        if (res.ok) {
          const data = await res.json();
          const saved = (data.templates || []) as PhotoTemplate[];
          const savedMap = new Map(saved.map(t => [t.id, { ...t, isCustom: true }]));
          // Merge: saved versions override defaults, then add any purely custom ones
          const merged = DEFAULT_TEMPLATES.map(d => savedMap.has(d.id) ? { ...savedMap.get(d.id)!, isCustom: true } : d);
          const extras = saved.filter(t => !DEFAULT_TEMPLATES.some(d => d.id === t.id)).map(t => ({ ...t, isCustom: true }));
          setTemplates([...merged, ...extras]);
        }
      } catch {
        // Silently fail — defaults are enough
      }
    })();
  }, []);

  // ─── Template CRUD ───────────────────────────────────────────────────────

  const openNewTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({ name: '', widthMm: 35, heightMm: 45, backgroundColor: 'white', notes: '' });
    setShowTemplateForm(true);
  };

  const openEditTemplate = (t: PhotoTemplate) => {
    setEditingTemplate(t);
    setTemplateForm({
      name: t.name,
      widthMm: t.widthMm,
      heightMm: t.heightMm,
      backgroundColor: t.backgroundColor,
      notes: t.notes || '',
    });
    setShowTemplateForm(true);
  };

  const saveTemplate = async () => {
    if (!templateForm.name.trim()) {
      toast.error('Name is required');
      return;
    }
    try {
      const body: any = { ...templateForm };
      if (editingTemplate) body.id = editingTemplate.id;

      const res = await adminFetch('/api/admin/photo-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Refresh templates
      const listRes = await adminFetch('/api/admin/photo-templates');
      const listData = await listRes.json();
      const saved = (listData.templates || []) as PhotoTemplate[];
      const savedMap = new Map(saved.map(t => [t.id, { ...t, isCustom: true }]));
      const merged = DEFAULT_TEMPLATES.map(d => savedMap.has(d.id) ? { ...savedMap.get(d.id)!, isCustom: true } : d);
      const extras = saved.filter(t => !DEFAULT_TEMPLATES.some(d => d.id === t.id)).map(t => ({ ...t, isCustom: true }));
      setTemplates([...merged, ...extras]);

      setShowTemplateForm(false);
      toast.success(editingTemplate ? 'Template updated' : 'Template created');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save template');
    }
  };

  const deleteTemplate = async (t: PhotoTemplate) => {
    const isDefault = DEFAULT_TEMPLATES.some(d => d.id === t.id);
    if (isDefault) {
      // Reset default template to original values by deleting the Firestore override
      if (!confirm(`Reset "${t.name}" to original defaults?`)) return;
      try {
        await adminFetch('/api/admin/photo-templates', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: t.id }),
        });
        const original = DEFAULT_TEMPLATES.find(d => d.id === t.id)!;
        setTemplates(prev => prev.map(x => x.id === t.id ? original : x));
        if (selectedTemplate.id === t.id) setSelectedTemplate(original);
        toast.success('Template reset to defaults');
      } catch {
        toast.error('Failed to reset template');
      }
    } else {
      if (!confirm(`Delete template "${t.name}"?`)) return;
      try {
        const res = await adminFetch('/api/admin/photo-templates', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: t.id }),
        });
        if (!res.ok) throw new Error('Delete failed');
        setTemplates(prev => prev.filter(x => x.id !== t.id));
        if (selectedTemplate.id === t.id) setSelectedTemplate(DEFAULT_TEMPLATES[0]);
        toast.success('Template deleted');
      } catch {
        toast.error('Failed to delete template');
      }
    }
  };

  // ─── Draw canvas ─────────────────────────────────────────────────────────

  // Cache the image element so we can draw synchronously during drag
  useEffect(() => {
    if (!currentImage) { cachedImg.current = null; cachedImgSrc.current = null; return; }
    if (cachedImgSrc.current === currentImage) return; // already loaded
    const img = new Image();
    img.onload = () => {
      cachedImg.current = img;
      cachedImgSrc.current = currentImage;
      drawCanvas();
    };
    img.src = currentImage;
  }, [currentImage]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = cachedImg.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const templateAspect = selectedTemplate.widthMm / selectedTemplate.heightMm;
    const canvasW = 400;
    const canvasH = canvasW / templateAspect;

    canvas.width = canvasW * 2;
    canvas.height = canvasH * 2;
    canvas.style.width = `${canvasW}px`;
    canvas.style.height = `${canvasH}px`;
    ctx.scale(2, 2);

    // Background
    ctx.fillStyle = BG_COLORS[selectedTemplate.backgroundColor];
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Image — draw with filters applied
    const filterStr = getFilterString(adjustments);
    ctx.filter = filterStr;

    const imgAspect = img.width / img.height;
    let drawW: number, drawH: number;
    if (imgAspect > templateAspect) {
      drawH = canvasH * crop.scale;
      drawW = drawH * imgAspect;
    } else {
      drawW = canvasW * crop.scale;
      drawH = drawW / imgAspect;
    }
    const drawX = (canvasW - drawW) / 2 + crop.x;
    const drawY = (canvasH - drawH) / 2 + crop.y;
    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    ctx.filter = 'none';

    // Apply sharpness after drawing
    if (adjustments.sharpness > 0) {
      applySharpness(ctx, canvasW * 2, canvasH * 2, adjustments.sharpness);
    }

    // Center crosshair
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(0, 180, 255, 0.4)';
    ctx.beginPath();
    ctx.moveTo(canvasW / 2, 0);
    ctx.lineTo(canvasW / 2, canvasH);
    ctx.moveTo(0, canvasH / 2);
    ctx.lineTo(canvasW, canvasH / 2);
    ctx.stroke();

    // Border
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, canvasW - 1, canvasH - 1);
  }, [crop, selectedTemplate, adjustments]);

  useEffect(() => { drawCanvas(); }, [drawCanvas]);

  // ─── File upload ─────────────────────────────────────────────────────────

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error('Image too large (max 20 MB)'); return; }

    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setOriginalImage(url);
      setProcessedImage(null);
      setBgRemoved(false);
      setCrop({ x: 0, y: 0, scale: 1 });
      const img = new Image();
      img.onload = () => setImageSize({ width: img.width, height: img.height });
      img.src = url;
    };
    reader.readAsDataURL(file);
  };

  // ─── Background removal ──────────────────────────────────────────────────

  const handleRemoveBackground = async () => {
    if (!originalImage) return;
    setIsRemovingBg(true);
    const loadingToast = toast.loading('Removing background... This may take 10-30 seconds.');

    try {
      const resp = await fetch(originalImage);
      const blob = await resp.blob();
      const resultBlob = await removeBackground(blob);

      // Store the transparent cutout directly — the background color is filled
      // by drawCanvas/renderPhotoToCanvas BEFORE ctx.filter is applied, so adjustments
      // (brightness/contrast/etc.) only affect the subject, not the chosen bg color.
      const reader = new FileReader();
      reader.onload = () => {
        setProcessedImage(reader.result as string);
        setBgRemoved(true);
        toast.dismiss(loadingToast);
        toast.success('Background removed!');
      };
      reader.readAsDataURL(resultBlob);
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(`Failed to remove background: ${err.message}`);
    } finally {
      setIsRemovingBg(false);
    }
  };

  // ─── Brush touch-up (erase/restore on processed image) ───────────────────

  // Initialize the work canvas + original-image ref whenever bg is removed.
  // The work canvas holds the full-resolution processed image; brush strokes mutate it
  // and we then sync `processedImage` so the display canvas re-renders.
  useEffect(() => {
    if (!bgRemoved || !processedImage || !originalImage) {
      workCanvasRef.current = null;
      originalImgRef.current = null;
      brushUndoStack.current = [];
      return;
    }

    // Load processed image into work canvas at native resolution
    const procImg = new Image();
    procImg.onload = () => {
      const c = document.createElement('canvas');
      c.width = procImg.width;
      c.height = procImg.height;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(procImg, 0, 0);
      workCanvasRef.current = c;
      brushUndoStack.current = [c.toDataURL('image/png')];
    };
    procImg.src = processedImage;

    // Load original image (sized to match the processed canvas) for restore brush
    const origImg = new Image();
    origImg.onload = () => { originalImgRef.current = origImg; };
    origImg.src = originalImage;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgRemoved]);

  // Map a mouse event on the display canvas → coordinates on the work canvas
  const getBrushCoords = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    const work = workCanvasRef.current;
    if (!canvas || !work) return null;
    const rect = canvas.getBoundingClientRect();
    const xCss = e.clientX - rect.left;
    const yCss = e.clientY - rect.top;
    const sx = work.width / rect.width;
    const sy = work.height / rect.height;
    return { x: xCss * sx, y: yCss * sy, displayX: xCss, displayY: yCss };
  };

  const paintStroke = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const work = workCanvasRef.current;
    if (!work) return;
    const ctx = work.getContext('2d');
    if (!ctx) return;
    const radius = (brushSize / 2) * (work.width / 400); // scale brush to work canvas
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = radius * 2;

    if (brushMode === 'erase') {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.restore();
    } else if (brushMode === 'restore') {
      const orig = originalImgRef.current;
      if (!orig) return;
      // Draw the original image clipped to the brush stroke path
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.lineWidth = radius * 2;
      // Use a path-based clip by stroking the path into a temporary mask
      // Simpler approach: fill circles along the path using composite source-over with the original image as source
      // We accomplish this by using a clip region
      ctx.beginPath();
      // Draw two end caps + a rect along the segment to form the stroke path
      ctx.arc(from.x, from.y, radius, 0, Math.PI * 2);
      ctx.arc(to.x, to.y, radius, 0, Math.PI * 2);
      // Quadrilateral between the two circles
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = -dy / len * radius;
      const ny = dx / len * radius;
      ctx.moveTo(from.x + nx, from.y + ny);
      ctx.lineTo(to.x + nx, to.y + ny);
      ctx.lineTo(to.x - nx, to.y - ny);
      ctx.lineTo(from.x - nx, from.y - ny);
      ctx.closePath();
      ctx.clip();
      // Draw the original image at the same size as the work canvas
      ctx.drawImage(orig, 0, 0, work.width, work.height);
      ctx.restore();
    }
  };

  const commitBrushStroke = () => {
    const work = workCanvasRef.current;
    if (!work) return;
    setProcessedImage(work.toDataURL('image/png'));
    // Save undo snapshot (cap at 20)
    brushUndoStack.current.push(work.toDataURL('image/png'));
    if (brushUndoStack.current.length > 20) brushUndoStack.current.shift();
  };

  const undoBrushStroke = () => {
    if (brushUndoStack.current.length <= 1) {
      toast('Nothing to undo');
      return;
    }
    brushUndoStack.current.pop(); // remove current
    const prev = brushUndoStack.current[brushUndoStack.current.length - 1];
    const work = workCanvasRef.current;
    if (!work || !prev) return;
    const img = new Image();
    img.onload = () => {
      const ctx = work.getContext('2d')!;
      ctx.clearRect(0, 0, work.width, work.height);
      ctx.drawImage(img, 0, 0);
      setProcessedImage(work.toDataURL('image/png'));
    };
    img.src = prev;
  };

  // ─── Canvas interaction ──────────────────────────────────────────────────

  const handleMouseDown = (e: React.MouseEvent) => {
    if (brushMode !== 'off') {
      const pos = getBrushCoords(e);
      if (!pos) return;
      isPainting.current = true;
      lastBrushPos.current = { x: pos.x, y: pos.y };
      // Single click = paint a dot
      paintStroke(lastBrushPos.current, lastBrushPos.current);
      // Live preview straight from work canvas
      const work = workCanvasRef.current;
      if (work) {
        cachedImg.current = work as unknown as HTMLImageElement;
        drawCanvas();
      }
      return;
    }
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (brushMode !== 'off') {
      const pos = getBrushCoords(e);
      if (pos) setBrushCursorPos({ x: pos.displayX, y: pos.displayY });
      if (!isPainting.current || !pos || !lastBrushPos.current) return;
      const from = lastBrushPos.current;
      paintStroke(from, { x: pos.x, y: pos.y });
      lastBrushPos.current = { x: pos.x, y: pos.y };
      // Live preview: draw the work canvas directly to the display canvas (no dataURL, no React state)
      const work = workCanvasRef.current;
      if (work) {
        // Temporarily point cachedImg at the work canvas so drawCanvas renders the latest pixels
        cachedImg.current = work as unknown as HTMLImageElement;
        cancelAnimationFrame(rafId.current);
        rafId.current = requestAnimationFrame(() => drawCanvas());
      }
      return;
    }
    if (!isDragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    // Throttle redraws to one per animation frame
    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      setCrop(p => ({ ...p, x: p.x + dx, y: p.y + dy }));
    });
  };
  const handleMouseUp = () => {
    if (brushMode !== 'off' && isPainting.current) {
      isPainting.current = false;
      lastBrushPos.current = null;
      commitBrushStroke();
      return;
    }
    isDragging.current = false;
  };
  const handleMouseLeave = () => {
    if (brushMode !== 'off') {
      setBrushCursorPos(null);
      if (isPainting.current) {
        isPainting.current = false;
        lastBrushPos.current = null;
        commitBrushStroke();
      }
      return;
    }
    isDragging.current = false;
  };
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      setCrop(p => ({ ...p, scale: Math.max(0.3, Math.min(3, p.scale + delta)) }));
    });
  };

  // ─── Export helpers ──────────────────────────────────────────────────────

  const renderPhotoToCanvas = (img: HTMLImageElement, widthPx: number, heightPx: number): HTMLCanvasElement => {
    const c = document.createElement('canvas');
    c.width = widthPx;
    c.height = heightPx;
    const ctx = c.getContext('2d')!;
    const tAspect = selectedTemplate.widthMm / selectedTemplate.heightMm;
    const iAspect = img.width / img.height;

    ctx.fillStyle = BG_COLORS[selectedTemplate.backgroundColor];
    ctx.fillRect(0, 0, widthPx, heightPx);

    // Apply image adjustments
    ctx.filter = getFilterString(adjustments);

    let dw: number, dh: number;
    if (iAspect > tAspect) { dh = heightPx * crop.scale; dw = dh * iAspect; }
    else { dw = widthPx * crop.scale; dh = dw / iAspect; }

    const canvasDisplayW = 400;
    const canvasDisplayH = canvasDisplayW / tAspect;
    const dx = (widthPx - dw) / 2 + (crop.x / canvasDisplayW) * widthPx;
    const dy = (heightPx - dh) / 2 + (crop.y / canvasDisplayH) * heightPx;
    ctx.drawImage(img, dx, dy, dw, dh);

    ctx.filter = 'none';
    if (adjustments.sharpness > 0) {
      applySharpness(ctx, widthPx, heightPx, adjustments.sharpness);
    }
    return c;
  };

  const exportPhoto = () => {
    if (!currentImage) return;
    const wPx = mmToPixels(selectedTemplate.widthMm);
    const hPx = mmToPixels(selectedTemplate.heightMm);
    const img = new Image();
    img.onload = () => {
      const c = renderPhotoToCanvas(img, wPx, hPx);
      c.toBlob(blob => {
        if (!blob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `photo_${selectedTemplate.widthMm}x${selectedTemplate.heightMm}mm.jpg`;
        a.click();
        toast.success('Photo exported!');
      }, 'image/jpeg', 0.95);
    };
    img.src = currentImage;
  };

  const addToPrintQueue = () => {
    if (!currentImage) return;
    const wPx = mmToPixels(selectedTemplate.widthMm);
    const hPx = mmToPixels(selectedTemplate.heightMm);
    const img = new Image();
    img.onload = () => {
      const c = renderPhotoToCanvas(img, wPx, hPx);
      const dataUrl = c.toDataURL('image/jpeg', 0.95);
      setPrintQueue(prev => [...prev, {
        id: `q-${Date.now()}`,
        dataUrl,
        label: `Photo ${prev.length + 1}`,
      }]);
      toast.success(`Photo added to print queue (${printQueue.length + 1})`);
    };
    img.src = currentImage;
  };

  const generatePrintLayout = () => {
    // Use print queue if it has items, otherwise use current photo
    const useQueue = printQueue.length > 0;
    if (!useQueue && !currentImage) return;

    const paper = selectedPaper;
    const paperWPx = mmToPixels(paper.widthMm);
    const paperHPx = mmToPixels(paper.heightMm);
    const photoWPx = mmToPixels(selectedTemplate.widthMm);
    const photoHPx = mmToPixels(selectedTemplate.heightMm);
    const gutterPx = mmToPixels(2);
    const marginPx = mmToPixels(3);
    const grid = calculatePhotoGrid(paper.widthMm, paper.heightMm, selectedTemplate.widthMm, selectedTemplate.heightMm);

    const canvas = document.createElement('canvas');
    canvas.width = paperWPx;
    canvas.height = paperHPx;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, paperWPx, paperHPx);

    if (useQueue) {
      // Load all queue images first, then split into sheets of `grid.total` photos each
      const total = printQueue.length;
      let loaded = 0;
      const images: HTMLImageElement[] = new Array(total);
      printQueue.forEach((item, i) => {
        const img = new Image();
        img.onload = () => {
          images[i] = img;
          loaded++;
          if (loaded === total) {
            const sheets = Math.ceil(total / grid.total);
            let exported = 0;

            const renderSheet = (sheetIdx: number) => {
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, paperWPx, paperHPx);
              ctx.strokeStyle = '#000000';
              ctx.lineWidth = mmToPixels(0.3);

              const startIdx = sheetIdx * grid.total;
              const endIdx = Math.min(startIdx + grid.total, total);
              const sheetCount = endIdx - startIdx;
              let placed = 0;
              for (let row = 0; row < grid.rows && placed < sheetCount; row++) {
                for (let col = 0; col < grid.cols && placed < sheetCount; col++) {
                  const x = marginPx + col * (photoWPx + gutterPx);
                  const y = marginPx + row * (photoHPx + gutterPx);
                  ctx.drawImage(images[startIdx + placed], x, y, photoWPx, photoHPx);
                  ctx.strokeRect(x, y, photoWPx, photoHPx);
                  placed++;
                }
              }

              canvas.toBlob(blob => {
                if (!blob) return;
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = sheets > 1
                  ? `print_${paper.id}_sheet${sheetIdx + 1}of${sheets}.jpg`
                  : `print_${paper.id}_${sheetCount}pcs.jpg`;
                a.click();
                exported++;
                if (exported === sheets) {
                  toast.success(
                    sheets > 1
                      ? `Exported ${sheets} sheets (${total} photos total)`
                      : `Print layout with ${total} photos exported!`
                  );
                } else {
                  // Stagger downloads slightly so the browser doesn't suppress them
                  setTimeout(() => renderSheet(sheetIdx + 1), 250);
                }
              }, 'image/jpeg', 0.95);
            };

            renderSheet(0);
          }
        };
        img.src = item.dataUrl;
      });
    } else {
      // Single photo repeated
      const count = Math.min(photoCount, grid.total);
      const img = new Image();
      img.onload = () => {
        const single = renderPhotoToCanvas(img, photoWPx, photoHPx);
        let placed = 0;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = mmToPixels(0.3);
        for (let row = 0; row < grid.rows && placed < count; row++) {
          for (let col = 0; col < grid.cols && placed < count; col++) {
            const x = marginPx + col * (photoWPx + gutterPx);
            const y = marginPx + row * (photoHPx + gutterPx);
            ctx.drawImage(single, x, y);
            ctx.strokeRect(x, y, photoWPx, photoHPx);
            placed++;
          }
        }
        canvas.toBlob(blob => {
          if (!blob) return;
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `print_${paper.id}_${count}pcs.jpg`;
          a.click();
          toast.success(`Print layout with ${count} photos exported!`);
        }, 'image/jpeg', 0.95);
      };
      img.src = currentImage!;
    }
  };

  const grid = calculatePhotoGrid(selectedPaper.widthMm, selectedPaper.heightMm, selectedTemplate.widthMm, selectedTemplate.heightMm);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <ProtectedRoute requiredPermission="canManageOrders">
      <Head><title>Passport Photo Editor — Admin</title></Head>

      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin" className="text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Passport Photo Editor</h1>
            </div>
            {currentImage && (
              <div className="flex items-center gap-2">
                <button onClick={addToPrintQueue} className="px-4 py-2 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600">
                  Add to print {printQueue.length > 0 && `(${printQueue.length})`}
                </button>
                <button onClick={exportPhoto} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                  Export photo
                </button>
                <button onClick={generatePrintLayout} className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
                  Print layout
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* ── Left: Templates ── */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-gray-900">Templates</h2>
                  <button onClick={openNewTemplate} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100">
                    + New
                  </button>
                </div>

                <div className="space-y-1 max-h-[500px] overflow-y-auto">
                  {templates.map(t => (
                    <div
                      key={t.id}
                      className={`group flex items-center gap-1 rounded-lg transition-colors ${
                        selectedTemplate.id === t.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                      }`}
                    >
                      <button
                        onClick={() => setSelectedTemplate(t)}
                        className="flex-1 text-left px-3 py-2 text-sm"
                      >
                        <div className="font-medium text-gray-900">{t.name}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          <span>{t.widthMm}×{t.heightMm} mm</span>
                          <span
                            className="inline-block w-3 h-3 rounded border border-gray-300"
                            style={{ backgroundColor: BG_COLORS[t.backgroundColor] }}
                          />
                        </div>
                      </button>
                      <div className="flex-shrink-0 pr-2 opacity-0 group-hover:opacity-100 flex gap-1">
                        <button onClick={() => openEditTemplate(t)} className="text-gray-400 hover:text-blue-600" title="Edit">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => deleteTemplate(t)} className="text-gray-400 hover:text-red-600" title="Delete">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Template form modal */}
              {showTemplateForm && (
                <div className="mt-4 bg-white rounded-lg shadow p-4 border-2 border-blue-200">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    {editingTemplate ? 'Edit Template' : 'New Template'}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Name</label>
                      <input
                        type="text"
                        value={templateForm.name}
                        onChange={e => setTemplateForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="e.g. China Visa (33×48 mm)"
                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Width (mm)</label>
                        <input
                          type="number"
                          value={templateForm.widthMm}
                          onChange={e => setTemplateForm(p => ({ ...p, widthMm: Number(e.target.value) }))}
                          min={10} max={200}
                          className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Height (mm)</label>
                        <input
                          type="number"
                          value={templateForm.heightMm}
                          onChange={e => setTemplateForm(p => ({ ...p, heightMm: Number(e.target.value) }))}
                          min={10} max={200}
                          className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Background</label>
                      <select
                        value={templateForm.backgroundColor}
                        onChange={e => setTemplateForm(p => ({ ...p, backgroundColor: e.target.value as any }))}
                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                      >
                        <option value="white">White</option>
                        <option value="light-grey">Light grey</option>
                        <option value="light-blue">Light blue</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Notes (optional)</label>
                      <input
                        type="text"
                        value={templateForm.notes}
                        onChange={e => setTemplateForm(p => ({ ...p, notes: e.target.value }))}
                        placeholder="Any special requirements..."
                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={saveTemplate}
                        className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        {editingTemplate ? 'Update' : 'Create'}
                      </button>
                      <button
                        onClick={() => setShowTemplateForm(false)}
                        className="px-3 py-1.5 border border-gray-300 text-sm rounded hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Center: Editor ── */}
            <div className="lg:col-span-6">
              {!currentImage ? (
                <div
                  onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileUpload(f); }}
                  onDragOver={e => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white rounded-lg shadow border-2 border-dashed border-gray-300 hover:border-blue-400 cursor-pointer transition-colors p-16 text-center"
                >
                  <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-lg font-medium text-gray-700">Upload photo</p>
                  <p className="text-sm text-gray-500 mt-1">Drag and drop or click to select</p>
                  <p className="text-xs text-gray-400 mt-2">JPG or PNG, max 20 MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-4">
                  {/* Toolbar */}
                  <div className="flex flex-wrap items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                    <button
                      onClick={handleRemoveBackground}
                      disabled={isRemovingBg || bgRemoved}
                      className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      {isRemovingBg && (
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      )}
                      {bgRemoved ? 'Background removed' : isRemovingBg ? 'Processing...' : 'Remove background'}
                    </button>

                    {bgRemoved && (
                      <button onClick={() => { setProcessedImage(null); setBgRemoved(false); setBrushMode('off'); }} className="px-3 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">
                        Restore original
                      </button>
                    )}

                    {/* Brush touch-up — only available after background removal */}
                    {bgRemoved && (
                      <>
                        <div className="h-6 w-px bg-gray-300 mx-1" />
                        <button
                          onClick={() => setBrushMode(brushMode === 'erase' ? 'off' : 'erase')}
                          className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 ${
                            brushMode === 'erase'
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                          title="Erase brush — click and drag to remove pixels"
                        >
                          🧽 Erase
                        </button>
                        <button
                          onClick={() => setBrushMode(brushMode === 'restore' ? 'off' : 'restore')}
                          className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 ${
                            brushMode === 'restore'
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                          title="Restore brush — click and drag to bring back pixels from the original"
                        >
                          ↩️ Restore
                        </button>
                        {brushMode !== 'off' && (
                          <>
                            <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-2 py-1">
                              <span className="text-xs text-gray-500">Size</span>
                              <input
                                type="range" min="5" max="120"
                                value={brushSize}
                                onChange={e => setBrushSize(Number(e.target.value))}
                                className="w-24 h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
                              />
                              <span className="text-xs font-mono text-gray-600 w-6 text-right">{brushSize}</span>
                            </div>
                            <button
                              onClick={undoBrushStroke}
                              className="px-3 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50"
                              title="Undo last brush stroke"
                            >
                              ↶ Undo
                            </button>
                          </>
                        )}
                      </>
                    )}

                    <div className="flex-1" />

                    {/* Zoom */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1">
                      <button onClick={() => setCrop(p => ({ ...p, scale: Math.max(0.3, p.scale - 0.1) }))} className="p-1 hover:bg-gray-200 rounded" title="Zoom out">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                      </button>
                      <span className="text-xs font-mono w-12 text-center">{Math.round(crop.scale * 100)}%</span>
                      <button onClick={() => setCrop(p => ({ ...p, scale: Math.min(3, p.scale + 0.1) }))} className="p-1 hover:bg-gray-200 rounded" title="Zoom in">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      </button>
                    </div>

                    <button onClick={() => setCrop({ x: 0, y: 0, scale: 1 })} className="px-3 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">
                      Reset
                    </button>

                    <button
                      onClick={() => { setOriginalImage(null); setProcessedImage(null); setBgRemoved(false); setCrop({ x: 0, y: 0, scale: 1 }); resetAdjustments(); }}
                      className="px-3 py-1.5 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50"
                    >
                      New photo
                    </button>
                  </div>

                  {/* Canvas */}
                  <div className="flex justify-center">
                    <div className="relative">
                      <canvas
                        ref={canvasRef}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseLeave}
                        onWheel={handleWheel}
                        className={`border border-gray-300 rounded ${
                          brushMode === 'off' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
                        }`}
                      />
                      {/* Brush cursor overlay */}
                      {brushMode !== 'off' && brushCursorPos && (
                        <div
                          className="absolute pointer-events-none rounded-full"
                          style={{
                            left: brushCursorPos.x - brushSize / 2,
                            top: brushCursorPos.y - brushSize / 2,
                            width: brushSize,
                            height: brushSize,
                            border: brushMode === 'erase' ? '2px solid #dc2626' : '2px solid #059669',
                            boxShadow: '0 0 0 1px rgba(255,255,255,0.9), inset 0 0 0 1px rgba(255,255,255,0.9)',
                            backgroundColor: brushMode === 'erase' ? 'rgba(220,38,38,0.18)' : 'rgba(5,150,105,0.18)',
                          }}
                        />
                      )}
                      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                        {selectedTemplate.widthMm}×{selectedTemplate.heightMm} mm
                      </div>
                      {brushMode !== 'off' && (
                        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {brushMode === 'erase' ? '🧽 Erase mode' : '↩️ Restore mode'} — click & drag
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Zoom slider */}
                  <div className="mt-4 flex items-center gap-3">
                    <span className="text-xs text-gray-500">Zoom</span>
                    <input
                      type="range" min="30" max="300"
                      value={crop.scale * 100}
                      onChange={e => setCrop(p => ({ ...p, scale: Number(e.target.value) / 100 }))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <span className="text-xs font-mono text-gray-500 w-10">{Math.round(crop.scale * 100)}%</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    Drag to position. Scroll or use the slider to zoom.
                  </p>

                  {/* Image adjustments */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-900">Adjustments</h3>
                      <div className="flex gap-1.5">
                        <button
                          onClick={autoEnhance}
                          className="px-2.5 py-1 text-xs bg-amber-50 text-amber-700 rounded hover:bg-amber-100 font-medium"
                        >
                          ✨ Auto-enhance
                        </button>
                        <button
                          onClick={resetAdjustments}
                          className="px-2.5 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {([
                        { key: 'brightness', label: 'Brightness', icon: '☀️', min: 50, max: 150, step: 1 },
                        { key: 'contrast', label: 'Contrast', icon: '◐', min: 50, max: 150, step: 1 },
                        { key: 'saturation', label: 'Saturation', icon: '🎨', min: 0, max: 200, step: 1 },
                        { key: 'temperature', label: 'Temperature', icon: '🌡️', min: -100, max: 100, step: 1 },
                        { key: 'sharpness', label: 'Sharpness', icon: '🔍', min: 0, max: 100, step: 1 },
                      ] as const).map(({ key, label, icon, min, max, step }) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-sm w-5 text-center">{icon}</span>
                          <span className="text-xs text-gray-600 w-20">{label}</span>
                          <input
                            type="range"
                            min={min}
                            max={max}
                            step={step}
                            value={adjustments[key]}
                            onChange={(e) => setAdjustments(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                            className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                          <span className="text-xs font-mono text-gray-500 w-10 text-right">
                            {key === 'temperature' ? (adjustments[key] > 0 ? `+${adjustments[key]}` : adjustments[key]) : adjustments[key]}
                            {key !== 'temperature' && key !== 'sharpness' ? '%' : ''}
                          </span>
                          {adjustments[key] !== defaultAdjustments[key] && (
                            <button
                              onClick={() => setAdjustments(prev => ({ ...prev, [key]: defaultAdjustments[key] }))}
                              className="text-gray-400 hover:text-gray-600 text-xs"
                              title="Reset"
                            >
                              ↺
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Right: Info & Print ── */}
            <div className="lg:col-span-3 space-y-4">
              {/* Selected template info */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Selected template</h3>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Size</span><span className="font-medium">{selectedTemplate.widthMm} × {selectedTemplate.heightMm} mm</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Pixels (300 DPI)</span><span className="font-medium">{mmToPixels(selectedTemplate.widthMm)} × {mmToPixels(selectedTemplate.heightMm)}</span></div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Background</span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: BG_COLORS[selectedTemplate.backgroundColor] }} />
                      {selectedTemplate.backgroundColor === 'white' ? 'White' : selectedTemplate.backgroundColor === 'light-grey' ? 'Light grey' : 'Light blue'}
                    </span>
                  </div>
                  {selectedTemplate.notes && (
                    <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mt-1">{selectedTemplate.notes}</p>
                  )}
                </div>
                {imageSize.width > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between text-sm">
                    <span className="text-gray-500">Original</span>
                    <span className="text-gray-700">{imageSize.width} × {imageSize.height} px</span>
                  </div>
                )}
              </div>

              {/* Print queue */}
              {printQueue.length > 0 && (
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Print queue ({printQueue.length})</h3>
                    <button
                      onClick={() => { setPrintQueue([]); toast.success('Print queue cleared'); }}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {printQueue.map((item, i) => (
                      <div key={item.id} className="relative group">
                        <img src={item.dataUrl} alt={item.label} className="w-full rounded border border-gray-200" />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-0.5 rounded-b">
                          {item.label}
                        </div>
                        <button
                          onClick={() => setPrintQueue(prev => prev.filter((_, j) => j !== i))}
                          className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-4 h-4 text-[10px] leading-none opacity-0 group-hover:opacity-100 flex items-center justify-center"
                          title="Remove"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Print settings */}
              {(currentImage || printQueue.length > 0) && (
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Print settings</h3>

                  <label className="block text-xs text-gray-600 mb-1">Paper size</label>
                  <select
                    value={selectedPaper.id}
                    onChange={e => setSelectedPaper(PAPER_SIZES.find(p => p.id === e.target.value)!)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3"
                  >
                    {PAPER_SIZES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>

                  <div className="text-xs text-gray-500 mb-3">
                    Fits {grid.total} photos per sheet ({grid.cols} × {grid.rows})
                  </div>

                  {printQueue.length === 0 && (
                    <>
                      <label className="block text-xs text-gray-600 mb-1">Number of photos</label>
                      <input
                        type="number" min={1} max={grid.total}
                        value={photoCount}
                        onChange={e => setPhotoCount(Math.min(grid.total, Math.max(1, Number(e.target.value))))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3"
                      />
                    </>
                  )}

                  {printQueue.length > 0 && (
                    <p className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1.5 mb-3">
                      Print queue mode: {printQueue.length} photo{printQueue.length !== 1 ? 's' : ''} will be placed on the sheet.
                    </p>
                  )}

                  <button
                    onClick={generatePrintLayout}
                    className="w-full px-4 py-2.5 bg-green-600 text-white font-medium text-sm rounded-lg hover:bg-green-700"
                  >
                    Download print layout
                  </button>
                  <p className="text-xs text-gray-400 mt-2">
                    {printQueue.length > 0
                      ? (() => {
                          const sheets = Math.ceil(printQueue.length / grid.total);
                          return sheets > 1
                            ? `Generates ${sheets} ${selectedPaper.name} sheets (${grid.total} per sheet × ${sheets}, ${printQueue.length} photos total) at ${PRINT_DPI} DPI.`
                            : `Generates a ${selectedPaper.name} layout with ${printQueue.length} different photos at ${PRINT_DPI} DPI.`;
                        })()
                      : `Generates a ${selectedPaper.name} image with ${Math.min(photoCount, grid.total)} photos and cut marks at ${PRINT_DPI} DPI.`
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const i18nConfig = {
    i18n: { defaultLocale: 'sv', locales: ['sv', 'en'], localeDetection: false as const },
  };
  return { props: { ...(await serverSideTranslations('en', ['common'], i18nConfig)) } };
};

export default PhotoEditorPage;
