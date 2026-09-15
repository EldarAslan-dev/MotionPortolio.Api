namespace MotionPortfolio.Api.Models;

public class ClientLogo
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string LogoUrl { get; set; } = "";
    public int SortOrder { get; set; }
}
