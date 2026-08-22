using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using MotionPortfolio.Api.Data;
using MotionPortfolio.Api.Models;

namespace MotionPortfolio.Api.Hubs;

public class NotificationHub : Hub
{
    // Müştəri ilk dəfə yazanda göndərilən avtomatik salamlama mətni.
    private const string AutoReplyText =
        "Salam! Müraciətiniz qeydə alındı, tezliklə sizinlə əlaqə saxlayacağıq.";

    private readonly AppDbContext _context;

    public NotificationHub(AppDbContext context)
    {
        _context = context;
    }

    public async Task SendInquiryNotification(object inquiry)
    {
        await Clients.All.SendAsync("ReceiveInquiryNotification", inquiry);
    }

    public async Task JoinOrderGroup(string orderNumber)
    {
        if (!string.IsNullOrEmpty(orderNumber))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, orderNumber);
        }
    }

    public async Task LeaveOrderGroup(string orderNumber)
    {
        if (!string.IsNullOrEmpty(orderNumber))
        {
            try
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, orderNumber);
            }
            catch (Exception) { }
        }
    }

    // Sifariş üzrə çat - komanda üzvü ilə müştərini birbaşa danışdırmaq üçün
    // istifadə olunur. Admin bunu Inquiry.ClientChatEnabled ilə açıb-bağlayır;
    // bağlı olanda mesaj keçmir və bütün əlaqə admin üzərindən davam edir.
    public async Task SendMessageToGroup(string orderNumber, string content, string sender)
    {
        if (string.IsNullOrEmpty(orderNumber) || string.IsNullOrWhiteSpace(content))
        {
            return;
        }

        var inquiry = await _context.Inquiries.FirstOrDefaultAsync(i => i.OrderNumber == orderNumber);
        if (inquiry == null || !inquiry.ClientChatEnabled)
        {
            return;
        }

        var sentAt = DateTime.UtcNow;
        _context.Messages.Add(new Message
        {
            ClientId = inquiry.ClientId,
            ClientName = inquiry.ClientName,
            OrderNumber = orderNumber,
            Sender = sender,
            Content = content,
            SentAt = sentAt
        });
        await _context.SaveChangesAsync();

        await Clients.Group(orderNumber).SendAsync("ReceiveMessage", new
        {
            orderNumber = orderNumber,
            OrderNumber = orderNumber,
            content = content,
            Content = content,
            sender = sender,
            Sender = sender,
            sentAt = sentAt,
            SentAt = sentAt
        });
    }

    public async Task NotifyOrderDeleted(string orderNumber)
    {
        if (!string.IsNullOrEmpty(orderNumber))
        {
            await Clients.Group(orderNumber).SendAsync("ReceiveOrderDeleted");
        }
    }

    // Komanda üzvü öz şəxsi bildiriş qrupuna qoşulur ki, admin ona yeni iş
    // təyin edəndə (ReceiveNewAssignment) xəbərdar olsun.
    public async Task JoinStaffGroup(string staffUsername)
    {
        if (!string.IsNullOrEmpty(staffUsername))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "staff_" + staffUsername);
        }
    }

    // --- CANLI DƏSTƏK (GENERAL SUPPORT) ---

    // Yalnız ADMIN bu qrupa qoşulur ki, hər müştəridən gələn mesajdan xəbərdar olsun.
    public async Task JoinGeneralSupport()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "general");
    }

    // Hər MÜŞTƏRİ öz şəxsi qrupuna qoşulur ki, yalnız ÖZ söhbətini görsün,
    // başqa müştərilərə göndərilən admin mesajlarını görməsin.
    public async Task JoinClientGroup(string clientId)
    {
        if (!string.IsNullOrEmpty(clientId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "client_" + clientId);
        }
    }

    // Ümumi dəstək mesajı: bazaya yazılır (offline saxlanılır) və canlı çatdırılır.
    // clientId  -> müştərinin unikal ID-si (məs: CLI-20260819-1234)
    // clientName-> müştərinin adı (görünmə üçün)
    // sender    -> "Client" və ya "Admin"
    // content   -> mesajın mətni
    public async Task SendGeneralMessage(string clientId, string clientName, string sender, string content)
    {
        if (string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(content))
        {
            return;
        }

        var displayName = string.IsNullOrWhiteSpace(clientName) ? clientId : clientName;
        var now = DateTime.UtcNow;

        // Müştərinin "şəxsiyyətini" saxla/yenilə (bu qeyd mesajlar silinsə belə qalır)
        var chatClient = await _context.ChatClients.FindAsync(clientId);
        if (chatClient == null)
        {
            chatClient = new ChatClient
            {
                ClientId = clientId,
                ClientName = displayName,
                CreatedAt = now,
                LastMessageAt = now
            };
            _context.ChatClients.Add(chatClient);
        }
        else
        {
            chatClient.LastMessageAt = now;
            if (sender == "Client" && !string.IsNullOrWhiteSpace(clientName))
            {
                chatClient.ClientName = displayName;
            }
        }

        // Mesajı bazaya yaz (offline saxlama)
        var message = new Message
        {
            ClientId = clientId,
            ClientName = displayName,
            Sender = sender,
            Content = content,
            SentAt = now
        };
        _context.Messages.Add(message);

        // Avtomatik salamlama: hər müştəriyə ÖMRÜ BOYU YALNIZ BİR DƏFƏ.
        // Bayraq bazada saxlanıldığı üçün nə admin panelinin açıq olması,
        // nə tabların sayı, nə də səhifənin yenilənməsi buna təsir etmir.
        var sendAutoReply = sender == "Client" && !chatClient.AutoReplySent;
        if (sendAutoReply)
        {
            chatClient.AutoReplySent = true;
            _context.Messages.Add(new Message
            {
                ClientId = clientId,
                ClientName = displayName,
                Sender = "Admin",
                Content = AutoReplyText,
                // Müştərinin mesajından sonra sıralansın
                SentAt = now.AddMilliseconds(1)
            });
        }

        await _context.SaveChangesAsync();

        var payload = new
        {
            id = message.Id,
            clientId,
            clientName = displayName,
            sender,
            content,
            sentAt = now
        };

        // Yalnız bu müştəriyə (onlayn olarsa) və admin(lər)ə canlı çatdır
        await Clients.Group("client_" + clientId).SendAsync("ReceiveGeneralMessage", sender, content, clientId, displayName, false, payload);
        await Clients.Group("general").SendAsync("ReceiveGeneralMessage", sender, content, clientId, displayName, false, payload);

        if (sendAutoReply)
        {
            // 5-ci arqument (isAuto) admin panelinə bunun avtomatik cavab
            // olduğunu bildirir.
            await Clients.Group("client_" + clientId).SendAsync("ReceiveGeneralMessage", "Admin", AutoReplyText, clientId, displayName, true);
            await Clients.Group("general").SendAsync("ReceiveGeneralMessage", "Admin", AutoReplyText, clientId, displayName, true);
        }
    }

    public async Task UpdateStatus(string orderNumber, string status)
    {
        if (!string.IsNullOrEmpty(orderNumber))
        {
            await Clients.Group(orderNumber).SendAsync("ReceiveStatusUpdate", status);
        }
    }
}