import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { HTTP_STATUS } from '../../utils/statusCodes';
import { sendResp } from '../../utils/resp';
import { prisma } from '../../lib/prisma';
import { getWhmcsClientInvoices, getWhmcsClientDetails } from '../../lib/whmcs';

export const getBillingOverview = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user?.whmcsClientId) {
      return sendResp(res, HTTP_STATUS.NOT_FOUND, 'Billing account not found');
    }

    const [invoices, details] = await Promise.all([
      getWhmcsClientInvoices(user.whmcsClientId),
      getWhmcsClientDetails(user.whmcsClientId),
    ]);

    return sendResp(res, HTTP_STATUS.OK, '', {
      invoices: invoices.invoices?.invoice || [],
      totalInvoices: invoices.totalresults,
      creditBalance: details.client?.credit,
      currency: details.client?.currency_code,
    });
  } catch (error) {
    return sendResp(
      res,
      HTTP_STATUS.SERVER_ERROR,
      'Failed to fetch billing data',
      null,
      error instanceof Error ? error.message : 'Unknown error',
    );
  }
};