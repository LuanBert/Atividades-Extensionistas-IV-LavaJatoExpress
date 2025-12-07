import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("appointments procedures", () => {
  it("should list user appointments", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const appointments = await caller.appointments.list();
    
    expect(Array.isArray(appointments)).toBe(true);
  });

  it("should create an appointment", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create a vehicle
    const vehicle = await caller.vehicles.create({
      brand: "Honda",
      model: "Civic",
      plate: "XYZ-5678",
    });

    const appointmentDate = new Date();
    appointmentDate.setDate(appointmentDate.getDate() + 7); // 7 days from now

    const appointment = await caller.appointments.create({
      vehicleId: vehicle.id,
      serviceType: "simple",
      appointmentDate,
    });

    expect(appointment).toBeDefined();
    expect(appointment.vehicleId).toBe(vehicle.id);
    expect(appointment.serviceType).toBe("simple");
    expect(appointment.status).toBe("pending");
  });
});
