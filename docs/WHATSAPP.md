# WhatsApp — asistente automático (plan mínimo, $0 Meta)

Guía para conectar el bot de menú en Cleoh. Solo responde cuando el cliente escribe primero (mensajes de servicio gratis en ventana de 24 h).

## 1. Meta Business

1. Crea o usa tu [Meta Business Suite](https://business.facebook.com/).
2. En [developers.facebook.com](https://developers.facebook.com/) → **Crear app** → tipo **Negocio**.
3. Agrega el producto **WhatsApp** → **API Setup**.
4. Vincula un número (puede ser el de WhatsApp Business; sigue los pasos de Meta).
5. Anota:
   - **Phone number ID**
   - **Temporary access token** (luego genera uno permanente en Business Settings → System Users, recomendado para producción)

## 2. Webhook en Cleoh

URL de callback (producción):

```
https://lenceriacleoh.com/api/webhooks/whatsapp
```

En Meta → WhatsApp → Configuration → Webhook:

| Campo | Valor |
|-------|--------|
| Callback URL | URL de arriba |
| Verify token | El mismo que `WHATSAPP_VERIFY_TOKEN` en Vercel |
| Campos suscritos | `messages` |

Meta hará un GET de verificación; Cleoh debe tener las env vars ya guardadas antes de pulsar **Verify**.

## 3. Variables en Vercel

| Variable | Ejemplo | Notas |
|----------|---------|--------|
| `WHATSAPP_ACCESS_TOKEN` | Token permanente | System User |
| `WHATSAPP_PHONE_NUMBER_ID` | `1234567890` | API Setup |
| `WHATSAPP_VERIFY_TOKEN` | string largo aleatorio | Tú lo inventas |
| `WHATSAPP_APP_SECRET` | De la app Meta | Valida firma del webhook |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `5215512345678` | 52 + 10 dígitos, sin + |
| `WHATSAPP_GRAPH_VERSION` | `v22.0` | Opcional |

Después de guardar → **Redeploy** en Vercel.

## 4. Probar

1. Abre la tienda y pulsa el botón verde **WhatsApp**.
2. Escribe `hola` → debe llegar el menú 1–7.
3. Escribe `2` → guía de tallas con link.

Logs en Vercel → Functions si algo falla.

## 5. Costo

- Respuestas dentro de 24 h al mensaje del cliente: **$0** (categoría servicio).
- No usamos plantillas de marketing en este bot.
- Solo pagarías Meta si más adelante mandan plantillas proactivas (pedido enviado, etc.).

## 6. Menú del bot

1. Cómo comprar  
2. Guía de tallas  
3. Envíos y envío gratis  
4. Cupón CLEOH10  
5. Cambios y devoluciones  
6. Ya pagué / mi pedido  
7. Ver la tienda  

Textos editables en `src/lib/whatsapp/messages.ts`.
