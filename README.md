# Hotel Accounting System

Bu proje, otel işletmeleri için gelir, gider ve vergi yönetimini kolaylaştıran bir muhasebe sistemidir.

## Özellikler

- Kullanıcı ve yönetici (admin) girişi
- Gelir ve gider kayıtları ekleme, düzenleme, silme
- Yıllık ve aylık finansal özetler ve grafikler (dashboard)
- KDV, konaklama vergisi, kurumlar ve gelir vergisi hesaplama
- Excel formatında gelir/gider raporu oluşturma
- Kullanıcı ve admin yönetimi (yetki seviyeleri)
- Sistem hareketlerinin loglanması

## Kurulum

1. **Depoyu klonlayın:**
   ```sh
   git clone <repo-url>
   cd Accounting/server
   ```

2. **Bağımlılıkları yükleyin:**
   ```sh
   npm install
   ```

3. **Veritabanı ayarlarını yapın:**
   - `.env` dosyasını oluşturun ve aşağıdaki değişkenleri doldurun:
     ```
     DB_USER=...
     DB_PASSWORD=...
     DB_HOST=...
     DB_NAME=...
     DB_PORT=...
     SESSION_SECRET=...
     NODE_ENV=development
     ```

4. **Veritabanı tablolarını oluşturun:**  
   Gerekli tabloları PostgreSQL üzerinde oluşturun (`users`, `admins`, `revenue`, `expense`, `system_logs`).
   hotel_accounting_schema.sql dosyasinda gerekli tablolarin kodalari vardir.

5. **Sunucuyu başlatın:**
   ```sh
   npm start
   ```

6. **Uygulamayı açın:**  
   Tarayıcınızda `http://localhost:3000` adresine gidin.

## Kullanım

- Kullanıcı olarak kayıt olabilir ve giriş yapabilirsiniz.
- Admin panelinden kullanıcı ve admin yönetimi yapabilirsiniz.
- Gelir ve gider işlemlerini ekleyip, raporlar alabilirsiniz.
- Vergi hesaplamalarını yıllara göre görebilirsiniz.


**Geliştirici:** Mert Eren Dilsiz