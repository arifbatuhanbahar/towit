# Towit Proje Durumu (Agent Devralma Dokumani)

Bu dokuman, projeyi yeni bir agent'in dogrudan devralabilmesi icin hazirlanmis ayrintili "state" kaydidir.  
Amac: mimariyi, calisma seklini, mevcut ilerlemeyi, acik riskleri ve bir sonraki adimlari tek yerden aktarmak.

---

## 1) Kisa Ozet

- Proje bir **monorepo**: backend (`apps/server`) + frontend (`apps/web`).
- Mimari hedef: **moduler monolith** (mikroservise gecis yok, servis sinirlari netlestiriliyor).
- Calisma modeli: **Docker-first** (`db + server + web` compose ile).
- Harita:
  - Gorsel katman: Leaflet + OpenStreetMap tile.
  - Geocode: Nominatim.
  - Rota: backend tarafinda Google Directions (varsa) -> ORS -> straight fallback.
- Son kritik duzeltmeler:
  - Turkce karakter bozulmasi (mojibake) kaynakli UI metin sorunu data tarafinda tespit edildi.
  - Operator rota akisi, istenen sekilde iki asamali hale getirildi:
    1) cekici -> arac (pickup)
    2) arac -> varis (destination)

---

## 2) Teknoloji Yigini

### Backend (`apps/server`)
- Node.js + TypeScript + Express
- Prisma ORM
- PostgreSQL
- Zod validation
- JWT access + refresh
- Vitest (unit)

### Frontend (`apps/web`)
- React + Vite + TypeScript
- React Leaflet / Leaflet
- Vitest + Testing Library

### DevOps / Kalite
- Docker + Docker Compose
- GitHub Actions CI/CD
- Test piramidi:
  - Static checks
  - Unit tests
  - Integration smoke
  - System smoke (compose)

---

## 3) Monorepo Yapisi

- `apps/server`: API, business logic, Prisma schema/migrations
- `apps/web`: UI, ekranlar, API client, map komponentleri
- `docs`: urun/teknik/kabul dokumanlari
- `.github/workflows`: CI/CD
- `docker-compose.yml`, `Dockerfile.server`, `Dockerfile.web`

---

## 4) Calistirma Runbook (Lokal)

### 4.1 Docker-first (onerilen)
```powershell
npm run docker:up
```

Servisler:
- Web: `http://localhost:5173`
- API: `http://localhost:4000`
- DB: `localhost:5432`

Durdurma / log:
```powershell
npm run docker:logs
npm run docker:down
```

### 4.2 Monorepo scriptleri (root `package.json`)
- `npm run dev` -> server + web birlikte
- `npm run test` -> server + web unit test
- `npm run typecheck`
- `npm run qa` -> typecheck + test + build
- `npm run qc` -> lint(web) + test
- `npm run db:migrate -w apps/server`

---

## 5) Backend Durumu ve Sinirlar

### 5.1 Giris noktasi
- `apps/server/src/index.ts`:
  - `.env` dosyasini server klasorunden yukler.
  - `createApp()` ile app olusturur, `PORT` (varsayilan 4000) dinler.

### 5.2 App wiring
- `apps/server/src/app.ts`:
  - `/health`
  - `/auth`, `/me`, `/cities`, `/places`, `/operators`, `/jobs`, `/directions`, reviews route'lari
  - 404 ve global error middleware
  - Prisma baglanti/schama hazir degil durumlari icin anlamli `503`:
    - `DB_UNAVAILABLE`
    - `DB_NOT_READY`

### 5.3 Is kurali dagitimi (SRP)
Refactor ile kritik is kurallari route dosyalarindan servis dosyalarina alinmis durumda:
- `jobPresentation.ts`
- `jobRouting.ts`
- `jobStateMachine.ts`
- `operatorSearch.ts`
- `authSession.ts`
- `compatibility.ts`

### 5.4 Job durumlari
Prisma `JobStatus`:
- `open`, `accepted`, `en_route`, `completed`, `rejected`, `cancelled`

Not: Bazi eski dokumanlarda `payment_pending` referansi geciyor; kod/schemayla birebir uyumlu degil (dokuman teknik borcu).

---

## 6) Frontend Durumu ve Ekran Mimarisi

### 6.1 Ust seviye shell
- `apps/web/src/App.tsx`
  - Auth yoksa login/register
  - Auth varsa web shell (`WebHeader`, `WebSidebar`, `BottomNav`)
  - Operator rota ekrani tam ekran overlay (`operator_route`)

### 6.2 Ekran ayristirma
- `src/screens/CustomerScreens.tsx`
- `src/screens/OperatorScreens.tsx`

Bu ayrisma ile `App.tsx` kismen sade, ancak hala global state ve screen yonetimi merkezde.

### 6.3 API client
- `apps/web/src/lib/api.ts`
  - Merkezi request wrapper
  - `401` durumunda refresh dene + istegi retry et
  - Refresh basarisizsa logout
  - OSM/Nominatim fonksiyonlari (search + reverse)

---

## 7) Harita ve Rota Durumu (Guncel)

### 7.1 Gorsellestirme
- `MapView.tsx`:
  - OSM tile
  - markerlar (pickup/destination/live)
  - route cizimi
  - disaridan gelen `routePoints` varsa onu cizer; yoksa pickup-destination icin client-side OSRM dener.

### 7.2 Backend rota stratejisi
- `apps/server/src/services/directions.ts`
  - Siralama:
    1) Google Directions (varsa)
    2) ORS (gercek yol agi)
    3) straight fallback
  - Response `source`: `google | osrm | straight`

### 7.3 Operator rota akisi (istenen sekilde duzenlendi)
- `OperatorRoutePage.tsx` artik iki endpoint'e bagli:
  - Faz 1 (`to_pickup`): `GET /jobs/:id/route`
  - Faz 2 (`to_dest`): `GET /jobs/:id/route-to-destination`
- Geolocation ile operator canli konumu route origin olarak kullanilabiliyor.
- "Rotayi yenile" butonu route'u yeniden fetch ediyor.
- UI'da sure/mesafe route response'dan okunuyor.

---

## 8) Veri Modeli Ozet (Prisma)

Kaynak: `apps/server/prisma/schema.prisma`

Temel modeller:
- `User` (role: customer/operator)
- `CustomerProfile`
- `OperatorProfile`
- `Tariff`
- `Job`
- `Review`
- `RefreshToken`

Ek enumlar:
- `VehicleType`
- `BreakdownType`
- `CustomerVehicleCategory`

---

## 9) Test Envanteri

### 9.1 Unit testler
Backend (`apps/server/src`):
- `services/jobStateMachine.test.ts`
- `services/jobRouting.test.ts`
- `services/directions.test.ts`
- `services/geo.test.ts`
- `services/pricing.test.ts`
- `middleware/rateLimit.test.ts`

Frontend (`apps/web/src`):
- `lib/api.test.ts`
- `pages/operator/OperatorRoutePage.test.tsx`

### 9.2 CI katmanlari (`.github/workflows/ci.yml`)
- `Static Checks`: typecheck + web lint
- `Unit Tests`: `npm test`
- `Integration Tests`:
  - Postgres service
  - migration
  - server build/start
  - API smoke (register/login)
- `System Smoke`:
  - `docker compose up --build -d`
  - web + api health check
- `Build Artifacts`: monorepo build

---

## 10) Son Donem Yapilan Kritik Isler

1. Docker-first calisma zinciri netlesti (`docker-compose`, root scriptler, CI smoke).
2. Backend'te SRP odakli bolunme:
   - jobs/operators/auth route'larindan servis katmanina ayrisma.
3. Frontend API client refresh-interceptor mantigi merkezilestirildi.
4. OSM/Nominatim kullanimi tum kritik alanlara tasindi.
5. Rota ekrani:
   - UI kompaktlastirildi (asiri buyuk alt barlar duzeltildi).
   - 2-asamali rota akisi gerceklestirildi.
6. Turkce metin bozulmasi:
   - Bir kayitta bozuk karakter tespit edildi.
   - DB degeri duzeltildi.
   - Profil guncellemede `U+FFFD` (replacement char) kontrolu eklenerek tekrarinin onune gecildi.

---

## 11) Bilinen Riskler ve Teknik Borc

1. **Dokuman uyumsuzluklari**  
   Bazi dokumanlarda eski akis/status referanslari var (`payment_pending` vb.). Kod gercegi ile tam senkron degil.

2. **Rota fallback davranisi**  
   Harici servis hatasinda straight fallback dogru calisma icin gerekli ama UX tarafinda kullaniciya acikca "tahmini/yedek" belirtimi her yerde tutarli olmayabilir.

3. **State yonetimi merkezilesmesi**  
   `App.tsx` hala ekran/state merkezi. Uzun vadede route-state/service-state daha da ayrilabilir.

4. **In-memory limit/cache**  
   Rate-limit ve bazi cacheler process-memory tabanli; yatay olcekte Redis gerekecek.

5. **Genis ve kirli calisma agaci**  
   Repoda birikmis cok sayida degisiklik mevcut; yeni agent file-level dikkatle ilerlemeli.

---

## 12) Yeni Agent Icin Oncelik Sirasi (Oneri)

1. **Dokuman konsolidasyonu**
   - `docs/MVP_SCOPE.md`, `docs/ACCEPTANCE_CHECKLIST.md`, `docs/DESIGN.md` dosyalarini kod gercegiyle senkron et.

2. **Rota UX netlestirme**
   - Faz etiketi: "1/2 Araca gidis", "2/2 Varisa gidis".
   - `source=straight` durumunda belirgin fallback badgesi.

3. **E2E katmani ekleme**
   - Playwright ile kritik flow:
     - login/register
     - operator profil
     - customer job create
     - operator accept -> route -> complete

4. **State yonetimi sadeleme**
   - Operator route ve job detail state'i icin daha acik bir state modeli.

5. **Gozlemlenebilirlik adimlari**
   - requestId
   - route source oranlari loglama
   - DB / external API hata metrikleri

---

## 13) Handoff Kontrol Listesi (Yeni Agent Baslamadan)

1. `npm run docker:up`
2. `http://localhost:4000/health` ve `http://localhost:5173` kontrol
3. `npm run test -w apps/server`
4. `npm run test -w apps/web`
5. Operator route akisi manuel dogrulama:
   - accepted durumda rota ac
   - ilk fazda cekici->pickup
   - "Musteriyi aldim" sonrasi pickup->destination
6. Bir profil kaydinda bozuk karakter validasyonu kontrol (replacement char reject)

---

## 14) Notlar

- Bu dosya "state snapshot" olarak hazirlandi; branch/commit ilerledikce guncellenmesi gerekir.
- Bu dokuman kodun tek dogrusu degildir; **nihai referans her zaman calisan kod + test + CI sonucudur**.

