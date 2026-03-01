--
-- PostgreSQL database dump
--

\restrict A1W0cfEPIWk9To9fMac1gDh6XQSxwBgqZ0qsvqzFEKOCH8OiAEGxNAM3Oz1U9OG

-- Dumped from database version 15.17 (Debian 15.17-1.pgdg13+1)
-- Dumped by pg_dump version 15.17 (Debian 15.17-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: payment_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_type_enum AS ENUM (
    'CREDIT',
    'DEBIT',
    'VA',
    'QRIS',
    'E_WALLET',
    'BANK TRANSFER'
);


ALTER TYPE public.payment_type_enum OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sender_id uuid,
    receiver_id uuid,
    amount numeric(18,2) NOT NULL,
    payment_type public.payment_type_enum NOT NULL,
    message text,
    encrypted_payload text NOT NULL,
    cid character varying(255),
    blockchain_tx_hash character varying(255),
    status character varying(50) DEFAULT 'CONFIRMED'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password text NOT NULL,
    share_enabled boolean DEFAULT false,
    share_id uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transactions (id, sender_id, receiver_id, amount, payment_type, message, encrypted_payload, cid, blockchain_tx_hash, status, created_at) FROM stdin;
9bb50aa4-b84f-4b65-a2d3-bfd9c5d6cc4e	109dd170-7181-4dee-b0f3-1904a515a09a	11b54320-319a-4113-8d9a-ff7faed98b06	150000.00	QRIS	Monthly AI License Subscription	{"invoice_no":"INV-001","item":"AI API Access","provider":"Paylabs"}	QmX2ve6sPwagSz9tCxz8zQAyZEsBX6cipENiDQdE6QSMp7	0x98cfa46e35db4a74e85daa89383dea322892e2b788871cf156a797bb21c59cef	CONFIRMED	2026-02-28 10:36:30.226
02034f11-a639-4df9-8109-d76d4306b2b5	109dd170-7181-4dee-b0f3-1904a515a09a	ec95c3bb-8fa4-4cf2-9ca8-026347344024	50000.00	E_WALLET	User Credit Top-up	{"invoice_no":"INV-002","item":"Balance Top-up","provider":"Paylabs"}	QmPxWRzDCVkWWe6168r3moJzY6JFU4XZhGWPGtc8LVy6J4	0xb817a01b669722837187db15d58f2ec0acf2f5503e9cde685490ddd974198416	CONFIRMED	2026-02-28 10:37:16.521
ac0b87c8-93ef-4376-be00-696b670065d6	ec95c3bb-8fa4-4cf2-9ca8-026347344024	11b54320-319a-4113-8d9a-ff7faed98b06	50000.00	QRIS	Technical Consultation Fee	{"invoice_no":"INV-003","item":"Consultancy","provider":"Paylabs"}	QmXnTZYbA1raJJXhGBub5LmMniqYupxZcPNGLSyo7fdWTX	0xc0191825b05365d579e61ec46d8e5c3a558f7813e02f903b4c5ac7656745635f	CONFIRMED	2026-02-28 10:39:50.974
66c55f79-00a6-47f6-8100-6f7fc30e9736	ec95c3bb-8fa4-4cf2-9ca8-026347344024	109dd170-7181-4dee-b0f3-1904a515a09a	2500000.00	VA	Server Rack Component Purchase	{"invoice_no":"INV-004","item":"Hardware Part A","provider":"Paylabs"}	QmeV8iXbSZBbgPvRrabr5dcDPfG1MuCxcv6ZVv47AJvVSr	0xb87a9a09ed36d8f819b405a03e0d02dd5119075bc4b4c863a8a4cf7b2c8afafd	CONFIRMED	2026-02-28 10:40:07.939
271762fc-dc75-46c9-b5b0-babdd8c7ab1f	11b54320-319a-4113-8d9a-ff7faed98b06	109dd170-7181-4dee-b0f3-1904a515a09a	50000.00	BANK TRANSFER	Cloud Hosting Monthly Payment	{"invoice_no":"INV-005","item":"Cloud VPS High","provider":"Paylabs"}	QmSfSwbv9WYjUsTrKQ8P9BtZC1WC5HbfUi1BTFG3rEPuTc	0x96f27b2a1c90c6cfdebdfb280504746af0777c9f873860e68347cb8461681509	CONFIRMED	2026-02-28 10:40:26.816
869f9baa-ead7-41d1-9518-0fcc30610ad2	11b54320-319a-4113-8d9a-ff7faed98b06	109dd170-7181-4dee-b0f3-1904a515a09a	3000000.00	VA	App Store Deployment Service	{"invoice_no":"INV-006","item":"Deployment","provider":"Paylabs"}	QmPv2cYqJ4qv5x8mcLKThVmDEdffH77oh5KxPF5w8uHxQm	0x8d90231bb7119bb14d11c15f3733bf71652a90d806b02afb0aebd4053c0f83a8	CONFIRMED	2026-02-28 10:40:42.559
dcda503b-7596-411f-80c4-55f49c532394	11b54320-319a-4113-8d9a-ff7faed98b06	109dd170-7181-4dee-b0f3-1904a515a09a	5500000.00	CREDIT	UI/UX Design Milestone 1	{"invoice_no":"INV-007","item":"Design System","provider":"Paylabs"}	QmfFEorUwBse87RvhN12dEJqrPuzRiK2xZkfmzAC4AMLLj	0xab6e9fd973575192a8e15321a74e1b554ff98da5bc427f74464b6c6b1f9a8a9d	CONFIRMED	2026-03-01 08:08:29.456
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, company_name, email, password, share_enabled, share_id, created_at) FROM stdin;
11b54320-319a-4113-8d9a-ff7faed98b06	Quantaris Labs	admin@quantaris.com	$2a$06$33QGBQ.W//A8iq9EI9sDKOuDk1UhQH0D8ZbSjDqp3l29rVgUEM/4i	t	340209fd-e31b-402e-9dbf-df2f46336c93	2026-02-28 10:22:07.607297
109dd170-7181-4dee-b0f3-1904a515a09a	Nexora Dynamics	contact@nexora.com	$2a$06$OotPXWVUHQ0fNBLD0AQwj.Tgyn0E8tTznmDpuUwoKH7pdKb3LBzwe	t	ce46656c-1e4a-4492-a1eb-ec00d792ffea	2026-02-28 10:22:07.607297
ec95c3bb-8fa4-4cf2-9ca8-026347344024	Velocita Systems	finance@velocita.com	$2a$06$IxKeu/ymr0Akp3s.27ceNe5xXkRedCyu5H9byOOleBN/o7vN3HQj.	t	3d86fc58-a748-4bfa-bd8b-e741a9197e7c	2026-02-28 10:22:07.607297
66bf9ac7-8e3e-47f8-bb9d-5af30db8ceda	Toko Maju Jaya	admin@maju.com	$2b$10$OTT8IYLhrgFhnfhqTaXZUeAXxrGKATzZ9F03C8MN.xpPLekqQC7wW	t	8133f017-9431-4267-b740-6a6168e363b1	2026-02-28 16:09:47.223061
6766219b-77ec-47b9-8443-0e354f7b5686	Cihuy PT	cihuy@gmail.com	$2b$10$b8YYZrECZqw/fQbh3JtSfu2FU0N3mDzoyleC4rws5fLR7G0KO7vIa	t	e55b93b5-e3a9-4129-b609-ffa6e7d964da	2026-03-01 01:38:59.163819
\.


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_share_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_share_id_key UNIQUE (share_id);


--
-- Name: transactions transactions_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict A1W0cfEPIWk9To9fMac1gDh6XQSxwBgqZ0qsvqzFEKOCH8OiAEGxNAM3Oz1U9OG

