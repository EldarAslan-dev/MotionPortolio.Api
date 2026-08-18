using Microsoft.AspNetCore.SignalR;

namespace MotionPortfolio.Api.Hubs;

public class NotificationHub : Hub
{
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

    public async Task JoinGeneralSupport()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "general");
    }

    // Tək bir metod (Overloading olmadan)
    public async Task SendGeneralMessage(string content, string sender, string clientNameOrId = "Müştəri")
    {
        await Clients.Group("general").SendAsync("ReceiveGeneralMessage", sender, content, clientNameOrId);
    }

    public async Task UpdateStatus(string orderNumber, string status)
    {
        if (!string.IsNullOrEmpty(orderNumber))
        {
            await Clients.Group(orderNumber).SendAsync("ReceiveStatusUpdate", status);
        }
    }
}