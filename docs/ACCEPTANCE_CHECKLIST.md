# Towit MVP — kabul kontrol listesi (SRS izlenebilirlik)

Manuel ve otomatik testlerle doğrulanır.

## Fonksiyonel (FR)

| Kimlik | Kontrol |
|--------|---------|
| FR-01 | Müşteri ve çekici ayrı kayıt; giriş sonrası `/me` rolü doğru. |
| FR-02 | `/cities` ile il seçimi; müşteri akışında kullanılıyor. |
| FR-03 | `/operators/search` yalnızca hizmet yarıçapı içindeki aktif çekicileri döndürür. |
| FR-04 | Önizleme tutarı = taban + km × birim (sunucu hesabı). |
| FR-05 | `GOOGLE_MAPS_API_KEY` varken `/places/suggest` ve `/places/resolve` çalışır; yoksa boş/404 davranışı tutarlı. |
| FR-06 | `POST /jobs` benzersiz kayıt, koordinatlar, seçilen operatör, anlık fiyat anlığı saklar. |
| FR-07 | `POST /jobs/:id/demo-payment` harici PSP çağırmadan `open` durumuna geçirir. |
| FR-08 | Çekici `PATCH /jobs/:id` ile kabul/red ve durum güncellemesi yapar. |
| FR-09 | Müşteri yalnızca kendi taleplerini listeler; çekici yalnızca kendi taleplerini görür. |
| FR-12 | Süresi dolmuş access ile istek reddedilir; `/auth/refresh` ile yenilenir. |
| FR-13 | Geçersiz koordinat için anlamlı `INVALID_COORDINATES` yanıtı. |
| FR-14 | Açık talep varken ikinci talep `409 CONFLICT_OPEN_JOB`. |
| FR-15 | Red sonrası talep `rejected`; müşteri ekranında durum güncellenir (polling). |

## Fonksiyonel olmayan (NFR)

| Kimlik | Kontrol |
|--------|---------|
| NFR-01 | Üretimde TLS (ör. Caddy/nginx) ile HTTPS. |
| NFR-02 | Parola bcrypt ile saklanır. |
| NFR-03 | `GOOGLE_MAPS_API_KEY` yalnızca sunucu ortamında; repo’da yok. |
| NFR-04 | Tipik arama yanıtı birkaç saniye içinde: tarayıcı geliştirici araçlarında `/operators/search` süresi veya `curl -w "%{time_total}"` ile ölçüm kaydı. |
| NFR-08 | [apps/server/openapi.yaml](../apps/server/openapi.yaml) sürümlenmiş uçları listeler. |
| NFR-09 | Beklenmeyen hata `500` + genel mesaj; ayrıntı sunucu günlüğünde. |

## Uçtan uca senaryo (staging)

1. Çekici kaydı → profil + tarife kaydet → aktif.  
2. Müşteri kaydı → şehir, çekim, varış (manuel koordinat veya Places) → liste → talep → demo ödeme.  
3. Çekici: kabul → yola çıkıldı → tamamlandı.  
4. Müşteri: durumların sırayla güncellendiğini gözle (polling).
