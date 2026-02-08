# 🧾 Hotel Accounting System

## 🇬🇧 English

### 📌 About the Project

**Hotel Accounting System** is a web-based accounting application designed to help hotel businesses manage their financial operations efficiently. It allows hotels to track daily revenues and expenses, calculate taxes, and view financial summaries through a clean and user-friendly interface.

This project is ideal for small and medium-sized hotels that need a simple yet powerful accounting solution without relying on complex third-party software.

---

### ✨ Features

* User and Admin authentication
* Role-based access control
* Revenue and expense management (add, edit, delete)
* Monthly and yearly financial dashboards
* Tax calculations: VAT, Accommodation tax, Income tax, Corporate tax
* Export revenue and expense reports to Excel
* User and admin management
* System activity logging

---

### 🧰 Tech Stack

* **Backend:** Node.js, Express.js
* **Database:** PostgreSQL
* **Frontend:** HTML, CSS, JavaScript (EJS)
* **Authentication:** Session-based authentication
* **Reporting:** Excel export

---

### 🚀 Installation

1. Clone the repository:

   ```bash
   git clone <repo-url>
   cd Accounting/server
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Configure environment variables:

   * Create a `.env` file and fill in the following:

     ```env
     DB_USER=...
     DB_PASSWORD=...
     DB_HOST=...
     DB_NAME=...
     DB_PORT=...
     SESSION_SECRET=...
     NODE_ENV=development
     ```

4. Create database tables:

   * Use PostgreSQL to create `users`, `admins`, `revenue`, `expense`, `system_logs`.
   * The `hotel_accounting_schema.sql` file contains the necessary SQL scripts.

5. Start the server:

   ```sh
   npm start
   ```

6. Open the application in your browser at `http://localhost:3000`

---

### 🧑‍💻 Usage

* Register and log in as a user.
* Admin panel for managing users, admins, and logs.
* Add, edit, delete revenues and expenses.
* View monthly and yearly dashboards.
* Generate Excel reports.
* Track taxes per year.

---

## 🇹🇷 Türkçe

### 📌 Proje Hakkında

**Hotel Accounting System**, otel işletmelerinin finansal işlemlerini etkin şekilde yönetmelerini sağlayan web tabanlı bir muhasebe uygulamasıdır. Sistem, günlük gelir ve giderleri takip etmeyi, vergi hesaplamalarını yapmayı ve finansal özetleri kullanıcı dostu bir arayüzle görüntülemeyi mümkün kılar.

Bu proje, karmaşık yazılımlara ihtiyaç duymadan küçük ve orta ölçekli oteller için basit ama güçlü bir muhasebe çözümü sunar.

---

### ✨ Özellikler

* Kullanıcı ve yönetici (admin) girişi
* Yetki bazlı erişim kontrolü
* Gelir ve gider yönetimi (ekleme, düzenleme, silme)
* Aylık ve yıllık finansal panolar
* Vergi hesaplamaları: KDV, Konaklama vergisi, Gelir vergisi, Kurumlar vergisi
* Gelir ve gider raporlarını Excel’e aktarma
* Kullanıcı ve admin yönetimi
* Sistem hareketlerini loglama

---

### 🧰 Teknoloji

* **Backend:** Node.js, Express.js
* **Veritabanı:** PostgreSQL
* **Frontend:** HTML, CSS, JavaScript (EJS)
* **Kimlik doğrulama:** Session tabanlı
* **Raporlama:** Excel export

---

### 🚀 Kurulum

1. Depoyu klonlayın:

   ```sh
   git clone <repo-url>
   cd Accounting/server
   ```

2. Bağımlılıkları yükleyin:

   ```sh
   npm install
   ```

3. Ortam değişkenlerini ayarlayın:

   * `.env` dosyasını oluşturun ve aşağıdaki değişkenleri doldurun:

     ```env
     DB_USER=...
     DB_PASSWORD=...
     DB_HOST=...
     DB_NAME=...
     DB_PORT=...
     SESSION_SECRET=...
     NODE_ENV=development
     ```

4. Veritabanı tablolarını oluşturun:

   * PostgreSQL üzerinde `users`, `admins`, `revenue`, `expense`, `system_logs` tablolarını oluşturun.
   * `hotel_accounting_schema.sql` dosyasında gerekli tabloların SQL kodları mevcuttur.

5. Sunucuyu başlatın:

   ```sh
   npm start
   ```

6. Tarayıcıdan `http://localhost:3000` adresine gidin

---

### 🧑‍💻 Kullanım

* Kullanıcı olarak kayıt olun ve giriş yapın.
* Admin panelinden kullanıcı, admin ve log yönetimi yapın.
* Gelir ve giderleri ekleyin, düzenleyin, silin.
* Aylık ve yıllık finansal panoları görüntüleyin.
* Excel raporları oluşturun.
* Yıllık vergi hesaplamalarını takip edin.

---

### 👨‍💻 Geliştirici

**Mert Eren Dilsiz**
