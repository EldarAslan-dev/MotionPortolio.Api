# 🎬 Motion Studio — Kreativ Portfel və Avtomatlaşdırılmış Video İstehsalı Platforması

Müasir veb texnologiyaları, Next.js və mikroservis arxitekturası ilə qurulmuş yüksək məhsuldarlıqlı, real vaxt rejimində işləyən kreativ portfel və avtomatlaşdırılmış video idarəetmə platforması.

---

## 🚀 Texnologiya Yığını (Tech Stack)

- **Backend / API:** C#, .NET 10, ASP.NET Core, SignalR (Real-time WebSocket), Entity Framework Core
- **Verilənlər Bazası və Mesajlaşma:** SQL Server, RabbitMQ
- **Frontend / UI:** Next.js 15, React 19, Tailwind CSS, GSAP, Lenis, Three.js (hero silindr)
- **DevOps və Yerləşdirmə (Deployment):** Docker, Docker Compose, DigitalOcean Ubuntu Server, Nginx (Reverse Proxy & SSL)

---

## ✨ Əsas Xüsusiyyətlər

- **Müasir Next.js Frontend (`/`):**
  - Public sayt ingiliscə; hero silindr, work kartları, `/work/[id]` izləmə səhifəsi.
  - Video paylaşımda avtomatik poster; like və şərh (Instagram sırası).
  - 24 saatlıq avtomatik silinən Story sistemi (video/şəkil dəstəyi ilə).
- **Canlı Dəstək və Çat Sistemi (SignalR):**
  - Müştərilər ilə admin/komanda arasında ani (real-time) ikitərəfli mesajlaşma.
  - Müştəri panelində çat tarixçəsinin bazadan avtomatik yüklənməsi (yeniləmədə mesajların itməməsi).
- **Admin Panel (`/admin`):**
  - Azərbaycan dilində, JWT autentifikasiyası, night palitra.
  - Gələn əməkdaşlıq müraciətlərinin idarəsi, status yeniləmə, komanda üzvlərinə iş təyinatı və fayl təhvili.
  - Çoxmüştərili Canlı DM Mərkəzi (SignalR ilə gələn yeni mesaj bildirişləri və səsli xəbərdarlıq).
  - Portfel yükləmə (çoxlu media + kapak kadrı), like/şərh idarəsi, story, rəy və vitrin elanı.
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
