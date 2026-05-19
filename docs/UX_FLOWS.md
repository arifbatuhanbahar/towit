# Towit MVP — ekran / akış özeti

## Müşteri

1. **Kayıt / Giriş** — rol: müşteri.
2. **Şehir seçimi** — arama bağlamı (il kodu).
3. **Çekim noktası** — haritada pin veya GPS (tarayıcı `geolocation`).
4. **Varış** — metin araması → sunucudan önerilen yerler; seçim.
5. **Çekici listesi** — tahmini tutar + “tahmini tutar” uyarısı; sıralama: Fiyat / Mesafe.
6. **Talep** — çekici seç → oluştur → **demo ödeme** tamamla.
7. **Durum** — periyodik yenileme (polling): bekliyor / açık / kabul / yolda / tamamlandı; kabul öncesi **iptal**.

## Çekici (operatör)

1. **Kayıt / Giriş** — rol: çekici.
2. **Profil** — işletme adı, araç bilgisi, hizmet merkezi (lat/lng), yarıçap (km), aktif/pasif.
3. **Tarife** — taban ücret, km ücreti.
4. **Talepler** — gelen talepler: **kabul / red**; kabul sonrası **yola çıkıldı** → **tamamlandı**.
