# Staging dağıtım notları

## Ortam değişkenleri

Sunucu (`apps/server/.env`):

- `DATABASE_URL` — PostgreSQL bağlantısı
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — uzun, rastgele
- `CORS_ORIGIN` — örn. `https://app.example.com`
- `PORT` — örn. `4000`
- `GOOGLE_MAPS_API_KEY` — isteğe bağlı

İstemci build (üretim):

- Varsayılan: aynı origin üzerinden `/api` ters vekil (önerilir). Ayrı API alan adı kullanıyorsanız `VITE_API_URL` ile tam taban URL verin.

## TLS (NFR-01)

Üretimde API ve web için HTTPS zorunludur. Örnek seçenekler:

1. **Tek sunucu**: Caddy veya nginx ile web statik dosyaları servis edin; `/api` yolunu Node sürecine yönlendirin. Let’s Encrypt otomatik sertifika (Caddy `reverse_proxy`).
2. **Ayrı hostlar**: API `api.example.com`, web `app.example.com`; CORS’ta web origin’i tanımlayın.

## Veritabanı migrasyonu

```bash
npm run db:migrate -w apps/server
```

## Gözlemlenebilirlik

- Uygulama stdout günlüğü; üretimde log toplayıcıya yönlendirin.
- İsteğe bağlı: OpenTelemetry veya basit `requestId` middleware (ileri faz).
