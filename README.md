# 🎬 Motion Studio — Kreativ Portfel və Avtomatlaşdırılmış Video İstehsalı Platforması

Müasir veb texnologiyaları, Next.js və mikroservis arxitekturası ilə qurulmuş yüksək məhsuldarlıqlı, real vaxt rejimində işləyən kreativ portfel və avtomatlaşdırılmış video idarəetmə platforması.

---

## 🚀 Texnologiya Yığını (Tech Stack)

- **Backend / API:** C#, .NET 10, ASP.NET Core, SignalR (Real-time WebSocket), Entity Framework Core
- **Verilənlər Bazası və Mesajlaşma:** SQL Server, RabbitMQ
- **Frontend / UI:** Next.js 14+, React, Tailwind CSS, GSAP (ScrollTrigger üçün)
- **Video Emalı:** Node.js, Remotion (sosial media Reels/TikTok şablonlarının avtomatlaşdırılmış renderinqi)
- **DevOps və Yerləşdirmə (Deployment):** Docker, Docker Compose, DigitalOcean Ubuntu Server, Nginx (Reverse Proxy & SSL)

---

## ✨ Əsas Xüsusiyyətlər

- **Müasir Next.js Frontend (`/`):** 
  - Orijinal akışkan "About" bölməsi, hərf-hərf scroll-reveal mətn effekti və GSAP pin-effektli proyekt yığını (card stack).
  - İnteraktiv portfel vitrini (video oynatma, vaxt çubuğu və nisbət itirmədən adaptiv kadr göstərilməsi).
  - 24 saatlıq avtomatik silinən Story sistemi (video/şəkil dəstəyi ilə).
- **Canlı Dəstək və Çat Sistemi (SignalR):** 
  - Müştərilər ilə admin/komanda arasında ani (real-time) ikitərəfli mesajlaşma.
  - Müştəri panelində çat tarixçəsinin bazadan avtomatik yüklənməsi (yeniləmədə mesajların itməməsi).
- **Admin Panel (`/admin`):** 
  - Tam təhlükəsiz JWT autentifikasiyası.
  - Gələn əməkdaşlıq müraciətlərinin idarəsi, status yeniləmə, komanda üzvlərinə iş təyinatı və fayl təhvili.
  - Çoxmüştərili Canlı DM Mərkəzi (SignalR ilə gələn yeni mesaj bildirişləri və səsli xəbərdarlıq).
  - Animasiya yükləmə, story paylaşma, rəylərin moderasiyası və vitrin elanı idarəsi.
  - **Mobil Uyğunluq:** Telefon və kiçik ekranlar üçün tam optimallaşdırılmış sürüşməyən cədvəllər və adaptiv çat interfeysi.
- **Komanda Paneli (`/team`):** 
  - Komanda üzvləri üçün xüsusi giriş və yalnız özlərinə təyin olunan işlərin siyahısı.
  - Hazır faylların yüklənməsi və sifarişə əsaslı birbaşa müştəri çatı.

---

## 🛠️ Yerli Mühitdə Necə İşə Salınmalı?

### 1. Klonlayın və qovluğa daxil olun:
```bash
git clone [https://github.com/EldarAslan-dev/MotionPortolio.Api.git](https://github.com/EldarAslan-dev/MotionPortolio.Api.git)
cd MotionPortolio.Api
