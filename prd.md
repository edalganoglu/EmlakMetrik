📘 **Teknik Analiz ve Mimari Dokümanı: EmlakMetrik**  
**Sürüm:** 1.0.0  
**Tarih:** 30 Aralık 2025  
**Platform:** Mobil (iOS & Android)  
**Teknoloji Stack:** React Native, Supabase (PostgreSQL), Google AdMob  

---

## 1. Proje Tanımı ve Kapsam

EmlakMetrik, gayrimenkul danışmanlarının sahadayken mülk verilerini girerek; amortisman, ROI (Yatırım Getirisi) ve kredi ödeme planlarını hesaplamalarını sağlayan, bu verileri markalı PDF raporlarına dönüştüren bir mobil uygulamadır.

Uygulama **"Hibrit Monetizasyon"** modeli ile çalışır:

- **Freemium:** Temel hesaplamalar ücretsizdir.  
- **Credit-Based:** PDF rapor oluşturma işlemi kredi gerektirir.  
- **Monetization:** Kullanıcılar krediyi Reklam İzleyerek (Rewarded Ads) veya Satın Alarak (IAP) kazanır.

---

## 2. Sistem Mimarisi

### 2.1. Teknoloji Yığını

- **Frontend:** React Native (Expo veya CLI).  
- **Backend & Database:** Supabase (PostgreSQL).  
- **Authentication:** Supabase Auth (Email/Password, Google).  
- **Serverless Logic:** Supabase Edge Functions (Güvenli bakiye işlemleri için).  
- **Depolama:** Supabase Storage (Profil fotoları ve geçici PDF'ler).  
- **Reklam Ağı:** Google AdMob (react-native-google-mobile-ads).  
- **Ödeme Sistemi:** RevenueCat veya react-native-iap.

### 2.2. Veri Akış Diyagramı

- **Client (App):** Veri girişi yapar, hesaplamayı yerel (local) olarak anlık gösterir.  
- **PDF İsteği:** Kullanıcı rapor istediğinde Client, Supabase'den bakiye sorgular.  
- **Transaction:** Bakiye yeterliyse Edge Function tetiklenir, bakiye düşülür, işlem loglanır.  
- **Reklam/IAP:** Reklam izlendiğinde veya satın alım yapıldığında callback tetiklenir, bakiye güncellenir.

---

## 3. Veritabanı Şeması (Database Schema)

Supabase PostgreSQL üzerinde kurulacak ilişkisel yapı aşağıdaki gibidir:

### 3.1. Tablolar

#### profiles (Kullanıcılar)

- **id (UUID, PK):** Supabase Auth ID ile eşleşir.  
- **email (Text):** Kullanıcı e-postası.  
- **full_name (Text):** Raporlarda görünecek isim.  
- **avatar_url (Text):** Raporlarda görünecek logo/fotoğraf.  
- **credit_balance (Integer):** Mevcut kredi bakiyesi (Default: 0).  
- **created_at (Timestamp).**

#### properties (Kaydedilen Analizler)

- **id (UUID, PK).**  
- **user_id (UUID, FK -> profiles.id).**  
- **title (Text):** Örn: "Beşiktaş 2+1 Daire".  
- **price (Decimal):** Satış fiyatı.  
- **monthly_rent (Decimal):** Aylık kira getirisi.  
- **params (JSONB):** Aidat, vergi, faiz oranı, vade gibi detay veriler.  
- **created_at (Timestamp).**

#### transactions (Kredi Hareketleri)

- **id (UUID, PK).**  
- **user_id (UUID, FK -> profiles.id).**  
- **amount (Integer):** +5, -10, +100 gibi değişim miktarı.  
- **type (Enum):** ad_reward, iap_purchase, report_spend, bonus.  
- **reference_id (Text):** IAP Receipt ID veya AdMob ID (Güvenlik için).  
- **created_at (Timestamp).**

### 3.2. Güvenlik Kuralları (RLS - Row Level Security)

- **profiles:** Kullanıcı sadece kendi profilini okuyabilir/düzenleyebilir.  
  credit_balance sütunu sadece servis rolü (Edge Function) tarafından güncellenebilir (Client-side update kapalı).  
- **transactions:** Kullanıcı sadece kendi geçmişini okuyabilir.  
  Ekleme/Silme kapalı (Sadece backend ekler).

---

## 4. Algoritma ve Hesaplama Mantığı (Core Logic)

Uygulama içinde AI yoktur, aşağıdaki formüller JavaScript fonksiyonu olarak `utils/calculator.js` içinde çalışacaktır.

### 4.1. Amortisman Süresi (Yıl)

Mülkün kendini kaç yılda geri ödediği.

$$
Amortisman = \frac{Mülk Fiyatı + Alım Masrafları}{(Aylık Kira - Aylık Giderler) \times 12}
$$

### 4.2. ROI (Yatırım Getirisi - 5 Yıllık)

$$
ROI (\%) = \frac{(Toplam Kira Geliri + 5.Yıl Mülk Değeri) - Toplam Maliyet}{Toplam Maliyet} \times 100
$$

(Not: Mülk değer artışı için yıllık tahmini enflasyon oranı kullanıcıdan input olarak alınır, varsayılan %40 set edilir.)

### 4.3. Kredi Ödemesi (Aylık Taksit)

Standart finansman formülü:

$$
Taksit = P \times \frac{r(1+r)^n}{(1+r)^n - 1}
$$

- **P:** Kredi Tutarı  
- **r:** Aylık Faiz Oranı (Yüzde / 100)  
- **n:** Vade Sayısı (Ay)

---

## 5. Uygulama Modülleri ve Ekranlar

### 5.1. Authentication (Giriş)

- **Login/Register:** Email & Şifre.  
- **Onboarding:** İlk girişte kullanıcıya "Hoşgeldin Hediyesi" olarak +5 kredi tanımlanır (Transaction tipi: bonus).

### 5.2. Dashboard (Ana Sayfa)

- **Header:** Kullanıcı adı ve Bakiye göstergesi (Badge).  
- **Son Analizler:** properties tablosundan son 5 kayıt listelenir.  
- **FAB (Floating Action Button):** Yeni Analiz Ekle (+).

### 5.3. Analiz Hesaplayıcı (Core Feature)

- **Input Formu:** Fiyat, Kira, Aidat, Tapu Harcı, Tadilat Masrafı, Kredi Oranı.  
- **Sonuç Ekranı:**  
  - Sayısal özet (Amortisman, ROI).  
  - Grafikler: Pasta grafik (Gider dağılımı), Çizgi grafik (10 yıllık değer projeksiyonu).  
- **Action:** "PDF Rapor Oluştur (10 Kredi)".

### 5.4. PDF Rapor Modülü

Kullanıcı butona bastığında:

- Bakiye kontrol edilir.  
- react-native-html-to-pdf kütüphanesi ile HTML şablonu render edilir.  
- Şablon içine: Kullanıcı Logosu + İletişim Bilgileri + Analiz Grafikleri gömülür.  
- Cihaza .pdf olarak indirilir ve "Paylaş" menüsü açılır (WhatsApp/Mail).

### 5.5. Cüzdan ve Mağaza (Monetization)

- **Bakiye Gösterimi.**

**Opsiyon 1: Reklam İzle Kazan**

- Buton: "Reklam İzle (+2 Kredi)".  
- Teknoloji: AdMob Rewarded Video.  
- Security: onRewardLoaded event'i tetiklendiğinde Edge Function çağrılır.

**Opsiyon 2: Paket Satın Al (IAP)**

- Ürünler:  
  - credits_20 (Başlangıç)  
  - credits_100 (Pro)  
  - credits_500 (Ofis)  
- Teknoloji: react-native-iap.  
- Security: Satın alma faturası (receipt) sunucuda doğrulanmadan kredi yüklenmez.

---

## 6. Kritik İş Kuralları (Business Rules)

- **Negatif Bakiye:** Bakiye 0'ın altına düşemez. Rapor isteği geldiğinde bakiye < Maliyet ise işlem reddedilir ve Mağaza modalı açılır.  
- **Çevrimdışı Mod:** Kullanıcı interneti yoksa hesaplama yapabilir, veriyi yerel depolayabilir ancak PDF oluşturamaz (Kredi kontrolü için internet şart).  
- **Fiyatlandırma Stratejisi:**  
  - PDF Rapor Maliyeti: 10 Kredi.  
  - Reklam Getirisi: 2 Kredi (Kullanıcıya verilen).  
  - Matematik: Kullanıcı 5 reklam izlerse 1 rapor alır. Bu, reklam gelirini optimize ederken kullanıcıyı sıkmaz.

---

## 7. Geliştirme Aşamaları (Development Phases)

- **Faz 1 (MVP - Temel):** UI tasarımı, Supabase kurulumu, Hesaplama motoru, Yerel veri kaydı. (Kredi sistemi yok, her şey ücretsiz).  
- **Faz 2 (Backend & Security):** RLS kurallarının yazılması, Edge Function ile kredi yönetiminin kodlanması.  
- **Faz 3 (Monetization):** AdMob ve IAP entegrasyonu. PDF modülünün krediye bağlanması.  
- **Faz 4 (Polish):** Grafiklerin iyileştirilmesi, PDF şablonunun güzelleştirilmesi.
