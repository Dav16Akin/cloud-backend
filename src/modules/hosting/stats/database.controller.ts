import { Response } from "express";
import { AuthRequest } from "../../../middleware/auth.middleware";
import { sendResp } from "../../../utils/resp";
import { HTTP_STATUS } from "../../../utils/statusCodes";
import { prisma } from "../../../lib/prisma";
import whmClient from "../../../lib/whm";

import {
  createDatabaseSchema,
  createDatabaseUserSchema,
  assignUserSchema,
} from "../validations/database.validations";
import { getCpanelResult } from "../../../lib/cpanelHelper";

// reusable hosting lookup
const getHosting = async (id: string, userId: string) => {
  return prisma.hostingAccount.findFirst({
    where: { id, userId },
  });
};

// reusable cPanel call
const cpanelCall = (cpanelUsername: string, func: string, extra?: object) =>
  whmClient.get("/json-api/cpanel", {
    params: {
      "api.version": 1,
      cpanel_jsonapi_user: cpanelUsername,
      cpanel_jsonapi_module: "Mysql",
      cpanel_jsonapi_func: func,
      cpanel_jsonapi_apiversion: 3,
      ...extra,
    },
  });

// GET /hosting/:id/databases
export const getDatabases = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const hosting = await getHosting(id, req.userId!);
    if (!hosting) return sendResp(res, HTTP_STATUS.NOT_FOUND, "Hosting not found");
    if (hosting.status !== "ACTIVE") return sendResp(res, HTTP_STATUS.BAD_REQUEST, "Hosting account must be active");

    const response = await cpanelCall(hosting.cpanelUsername, "list_databases");
    const result = getCpanelResult(response.data);

    if (!result || result.status !== 1) {
      return sendResp(res, HTTP_STATUS.SERVER_ERROR, "Failed to get databases");
    }

    return sendResp(res, HTTP_STATUS.OK, "", result.data ?? []);
  } catch (error) {
    return sendResp(res, HTTP_STATUS.SERVER_ERROR, "Something went wrong getting databases",
      null, error instanceof Error ? error.message : "Unknown error");
  }
};

// POST /hosting/:id/databases
export const createDatabase = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = createDatabaseSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendResp(res, HTTP_STATUS.BAD_REQUEST, "Invalid input", null,
        parsed.error.issues.map((e) => e.message));
    }

    const { id } = req.params as { id: string };
    const hosting = await getHosting(id, req.userId!);
    if (!hosting) return sendResp(res, HTTP_STATUS.NOT_FOUND, "Hosting not found");
    if (hosting.status !== "ACTIVE") return sendResp(res, HTTP_STATUS.BAD_REQUEST, "Hosting account must be active");

    // cPanel auto prefixes but we do it explicitly for clarity
    const dbName = `${hosting.cpanelUsername}_${parsed.data.name}`;

    const response = await cpanelCall(hosting.cpanelUsername, "create_database", {
      name: dbName,
    });

    const result = getCpanelResult(response.data);
    if (!result || result.status !== 1) {
      return sendResp(res, HTTP_STATUS.SERVER_ERROR,
        result?.errors?.[0] || "Failed to create database");
    }

    return sendResp(res, HTTP_STATUS.CREATED, "Database created", {
      database: dbName,
      host: "localhost",
      port: 3306,
    });
  } catch (error) {
    return sendResp(res, HTTP_STATUS.SERVER_ERROR, "Something went wrong creating database",
      null, error instanceof Error ? error.message : "Unknown error");
  }
};

// DELETE /hosting/:id/databases/:database
export const deleteDatabase = async (req: AuthRequest, res: Response) => {
  try {
    const { id, database } = req.params as { id: string; database: string };

    const hosting = await getHosting(id, req.userId!);
    if (!hosting) return sendResp(res, HTTP_STATUS.NOT_FOUND, "Hosting not found");
    if (hosting.status !== "ACTIVE") return sendResp(res, HTTP_STATUS.BAD_REQUEST, "Hosting account must be active");

    const response = await cpanelCall(hosting.cpanelUsername, "delete_database", {
      name: decodeURIComponent(database),
    });

    const result = getCpanelResult(response.data);
    if (!result || result.status !== 1) {
      return sendResp(res, HTTP_STATUS.SERVER_ERROR,
        result?.errors?.[0] || "Failed to delete database");
    }

    return sendResp(res, HTTP_STATUS.OK, "Database deleted successfully");
  } catch (error) {
    return sendResp(res, HTTP_STATUS.SERVER_ERROR, "Something went wrong deleting database",
      null, error instanceof Error ? error.message : "Unknown error");
  }
};

// GET /hosting/:id/databases/users
export const getDatabaseUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const hosting = await getHosting(id, req.userId!);
    if (!hosting) return sendResp(res, HTTP_STATUS.NOT_FOUND, "Hosting not found");
    if (hosting.status !== "ACTIVE") return sendResp(res, HTTP_STATUS.BAD_REQUEST, "Hosting account must be active");

    const response = await cpanelCall(hosting.cpanelUsername, "list_users");
    const result = getCpanelResult(response.data);

    if (!result || result.status !== 1) {
      return sendResp(res, HTTP_STATUS.SERVER_ERROR, "Failed to get database users");
    }

    return sendResp(res, HTTP_STATUS.OK, "", result.data ?? []);
  } catch (error) {
    return sendResp(res, HTTP_STATUS.SERVER_ERROR, "Something went wrong getting database users",
      null, error instanceof Error ? error.message : "Unknown error");
  }
};

// POST /hosting/:id/databases/users
export const createDatabaseUser = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = createDatabaseUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendResp(res, HTTP_STATUS.BAD_REQUEST, "Invalid input", null,
        parsed.error.issues.map((e) => e.message));
    }

    const { id } = req.params as { id: string };
    const hosting = await getHosting(id, req.userId!);
    if (!hosting) return sendResp(res, HTTP_STATUS.NOT_FOUND, "Hosting not found");
    if (hosting.status !== "ACTIVE") return sendResp(res, HTTP_STATUS.BAD_REQUEST, "Hosting account must be active");

    const username = `${hosting.cpanelUsername}_${parsed.data.username}`;

    const response = await cpanelCall(hosting.cpanelUsername, "create_user", {
      name: username,
      password: parsed.data.password,
    });

    const result = getCpanelResult(response.data);
    if (!result || result.status !== 1) {
      return sendResp(res, HTTP_STATUS.SERVER_ERROR,
        result?.errors?.[0] || "Failed to create database user");
    }

    return sendResp(res, HTTP_STATUS.CREATED, "Database user created", {
      username,
    });
  } catch (error) {
    return sendResp(res, HTTP_STATUS.SERVER_ERROR, "Something went wrong creating database user",
      null, error instanceof Error ? error.message : "Unknown error");
  }
};

// DELETE /hosting/:id/databases/users/:user
export const deleteDatabaseUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id, user } = req.params as { id: string; user: string };

    const hosting = await getHosting(id, req.userId!);
    if (!hosting) return sendResp(res, HTTP_STATUS.NOT_FOUND, "Hosting not found");
    if (hosting.status !== "ACTIVE") return sendResp(res, HTTP_STATUS.BAD_REQUEST, "Hosting account must be active");

    const response = await cpanelCall(hosting.cpanelUsername, "delete_user", {
      name: decodeURIComponent(user),
    });

    const result = getCpanelResult(response.data);
    if (!result || result.status !== 1) {
      return sendResp(res, HTTP_STATUS.SERVER_ERROR,
        result?.errors?.[0] || "Failed to delete database user");
    }

    return sendResp(res, HTTP_STATUS.OK, "Database user deleted successfully");
  } catch (error) {
    return sendResp(res, HTTP_STATUS.SERVER_ERROR, "Something went wrong deleting database user",
      null, error instanceof Error ? error.message : "Unknown error");
  }
};

// POST /hosting/:id/databases/users/assign
export const assignUserToDatabase = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = assignUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendResp(res, HTTP_STATUS.BAD_REQUEST, "Invalid input", null,
        parsed.error.issues.map((e) => e.message));
    }

    const { id } = req.params as { id: string };
    const hosting = await getHosting(id, req.userId!);
    if (!hosting) return sendResp(res, HTTP_STATUS.NOT_FOUND, "Hosting not found");
    if (hosting.status !== "ACTIVE") return sendResp(res, HTTP_STATUS.BAD_REQUEST, "Hosting account must be active");

    const response = await cpanelCall(hosting.cpanelUsername, "set_privileges_on_database", {
      user: parsed.data.username,
      database: parsed.data.database,
      privileges: parsed.data.privileges,
    });

    const result = getCpanelResult(response.data);
    if (!result || result.status !== 1) {
      return sendResp(res, HTTP_STATUS.SERVER_ERROR,
        result?.errors?.[0] || "Failed to assign user to database");
    }

    return sendResp(res, HTTP_STATUS.OK, "User assigned to database successfully");
  } catch (error) {
    return sendResp(res, HTTP_STATUS.SERVER_ERROR, "Something went wrong assigning user to database",
      null, error instanceof Error ? error.message : "Unknown error");
  }
};