# Administración Cleoh

## Decisión: admin propio, no CMS (Sanity / Contentful)

| Opción | Veredicto |
|--------|-----------|
| **Admin Next.js + Supabase** | **Elegido** — productos, variantes, stock, pedidos, cupones, subida a R2 |
| Sanity / otro CMS headless | Fuera de alcance día 1 — útil si el copy/marketing crece mucho |
| Solo Google Sheets | Frágil para stock, pedidos y pagos |

La tienda sigue siendo romántica (Tailwind + marca). El panel `/admin` es **utilitario** (luego shadcn/ui).

## Quién edita qué

| Área | Dónde |
|------|--------|
| Productos, fotos, tallas, stock | `/admin/productos` → Postgres + R2 |
| Pedidos / fulfillment | `/admin/pedidos` |
| Cupones | `/admin/cupones` |
| Categorías / home tiles | `/admin/categorias` |
| Imagen del hero (landing) | `/admin/apariencia` → `site_settings.hero_image_url` |
| Textos de marca (tagline, redes) | Por ahora `src/data/site.ts` → luego más keys en `site_settings` |

## Auth

1. Supabase Auth (email/password).
2. `profiles.role = 'admin'`.
3. Middleware protege `/admin/*` (excepto `/admin/login`).
4. Server Actions usan el cliente con sesión; operaciones sensibles pueden usar service role solo en servidor.

## Orden de integración sugerido

1. ~~Esqueleto tienda~~  
2. **Schema Supabase + panel admin (este paso)**  
3. Conectar proyecto Supabase real + primer usuario admin  
4. CRUD productos + upload R2  
5. Tienda lee de Supabase (quitar seed estático)  
6. Carrito + Mercado Pago + pedidos en admin  
7. Cupones + Resend  

## Local

```bash
# Cuando tengas proyecto Supabase:
# 1. Copia .env.example → .env.local
# 2. Aplica supabase/migrations/20260320100000_initial.sql
# 3. Crea usuario en Auth y pon role = admin en profiles
```

El panel actual funciona en **modo demo** (datos mock) hasta conectar Supabase.
