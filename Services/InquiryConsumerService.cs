using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using MotionPortfolio.Api.Hubs;
using MotionPortfolio.Api.Models;

namespace MotionPortfolio.Api.Services;

public class InquiryConsumerService : BackgroundService
{
    private readonly ILogger<InquiryConsumerService> _logger;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly IConfiguration _configuration;

    public InquiryConsumerService(ILogger<InquiryConsumerService> logger, IHubContext<NotificationHub> hubContext, IConfiguration configuration)
    {
        _logger = logger;
        _hubContext = hubContext;
        _configuration = configuration;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Docker daxilindədirsə "rabbitmq", lokal işləyirsə "localhost" götürür
        var rabbitHost = _configuration["RabbitMQ:Host"] ?? Environment.GetEnvironmentVariable("RabbitMQ__Host") ?? "localhost";

        // RabbitMQ-nun tam qalxmasını təmin etmək üçün qısa gözləmə və təkrar yoxlama
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var factory = new ConnectionFactory { HostName = rabbitHost };
                using var connection = await factory.CreateConnectionAsync(stoppingToken);
                using var channel = await connection.CreateChannelAsync(cancellationToken: stoppingToken);

                await channel.QueueDeclareAsync(
                    queue: "client_inquiries",
                    durable: false,
                    exclusive: false,
                    autoDelete: false,
                    arguments: null,
                    cancellationToken: stoppingToken);

                var consumer = new AsyncEventingBasicConsumer(channel);
                consumer.ReceivedAsync += async (model, ea) =>
                {
                    var body = ea.Body.ToArray();
                    var message = Encoding.UTF8.GetString(body);

                    _logger.LogInformation("🔔 [YENİ SİFARİŞ BİLDİRİŞİ GƏLDİ]: {Message}", message);

                    var inquiry = JsonSerializer.Deserialize<Inquiry>(message, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (inquiry != null)
                    {
                        await _hubContext.Clients.All.SendAsync("ReceiveInquiryNotification", inquiry, cancellationToken: stoppingToken);
                    }
                };

                await channel.BasicConsumeAsync(
                    queue: "client_inquiries",
                    autoAck: true,
                    consumer: consumer,
                    cancellationToken: stoppingToken);

                while (!stoppingToken.IsCancellationRequested)
                {
                    await Task.Delay(1000, stoppingToken);
                }
                break;
            }
            catch (Exception ex)
            {
                _logger.LogWarning("RabbitMQ-ya qoşulmaq olmadı ({Host}), 3 saniyə sonra yenidən yoxlanılır: {Message}", rabbitHost, ex.Message);
                await Task.Delay(3000, stoppingToken);
            }
        }
    }
}