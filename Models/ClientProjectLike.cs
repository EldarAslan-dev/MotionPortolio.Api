namespace MotionPortfolio.Api.Models;

public class ClientProjectLike
{
    public int Id { get; set; }
    public string ClientId { get; set; } = string.Empty;
    public int ProjectId { get; set; }
}
