'use client';

import { useState } from 'react';
import styles from './page.module.css';

export default function Home() {
  const [referenceImg, setReferenceImg] = useState<string | null>(null);
  const [avatarImg, setAvatarImg] = useState<string | null>(null);
  const [bagImg, setBagImg] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImg, setGeneratedImg] = useState<string | null>(null);

  // Settings
  const [quality, setQuality] = useState<'2K' | '4K'>('2K');

  // Saved Items
  const [savedAvatars, setSavedAvatars] = useState<string[]>([]);
  const [savedBags, setSavedBags] = useState<string[]>([]);

  // Batch Generation States
  const [baseAnalysisJson, setBaseAnalysisJson] = useState<any>(null);
  const [showJson, setShowJson] = useState(false);
  const [batchReferences, setBatchReferences] = useState<string[]>([]);
  const [batchResults, setBatchResults] = useState<{ url: string | null; status: 'loading' | 'done' | 'error'; errorMsg?: string }[]>([]);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string | null>>, listSetter?: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const b64 = reader.result as string;
        setter(b64);
        if (listSetter) {
          listSetter(prev => {
            if (!prev.includes(b64)) return [b64, ...prev];
            return prev;
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBatchUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setBatchReferences(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          referenceBase64: referenceImg,
          avatarBase64: avatarImg,
          bagBase64: bagImg,
          quality: quality,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ocurrió un error al generar la imagen.');
      }

      setGeneratedImg(data.generatedImage);
      if (data.analysisJson) {
        setBaseAnalysisJson(data.analysisJson);
      }

      if (data.message) {
        alert(data.message);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBatchGenerate = async () => {
    if (batchReferences.length === 0 || !baseAnalysisJson || !avatarImg || !bagImg) return;
    setIsBatchGenerating(true);

    // Initialize results
    const initialResults = batchReferences.map(() => ({ url: null, status: 'loading' as const }));
    setBatchResults(initialResults);

    for (let i = 0; i < batchReferences.length; i++) {
      try {
        const response = await fetch('/api/generate-variation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            referenceBase64: batchReferences[i],
            avatarBase64: avatarImg,
            bagBase64: bagImg,
            quality: quality,
            baseAnalysis: baseAnalysisJson
          }),
        });
        const data = await response.json();

        setBatchResults(prev => {
          const updated = [...prev];
          if (!response.ok) {
            updated[i] = { url: null, status: 'error', errorMsg: data.error };
          } else {
            updated[i] = { url: data.generatedImage, status: 'done' };
          }
          return updated;
        });

      } catch (err: any) {
        setBatchResults(prev => {
          const updated = [...prev];
          updated[i] = { url: null, status: 'error', errorMsg: err.message };
          return updated;
        });
      }
    }

    setIsBatchGenerating(false);
  };

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className="title">
          Creador de Posts <span className="text-gradient">Instagram</span>
        </h1>
        <p className={styles.subtitle}>
          Combina tu avatar, bolso y entorno con el poder visual de Nano Banana Pro para crear contenido hiperrealista.
        </p>
      </header>

      <div className={styles.dashboard}>
        {/* PANEL IZQUIERDO: CONTROLES */}
        <section className={`glass-panel ${styles.column} animate-fade-in`}>
          <h2 className={styles.panelTitle}>⚙️ Assets Base</h2>

          <div className={styles.uploadGroup}>
            <span className={styles.uploadLabel}>1. Imagen de Referencia</span>
            <span className={styles.uploadHelp}>Define la pose y el entorno para la escena.</span>
            <div className="upload-area">
              <input type="file" accept="image/*" onChange={(e) => handleUpload(e, setReferenceImg)} />
              {referenceImg ? (
                <img src={referenceImg} alt="Reference" className={styles.previewImage} />
              ) : (
                <p>Arrástra tu imagen o haz click</p>
              )}
            </div>
          </div>

          <div className={styles.uploadGroup}>
            <span className={styles.uploadLabel}>2. Tu Avatar</span>
            <span className={styles.uploadHelp}>El rostro e identidad visual de la modelo.</span>
            <div className="upload-area">
              <input type="file" accept="image/*" onChange={(e) => handleUpload(e, setAvatarImg, setSavedAvatars)} />
              {avatarImg ? (
                <img src={avatarImg} alt="Avatar" className={styles.previewImage} />
              ) : (
                <p>Sube la foto del avatar</p>
              )}
            </div>
            {/* Histórico Avatares */}
            {savedAvatars.length > 0 && (
              <div className={styles.thumbnailGallery}>
                {savedAvatars.map((av, idx) => (
                  <img
                    key={idx}
                    src={av}
                    className={avatarImg === av ? styles.thumbnailActive : styles.thumbnail}
                    onClick={() => setAvatarImg(av)}
                    alt="avatar saved"
                  />
                ))}
              </div>
            )}
          </div>

          <div className={styles.uploadGroup}>
            <span className={styles.uploadLabel}>3. El Bolso (Producto)</span>
            <span className={styles.uploadHelp}>La imagen limpia del producto a publicitar.</span>
            <div className="upload-area">
              <input type="file" accept="image/*" onChange={(e) => handleUpload(e, setBagImg, setSavedBags)} />
              {bagImg ? (
                <img src={bagImg} alt="Bolso" className={styles.previewImage} />
              ) : (
                <p>Sube el bolso principal</p>
              )}
            </div>
            {/* Histórico Bolsos */}
            {savedBags.length > 0 && (
              <div className={styles.thumbnailGallery}>
                {savedBags.map((bg, idx) => (
                  <img
                    key={idx}
                    src={bg}
                    className={bagImg === bg ? styles.thumbnailActive : styles.thumbnail}
                    onClick={() => setBagImg(bg)}
                    alt="bolso saved"
                  />
                ))}
              </div>
            )}
          </div>

          <div className={styles.uploadGroup}>
            <span className={styles.uploadLabel}>Calidad de Salida & Formato</span>
            <span className={styles.uploadHelp}>Las imágenes siempre serán en formato vertical (9:16).</span>
            <select className="glass-input" value={quality} onChange={(e) => setQuality(e.target.value as '2K' | '4K')}>
              <option style={{ color: 'black' }} value="2K">2K (Rápido, 1440x2560)</option>
              <option style={{ color: 'black' }} value="4K">4K (Alta Definición, 2160x3840)</option>
            </select>
          </div>

          <button
            className={`primary-button ${styles.actions}`}
            onClick={handleGenerate}
            disabled={!referenceImg || !avatarImg || !bagImg || isGenerating}
            style={{ opacity: (!referenceImg || !avatarImg || !bagImg || isGenerating) ? 0.5 : 1 }}
          >
            {isGenerating ? 'Generando Magia...' : '💫 Generar Nueva Imagen'}
          </button>
        </section>

        {/* PANEL DERECHO: RESULTADOS */}
        <section className={`glass-panel ${styles.column} animate-fade-in`} style={{ animationDelay: '0.2s' }}>
          <h2 className={styles.panelTitle}>✨ Resultado Final</h2>

          <div className={styles.resultArea}>
            {generatedImg ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '1rem' }}>
                <img src={generatedImg} alt="Generada" className={styles.previewImage} style={{ height: 'auto', maxHeight: '400px', cursor: 'zoom-in' }} onClick={() => setFullScreenImage(generatedImg)} />
                <a
                  href={generatedImg}
                  download="creador_instagram_resultado.jpg"
                  className="glass-button"
                  style={{ textDecoration: 'none', width: 'auto' }}
                >
                  📥 Descargar Imagen
                </a>
              </div>
            ) : (
              <>
                {isGenerating ? (
                  <div className={styles.spinner}></div>
                ) : (
                  <div className={styles.placeholderIcon}>✦</div>
                )}
                <h3>{isGenerating ? 'Creando composición...' : 'Esperando composición...'}</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  {isGenerating ? 'Nano Banana Pro está procesando tu solicitud...' : 'Sube los 3 assets y haz click en generar para invocar la API de Nano Banana.'}
                </p>
              </>
            )}
          </div>

          {baseAnalysisJson && (
            <div className={styles.videoSection}>
              <h2 className={styles.panelTitle}>📂 Variaciones en Masa</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                Estética base guardada. Sube nuevas referencias para forzar la pose manteniendo el estilo actual.
              </p>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <button onClick={() => setShowJson(!showJson)} className="glass-button" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
                  {showJson ? 'Ocultar JSON Base' : '👁️ Ver JSON Base Extraído'}
                </button>
              </div>

              {showJson && (
                <pre style={{ background: 'rgba(0,0,0,0.5)', padding: '1rem', borderRadius: '8px', fontSize: '0.75rem', overflowX: 'auto', marginBottom: '1.5rem', border: '1px solid var(--border-glass)' }}>
                  {JSON.stringify(baseAnalysisJson, null, 2)}
                </pre>
              )}

              <div className={styles.uploadGroup}>
                <span className={styles.uploadLabel}>Nuevas Poses (Multiselección)</span>
                <div className="upload-area">
                  <input type="file" accept="image/*" multiple onChange={handleBatchUpload} />
                  <p>Sube Múltiples Imágenes (N fotos)</p>
                </div>
              </div>

              {batchReferences.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <span className={styles.uploadLabel}>{batchReferences.length} imagen(es) listas:</span>
                  <div className={styles.thumbnailGallery}>
                    {batchReferences.map((ref, i) => (
                      <img key={i} src={ref} className={styles.thumbnail} alt={`batch ref ${i}`} />
                    ))}
                  </div>
                </div>
              )}

              <button
                className={`primary-button`}
                style={{ width: '100%', opacity: (batchReferences.length === 0 || isBatchGenerating) ? 0.5 : 1 }}
                disabled={batchReferences.length === 0 || isBatchGenerating}
                onClick={handleBatchGenerate}
              >
                {isBatchGenerating ? '⚙️ Procesando variaciones...' : `⚡ Generar ${batchReferences.length} Variaciones`}
              </button>

              {/* Respuestas del batch */}
              {batchResults.length > 0 && (
                <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <h3 className={styles.panelTitle} style={{ fontSize: '1.2rem' }}>Resultados del Lote:</h3>
                  {batchResults.map((res, i) => (
                    <div key={i} style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                      <p style={{ marginBottom: '1rem', fontWeight: 600 }}>Variación #{i + 1}</p>
                      {res.status === 'loading' && <div className={styles.spinner} style={{ width: '30px', height: '30px', borderWidth: '3px' }}></div>}
                      {res.status === 'error' && <p style={{ color: 'red' }}>Error: {res.errorMsg}</p>}
                      {res.status === 'done' && res.url && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                          <img src={res.url} alt={`Resultado ${i}`} style={{ width: '100%', borderRadius: '8px', maxHeight: '400px', objectFit: 'contain', background: 'black', cursor: 'zoom-in' }} onClick={() => setFullScreenImage(res.url)} />
                          <a href={res.url} download={`creador_instagram_batch_${i}.jpg`} className="glass-button" style={{ textDecoration: 'none' }}>
                            📥 Descargar Variación
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}
        </section>
      </div>

      {/* Fullscreen Overlay */}
      {fullScreenImage && (
        <div className={styles.fullscreenOverlay} onClick={() => setFullScreenImage(null)}>
          <img src={fullScreenImage} alt="Fullscreen view" className={styles.fullscreenImage} />
        </div>
      )}
    </main>
  );
}
