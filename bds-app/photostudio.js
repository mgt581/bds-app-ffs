/* photostudio.js
 * Full editor engine for AI Photo Studio
 * Extracted from index.html for clean SaaS structure
 */

console.log("PhotoStudio engine loading…");

// Register service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch(()=>{});
  });
}

const PhotoStudio = (() => {
  const state = {
    photoSrc: null,
    bgSrc: null,
    isBusy: false
  };

  const canvas = document.getElementById("stage") || (() => {
    // Create canvas if not already present
    const stageBox = document.createElement("div");
    stageBox.className = "stage";
    stageBox.innerHTML = `<canvas id="stage" width="960" height="600"></canvas>`;
    document.getElementById("app").prepend(stageBox);
    return document.getElementById("stage");
  })();

  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const setStatus = (m) => {
    let el = document.getElementById("status");
    if (!el) {
      el = document.createElement("p");
      el.id = "status";
      el.className = "status";
      document.getElementById("app").appendChild(el);
    }
    el.textContent = m;
  };

  const setBusy = (b) => {
    state.isBusy = b;
    const btnRemove = document.getElementById("btnRemove");
    const btnChange = document.getElementById("btnChange");
    if (btnRemove) btnRemove.disabled = !state.photoSrc || b;
    if (btnChange) btnChange.disabled = !state.photoSrc || b;
  };

  const setPhoto = (src) => {
    state.photoSrc = src;
    const btnRemove = document.getElementById("btnRemove");
    const btnChange = document.getElementById("btnChange");
    if (btnRemove) btnRemove.disabled = !src;
    if (btnChange) btnChange.disabled = !src;
    drawToCanvas({ imgSrc: src, bgSrc: state.bgSrc });
  };

  const setBg = (src) => {
    state.bgSrc = src;

    let badge = document.getElementById("bgBadge");
    if (!badge) {
      badge = document.createElement("span");
      badge.id = "bgBadge";
      document.getElementById("app").appendChild(badge);
    }

    badge.textContent = src ? "Background selected ✓" : "";
    if (state.photoSrc) drawToCanvas({ imgSrc: state.photoSrc, bgSrc: src });
  };

  const readFileToDataURL = (file) => new Promise((resolve,reject) => {
    if (!file) return resolve(null);
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error("read-failed"));
    r.readAsDataURL(file);
  });

  const loadImage = (url) => new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = url;
  });

  const drawChecker = () => {
    const size = 20;
    for (let y = 0; y < canvas.height; y += size) {
      for (let x = 0; x < canvas.width; x += size) {
        ctx.fillStyle =
          (x / size + y / size) % 2 === 0 ? "#e5e7eb" : "#ffffff";
        ctx.fillRect(x, y, size, size);
      }
    }
  };

  async function drawToCanvas({ imgSrc, bgSrc = null }) {
    if (!imgSrc) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    if (bgSrc) {
      const bg = await loadImage(bgSrc);
      const scale = Math.max(
        canvas.width / bg.width,
        canvas.height / bg.height
      );
      const bw = bg.width * scale;
      const bh = bg.height * scale;
      ctx.drawImage(bg, (canvas.width - bw) / 2, (canvas.height - bh) / 2, bw, bh);
    } else {
      drawChecker();
    }

    // Draw foreground image
    const img = await loadImage(imgSrc);
    const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
    const w = img.width * scale;
    const h = img.height * scale;

    ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
  }

  // ===== Mediapipe Loader =====

  let ssLoading = null;

  function ensureSelfieSegmentation() {
    if (window.SelfieSegmentation) return Promise.resolve();
    if (ssLoading) return ssLoading;

    ssLoading = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1/selfie_segmentation.js";
      script.onerror = () => reject(new Error("failed-to-load-mediapipe"));

      script.onload = () => {
        let waited = 0;
        const tick = () => {
          if (window.SelfieSegmentation) return resolve();
          waited += 50;
          if (waited > 3000)
            return reject(new Error("mediapipe-global-missing"));
          setTimeout(tick, 50);
        };
        tick();
      };

      document.head.appendChild(script);
    });

    return ssLoading;
  }

  const withTimeout = (p, ms = 15000) =>
    new Promise((res, rej) => {
      const t = setTimeout(() => rej(new Error("segmentation-timeout")), ms);
      p.then((v) => {
        clearTimeout(t);
        res(v);
      }).catch((e) => {
        clearTimeout(t);
        rej(e);
      });
    });

  async function getSegmentationMask(img) {
    await ensureSelfieSegmentation();

    const NS = window.SelfieSegmentation;
    const Ctor = NS && NS.SelfieSegmentation ? NS.SelfieSegmentation : NS;

    if (typeof Ctor !== "function")
      throw new Error("SelfieSegmentation constructor not found");

    const ss = new Ctor({
      locateFile: (f) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1/${f}`
    });

    if (ss.setOptions) ss.setOptions({ modelSelection: 1 });

    if (ss.initialize) {
      try {
        await ss.initialize();
      } catch {}
    }

    const maxSide = 1024;
    const iw = img.width;
    const ih = img.height;

    const scale = Math.min(1, maxSide / Math.max(iw, ih));
    let src = img;

    if (scale < 1) {
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(iw * scale));
      c.height = Math.max(1, Math.round(ih * scale));
      const cx = c.getContext("2d");
      cx.imageSmoothingEnabled = true;
      cx.imageSmoothingQuality = "high";
      cx.drawImage(img, 0, 0, c.width, c.height);
      src = c;
    }

    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = iw;
    maskCanvas.height = ih;

    await withTimeout(
      new Promise((resolve, reject) => {
        if (ss.onResults) {
          ss.onResults((r) => {
            try {
              const mctx = maskCanvas.getContext("2d");
              mctx.clearRect(0, 0, iw, ih);
              mctx.drawImage(
                r.segmentationMask,
                0,
                0,
                src.width || iw,
                src.height || ih,
                0,
                0,
                iw,
                ih
              );
              resolve();
            } catch (e) {
              reject(e);
            }
          });
        }

        const maybe = ss.send ? ss.send({ image: src }) : null;
        if (maybe && maybe.then) maybe.catch(reject);
      }),
      15000
    );

    if (ss.close) {
      try {
        ss.close();
      } catch {}
    }

    return maskCanvas;
  }

  // ===== Cutout compositing =====

  async function drawCutoutToCanvas(img, maskCanvas, bgSrc = null) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (bgSrc) {
      const bg = await loadImage(bgSrc);
      const s1 = Math.max(
        canvas.width / bg.width,
        canvas.height / bg.height
      );
      const bw = bg.width * s1;
      const bh = bg.height * s1;
      ctx.drawImage(bg, (canvas.width - bw) / 2, (canvas.height - bh) / 2, bw, bh);
    } else {
      drawChecker();
    }

    const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
    const sw = img.width * scale;
    const sh = img.height * scale;
    const dx = (canvas.width - sw) / 2;
    const dy = (canvas.height - sh) / 2;

    const mC = document.createElement("canvas");
    mC.width = sw;
    mC.height = sh;
    const mctx = mC.getContext("2d");
    mctx.drawImage(maskCanvas, 0, 0, img.width, img.height, 0, 0, sw, sh);

    const subj = document.createElement("canvas");
    subj.width = sw;
    subj.height = sh;
    const sctx = subj.getContext("2d");
    sctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, sw, sh);
    sctx.globalCompositeOperation = "destination-in";
    sctx.drawImage(mC, 0, 0);
    sctx.globalCompositeOperation = "source-over";

    ctx.drawImage(subj, dx, dy);
  }

  return {
    setPhoto,
    setBg,
    onDrop: (e) => {
      e.preventDefault();
      const f = e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) PhotoStudio.onUploadMain(f);
    },
    onUploadMain: async (file) => {
      const src = await readFileToDataURL(file);
      if (!src) return;
      setPhoto(src);
      setStatus("Choose an action below.");
    },
    onUploadBg: async (file) => {
      const src = await readFileToDataURL(file);
      if (!src) return;
      setBg(src);
    },
    removeBackground: async () => {
      if (!state.photoSrc) return;
      try {
        setBusy(true);
        setStatus("Removing background…");
        const img = await loadImage(state.photoSrc);
        const mask = await getSegmentationMask(img);
        await drawCutoutToCanvas(img, mask, null);
        setStatus("Done.");
      } catch {
        alert("Background removal failed.");
      } finally {
        setBusy(false);
      }
    },
    changeBackground: async () => {
      if (!state.photoSrc) return;
      if (!state.bgSrc) {
        document.getElementById("bgInput").click();
        setStatus("Choose a background image…");
        return;
      }
      try {
        setBusy(true);
        setStatus("Compositing…");
        const img = await loadImage(state.photoSrc);
        const mask = await getSegmentationMask(img);
        await drawCutoutToCanvas(img, mask, state.bgSrc);
        setStatus("Done.");
      } catch {
        alert("Change background failed.");
      } finally {
        setBusy(false);
      }
    },

    // ===== Export / Downloads =====

    downloadPreview: () => {
      canvas.toBlob(
        (b) => {
          if (!b) return;
          downloadBlob(b, "photo-studio-preview.png");
        },
        "image/png",
        0.95
      );
    },

    downloadHD: async (as = "png") => {
      setBusy(true);
      setStatus("Preparing HD export…");

      try {
        const blob = await exportFullRes(as);
        if (!blob) return;

        const ext = as === "jpeg" ? "jpg" : "png";
        downloadBlob(blob, `photo-studio-hd.${ext}`);

        setStatus("Saved HD image.");
      } finally {
        setBusy(false);
      }
    },

    shareHD: async () => {
      try {
        setBusy(true);
        setStatus("Preparing share…");

        const blob = await exportFullRes("png");
        if (!blob) return;

        const file = new File([blob], "photo-studio.png", {
          type: "image/png"
        });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "AI Photo Studio"
          });
        } else {
          downloadBlob(blob, "photo-studio.png");
        }

        setStatus("Done.");
      } catch {
        alert("Share failed.");
      } finally {
        setBusy(false);
      }
    },

    // ===== Diagnostics =====
    runDiagnostics: async () => {
      try {
        setBusy(true);
        setStatus("Diagnostics: loading model…");

        const c = document.createElement("canvas");
        c.width = 256;
        c.height = 256;
        const cx = c.getContext("2d");
        cx.fillStyle = "#fff";
        cx.fillRect(0, 0, 256, 256);
        cx.fillStyle = "#000";
        cx.beginPath();
        cx.arc(128, 128, 64, 0, Math.PI * 2);
        cx.fill();

        const img = new Image();
        img.src = c.toDataURL();

        await (img.decode
          ? img.decode()
          : new Promise((r) => (img.onload = r)));

        const mask = await withTimeout(getSegmentationMask(img), 15000);

        setStatus(mask && mask.width ? "Diagnostics OK" : "Diagnostics: mask empty");
      } catch (e) {
        setStatus("Diagnostics failed: " + (e && e.message ? e.message : "error"));
      } finally {
        setBusy(false);
      }
    }
  };

  // ===== Export full resolution image =====
  async function exportFullRes(format = "png", quality = 0.95) {
    if (!state.photoSrc) return null;

    const img = await loadImage(state.photoSrc);
    const mask = await getSegmentationMask(img);

    const iw = img.width;
    const ih = img.height;

    const out = document.createElement("canvas");
    out.width = iw;
    out.height = ih;

    const octx = out.getContext("2d");

    // Background
    if (state.bgSrc) {
      const bg = await loadImage(state.bgSrc);
      const scale = Math.max(iw / bg.width, ih / bg.height);
      const bw = Math.round(bg.width * scale);
      const bh = Math.round(bg.height * scale);
      octx.drawImage(bg, Math.round((iw - bw) / 2), Math.round((ih - bh) / 2), bw, bh);
    } else {
      octx.clearRect(0, 0, iw, ih);
    }

    // Foreground subject
    const subj = document.createElement("canvas");
    subj.width = iw;
    subj.height = ih;
    const sctx = subj.getContext("2d");

    sctx.drawImage(img, 0, 0, iw, ih);
    sctx.globalCompositeOperation = "destination-in";
    sctx.drawImage(mask, 0, 0, iw, ih);
    sctx.globalCompositeOperation = "source-over";

    octx.drawImage(subj, 0, 0);

    return await new Promise((resolve) => {
      const mime = format === "jpeg" ? "image/jpeg" : "image/png";
      out.toBlob((b) => resolve(b), mime, quality);
    });
  }

  // ===== Util: Blob downloader =====
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  // Initialise checkerboard on startup
  drawChecker();

  return PhotoStudio;
})();
    
    
