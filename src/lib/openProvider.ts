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

export const createOpenProviderCustomerHandle = async (user: {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  streetAddress: string; // street name only, no house number
  houseNumber: string; // separate field — OpenProvider requires this split
  city: string;
  state: string;
  countryCode: string; // ISO code, e.g. "NG"
  postcode: string;
  companyName?: string;
}): Promise<string> => {
  const response = await openproviderRequest("POST", "/customers", {
    name: {
      first_name: user.firstName,
      last_name: user.lastName,
      full_name: `${user.firstName} ${user.lastName}`,
    },
    email: user.email,
    phone: {
      country_code: "+234", // hardcoded for Nigeria — revisit if you expand countries
      area_code: "0",
      subscriber_number: user.phoneNumber.replace(/\D/g, "").slice(-10),
    },
    address: {
      street: user.streetAddress,
      number: user.houseNumber,
      city: user.city,
      state: user.state,
      zipcode: user.postcode,
      country: user.countryCode,
    },
    company_name: user.companyName || undefined,
  });

  const handle = response.data?.data?.handle;
  if (!handle) {
    throw new Error("OpenProvider did not return a customer handle");
  }
  return handle as string;
};


export const registerDomainWithOpenProvider = async ({
  domainName,
  extension,
  ownerHandle,
  nameservers,
}: {
  domainName: string;
  extension: string;
  ownerHandle: string;
  nameservers?: string[];
}) => {
  const response = await openproviderRequest("POST", "/domains", {
    owner_handle: ownerHandle,
    admin_handle: ownerHandle,
    tech_handle: ownerHandle,
    billing_handle: ownerHandle,
    domain: {
      name: domainName,
      extension: extension,
    },
    period: 1,
    name_servers: (nameservers ?? []).map((ns) => ({ name: ns })),
    autorenew: "off",
  });
 
  const data = response.data?.data;
  if (!data?.id) {
    throw new Error("OpenProvider did not return a domain id — registration may have failed");
  }
 
  return {
    openproviderId: data.id as number,
    authCode: data.auth_code as string,
    status: data.status as string,
    activationDate: data.activation_date as string,
    expirationDate: data.expiration_date as string,
  };
};


export const updateDomainNameservers = async (
  openproviderId: number,
  nameservers: string[],
) => {
  const response = await openproviderRequest("PUT", `/domains/${openproviderId}`, {
    name_servers: nameservers.map((ns) => ({ name: ns })),
  });
 
  const success = response.data?.data?.success;
  if (!success) {
    throw new Error("OpenProvider did not confirm the nameserver update");
  }
 
  return true;
};

export default openproviderClient;
