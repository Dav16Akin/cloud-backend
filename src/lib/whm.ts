import axios from "axios";
import https from "https";
import qs from "qs";

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const whmClient = axios.create({
  baseURL: process.env.WHM_HOST,
  httpsAgent,
  headers: {
    Authorization: `whm ${process.env.WHM_USERNAME}:${process.env.WHM_API_TOKEN}`,
  },
  paramsSerializer: (params) => qs.stringify(params),
});

export const createCpanelSession = async (cpanelUsername: string) => {
  const response = await whmClient.get("/json-api/create_user_session", {
    params: {
      "api.version": 1,
      user: cpanelUsername,
      service: "cpaneld",
    },
  });

  console.log(response);
  

  const data = response.data.data;
  console.log(data);
  
  if (!data.url) {
    throw new Error("WHM did not return a session URL");
  }

  return data.url as string;
};

export const createDnsZone = async (domain: string, serverIp: string) => {
  const response = await whmClient.get("/json-api/adddns", {
    params: {
      "api.version": 1,
      domain,
      ip: serverIp, // the A record's target — your WHM server's IP
      trueowner: "nupatcloud",
    },
  });
 
  if (response.data.metadata.result !== 1) {
    throw new Error(`WHM failed to create DNS zone for ${domain}`);
  }
 
  return true;
};

export default whmClient;