import { Response } from "express";
import { AuthRequest } from "../../../middleware/auth.middleware";
import { sendResp } from "../../../utils/resp";
import { HTTP_STATUS } from "../../../utils/statusCodes";
import { prisma } from "../../../lib/prisma";
import whmClient from "../../../lib/whm";

export const getHostingDatabases = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const hosting = await prisma.hostingAccount.findFirst({
      where: { id, userId: req.userId },
    });

    if (!hosting) {
      return sendResp(res, HTTP_STATUS.NOT_FOUND, "Hosting not found");
    }

    if (hosting.status !== "ACTIVE") {
      return sendResp(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Hosting account must be active to manage emails",
      );
    }

    const response = await whmClient.get("/json-api/cpanel", {
      params: {
        "api.version": 1,
        cpanel_jsonapi_user: hosting.cpanelUsername,
        cpanel_jsonapi_module: "Mysql",
        cpanel_jsonapi_func: "list_databases",
        cpanel_jsonapi_apiversion: 3,
      },
    });

    const result = response.data.result.data;

    console.log(result);

    if (!result || result.status !== 1) {
      return sendResp;
    }
  } catch (error) {
    return sendResp(
      res,
      HTTP_STATUS.SERVER_ERROR,
      "Something went wrong getting hosting databases",
      null,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};
