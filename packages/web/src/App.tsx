import React, { useRef } from 'react';
import { UploadCloud, Layers, Type, Sparkles, FileImage } from 'lucide-react';
import styles from './App.module.css';

export function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('Selected file for decomposition:', file.name, file.size);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <Layers size={22} color="var(--accent-primary)" />
          <span>FRB Layer Studio</span>
          <span className={styles.brandBadge}>Preview</span>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.headlineGroup}>
          <h1 className={styles.title} id="main-heading">
            Turn Flat Images Into Living Layers
          </h1>
          <p className={styles.subtitle}>
            Upload any flyer, photo, or mock-up. AI breaks it into movable objects, in々painted backgrounds, and editable live text.
          </p>
        </div>

        <div
          className={styles.dropzone}
          onClick={handleSelectClick}
          role="button"
          tabIndex={0}
          aria-label="Upload an image to decompose"
          id="upload-dropzone"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleSelectClick();
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/heic"
            style={{ display: 'none' }}
            onChange={handleFileChange}
            id="file-input"
          />
          <div className={styles.dropzoneIconWrapper}>
            <UploadCloud size={32} />
          </div>
          <div>
            <div className={styles.dropzonePrompt}>Drag & drop your image here</div>
            <div className={styles.dropzoneHint}>Supports PNG, JPG, WebP, HEIC up to 25MB (Paste with Ctrl+V)</div>
          </div>

          <button
            type="button"
            className={styles.uploadButton}
            onClick={(e) => {
              e.stopPropagation();
              handleSelectClick();
            }}
          >
            <UploadCloud size={18} />
            <span>Choose Image</span>
          </button>
        </div>

        <div className={styles.featureGrid}>
          <div className={styles.featureTag}>
            <Type size={14} /> Live Editable Text
          </div>
          <div className={styles.featureTag}>
            <Sparkles size={14} /> Inpainted Clean Background
          </div>
          <div className={styles.featureTag}>
            <Layers size={14} /> Automatic SAM 2.1 Cutouts
          </div>
          <div className={styles.featureTag}>
            <FileImage size={14} /> PSD & TIFF Export
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
