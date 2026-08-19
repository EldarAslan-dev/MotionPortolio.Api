using Microsoft.AspNetCore.SignalR;
using MotionPortfolio.Api.Data;
using MotionPortfolio.Api.Models;

namespace MotionPortfolio.Api.Hubs;

public class NotificationHub : Hub
{
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

    public async Task SendMessageToGroup(string orderNumber, string content, string sender)
    {
        if (!string.IsNullOrEmpty(orderNumber))
        {
            await Clients.Group(orderNumber).SendAsync("ReceiveMessage", new
            {
                orderNumber = orderNumber,
                OrderNumber = orderNumber, 
                content = content,
                Content = content,
                sender = sender,
                Sender = sender,
                sentAt = DateTime.UtcNow,
                SentAt = DateTime.UtcNow
            });
        }
    }

    public async Task NotifyOrderDeleted(string orderNumber)
    {
        if (!string.IsNullOrEmpty(orderNumber))
        {
            await Clients.Group(orderNumber).SendAsync("ReceiveOrderDeleted");
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

        // Müştərinin "şəxsiyyətini" saxla/yenilə (bu qeyd mesajlar silinsə belə qalır)
        var chatClient = await _context.ChatClients.FindAsync(clientId);
        if (chatClient == null)
        {
            chatClient = new ChatClient
            {
                ClientId = clientId,
                ClientName = displayName,
                CreatedAt = DateTime.UtcNow,
                LastMessageAt = DateTime.UtcNow
            };
            _context.ChatClients.Add(chatClient);
        }
        else
        {
            chatClient.LastMessageAt = DateTime.UtcNow;
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
            SentAt = DateTime.UtcNow
        };
        _context.Messages.Add(message);
        await _context.SaveChangesAsync();

        // Yalnız bu müştəriyə (onlayn olarsa) və admin(lər)ə canlı çatdır
        await Clients.Group("client_" + clientId).SendAsync("ReceiveGeneralMessage", sender, content, clientId, displayName);
        await Clients.Group("general").SendAsync("ReceiveGeneralMessage", sender, content, clientId, displayName);
    }

    public async Task UpdateStatus(string orderNumber, string status)
    {
        if (!string.IsNullOrEmpty(orderNumber))
        {
            await Clients.Group(orderNumber).SendAsync("ReceiveStatusUpdate", status);
        }
    }
}