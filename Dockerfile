# 1. Build Mərhələsi (.NET SDK)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["MotionPortfolio.Api.csproj", "./"]
RUN dotnet restore "MotionPortfolio.Api.csproj"

COPY . .
RUN dotnet publish "MotionPortfolio.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# 2. Runtime Mərhələsi (.NET ASPNET)
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# wwwroot qovluğunun və admin.html faylının konteynerə tam kopyalandığından əmin oluruq
COPY --from=build /src/wwwroot ./wwwroot

# Fayl yükləmələri üçün qovluq təminatı
RUN mkdir -p /app/wwwroot/uploads

EXPOSE 8080
ENV ASPNETCORE_HTTP_PORTS=8080
ENTRYPOINT ["dotnet", "MotionPortfolio.Api.dll"]