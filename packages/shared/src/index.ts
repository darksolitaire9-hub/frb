import { z } from 'zod';

/**
 * 2D Bounding Box in Master pixel space.
 */
export const RectSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
});
export type Rect = z.infer<typeof RectSchema>;

/**
 * 2D Affine transform relative to layer initial bounds.
 */
export const TransformSchema = z.object({
  x: z.number().default(0),
  y: z.number().default(0),
  scale: z.number().positive().default(1),
  rotation: z.number().default(0), // in degrees
});
export type Transform = z.infer<typeof TransformSchema>;

/**
 * Common attributes for all layers.
 */
const BaseLayerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  visible: z.boolean().default(true),
  locked: z.boolean().default(false),
  opacity: z.number().min(0).max(1).default(1),
  transform: TransformSchema.default({ x: 0, y: 0, scale: 1, rotation: 0 }),
});

/**
 * Raster layer: can be the in々painted background or an isolated subject/object.
 */
export const RasterLayerSchema = BaseLayerSchema.extend({
  kind: z.literal('raster'),
  role: z.enum(['background', 'object']),
  masterKey: z.string().min(1), // R2 object key for high-res master
  proxyKey: z.string().min(1),  // R2 object key for web editor proxy (<=2048px)
  bounds: RectSchema,
});
export type RasterLayer = z.infer<typeof RasterLayerSchema>;

/**
 * Live editable text layer.
 */
export const TextLayerSchema = BaseLayerSchema.extend({
  kind: z.literal('text'),
  text: z.string(),
  font: z.string().default('Inter'),
  size: z.number().positive(),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, 'Invalid hex color').default('#000000'),
  align: z.enum(['left', 'center', 'right']).default('left'),
  box: RectSchema,
  confidence: z.number().min(0).max(1).default(1), // Gemini OCR confidence
  fallbackRasterKey: z.string().optional(), // Original pixels cut out from source image
});
export type TextLayer = z.infer<typeof TextLayerSchema>;

/**
 * Discriminated union of all layer types.
 */
export const LayerSchema = z.discriminatedUnion('kind', [
  RasterLayerSchema,
  TextLayerSchema,
]);
export type Layer = z.infer<typeof LayerSchema>;

/**
 * Canonical LayeredDocument: The single source of truth.
 */
export const LayeredDocumentSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  id: z.string().min(1),
  width: z.number().int().positive(),   // Master pixel space width
  height: z.number().int().positive(),  // Master pixel space height
  layers: z.array(LayerSchema).default([]), // Index 0 = Bottom layer
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type LayeredDocument = z.infer<typeof LayeredDocumentSchema>;

/**
 * Calculates scale ratio between Master coordinate space and Proxy display space.
 */
export function calculateProxyScale(masterWidth: number, masterHeight: number, maxProxyDim = 2048): number {
  const maxDim = Math.max(masterWidth, masterHeight);
  if (maxDim <= maxProxyDim) return 1;
  return maxProxyDim / maxDim;
}

/**
 * Converts a rectangle from Master space to Proxy space.
 */
export function masterToProxyRect(rect: Rect, scale: number): Rect {
  return {
    x: Math.round(rect.x * scale),
    y: Math.round(rect.y * scale),
    width: Math.max(1, Math.round(rect.width * scale)),
    height: Math.max(1, Math.round(rect.height * scale)),
  };
}
