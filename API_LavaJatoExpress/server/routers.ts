import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  vehicles: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserVehicles(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const vehicle = await db.getVehicleById(input.id);
        if (!vehicle) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Veículo não encontrado" });
        }
        if (vehicle.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        return vehicle;
      }),

    create: protectedProcedure
      .input(z.object({
        brand: z.string().min(1, "Marca é obrigatória"),
        model: z.string().min(1, "Modelo é obrigatório"),
        plate: z.string().min(1, "Placa é obrigatória"),
        color: z.string().optional(),
        year: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const vehicle = await db.createVehicle({
          ...input,
          userId: ctx.user.id,
        });
        return vehicle;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        brand: z.string().min(1).optional(),
        model: z.string().min(1).optional(),
        plate: z.string().min(1).optional(),
        color: z.string().optional(),
        year: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        const vehicle = await db.getVehicleById(id);
        if (!vehicle) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Veículo não encontrado" });
        }
        if (vehicle.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        await db.updateVehicle(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const vehicle = await db.getVehicleById(input.id);
        if (!vehicle) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Veículo não encontrado" });
        }
        if (vehicle.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        await db.deleteVehicle(input.id);
        return { success: true };
      }),
  }),

  appointments: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserAppointments(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const appointment = await db.getAppointmentById(input.id);
        if (!appointment) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Agendamento não encontrado" });
        }
        if (appointment.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        return appointment;
      }),

    create: protectedProcedure
      .input(z.object({
        vehicleId: z.number(),
        serviceType: z.enum(["simple", "complete"]),
        appointmentDate: z.date(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Verify vehicle belongs to user
        const vehicle = await db.getVehicleById(input.vehicleId);
        if (!vehicle || vehicle.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Veículo inválido" });
        }

        const appointment = await db.createAppointment({
          ...input,
          userId: ctx.user.id,
          status: "pending",
        });

        // Create notification
        const serviceTypeText = input.serviceType === "simple" ? "Lavagem Simples" : "Lavagem Completa";
        await db.createNotification({
          userId: ctx.user.id,
          title: "Agendamento Criado",
          message: `Seu agendamento de ${serviceTypeText} para ${input.appointmentDate.toLocaleDateString('pt-BR')} foi criado com sucesso.`,
          type: "appointment",
        });

        return appointment;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        vehicleId: z.number().optional(),
        serviceType: z.enum(["simple", "complete"]).optional(),
        appointmentDate: z.date().optional(),
        status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        const appointment = await db.getAppointmentById(id);
        if (!appointment) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Agendamento não encontrado" });
        }
        if (appointment.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        
        // If updating vehicle, verify it belongs to user
        if (data.vehicleId) {
          const vehicle = await db.getVehicleById(data.vehicleId);
          if (!vehicle || vehicle.userId !== ctx.user.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Veículo inválido" });
          }
        }

        await db.updateAppointment(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const appointment = await db.getAppointmentById(input.id);
        if (!appointment) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Agendamento não encontrado" });
        }
        if (appointment.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        await db.deleteAppointment(input.id);
        return { success: true };
      }),
  }),

  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserNotifications(ctx.user.id);
    }),

    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUnreadNotificationCount(ctx.user.id);
    }),

    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const notifications = await db.getUserNotifications(ctx.user.id);
        const notification = notifications.find(n => n.id === input.id);
        if (!notification) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Notificação não encontrada" });
        }
        await db.markNotificationAsRead(input.id);
        return { success: true };
      }),

    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      await db.markAllNotificationsAsRead(ctx.user.id);
      return { success: true };
    }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const notifications = await db.getUserNotifications(ctx.user.id);
        const notification = notifications.find(n => n.id === input.id);
        if (!notification) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Notificação não encontrada" });
        }
        await db.deleteNotification(input.id);
        return { success: true };
      }),
  }),

  weather: router({
    getCurrent: publicProcedure
      .input(z.object({
        latitude: z.number(),
        longitude: z.number(),
      }))
      .query(async ({ input }) => {
        try {
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${input.latitude}&longitude=${input.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`
          );
          
          if (!response.ok) {
            throw new Error("Failed to fetch weather data");
          }
          
          const data = await response.json();
          return data;
        } catch (error) {
          throw new TRPCError({ 
            code: "INTERNAL_SERVER_ERROR", 
            message: "Erro ao buscar dados do clima" 
          });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
