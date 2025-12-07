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

function createPublicContext(): TrpcContext {
  const ctx: TrpcContext = {
    user: undefined,
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

describe("notifications procedures", () => {
  it("should list user notifications", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const notifications = await caller.notifications.list();
    
    expect(Array.isArray(notifications)).toBe(true);
  });

  it("should get unread notification count", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const count = await caller.notifications.unreadCount();
    
    expect(typeof count).toBe("number");
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

describe("weather procedures", () => {
  it("should fetch current weather data", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // São Paulo coordinates
    const weather = await caller.weather.getCurrent({
      latitude: -23.5505,
      longitude: -46.6333,
    });

    expect(weather).toBeDefined();
    expect(weather.current).toBeDefined();
    expect(weather.current.temperature_2m).toBeDefined();
    expect(typeof weather.current.temperature_2m).toBe("number");
  });
});
