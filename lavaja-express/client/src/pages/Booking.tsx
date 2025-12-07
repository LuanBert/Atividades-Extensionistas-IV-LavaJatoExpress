import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Calendar, Car, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function Booking() {
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [serviceType, setServiceType] = useState<"simple" | "complete" | "">("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");

  const utils = trpc.useUtils();
  const { data: vehicles, isLoading: vehiclesLoading } = trpc.vehicles.list.useQuery();
  const { data: appointments } = trpc.appointments.list.useQuery();

  const createMutation = trpc.appointments.create.useMutation({
    onSuccess: () => {
      utils.appointments.list.invalidate();
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
      toast.success("Agendamento criado com sucesso!");
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar agendamento");
    },
  });

  const resetForm = () => {
    setSelectedVehicle("");
    setServiceType("");
    setAppointmentDate("");
    setAppointmentTime("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedVehicle || !serviceType || !appointmentDate || !appointmentTime) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    const dateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    
    if (dateTime < new Date()) {
      toast.error("A data e hora devem ser no futuro");
      return;
    }

    createMutation.mutate({
      vehicleId: parseInt(selectedVehicle),
      serviceType,
      appointmentDate: dateTime,
    });
  };

  const upcomingAppointments = appointments?.filter(
    (apt) => new Date(apt.appointmentDate) > new Date() && apt.status !== "cancelled"
  );

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
          <h1 className="text-3xl font-bold text-gray-900">Agendar Lavagem</h1>
          <p className="text-gray-600 mt-1">Escolha seu veículo e o tipo de serviço</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Booking Form */}
          <Card>
            <CardHeader>
              <CardTitle>Novo Agendamento</CardTitle>
              <CardDescription>Preencha os dados para agendar</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="vehicle">Veículo *</Label>
                  {vehiclesLoading ? (
                    <div className="h-10 flex items-center justify-center border rounded-md">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  ) : vehicles && vehicles.length > 0 ? (
                    <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                      <SelectTrigger id="vehicle">
                        <SelectValue placeholder="Selecione um veículo" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                            {vehicle.brand} {vehicle.model} - {vehicle.plate}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg">
                      <p className="text-sm text-amber-800">
                        Você precisa cadastrar um veículo primeiro.
                      </p>
                      <Link href="/perfil">
                        <Button variant="link" className="h-auto p-0 mt-2">Ir para Meu Perfil</Button>
                      </Link>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service">Tipo de Serviço *</Label>
                  <Select
                    value={serviceType}
                    onValueChange={(value) => setServiceType(value as "simple" | "complete")}
                  >
                    <SelectTrigger id="service">
                      <SelectValue placeholder="Selecione o serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Lavagem Simples</SelectItem>
                      <SelectItem value="complete">Lavagem Completa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {serviceType && (
                  <div className="p-4 bg-blue-50 rounded-lg space-y-2">
                    <h4 className="font-medium text-blue-900 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      {serviceType === "simple" ? "Lavagem Simples" : "Lavagem Completa"}
                    </h4>
                    <p className="text-sm text-blue-800">
                      {serviceType === "simple"
                        ? "Inclui: Lavagem externa, secagem e limpeza de rodas"
                        : "Inclui: Lavagem completa externa e interna, enceramento, polimento e aspiração"}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="date">Data *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Horário *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createMutation.isPending || !vehicles || vehicles.length === 0}
                >
                  {createMutation.isPending ? "Agendando..." : "Confirmar Agendamento"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Upcoming Appointments */}
          <Card>
            <CardHeader>
              <CardTitle>Seus Agendamentos</CardTitle>
              <CardDescription>Próximos agendamentos confirmados</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingAppointments && upcomingAppointments.length > 0 ? (
                <div className="space-y-3">
                  {upcomingAppointments.map((appointment) => {
                    const vehicle = vehicles?.find((v) => v.id === appointment.vehicleId);
                    return (
                      <div
                        key={appointment.id}
                        className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Car className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {vehicle?.brand} {vehicle?.model}
                              </p>
                              <p className="text-sm text-gray-600">
                                {appointment.serviceType === "simple"
                                  ? "Lavagem Simples"
                                  : "Lavagem Completa"}
                              </p>
                            </div>
                          </div>
                          {getStatusBadge(appointment.status)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-3">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(appointment.appointmentDate).toLocaleString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Nenhum agendamento futuro</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
