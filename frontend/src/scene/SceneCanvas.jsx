import { useEffect, useRef, useState } from 'react';
import { descent } from '../lib/descent.js';
import './scene.css';

/** Cheap capability probe — never keeps the context it opens. */
function webglSupported() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export default function SceneCanvas() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!webglSupported()) {
      setFailed(true);
      return undefined;
    }

    let cancelled = false;
    let engine = null;

    // three is a deferred chunk — the document paints before the scene loads.
    import('./Descent.js')
      .then(({ Descent }) => {
        if (cancelled || !canvasRef.current) return;
        engine = new Descent(canvasRef.current);
        engineRef.current = engine;
        engine.start();
      })
      .catch((err) => {
        console.error('scene failed to start', err);
        if (!cancelled) setFailed(true);
      });

    const onVisibility = () => {
      if (!engineRef.current) return;
      if (document.hidden) engineRef.current.stop();
      else engineRef.current.start();
    };

    const onContextLost = (event) => {
      event.preventDefault();
      engineRef.current?.stop();
      setFailed(true);
    };

    document.addEventListener('visibilitychange', onVisibility);
    const canvas = canvasRef.current;
    canvas?.addEventListener('webglcontextlost', onContextLost);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      canvas?.removeEventListener('webglcontextlost', onContextLost);
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  // Pointer parallax, written straight to the shared store — no re-render.
  useEffect(() => {
    const onMove = (e) => {
      descent.pointerX = (e.clientX / window.innerWidth - 0.5) * 2;
      descent.pointerY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  if (failed) {
    // The document already carries the full palette; without WebGL it simply
    // reads as a styled scrolling site rather than a broken one.
    return <div className="scene scene--fallback" aria-hidden="true" />;
  }

  return (
    <>
      <canvas ref={canvasRef} className="scene" aria-hidden="true" />
      <div className="scene-scrim" aria-hidden="true" />
    </>
  );
}
