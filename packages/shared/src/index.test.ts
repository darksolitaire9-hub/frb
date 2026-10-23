import { describe, it, expect } from 'vitest';
import {
  LayeredDocumentSchema,
  calculateProxyScale,
  masterToProxyRect,
  type LayeredDocument,
} from './index.js';

describe('LayeredDocumentSchema', () => {
  it('validates a correct document with raster and text layers', () => {
    const validDoc: LayeredDocument = {
      schemaVersion: 1,
      id: 'doc-123',
      width: 4000,
      height: 3000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      layers: [
        {
          id: 'layer-bg',
          name: 'Background',
          kind: 'raster',
          role: 'background',
          visible: true,
          locked: true,
          opacity: 1,
          masterKey: 'masters/bg.png',
          proxyKey: 'proxies/bg.png',
          bounds: { x: 0, y: 0, width: 4000, height: 3000 },
          transform: { x: 0, y: 0, scale: 1, rotation: 0 },
        },
        {
          id: 'layer-text-1',
          name: 'Title Text',
          kind: 'text',
          text: 'SUMMER SALE',
          font: 'Inter',
          size: 72,
          color: '#ffffff',
          align: 'center',
          box: { x: 500, y: 400, width: 1200, height: 160 },
          confidence: 0.98,
          visible: true,
          locked: false,
          opacity: 1,
          transform: { x: 0, y: 0, scale: 1, rotation: 0 },
        },
      ],
    };

    const parsed = LayeredDocumentSchema.safeParse(validDoc);
    expect(parsed.success).toBe(true);
  });

  it('rejects an invalid hex color in text layer', () => {
    const invalidDoc = {
      schemaVersion: 1,
      id: 'doc-invalid',
      width: 1000,
      height: 1000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      layers: [
        {
          id: 'layer-t',
          name: 'Text',
          kind: 'text',
          text: 'Hello',
          size: 24,
          color: 'red', // Not a valid hex!
          box: { x: 0, y: 0, width: 100, height: 30 },
        },
      ],
    };

    const parsed = LayeredDocumentSchema.safeParse(invalidDoc);
    expect(parsed.success).toBe(false);
  });

  it('correctly computes proxy scale factor for downscaling', () => {
    // 8000x6000 image downscaled to max 2048
    const scale = calculateProxyScale(8000, 6000, 2048);
    expect(scale).toBe(2048 / 8000); // 0.256

    const masterBox = { x: 1000, y: 500, width: 2000, height: 1500 };
    const proxyBox = masterToProxyRect(masterBox, scale);
    expect(proxyBox.x).toBe(256);
    expect(proxyBox.width).toBe(512);
  });
});
