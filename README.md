<img width="1200" height="420" alt="banner" src="https://github.com/user-attachments/assets/9a5a2a1e-0353-4829-b18c-ba82f66f83ab" />

<img width="1000" height="300" alt="inquiry-flow" src="https://github.com/user-attachments/assets/e06a384b-fd70-4b78-9ea9-437474710e16" />
<img width="1260" height="600" alt="architecture" src="https://github.com/user-attachments/assets/a82388ec-2f64-4061-a22b-4118783b9f58" />



Visitors browse the portfolio. Clients send a brief, sign in, follow an order, and chat. The studio runs the same system from `/admin`: content, inquiries, accounts, and delivery.

## Stack

| Layer | What it uses |
| --- | --- |
| Public site and admin | Next.js 15, React 19, TypeScript, Tailwind CSS, Framer Motion, GSAP, Lenis |
| API | ASP.NET Core on .NET 10, Entity Framework Core, JWT, SignalR, BCrypt |
| Data and queue | SQL Server (`MotionPortfolioDb`), RabbitMQ for new inquiries |
| Mail and media | Gmail SMTP, ImageSharp for sized public images |
| Production | Docker Compose (`motion_web`, `motion_api`, `motion_sqlserver`, `motion_rabbitmq`) behind Nginx |

Nginx sends `/` to Next.js and `/api`, `/uploads`, and the SignalR hub to the API. Public image requests can pass `?w=` so the API serves a display size. Delivery files stay at their original quality.

## Public site

English interface, SF Pro, day and night themes.

- Hero gallery of up to four images or videos. Width, height, corner radius, and fit come from admin, and the fan scales to the screen.
- Selected works with video, likes, and comments. Each piece has its own page at `/work/[id]`.
- Client logos, about, contact, and a structured brief (the client writes their own budget in USD or AZN).
- Stories on the studio mark.
- Account at `/account`: orders, discounts, and gifts.
- Order tracking at `/track/[token]`.
- Extra pages at `/p/[slug]`.
- Sections fade in as you scroll. Images and nearby videos are already loaded.

## Admin — `/admin`

English panel, JWT sign-in.

| Group | Sections |
| --- | --- |
| Workflow | Inquiries, accounts, testimonials |
| Site | Appearance, brief, announcements, about, logos, hero gallery, portfolio |
| Studio | Studio profile |

Inquiries move through New, In progress, Awaiting payment, Completed, and Cancelled. The studio can attach the finished work, email the client, and confirm payment before the file is released. Accounts show orders and the amount paid, and can set a password, remove an account, or email a discount or gift. Logos and portfolio rows have an order number; that number is the public order and is not shown on the site. Desktop still allows drag-and-drop.

## Team — `/team`

Team members sign in and see the jobs assigned to them, upload finished files, and chat with that client.
