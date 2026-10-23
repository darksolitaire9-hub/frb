import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { LayeredDocumentSchema } from '@frb/shared';

export interface Env {
  // Bindings for R2, D1 and AI will be injected here
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'frb-layer-worker',
  });
});

app.post('/api/validate-doc', async (c) => {
  try {
    const body = await c.req.json();
    const result = LayeredDocumentSchema.safeParse(body);
    if (!result.success) {
      return c.json({ ok: false, errors: result.error.errors }, 400);
    }
    return c.json({ ok: true, docId: result.data.id });
  } catch (err) {
    return c.json({ ok: false, message: 'Invalid JSON payload' }, 400);
  }
});

export default app;
