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

export default whmClient;