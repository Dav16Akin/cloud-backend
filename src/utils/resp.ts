import { Response } from "express";

export const sendResp = (
  res: Response,
  status: number,
  message: string,
  data: any = null,
  error: any = null,
) => {
  return res.status(status).json({
    success: status < 400,
    message,
    data,
    error
  });
};
