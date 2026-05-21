# Towit (MVP)

Çekici eşleştirme web uygulaması: **Vite + React** istemci, **Node.js + TypeScript + Express** API, **PostgreSQL** veri tabanı. Ayrıntılı ürün kararları: [docs/MVP_SCOPE.md](docs/MVP_SCOPE.md).

## Gereksinimler

- Node.js 20+
- Docker (PostgreSQL için)

## Docker Compose ile tam sistem (web + server + db)

Tek komutla tum servisleri kaldirmak icin:

```powershell
npm run docker:up
```

Servisler:
- Web: http://localhost:5173
- API: http://localhost:4000
- DB: localhost:5432

Durdurmak icin:

```powershell
npm run docker:down
```

Log izlemek icin:

```powershell
npm run docker:logs
```

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

## Manuel Test Rehberi (Docker-first)

Asagidaki adimlarla tum sistemi dogrulayabilirsiniz.

1. Sistemi kaldir:

```powershell
npm run docker:up
```

2. Saglik kontrolu:

- Web: `http://localhost:5173`
- API: `http://localhost:4000/health`

3. Uygulama akis testi:

- `customer` ve `operator` hesaplari olusturun (veya demo hesaplari kullanin).
- Operator profili doldurun:
  - arac tipi
  - tarife
  - servis merkezi
  - aktif/pasif
- Customer tarafinda:
  - cekim + varis konumu secin
  - operator arayin
  - talep olusturun
- Operator tarafinda:
  - isi kabul edin
  - `en_route` durumuna gecin
  - isi tamamlayin
- Customer tarafinda:
  - durum gecisini ve gecmisi kontrol edin
  - tamamlanan is icin degerlendirme girin

4. Otomatik kalite kapilari:

```powershell
npm run qc
npm run qa
```

5. Log inceleme:

```powershell
npm run docker:logs
```

6. Sistemi kapat:

```powershell
npm run docker:down
```

Tum kalite kapilarini tek komutta calistirmak icin:

```powershell
npm run qa
```

Kabul kontrol listesi: [docs/ACCEPTANCE_CHECKLIST.md](docs/ACCEPTANCE_CHECKLIST.md).

## CI/CD (GitHub Actions)

Proje iki workflow ile otomatiklestirildi:

- `CI` (`.github/workflows/ci.yml`)
  - Test piramidi katmanlari:
    1. Static checks (typecheck + web lint)
    2. Unit tests (server + web Vitest)
    3. Integration tests (PostgreSQL service + migration + API smoke)
    4. System smoke (docker compose ile web+server+db)
  - En sonda monorepo build dogrulamasi yapar.

- `CD` (`.github/workflows/cd.yml`)
  - `main` branch'te basarili `CI` sonrasinda tetiklenir.
  - `Dockerfile.server` ve `Dockerfile.web` image'larini `ghcr.io`'ya publish eder.
  - Istenirse `workflow_dispatch` ile manuel de calistirilabilir.

## Staging / TLS

Özet: [docs/STAGING.md](docs/STAGING.md).
