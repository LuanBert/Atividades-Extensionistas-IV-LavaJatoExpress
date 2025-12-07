import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, vehicles, InsertVehicle, Vehicle, appointments, InsertAppointment, Appointment, notifications, InsertNotification, Notification } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Vehicle operations
export async function getUserVehicles(userId: number): Promise<Vehicle[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(vehicles).where(eq(vehicles.userId, userId)).orderBy(desc(vehicles.createdAt));
}

export async function getVehicleById(vehicleId: number): Promise<Vehicle | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(vehicles).where(eq(vehicles.id, vehicleId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(vehicles).values(vehicle);
  const insertedId = Number(result[0].insertId);
  
  const newVehicle = await getVehicleById(insertedId);
  if (!newVehicle) throw new Error("Failed to retrieve created vehicle");
  
  return newVehicle;
}

export async function updateVehicle(vehicleId: number, data: Partial<InsertVehicle>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(vehicles).set(data).where(eq(vehicles.id, vehicleId));
}

export async function deleteVehicle(vehicleId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(vehicles).where(eq(vehicles.id, vehicleId));
}

// Appointment operations
export async function getUserAppointments(userId: number): Promise<Appointment[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(appointments).where(eq(appointments.userId, userId)).orderBy(desc(appointments.appointmentDate));
}

export async function getAppointmentById(appointmentId: number): Promise<Appointment | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(appointments).where(eq(appointments.id, appointmentId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createAppointment(appointment: InsertAppointment): Promise<Appointment> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(appointments).values(appointment);
  const insertedId = Number(result[0].insertId);
  
  const newAppointment = await getAppointmentById(insertedId);
  if (!newAppointment) throw new Error("Failed to retrieve created appointment");
  
  return newAppointment;
}

export async function updateAppointment(appointmentId: number, data: Partial<InsertAppointment>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(appointments).set(data).where(eq(appointments.id, appointmentId));
}

export async function deleteAppointment(appointmentId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(appointments).where(eq(appointments.id, appointmentId));
}

// Notification operations
export async function getUserNotifications(userId: number): Promise<Notification[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
}

export async function getUnreadNotificationCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.select().from(notifications).where(
    and(
      eq(notifications.userId, userId),
      eq(notifications.isRead, false)
    )
  );
  
  return result.length;
}

export async function createNotification(notification: InsertNotification): Promise<Notification> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(notifications).values(notification);
  const insertedId = Number(result[0].insertId);
  
  const newNotification = await db.select().from(notifications).where(eq(notifications.id, insertedId)).limit(1);
  if (!newNotification[0]) throw new Error("Failed to retrieve created notification");
  
  return newNotification[0];
}

export async function markNotificationAsRead(notificationId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, notificationId));
}

export async function markAllNotificationsAsRead(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

export async function deleteNotification(notificationId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(notifications).where(eq(notifications.id, notificationId));
}
