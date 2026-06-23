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

export default whmClient;