import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Calendar, Car, Cloud, Droplets, Wind, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const { user } = useAuth();
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const { data: appointments } = trpc.appointments.list.useQuery();
  const { data: vehicles } = trpc.vehicles.list.useQuery();
  const { data: weather } = trpc.weather.getCurrent.useQuery(
    { latitude: location?.latitude || 0, longitude: location?.longitude || 0 },
    { enabled: !!location }
  );

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationError("Não foi possível obter sua localização");
          // Default to São Paulo coordinates
          setLocation({ latitude: -23.5505, longitude: -46.6333 });
        }
      );
    } else {
      setLocationError("Geolocalização não suportada");
      setLocation({ latitude: -23.5505, longitude: -46.6333 });
    }
  }, []);

  const upcomingAppointments = appointments?.filter(
    (apt) => new Date(apt.appointmentDate) > new Date() && apt.status !== "cancelled"
  ).slice(0, 3);

  const getWeatherDescription = (code: number) => {
    if (code === 0) return "Céu limpo";
    if (code <= 3) return "Parcialmente nublado";
    if (code <= 48) return "Nublado";
    if (code <= 67) return "Chuva";
    if (code <= 77) return "Neve";
    if (code <= 82) return "Chuva forte";
    if (code <= 86) return "Neve forte";
    return "Tempestade";
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      confirmed: "default",
      completed: "outline",
      cancelled: "destructive",
    };
    const labels: Record<string, string> = {
      pending: "Pendente",
      confirmed: "Confirmado",
      completed: "Concluído",
      cancelled: "Cancelado",
    };
    return <Badge variant={variants[status] || "default"}>{labels[status] || status}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Bem-vindo, {user?.name || "Usuário"}!
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie seus agendamentos e veículos de forma simples
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weather Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Clima Atual
              </CardTitle>
              <CardDescription>Condições meteorológicas</CardDescription>
            </CardHeader>
            <CardContent>
              {weather ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600">
                      {Math.round(weather.current.temperature_2m)}°C
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {getWeatherDescription(weather.current.weather_code)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-xs text-gray-500">Umidade</p>
                        <p className="text-sm font-medium">{weather.current.relative_humidity_2m}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wind className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-xs text-gray-500">Vento</p>
                        <p className="text-sm font-medium">{Math.round(weather.current.wind_speed_10m)} km/h</p>
                      </div>
                    </div>
                  </div>
                  {locationError && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                      <p className="text-xs text-amber-800">{locationError}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
              <CardDescription>Estatísticas rápidas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">
                        {upcomingAppointments?.length || 0}
                      </p>
                      <p className="text-sm text-gray-600">Agendamentos Próximos</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Car className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {vehicles?.length || 0}
                      </p>
                      <p className="text-sm text-gray-600">Veículos Cadastrados</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Próximos Agendamentos</CardTitle>
                <CardDescription>Seus agendamentos futuros</CardDescription>
              </div>
              <Link href="/agendar">
                <Button>Novo Agendamento</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingAppointments && upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => {
                  const vehicle = vehicles?.find((v) => v.id === appointment.vehicleId);
                  return (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <Car className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {vehicle?.brand} {vehicle?.model}
                          </p>
                          <p className="text-sm text-gray-600">
                            {appointment.serviceType === "simple" ? "Lavagem Simples" : "Lavagem Completa"}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(appointment.appointmentDate).toLocaleString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(appointment.status)}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Nenhum agendamento próximo</p>
                <Link href="/agendar">
                  <Button variant="link" className="mt-2">Agendar agora</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
