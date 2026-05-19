# Towit MVP — ürün ve teknik kararlar (SRS ile uyum)

Bu dosya [Towit_SRS.md](../Towit_SRS.md) kapsamındaki MVP için alınmış sabit kararları listeler.

## Teknoloji

- **Web**: Vite + React (duyarlı).
- **API**: Node.js + TypeScript, REST + JSON.
- **Kimlik**: JWT access + refresh; durum güncellemeleri için **polling**.
- **Veritabanı**: PostgreSQL (Prisma ORM).

## İş kuralları

- **Operatör sıralama**: kullanıcı **Fiyat / Mesafe** seçebilir; varsayılan **Fiyat** (UR-04).
- **Eşzamanlı talep**: müşteri için `payment_pending`, `open`, `accepted`, `en_route` durumunda başka talep oluşturulamaz (FR-14).
- **İptal**: müşteri yalnızca `accepted` **öncesi** iptal edebilir (`payment_pending`, `open`).
- **Tarife (MVP)**: taban ücret + km başı ücret (UR-08, FR-04).

## Talep (Job) durumları

`payment_pending` → (demo ödeme) → `open` → (çekici kabul) → `accepted` → `en_route` → `completed`  
Yan dallar: `rejected` (çekici red, `open` iken), `cancelled` (müşteri, kabul öncesi).

## Harita

- Mesafe / POI: tercihen sunucu üzerinden Google APIs (anahtar yalnızca sunucu ortam değişkeninde). Anahtar yoksa geliştirme için **haversine** mesafe ve boş POI listesi kullanılır.
- Harita görselleştirme: API anahtarını istemciye zorunlu kılmamak için **Leaflet + OpenStreetMap** (demo).
