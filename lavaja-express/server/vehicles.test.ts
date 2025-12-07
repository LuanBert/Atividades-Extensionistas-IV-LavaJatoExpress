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

describe("vehicles procedures", () => {
  it("should list user vehicles", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const vehicles = await caller.vehicles.list();
    
    expect(Array.isArray(vehicles)).toBe(true);
  });

  it("should create a vehicle", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const vehicleData = {
      brand: "Toyota",
      model: "Corolla",
      plate: "ABC-1234",
      color: "Prata",
      year: 2020,
    };

    const vehicle = await caller.vehicles.create(vehicleData);

    expect(vehicle).toBeDefined();
    expect(vehicle.brand).toBe(vehicleData.brand);
    expect(vehicle.model).toBe(vehicleData.model);
    expect(vehicle.plate).toBe(vehicleData.plate);
  });
});
