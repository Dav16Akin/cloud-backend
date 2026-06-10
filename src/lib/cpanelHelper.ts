export const getCpanelResult = (responseData: any) => {
  return responseData?.cpanelresult?.result || responseData?.result;
};