# Towit (MVP)

Çekici eşleştirme web uygulaması: **Vite + React** istemci, **Node.js + TypeScript + Express** API, **PostgreSQL** veri tabanı. Ayrıntılı ürün kararları: [docs/MVP_SCOPE.md](docs/MVP_SCOPE.md).

## Gereksinimler

- Node.js 20+
- Docker (PostgreSQL için)

## Hızlı başlangıç

1. Veritabanını başlatın:

```powershell
docker compose up -d
```

2. Sunucu ortam değişkenleri: [apps/server/.env.example](apps/server/.env.example) dosyasını `apps/server/.env` olarak kopyalayın ve `JWT_*` değerlerini güçlü rastgele dizeler yapın.

3. Migrasyon ve bağımlılıklar:

```powershell
cd /path/to/towit
npm install
npm run db:generate -w apps/server
npm run db:migrate -w apps/server
```

4. Geliştirme (API + web birlikte):

```powershell
npm run dev
```

- Web: http://localhost:5173 ( `/api` → http://localhost:4000 proxy )
- API: http://localhost:4000  
- OpenAPI taslağı: [apps/server/openapi.yaml](apps/server/openapi.yaml)

## Google Maps (isteğe bağlı)

`GOOGLE_MAPS_API_KEY` yalnızca **sunucu** `.env` içinde tutulur. Tanımlı değilse mesafe için **haversine**, yer önerileri için boş liste kullanılır.

## Test

```powershell
npm run test -w apps/server
```

Kabul kontrol listesi: [docs/ACCEPTANCE_CHECKLIST.md](docs/ACCEPTANCE_CHECKLIST.md).

## Staging / TLS

Özet: [docs/STAGING.md](docs/STAGING.md).
