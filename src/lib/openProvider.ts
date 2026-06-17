import axios from "axios";

const openproviderClient = axios.create({
  baseURL: process.env.OPENPROVIDER_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// token cache - so we don't login on every request
let cachedToken: string | null = null;
let tokenExpiry: Date | null = null;

export const getOpenProviderToken = async (): Promise<string> => {
  // return cached token if still valid
  if (cachedToken && tokenExpiry && tokenExpiry > new Date()) {
    return cachedToken;
  }

  const response = await openproviderClient.post("/auth/login", {
    username: process.env.OPENPROVIDER_USERNAME,
    password: process.env.OPENPROVIDER_PASSWORD,
  });

  if (!response.data?.data?.token) {
    throw new Error("Failed to authenticate with OpenProvider");
  }

  cachedToken = response.data.data.token;
  // token expires in 1 hour, refresh 5 mins early
  tokenExpiry = new Date(Date.now() + 55 * 60 * 1000);

  return cachedToken!;
};

export const openproviderRequest = async (
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  data?: object,
) => {
  const token = await getOpenProviderToken();

  return openproviderClient.request({
    method,
    url: path,
    headers: { Authorization: `Bearer ${token}` },
    ...(data && { data }),
  });
};

export default openproviderClient;