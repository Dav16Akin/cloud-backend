--
-- PostgreSQL database dump
--

\restrict w2yRC7xwk2z0NtIr3jEk1V2s66lpimTtvn6ZJhYl1eNBRhyhC4dF9tXhbf7cB1L

-- Dumped from database version 17.10 (9f6157c)
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: neon_auth; Type: SCHEMA; Schema: -; Owner: neon_auth
--

CREATE SCHEMA neon_auth;


ALTER SCHEMA neon_auth OWNER TO neon_auth;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: neondb_owner
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO neondb_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: neondb_owner
--

COMMENT ON SCHEMA public IS '';


--
-- Name: DomainStatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."DomainStatus" AS ENUM (
    'PENDING',
    'ACTIVE',
    'EXPIRED',
    'TRANSFERRED_OUT',
    'CANCELLED'
);


ALTER TYPE public."DomainStatus" OWNER TO neondb_owner;

--
-- Name: HostingStatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."HostingStatus" AS ENUM (
    'ACTIVE',
    'SUSPENDED',
    'TERMINATED',
    'PENDING'
);


ALTER TYPE public."HostingStatus" OWNER TO neondb_owner;

--
-- Name: OrderItemType; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."OrderItemType" AS ENUM (
    'HOSTING',
    'DOMAIN',
    'SSL'
);


ALTER TYPE public."OrderItemType" OWNER TO neondb_owner;

--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'PENDING',
    'PAID',
    'FAILED',
    'REFUNDED'
);


ALTER TYPE public."OrderStatus" OWNER TO neondb_owner;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."Role" AS ENUM (
    'USER',
    'ADMIN',
    'SUPPORT'
);


ALTER TYPE public."Role" OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth.account (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "accountId" text NOT NULL,
    "providerId" text NOT NULL,
    "userId" uuid NOT NULL,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "accessTokenExpiresAt" timestamp with time zone,
    "refreshTokenExpiresAt" timestamp with time zone,
    scope text,
    password text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE neon_auth.account OWNER TO neon_auth;

--
-- Name: invitation; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth.invitation (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "organizationId" uuid NOT NULL,
    email text NOT NULL,
    role text,
    status text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "inviterId" uuid NOT NULL
);


ALTER TABLE neon_auth.invitation OWNER TO neon_auth;

--
-- Name: jwks; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth.jwks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "publicKey" text NOT NULL,
    "privateKey" text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "expiresAt" timestamp with time zone
);


ALTER TABLE neon_auth.jwks OWNER TO neon_auth;

--
-- Name: member; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth.member (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "organizationId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    role text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL
);


ALTER TABLE neon_auth.member OWNER TO neon_auth;

--
-- Name: organization; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth.organization (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    logo text,
    "createdAt" timestamp with time zone NOT NULL,
    metadata text
);


ALTER TABLE neon_auth.organization OWNER TO neon_auth;

--
-- Name: project_config; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth.project_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    endpoint_id text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    trusted_origins jsonb NOT NULL,
    social_providers jsonb NOT NULL,
    email_provider jsonb,
    email_and_password jsonb,
    allow_localhost boolean NOT NULL,
    plugin_configs jsonb,
    webhook_config jsonb
);


ALTER TABLE neon_auth.project_config OWNER TO neon_auth;

--
-- Name: session; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth.session (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    token text NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "userId" uuid NOT NULL,
    "impersonatedBy" text,
    "activeOrganizationId" text
);


ALTER TABLE neon_auth.session OWNER TO neon_auth;

--
-- Name: user; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth."user" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    "emailVerified" boolean NOT NULL,
    image text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    role text,
    banned boolean,
    "banReason" text,
    "banExpires" timestamp with time zone
);


ALTER TABLE neon_auth."user" OWNER TO neon_auth;

--
-- Name: verification; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth.verification (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    identifier text NOT NULL,
    value text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE neon_auth.verification OWNER TO neon_auth;

--
-- Name: Domain; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Domain" (
    id text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    extension text NOT NULL,
    "openproviderId" integer,
    "authCode" text,
    status public."DomainStatus" DEFAULT 'PENDING'::public."DomainStatus" NOT NULL,
    "autoRenew" boolean DEFAULT true NOT NULL,
    nameservers text[],
    "registeredAt" timestamp(3) without time zone,
    "expiresAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "orderItemId" text
);


ALTER TABLE public."Domain" OWNER TO neondb_owner;

--
-- Name: HostingAccount; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."HostingAccount" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "planId" text NOT NULL,
    "cpanelUsername" text NOT NULL,
    domain text NOT NULL,
    "serverIp" text NOT NULL,
    status public."HostingStatus" DEFAULT 'ACTIVE'::public."HostingStatus" NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "orderItemId" text
);


ALTER TABLE public."HostingAccount" OWNER TO neondb_owner;

--
-- Name: OTP; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."OTP" (
    id text NOT NULL,
    "userId" text NOT NULL,
    code text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    attempts integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."OTP" OWNER TO neondb_owner;

--
-- Name: Order; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Order" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "planId" text,
    amount double precision NOT NULL,
    status public."OrderStatus" DEFAULT 'PENDING'::public."OrderStatus" NOT NULL,
    "paystackRef" text NOT NULL,
    "paystackData" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Order" OWNER TO neondb_owner;

--
-- Name: OrderItem; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."OrderItem" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    type public."OrderItemType" NOT NULL,
    price double precision NOT NULL,
    "planId" text,
    "domainName" text,
    "hostingAccountId" text,
    "domainId" text
);


ALTER TABLE public."OrderItem" OWNER TO neondb_owner;

--
-- Name: Plan; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Plan" (
    id text NOT NULL,
    name text NOT NULL,
    price double precision NOT NULL,
    "billingCycle" text NOT NULL,
    storage text NOT NULL,
    bandwidth text NOT NULL,
    websites integer NOT NULL,
    emails integer NOT NULL,
    features text[],
    "isPopular" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Plan" OWNER TO neondb_owner;

--
-- Name: RefreshToken; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."RefreshToken" (
    id text NOT NULL,
    token text NOT NULL,
    "userId" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."RefreshToken" OWNER TO neondb_owner;

--
-- Name: User; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role public."Role" DEFAULT 'USER'::public."Role" NOT NULL,
    verified boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "phoneNumber" text NOT NULL,
    address text NOT NULL,
    city text NOT NULL,
    "companyName" text NOT NULL,
    country text NOT NULL,
    "firstName" text NOT NULL,
    "houseNumber" text NOT NULL,
    "lastName" text NOT NULL,
    "openproviderHandle" text,
    postcode text NOT NULL,
    state text NOT NULL,
    "whmcsClientId" integer
);


ALTER TABLE public."User" OWNER TO neondb_owner;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO neondb_owner;

--
-- Data for Name: account; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.account (id, "accountId", "providerId", "userId", "accessToken", "refreshToken", "idToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", scope, password, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: invitation; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.invitation (id, "organizationId", email, role, status, "expiresAt", "createdAt", "inviterId") FROM stdin;
\.


--
-- Data for Name: jwks; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.jwks (id, "publicKey", "privateKey", "createdAt", "expiresAt") FROM stdin;
\.


--
-- Data for Name: member; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.member (id, "organizationId", "userId", role, "createdAt") FROM stdin;
\.


--
-- Data for Name: organization; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.organization (id, name, slug, logo, "createdAt", metadata) FROM stdin;
\.


--
-- Data for Name: project_config; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.project_config (id, name, endpoint_id, created_at, updated_at, trusted_origins, social_providers, email_provider, email_and_password, allow_localhost, plugin_configs, webhook_config) FROM stdin;
e3919648-bbc6-417d-8277-2e435a9386cb	nupat-cloud-db	ep-fancy-block-aqqocq7i	2026-05-12 22:24:29.163+00	2026-05-12 22:24:29.163+00	[]	[{"id": "google", "isShared": true}]	{"type": "shared"}	{"enabled": true, "disableSignUp": false, "emailVerificationMethod": "otp", "requireEmailVerification": false, "autoSignInAfterVerification": true, "sendVerificationEmailOnSignIn": false, "sendVerificationEmailOnSignUp": false}	t	{"magicLink": {"config": {"expiresIn": 5, "disableSignUp": false}, "enabled": false}, "phoneNumber": {"config": {"otp_expires_in": 300, "allowed_attempts": 3}, "enabled": false}, "organization": {"config": {"creatorRole": "owner", "membershipLimit": 100, "organizationLimit": 10, "sendInvitationEmail": false}, "enabled": true}}	{"enabled": false, "enabledEvents": [], "timeoutSeconds": 5}
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.session (id, "expiresAt", token, "createdAt", "updatedAt", "ipAddress", "userAgent", "userId", "impersonatedBy", "activeOrganizationId") FROM stdin;
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth."user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt", role, banned, "banReason", "banExpires") FROM stdin;
\.


--
-- Data for Name: verification; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.verification (id, identifier, value, "expiresAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Domain; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Domain" (id, "userId", name, extension, "openproviderId", "authCode", status, "autoRenew", nameservers, "registeredAt", "expiresAt", "createdAt", "updatedAt", "orderItemId") FROM stdin;
cmqmahd3m0002zxruw5liieov	cmqm822nx00009crukyb06ybf	akindav.com	com	29734312	1qj1F%8#L$Po	ACTIVE	t	\N	2026-06-20 10:43:28	2027-06-20 10:43:28	2026-06-20 11:43:33.01	2026-06-20 11:43:33.01	cmqmagy8j0001zxruvq8zqcg1
\.


--
-- Data for Name: HostingAccount; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."HostingAccount" (id, "userId", "planId", "cpanelUsername", domain, "serverIp", status, "expiresAt", "createdAt", "updatedAt", "orderItemId") FROM stdin;
cmqsycqm2000223ru3ce2kfo5	cmqm822nx00009crukyb06ybf	cmqm5fvx20000r5ru44e7b4il	akin5056	akindav.com	https://178.105.218.165:2087	ACTIVE	2027-06-25 03:38:25.079	2026-06-25 03:38:25.083	2026-06-25 03:38:25.083	cmqsyav71000123ru5w3azn7f
cmqtgjaoq0004mpru6fyxa5fb	cmqm822nx00009crukyb06ybf	cmqm5fvx20000r5ru44e7b4il	akin3094	nupatworld.ng	https://host.nupatcloud.com:2087	ACTIVE	2027-06-25 12:07:24.12	2026-06-25 12:07:24.122	2026-06-25 12:07:24.122	cmqtgi8f60003mpruqgrwzk81
\.


--
-- Data for Name: OTP; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."OTP" (id, "userId", code, "expiresAt", "createdAt", attempts) FROM stdin;
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Order" (id, "userId", "planId", amount, status, "paystackRef", "paystackData", "createdAt", "updatedAt") FROM stdin;
cmqm842xb00029crur51hdum9	cmqm822nx00009crukyb06ybf	\N	62613	PAID	0i1fz6xlyx	{"id": 6280523974, "log": {"input": [], "errors": 0, "mobile": false, "history": [{"time": 13, "type": "action", "message": "Attempted to pay with card"}, {"time": 13, "type": "success", "message": "Successfully paid with card"}], "success": true, "attempts": 1, "start_time": 1781951838, "time_spent": 13}, "fees": 103920, "plan": null, "split": {}, "amount": 6261300, "domain": "test", "paidAt": "2026-06-20T10:37:31.000Z", "source": null, "status": "success", "channel": "card", "connect": null, "message": null, "paid_at": "2026-06-20T10:37:31.000Z", "currency": "NGN", "customer": {"id": 213106301, "email": "akindav16@gmail.com", "phone": "", "metadata": null, "last_name": "", "first_name": "", "risk_action": "default", "customer_code": "CUS_2ij5op6f22qhg91", "international_format_phone": null}, "metadata": {"userId": "cmqm822nx00009crukyb06ybf", "referrer": "http://localhost:3000/"}, "order_id": null, "createdAt": "2026-06-20T10:37:13.000Z", "reference": "0i1fz6xlyx", "created_at": "2026-06-20T10:37:13.000Z", "fees_split": null, "ip_address": "102.219.155.13", "subaccount": {}, "plan_object": {}, "authorization": {"bin": "408408", "bank": "TEST BANK", "brand": "visa", "last4": "4081", "channel": "card", "exp_year": "2030", "reusable": true, "card_type": "visa ", "exp_month": "12", "signature": "SIG_aKZKOsvCzrIbdzjtDDlQ", "account_name": null, "country_code": "NG", "receiver_bank": null, "authorization_code": "AUTH_s9h2uu948q", "receiver_bank_account_number": null}, "response_code": "00", "fees_breakdown": null, "receipt_number": null, "gateway_response": "Successful", "requested_amount": 6261300, "transaction_date": "2026-06-20T10:37:13.000Z", "pos_transaction_data": null, "gateway_response_code": "approved"}	2026-06-20 10:37:14.063	2026-06-20 10:37:35.86
cmqmagy3g0000zxru6yvtpu73	cmqm822nx00009crukyb06ybf	\N	14679	PAID	j4zkhtj91w	{"id": 6280763793, "log": {"input": [], "errors": 0, "mobile": false, "history": [{"time": 3, "type": "action", "message": "Attempted to pay with card"}, {"time": 3, "type": "success", "message": "Successfully paid with card"}], "success": true, "attempts": 1, "start_time": 1781955797, "time_spent": 3}, "fees": 32019, "plan": null, "split": {}, "amount": 1467900, "domain": "test", "paidAt": "2026-06-20T11:43:20.000Z", "source": null, "status": "success", "channel": "card", "connect": null, "message": null, "paid_at": "2026-06-20T11:43:20.000Z", "currency": "NGN", "customer": {"id": 213106301, "email": "akindav16@gmail.com", "phone": "", "metadata": null, "last_name": "", "first_name": "", "risk_action": "default", "customer_code": "CUS_2ij5op6f22qhg91", "international_format_phone": null}, "metadata": {"userId": "cmqm822nx00009crukyb06ybf", "referrer": "http://localhost:3000/"}, "order_id": null, "createdAt": "2026-06-20T11:43:13.000Z", "reference": "j4zkhtj91w", "created_at": "2026-06-20T11:43:13.000Z", "fees_split": null, "ip_address": "102.219.155.13", "subaccount": {}, "plan_object": {}, "authorization": {"bin": "408408", "bank": "TEST BANK", "brand": "visa", "last4": "4081", "channel": "card", "exp_year": "2030", "reusable": true, "card_type": "visa ", "exp_month": "12", "signature": "SIG_aKZKOsvCzrIbdzjtDDlQ", "account_name": null, "country_code": "NG", "receiver_bank": null, "authorization_code": "AUTH_fq4kwk2tx2", "receiver_bank_account_number": null}, "response_code": "00", "fees_breakdown": null, "receipt_number": null, "gateway_response": "Successful", "requested_amount": 1467900, "transaction_date": "2026-06-20T11:43:13.000Z", "pos_transaction_data": null, "gateway_response_code": "approved"}	2026-06-20 11:43:13.564	2026-06-20 11:43:25.633
cmqsxswkc0001dmru3ionu0zj	cmqm822nx00009crukyb06ybf	\N	30000	PENDING	wtiwmcyhq0	\N	2026-06-25 03:22:59.677	2026-06-25 03:22:59.677
cmqsyauvf000023ru2661chl0	cmqm822nx00009crukyb06ybf	\N	30000	PAID	bxt5xx857k	{"id": 6296547564, "log": {"input": [], "errors": 0, "mobile": true, "history": [{"time": 3, "type": "action", "message": "Set payment method to: card"}, {"time": 6, "type": "action", "message": "Attempted to pay with card"}, {"time": 6, "type": "success", "message": "Successfully paid with card"}], "success": true, "attempts": 1, "start_time": 1782358622, "time_spent": 6}, "fees": 55000, "plan": null, "split": {}, "amount": 3000000, "domain": "test", "paidAt": "2026-06-25T03:37:08.000Z", "source": null, "status": "success", "channel": "card", "connect": null, "message": null, "paid_at": "2026-06-25T03:37:08.000Z", "currency": "NGN", "customer": {"id": 213106301, "email": "akindav16@gmail.com", "phone": "", "metadata": null, "last_name": "", "first_name": "", "risk_action": "default", "customer_code": "CUS_2ij5op6f22qhg91", "international_format_phone": null}, "metadata": {"userId": "cmqm822nx00009crukyb06ybf", "referrer": "http://localhost:3000/"}, "order_id": null, "createdAt": "2026-06-25T03:36:56.000Z", "reference": "bxt5xx857k", "created_at": "2026-06-25T03:36:56.000Z", "fees_split": null, "ip_address": "197.211.59.185", "subaccount": {}, "plan_object": {}, "authorization": {"bin": "408408", "bank": "TEST BANK", "brand": "visa", "last4": "4081", "channel": "card", "exp_year": "2030", "reusable": true, "card_type": "visa ", "exp_month": "12", "signature": "SIG_aKZKOsvCzrIbdzjtDDlQ", "account_name": null, "country_code": "NG", "receiver_bank": null, "authorization_code": "AUTH_1xvl5f3kr5", "receiver_bank_account_number": null}, "response_code": "00", "fees_breakdown": null, "receipt_number": null, "gateway_response": "Successful", "requested_amount": 3000000, "transaction_date": "2026-06-25T03:36:56.000Z", "pos_transaction_data": null, "gateway_response_code": "approved"}	2026-06-25 03:36:57.291	2026-06-25 03:37:15.36
cmqtfrtev0000mpruwp18bq4z	cmqm822nx00009crukyb06ybf	\N	30000	PENDING	z5gzrfbk3m	\N	2026-06-25 11:46:02.023	2026-06-25 11:46:02.023
cmqtgi7ui0002mpruy7phbe40	cmqm822nx00009crukyb06ybf	\N	30000	PAID	c03rhjmo16	{"id": 6297894757, "log": {"input": [], "errors": 0, "mobile": false, "history": [{"time": 2, "type": "action", "message": "Attempted to pay with card"}, {"time": 3, "type": "success", "message": "Successfully paid with card"}], "success": true, "attempts": 1, "start_time": 1782389198, "time_spent": 3}, "fees": 55000, "plan": null, "split": {}, "amount": 3000000, "domain": "test", "paidAt": "2026-06-25T12:06:40.000Z", "source": null, "status": "success", "channel": "card", "connect": null, "message": null, "paid_at": "2026-06-25T12:06:40.000Z", "currency": "NGN", "customer": {"id": 213106301, "email": "akindav16@gmail.com", "phone": "", "metadata": null, "last_name": "", "first_name": "", "risk_action": "default", "customer_code": "CUS_2ij5op6f22qhg91", "international_format_phone": null}, "metadata": {"userId": "cmqm822nx00009crukyb06ybf", "referrer": "http://localhost:3000/"}, "order_id": null, "createdAt": "2026-06-25T12:06:33.000Z", "reference": "c03rhjmo16", "created_at": "2026-06-25T12:06:33.000Z", "fees_split": null, "ip_address": "102.88.109.202", "subaccount": {}, "plan_object": {}, "authorization": {"bin": "408408", "bank": "TEST BANK", "brand": "visa", "last4": "4081", "channel": "card", "exp_year": "2030", "reusable": true, "card_type": "visa ", "exp_month": "12", "signature": "SIG_aKZKOsvCzrIbdzjtDDlQ", "account_name": null, "country_code": "NG", "receiver_bank": null, "authorization_code": "AUTH_h3zs02rtmj", "receiver_bank_account_number": null}, "response_code": "00", "fees_breakdown": null, "receipt_number": null, "gateway_response": "Successful", "requested_amount": 3000000, "transaction_date": "2026-06-25T12:06:33.000Z", "pos_transaction_data": null, "gateway_response_code": "approved"}	2026-06-25 12:06:33.787	2026-06-25 12:06:49.391
\.


--
-- Data for Name: OrderItem; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."OrderItem" (id, "orderId", type, price, "planId", "domainName", "hostingAccountId", "domainId") FROM stdin;
cmqm843p900049cruhjchgnrb	cmqm842xb00029crur51hdum9	HOSTING	30000	cmqm5fvx20000r5ru44e7b4il	\N	\N	\N
cmqmagy8j0001zxruvq8zqcg1	cmqmagy3g0000zxru6yvtpu73	DOMAIN	14679	\N	akindav.com	\N	\N
cmqsyav71000123ru5w3azn7f	cmqsyauvf000023ru2661chl0	HOSTING	30000	cmqm5fvx20000r5ru44e7b4il	\N	\N	\N
cmqtfrtsy0001mpruly6ooztl	cmqtfrtev0000mpruwp18bq4z	HOSTING	30000	cmqm5fvx20000r5ru44e7b4il	\N	\N	\N
cmqtgi8f60003mpruqgrwzk81	cmqtgi7ui0002mpruy7phbe40	HOSTING	30000	cmqm5fvx20000r5ru44e7b4il	\N	\N	\N
\.


--
-- Data for Name: Plan; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Plan" (id, name, price, "billingCycle", storage, bandwidth, websites, emails, features, "isPopular", "isActive", "createdAt", "updatedAt") FROM stdin;
cmqm5fvx20000r5ru44e7b4il	Starter	30000	yearly	2GB SSD	10GB	1	2	{"Free SSL Certificate","Daily Backups","cPanel Access","24/7 Monitoring"}	f	t	2026-06-20 09:22:26.006	2026-06-20 09:22:26.006
cmqm5fvx40001r5ruk7esbeys	Business	100000	yearly	10GB SSD	50GB	5	10	{"Free SSL Certificate","Daily Backups","Priority Support","Enhanced Performance"}	t	t	2026-06-20 09:22:26.006	2026-06-20 09:22:26.006
cmqm5fvx40002r5rurekio07y	Agency	250000	yearly	50GB SSD	Unlimited	999	999	{"White-label Support","Dedicated Resources","Advanced Security","Priority Infrastructure"}	f	t	2026-06-20 09:22:26.006	2026-06-20 09:22:26.006
\.


--
-- Data for Name: RefreshToken; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."RefreshToken" (id, token, "userId", "expiresAt", "createdAt") FROM stdin;
cmqp7n2s6000104jyxgg5fj2v	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbXFwN202MWkwMDAwMDRqeTMybzdmZTdrIiwiaWF0IjoxNzgyMTMyNDM5LCJleHAiOjE3ODI3MzcyMzl9.vr33ot724v7aUtmjT1d6-DBpCF7Q6M-AvwZLGf3-qNA	cmqp7m61i000004jy32o7fe7k	2026-06-29 12:47:19.253	2026-06-22 12:47:19.254
cmqqoc76d0000uhruh8a3i1y8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbXFwN202MWkwMDAwMDRqeTMybzdmZTdrIiwiaWF0IjoxNzgyMjIwOTUxLCJleHAiOjE3ODI4MjU3NTF9.7-aUNRaYJ5UF-LGTfaRo-i6JzC8QQCJH6DIvSrkc7U8	cmqp7m61i000004jy32o7fe7k	2026-06-30 13:22:31.375	2026-06-23 13:22:31.381
cmqqr6co80000uaru15hoq3hz	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbXFtODIybngwMDAwOWNydWt5YjA2eWJmIiwiaWF0IjoxNzgyMjI1NzE3LCJleHAiOjE3ODI4MzA1MTd9.Teb9kH_7BZTH-udGlRIDg946ZwJlH42yMqYDCHZ-NQI	cmqm822nx00009crukyb06ybf	2026-06-30 14:41:57.41	2026-06-23 14:41:57.416
cmqswhzlv000004kzgwzjztd8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbXFtODIybngwMDAwOWNydWt5YjA2eWJmIiwiaWF0IjoxNzgyMzU1NTkwLCJleHAiOjE3ODI5NjAzOTB9.UQZhmFPP8C8K6Q9r1hdkTwagH-Iyj17zSFIGThQeZEk	cmqm822nx00009crukyb06ybf	2026-07-02 02:46:30.782	2026-06-25 02:46:30.788
cmqtxa4ey00008zrug0rpfsu5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbXFtODIybngwMDAwOWNydWt5YjA2eWJmIiwiaWF0IjoxNzgyNDE3MzY5LCJleHAiOjE3ODMwMjIxNjl9.P3oMcc0NbTR9e2pW_17Tn0Nm8MsHHYVHILTqmI6tUMU	cmqm822nx00009crukyb06ybf	2026-07-02 19:56:09.557	2026-06-25 19:56:09.562
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."User" (id, email, password, role, verified, "createdAt", "updatedAt", "phoneNumber", address, city, "companyName", country, "firstName", "houseNumber", "lastName", "openproviderHandle", postcode, state, "whmcsClientId") FROM stdin;
cmqp7m61i000004jy32o7fe7k	ugwufranklee@gmail.com	$2b$10$Eqpu8dJSqjtwBlCqA9hFM.upHKNZerGQ5x7oY/E7cFFmcRV5n.1k6	USER	t	2026-06-22 12:46:36.822	2026-06-23 13:31:32.287	+2349035243194	Lagos	Lagos	DC Datalab 	Nigeria	Ugwu	19	frank	UF904650-NG	100006	Lagos	\N
cmqm822nx00009crukyb06ybf	akindav16@gmail.com	$2b$10$0/p7m1hjW.EI/oU5ARH6OeMmZI3nBvq3UF5Ds5COisXaWfox8IEoC	USER	t	2026-06-20 10:35:40.413	2026-06-23 14:53:16.879	+2348140397106	Ayodele Fanoiki Street	Magodo G.R.A	DevSimplified	Nigeria	Akinloluwa	40	Oluwaleye	AO921406-NG	100248	Lagos	\N
cmqrwnq0v0000dmrui21dhrbp	akin200317@gmail.com	$2b$10$woN3XPcSLI3VEAGD9gl45eK4GJEFbAWP6t5UFcDA8ieMlErUIUjgG	USER	t	2026-06-24 10:03:12.127	2026-06-24 10:04:03.032	08140397106	communtity road	Lagos	nupat	Nigeria	david	4	akin	\N	100001	Lagos	6
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
6f93e102-5b0b-459a-a184-2dd8077cb8c5	2d37bae62ff6ed44a77fddbe4eecf9c41925feca63121ade77c1d17d11e86bfe	2026-06-20 09:19:41.056898+00	20260512224306_init	\N	\N	2026-06-20 09:19:39.804288+00	1
4cca94cb-f399-402d-88da-e824ed556094	db6997f95bc14557702a166a4598a554ec1bfd3a8e4ae2d01f282ab2497d6985	2026-06-20 09:19:42.285891+00	20260513125337_add_phone_number	\N	\N	2026-06-20 09:19:41.412227+00	1
\.


--
-- Name: account account_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.account
    ADD CONSTRAINT account_pkey PRIMARY KEY (id);


--
-- Name: invitation invitation_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.invitation
    ADD CONSTRAINT invitation_pkey PRIMARY KEY (id);


--
-- Name: jwks jwks_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.jwks
    ADD CONSTRAINT jwks_pkey PRIMARY KEY (id);


--
-- Name: member member_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.member
    ADD CONSTRAINT member_pkey PRIMARY KEY (id);


--
-- Name: organization organization_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.organization
    ADD CONSTRAINT organization_pkey PRIMARY KEY (id);


--
-- Name: organization organization_slug_key; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.organization
    ADD CONSTRAINT organization_slug_key UNIQUE (slug);


--
-- Name: project_config project_config_endpoint_id_key; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.project_config
    ADD CONSTRAINT project_config_endpoint_id_key UNIQUE (endpoint_id);


--
-- Name: project_config project_config_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.project_config
    ADD CONSTRAINT project_config_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (id);


--
-- Name: session session_token_key; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.session
    ADD CONSTRAINT session_token_key UNIQUE (token);


--
-- Name: user user_email_key; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: verification verification_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.verification
    ADD CONSTRAINT verification_pkey PRIMARY KEY (id);


--
-- Name: Domain Domain_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Domain"
    ADD CONSTRAINT "Domain_pkey" PRIMARY KEY (id);


--
-- Name: HostingAccount HostingAccount_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."HostingAccount"
    ADD CONSTRAINT "HostingAccount_pkey" PRIMARY KEY (id);


--
-- Name: OTP OTP_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."OTP"
    ADD CONSTRAINT "OTP_pkey" PRIMARY KEY (id);


--
-- Name: OrderItem OrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_pkey" PRIMARY KEY (id);


--
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);


--
-- Name: Plan Plan_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Plan"
    ADD CONSTRAINT "Plan_pkey" PRIMARY KEY (id);


--
-- Name: RefreshToken RefreshToken_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."RefreshToken"
    ADD CONSTRAINT "RefreshToken_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: account_userId_idx; Type: INDEX; Schema: neon_auth; Owner: neon_auth
--

CREATE INDEX "account_userId_idx" ON neon_auth.account USING btree ("userId");


--
-- Name: invitation_email_idx; Type: INDEX; Schema: neon_auth; Owner: neon_auth
--

CREATE INDEX invitation_email_idx ON neon_auth.invitation USING btree (email);


--
-- Name: invitation_organizationId_idx; Type: INDEX; Schema: neon_auth; Owner: neon_auth
--

CREATE INDEX "invitation_organizationId_idx" ON neon_auth.invitation USING btree ("organizationId");


--
-- Name: member_organizationId_idx; Type: INDEX; Schema: neon_auth; Owner: neon_auth
--

CREATE INDEX "member_organizationId_idx" ON neon_auth.member USING btree ("organizationId");


--
-- Name: member_userId_idx; Type: INDEX; Schema: neon_auth; Owner: neon_auth
--

CREATE INDEX "member_userId_idx" ON neon_auth.member USING btree ("userId");


--
-- Name: organization_slug_uidx; Type: INDEX; Schema: neon_auth; Owner: neon_auth
--

CREATE UNIQUE INDEX organization_slug_uidx ON neon_auth.organization USING btree (slug);


--
-- Name: session_userId_idx; Type: INDEX; Schema: neon_auth; Owner: neon_auth
--

CREATE INDEX "session_userId_idx" ON neon_auth.session USING btree ("userId");


--
-- Name: verification_identifier_idx; Type: INDEX; Schema: neon_auth; Owner: neon_auth
--

CREATE INDEX verification_identifier_idx ON neon_auth.verification USING btree (identifier);


--
-- Name: Domain_name_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Domain_name_key" ON public."Domain" USING btree (name);


--
-- Name: Domain_orderItemId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Domain_orderItemId_key" ON public."Domain" USING btree ("orderItemId");


--
-- Name: HostingAccount_cpanelUsername_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "HostingAccount_cpanelUsername_key" ON public."HostingAccount" USING btree ("cpanelUsername");


--
-- Name: HostingAccount_domain_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "HostingAccount_domain_key" ON public."HostingAccount" USING btree (domain);


--
-- Name: HostingAccount_orderItemId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "HostingAccount_orderItemId_key" ON public."HostingAccount" USING btree ("orderItemId");


--
-- Name: OrderItem_domainId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "OrderItem_domainId_key" ON public."OrderItem" USING btree ("domainId");


--
-- Name: OrderItem_hostingAccountId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "OrderItem_hostingAccountId_key" ON public."OrderItem" USING btree ("hostingAccountId");


--
-- Name: Order_paystackRef_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Order_paystackRef_key" ON public."Order" USING btree ("paystackRef");


--
-- Name: RefreshToken_token_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "RefreshToken_token_key" ON public."RefreshToken" USING btree (token);


--
-- Name: RefreshToken_userId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "RefreshToken_userId_idx" ON public."RefreshToken" USING btree ("userId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: account account_userId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.account
    ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: invitation invitation_inviterId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.invitation
    ADD CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: invitation invitation_organizationId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.invitation
    ADD CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES neon_auth.organization(id) ON DELETE CASCADE;


--
-- Name: member member_organizationId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.member
    ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES neon_auth.organization(id) ON DELETE CASCADE;


--
-- Name: member member_userId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.member
    ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: session session_userId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.session
    ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: Domain Domain_orderItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Domain"
    ADD CONSTRAINT "Domain_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES public."OrderItem"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Domain Domain_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Domain"
    ADD CONSTRAINT "Domain_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: HostingAccount HostingAccount_orderItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."HostingAccount"
    ADD CONSTRAINT "HostingAccount_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES public."OrderItem"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: HostingAccount HostingAccount_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."HostingAccount"
    ADD CONSTRAINT "HostingAccount_planId_fkey" FOREIGN KEY ("planId") REFERENCES public."Plan"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: HostingAccount HostingAccount_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."HostingAccount"
    ADD CONSTRAINT "HostingAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OTP OTP_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."OTP"
    ADD CONSTRAINT "OTP_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderItem OrderItem_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderItem OrderItem_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES public."Plan"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Order Order_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_planId_fkey" FOREIGN KEY ("planId") REFERENCES public."Plan"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Order Order_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: neondb_owner
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict w2yRC7xwk2z0NtIr3jEk1V2s66lpimTtvn6ZJhYl1eNBRhyhC4dF9tXhbf7cB1L

