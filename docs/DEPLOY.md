# Deploy Cleoh en Vercel

## Antes de subir

1. Build local: `npm run build`
2. Migraciones Supabase aplicadas en el proyecto de prod
3. Credenciales listas (ver tabla abajo)
4. PayPal: cambia a **Live** cuando cobres de verdad (`api-m.paypal.com` + Client ID live)
5. Resend: verifica el dominio y usa `EMAIL_FROM` con ese dominio

## Variables en Vercel

Project → **Settings → Environment Variables** (Production + Preview si quieres).

| Variable | Notas |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo server |
| `NEXT_PUBLIC_SITE_URL` | `https://tu-dominio.vercel.app` o dominio custom (sin `/` final) |
| `MP_ACCESS_TOKEN` | Prod: `APP_USR-…` |
| `NEXT_PUBLIC_MP_PUBLIC_KEY` | Prod: `APP_USR-…` |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | Live cuando salgas de sandbox |
| `PAYPAL_CLIENT_SECRET` | Live cuando salgas de sandbox |
| `PAYPAL_API_BASE` | Sandbox: `https://api-m.sandbox.paypal.com` · Live: `https://api-m.paypal.com` |
| `R2_ACCOUNT_ID` | |
| `R2_ACCESS_KEY_ID` | |
| `R2_SECRET_ACCESS_KEY` | |
| `CLOUDFLARE_API_TOKEN` | |
| `R2_BUCKET` | |
| `R2_PUBLIC_BASE_URL` | URL pública del bucket |
| `RESEND_API_KEY` | |
| `EMAIL_FROM` | Ej. `Cleoh <pedidos@pedidos.lenceriacleoh.com>` (dominio verificado en Resend) |
| `CRON_SECRET` | Auto en Vercel para `/api/cron/abandoned-cart` (carrito abandonado) |
| `ORDER_NOTIFY_EMAIL` | Inbox de la tienda |
| `VERCEL_TOKEN` | Token **personal** (`vcp_…`) para tráfico en `/admin/analiticas`. [Crear aquí](https://vercel.com/account/tokens). No uses tokens `vca_` de Sign in with Vercel. |
| `VERCEL_PROJECT_ID` | `prj_3jV3lCl9BBojqiFMCp72i9kdpBMJ` (proyecto cleoh) |
| `VERCEL_TEAM_ID` | `team_Fe3Ld4xrAgFma4ZNRHycwgUM` |

Después del primer deploy, actualiza `NEXT_PUBLIC_SITE_URL` con la URL real y **redeploy** (webhooks MP y links de correo lo usan).

## CLI

```bash
# Login (una vez)
vercel login

# Link del proyecto (primera vez)
vercel link

# Deploy a producción
vercel --prod
```

O conecta el repo en [vercel.com/new](https://vercel.com/new) y deja que cada push a `main` despliegue.

## Post-deploy

- [ ] Abrir la URL y revisar home / tienda / ficha
- [ ] Login admin `/admin`
- [ ] Carrito → checkout → PayPal (sandbox o live)
- [ ] Checkout Mercado Pago
- [ ] Aplicar cupón
- [ ] Marcar pedido enviado y confirmar correo de rastreo
- [ ] En panel MP: URL de notificación `https://TU_DOMINIO/api/webhooks/mercadopago` (también se manda en la preferencia vía `NEXT_PUBLIC_SITE_URL`)
