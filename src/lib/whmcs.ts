import axios from 'axios';
import qs from 'qs';

const WHMCS_URL = `${process.env.WHMCS_URL}/includes/api.php`;

async function whmcsRequest(action: string, params: Record<string, any> = {}) {
  const payload = {
    identifier: process.env.WHMCS_API_IDENTIFIER,
    secret: process.env.WHMCS_API_SECRET,
    action,
    responsetype: 'json',
    ...params,
  };

  const { data } = await axios.post(WHMCS_URL, qs.stringify(payload), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  if (data.result === 'error') throw new Error(data.message);
  return data;
}

const countryCodeMap: Record<string, string> = {
  Nigeria: 'NG',
  // add more as your user base grows
};

export async function createWhmcsClient(user: {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  companyName: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postcode: string;
}) {
  const countryCode = countryCodeMap[user.country] ?? user.country;
  const data = await whmcsRequest('AddClient', {
    firstname:   user.firstName,
    lastname:    user.lastName,
    email:       user.email,
    phonenumber: user.phoneNumber,
    companyname: user.companyName,
    address1:    user.address,
    city:        user.city,
    state:       user.state,
    country:     countryCode,
    postcode:    user.postcode,
    password2:   Math.random().toString(36).slice(-10) + 'A1!',
    currency:    2, // NGN — check your WHMCS currency ID
    noemail:     true,
  });
  return data.clientid as number;
}

export async function createWhmcsInvoice(
  clientId: number,
  amount: number,
  description: string,
  paystackRef: string,
) {
  return whmcsRequest('CreateInvoice', {
    userid:      clientId,
    status:      'Unpaid',
    itemdescription1: description,
    itemamount1: amount,
    itemtaxed1:  false,
    paymentmethod: 'paystack',
    autoapplycredit: false,
  });
}

export async function markWhmcsInvoicePaid(
  invoiceId: number,
  amount: number,
  paystackRef: string,
) {
  return whmcsRequest('AddInvoicePayment', {
    invoiceid:   invoiceId,
    transid:     paystackRef,
    amount,
    gateway:     'paystack',
    noemail:     false,
  });
}

export async function getWhmcsClientInvoices(clientId: number) {
  return whmcsRequest('GetInvoices', {
    userid: clientId,
    limitnum: 50,
  });
}

export async function getWhmcsClientDetails(clientId: number) {
  return whmcsRequest('GetClientsDetails', {
    clientid: clientId,
    stats: true,
  });
}