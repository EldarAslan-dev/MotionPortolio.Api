# bilgeyismirzazada.com — Deployment Bələdçisi

Bu sənəd Next.js saytını (public sayt + `/admin` + `/team`) köhnə statik
`wwwroot/index.html`-in yerinə, eyni domendə (bilgeyismirzazada.com) canlıya
çıxarmaq üçün addımları izah edir.

Memarlıq: Nginx (host üzərində, SSL ilə) → iki Docker konteyneri:
- `motion_web` (Next.js, daxili port 3000) → `/`, `/admin`, `/team`
- `motion_api` (.NET API, daxili port 8080→host 5118) → `/api`, `/uploads`, `/notificationHub`

## 1. Kodu serverə gətir

```bash
cd /path/to/MotionPortfolio.Api
git pull origin <branch>
```

## 2. Konteynerləri qur və işə sal

```bash
docker compose build web api
docker compose up -d web api
```

`web` xidməti `NEXT_PUBLIC_API_URL=""` ilə qurulur — bu o deməkdir ki,
brauzerdəki bütün sorğular (`/api/...`, `/uploads/...`) **nisbi** yoldan
gedir və eyni domendə Nginx onları API konteynerinə yönləndirir. Əlavə CORS
konfiqurasiyasına ehtiyac yoxdur, çünki brauzer üçün hər ikisi eyni origin-dir.

## 3. Nginx konfiqurasiyasını yenilə

`deploy/nginx/bilgeyismirzazada.com.conf` faylındakı `location` bloklarını
serverin mövcud Nginx konfiqurasiyasına (adətən Certbot tərəfindən idarə
olunan `/etc/nginx/sites-available/bilgeyismirzazada.com`) köçür:

- `location /api/`, `location /uploads/`, `location /notificationHub` → API konteynerinə (127.0.0.1:5118)
- `location /` → Next.js konteynerinə (127.0.0.1:3000)

SSL sertifikatı sətirlərinə (`ssl_certificate`, `ssl_certificate_key`) toxunma
— onlar artıq Certbot tərəfindən idarə olunur.

```bash
sudo nginx -t          # konfiqurasiyanı yoxla
sudo systemctl reload nginx
```

## 4. Yoxla

- `https://www.bilgeyismirzazada.com/` → yeni Next.js sayt açılmalıdır
- `https://www.bilgeyismirzazada.com/admin` → admin panel giriş ekranı
- `https://www.bilgeyismirzazada.com/team` → komanda panel giriş ekranı
- `https://www.bilgeyismirzazada.com/api/profile` → JSON cavab qaytarmalıdır

## Qeydlər

- Köhnə `wwwroot/index.html`, `my-secret-panel.html`, `team.html` API
  konteynerində hələ də mövcuddur (silinməyib), amma Nginx artıq `/`
  yolunu Next.js-ə yönləndirdiyi üçün onlara birbaşa giriş olmayacaq.
  İstəsəniz sonradan `wwwroot`-dan silinə bilər.
- Fayl yükləmə limiti həm API-də (`Kestrel` + `FormOptions`, 500MB), həm də
  Nginx-də (`client_max_body_size 500M`) uyğunlaşdırılıb.
- Əgər gələcəkdə Next.js-i ayrı bir subdomendə saxlamaq istəsəniz,
  `docker-compose.yml`-dəki `NEXT_PUBLIC_API_URL` build arg-ını API-nin tam
  URL-inə dəyişin və `Cors:Origins`-ə uyğun domeni əlavə edin.
