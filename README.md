🌐 Canlı Demo & Test Hesabı
Projeyi lokal bilgisayarınıza kurmadan doğrudan deneyimleyebilirsiniz:
Canlı Web Sürümü: wherewasi.vercel.app (Kendi Vercel linkinle değiştir)
Test Hesabı Email: test@mail.com
Test Hesabı Şifre: test1234
(Not: Test hesabı, Supabase üzerinden e-posta doğrulama adımları atlanarak doğrudan erişime açılmıştır.)
📸 Ekran Görüntüleri
Buraya projenin minimalist ve karanlık temasını yansıtan 2-3 kaliteli ekran görüntüsü veya uygulamanın nasıl çalıştığını gösteren kısa bir GIF ekleyebilirsin. GitHub'da Issues veya ana sayfaya resmi sürükleyip bırakarak link oluşturabilirsin.
🚀 Temel Özellikler
AI Destekli Bölüm Bulma: Kullanıcı diziden hatırladığı bulanık bir anıyı metin olarak girer. Sistem, Gemini AI entegrasyonu ve TMDB API verilerini kullanarak bu anıyı analiz eder ve en olası bölümü nokta atışı bulur.
İkili Arama (Binary Search) Mantığı ile Manuel Takip: İzlenen/izlenmeyen bölümler arasında havuzu daraltarak kullanıcının kaldığı yeri hızlıca tespit eden filtreleme sistemi.
Cross-Platform Mimarisi: Tek bir React kod tabanı (Single Codebase) kullanılarak, Capacitor aracılığıyla hem modern bir web uygulaması hem de donanım hızlandırmalı bir Android APK'sı oluşturulmuştur.
Güvenli Kimlik Doğrulama: Supabase altyapısı ve RLS (Row Level Security) politikaları kullanılarak kullanıcı verilerinin izolasyonu sağlanmıştır.
🛠 Kullanılan Teknolojiler (Tech Stack)
Frontend
React.js & Vite: Yüksek performanslı, bileşen (component) tabanlı arayüz mimarisi ve hızlı geliştirme ortamı.
Tailwind CSS: "Utility-first" yaklaşımıyla geliştirilmiş, minimalist ve cihaz çözünürlüklerine tam uyumlu (responsive) tasarım.
Backend & API
Supabase: PostgreSQL tabanlı ilişkisel veritabanı yönetimi ve güvenli kimlik doğrulama (Authentication) altyapısı.
TMDB REST API: Küresel dizi/film veritabanından eşzamanlı veri ve görsel (still) çekimi.
Google Gemini AI: Doğal dil işleme (NLP) ve bağlamsal veri analizi için (gemini-flash) entegrasyonu.
Mobil Entegrasyon
Capacitor.js: Web teknolojilerini native bir kabuk (wrapper) içine sararak Android (SDK 34) uyumlu APK çıktısı alınmasını sağlayan köprü teknolojisi.
🏗 Mimari ve Mühendislik Kararları
Neden Firebase yerine Supabase?
Projelerdeki ilişkisel veri bütünlüğünü korumak ve açık kaynak (open-source) SQL gücünden faydalanmak adına NoSQL yerine PostgreSQL tabanlı Supabase tercih edilmiştir.
Neden Native yerine Hybrid (Capacitor)?
Zaman ve efor maliyetini (Time-to-market) minimize etmek amacıyla "Write once, run anywhere" felsefesi benimsenmiştir. UI tasarımı tek bir merkezde toplanarak platformlar arası tasarım tutarsızlıkları önlenmiştir.
Performans Optimizasyonu:
Kullanıcının her tuş vuruşunda TMDB API'sine istek gitmesini ve limitlere (Rate Limit) takılmayı önlemek amacıyla arama çubuğunda Debounce yöntemi kullanılmıştır.
💻 Kurulum (Lokal Ortam)
Projeyi kendi bilgisayarınızda çalıştırmak için aşağıdaki adımları izleyebilirsiniz:
Repoyu bilgisayarınıza klonlayın:
Bash
git clone https://github.com/KULLANICI_ADIN/wherewasi.git
Gerekli kütüphaneleri yükleyin:
Bash
cd wherewasi
npm install
Kök dizinde bir .env dosyası oluşturup Supabase, TMDB ve Gemini API anahtarlarınızı ekleyin.
Geliştirici sunucusunu başlatın:
Bash
npm run dev
