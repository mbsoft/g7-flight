--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: travelapi; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE travelapi (
    call_time timestamp without time zone,
    travelid character varying,
    call character varying(256)
);


--
-- Name: travelchecking; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE travelchecking (
    id integer NOT NULL,
    status character varying(25),
    travelid character varying(10),
    pickupday character varying(10),
    internationalname character varying(30),
    internationalcode character varying(10),
    typeofplace character(1),
    initialtravelarrival timestamp without time zone,
    currentestimatetravelarrival timestamp without time zone,
    nexttravelcheckdate timestamp without time zone,
    checkiteration bigint
);


--
-- Name: travelchecking_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE travelchecking_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: travelchecking_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE travelchecking_id_seq OWNED BY travelchecking.id;


--
-- Name: travelers; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE travelers (
    ridenumber integer NOT NULL,
    travelid character varying(10) NOT NULL,
    pickupday character varying(9) NOT NULL,
    subscriptioncode character varying(18),
    requestedby character varying(20),
    refclient character varying(20),
    g7pickupzone character varying(20),
    fromplace character varying(30),
    typeofplace character(1),
    initialdueridetimestamp integer,
    lastdueridetimestamp integer,
    ridestatus character varying(10)
);


--
-- Name: travelparams; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE travelparams (
    initialcheckflight integer,
    limitcheckflight integer,
    timetocheck integer,
    estimatedelayflight integer,
    apitraveltimeoutflight integer
);


--
-- Name: travelplaces; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE travelplaces (
    id integer NOT NULL,
    g7pickupzone character varying(30),
    fromplace character(1),
    internationalname character varying(30),
    internationalcode character varying(10),
    typeofplace character(1)
);


--
-- Name: travelplaces_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE travelplaces_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: travelplaces_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE travelplaces_id_seq OWNED BY travelplaces.id;


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY travelchecking ALTER COLUMN id SET DEFAULT nextval('travelchecking_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY travelplaces ALTER COLUMN id SET DEFAULT nextval('travelplaces_id_seq'::regclass);


--
-- Data for Name: travelapi; Type: TABLE DATA; Schema: public; Owner: -
--

COPY travelapi (call_time, travelid, call) FROM stdin;
2016-02-26 23:11:26.716287	A31446	/flex/flightstatus/rest/v2/json/flight/status/A3/1446/arr/2016/02/26?appId=9e542dda&appKey=52b0919821212f0df01a112f842e99df&utc=false
2016-02-26 23:11:43.829781	A31446	/flex/flightstatus/rest/v2/json/flight/status/A3/1446/arr/2016/02/26?appId=9e542dda&appKey=52b0919821212f0df01a112f842e99df&utc=false
2016-02-26 23:11:45.541804	A31446	/flex/flightstatus/rest/v2/json/flight/status/A3/1446/arr/2016/02/26?appId=9e542dda&appKey=52b0919821212f0df01a112f842e99df&utc=false
2016-02-27 16:23:46.168837	JAF5470	/flex/flightstatus/rest/v2/json/flight/status/JA/F5470/arr/2016/02/27?appId=9e542dda&appKey=52b0919821212f0df01a112f842e99df&utc=false
2016-02-27 16:24:46.172267	JAF5470	/flex/flightstatus/rest/v2/json/flight/status/JA/F5470/arr/2016/02/27?appId=9e542dda&appKey=52b0919821212f0df01a112f842e99df&utc=false
\.


--
-- Data for Name: travelchecking; Type: TABLE DATA; Schema: public; Owner: -
--

COPY travelchecking (id, status, travelid, pickupday, internationalname, internationalcode, typeofplace, initialtravelarrival, currentestimatetravelarrival, nexttravelcheckdate, checkiteration) FROM stdin;
969	TERMINATED	TO3147	26-02-16	MADRID	ORY	A	2016-02-26 22:20:00	2016-02-26 22:20:00	2016-02-26 21:50:00	1
971	TERMINATED	BA8120	26-02-16	ROME	ORY	A	2016-02-26 22:40:00	2016-02-26 22:55:00	2016-02-26 22:25:00	1
970	TERMINATED	U24296	26-02-16	VENICE	ORY	A	2016-02-26 22:30:00	2016-02-26 22:59:00	2016-02-26 22:29:00	1
973	TRAVELID_ERROR	UA912	26-02-16	OMAHA	CDG	A	2016-02-26 23:15:00	2016-02-26 23:15:00	\N	\N
972	TERMINATED	U23798	26-02-16	VENICE	CDG	A	2016-02-26 22:55:00	2016-02-26 23:14:00	2016-02-26 22:44:00	1
974	TERMINATED	LH2238	26-02-16	MUNICH	CDG	A	2016-02-26 23:20:00	2016-02-26 23:08:00	2016-02-26 22:38:00	1
975	TERMINATED	A31446	26-02-16	MUNICH	CDG	A	2016-02-26 23:20:00	2016-02-26 23:20:00	2016-02-26 22:50:00	1
976	TERMINATED	JAF5470	27-02-16	LANZAROTE	CDG	A	2016-02-27 01:35:00	2016-02-27 01:35:00	2016-02-27 01:05:00	1
\.


--
-- Name: travelchecking_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('travelchecking_id_seq', 976, true);


--
-- Data for Name: travelers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY travelers (ridenumber, travelid, pickupday, subscriptioncode, requestedby, refclient, g7pickupzone, fromplace, typeofplace, initialdueridetimestamp, lastdueridetimestamp, ridestatus) FROM stdin;
137827666	TO3147	26-02-16	A1241	CARLOS MARTINS TESTS	DONALD DUCK	ORLY AEROPORT	MADRID	A	1456521300	0	CREATED
137827667	TO3147	26-02-16	A1241	CARLOS MARTINS TESTS	MICKEY	ORLY AEROPORT	MADRID	A	1456521600	0	CREATED
137827668	U24296	26-02-16	A1241	CARLOS MARTINS TESTS	MICKEY	ORLY AEROPORT	VENICE	A	1456522200	0	CREATED
137827669	BA8120	26-02-16	A1241	CARLOS MARTINS TESTS	DONALD DUCK	ORLY AEROPORT	ROME	A	1456522800	0	CREATED
137827670	U23798	26-02-16	A1241	CARLOS MARTINS TESTS	DONALD DUCK	ROISSY AEROPORT	VENICE	A	1456523700	0	CREATED
137827671	UA912	26-02-16	A1241	CARLOS MARTINS TESTS	DAISY DUCK	ROISSY AEROPORT	OMAHA	A	1456524900	0	CREATED
137827672	LH2238	26-02-16	A1241	ADC11	GOOFY	ROISSY AEROPORT	MUNICH	A	1456525200	0	CREATED
137827673	A31446	26-02-16	A1241	CARLOS MARTINS TESTS	DAISY	ROISSY AEROPORT	MUNICH	A	1456525500	0	CREATED
137827674	JAF5470	27-02-16	A1241	CARLOS MARTINS TESTS	HELLO WORLD	ROISSY AEROPORT	LANZAROTE	A	1456533300	0	CREATED
\.


--
-- Data for Name: travelparams; Type: TABLE DATA; Schema: public; Owner: -
--

COPY travelparams (initialcheckflight, limitcheckflight, timetocheck, estimatedelayflight, apitraveltimeoutflight) FROM stdin;
60	30	5	15	10
\.


--
-- Data for Name: travelplaces; Type: TABLE DATA; Schema: public; Owner: -
--

COPY travelplaces (id, g7pickupzone, fromplace, internationalname, internationalcode, typeofplace) FROM stdin;
8	TERMINAL ORLY SUD	 	Paris Orly Airport	ORY	A
9	TERMINAL ORLY OUEST	 	Paris Orly Airport	ORY	A
10	TERMINAL ROISSY 3	 	Charles de Gaulle Airport	CDG	A
11	GARE NORD EXTERIEUR	 	Paris Gare du Nord		G
12	ORLY	 	Paris Orly Airport	ORY	A
13	ORLY VILLE	 	Paris Orly Airport	ORY	A
14	ROISSY AEROPORT	 	Charles de Gaulle Airport	CDG	A
15	ORLY AEROPORT	 	Paris Orly Airport	ORY	A
\.


--
-- Name: travelplaces_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('travelplaces_id_seq', 15, true);


--
-- Name: travelchecking_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY travelchecking
    ADD CONSTRAINT travelchecking_pkey PRIMARY KEY (id);


--
-- Name: travelers_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY travelers
    ADD CONSTRAINT travelers_pkey PRIMARY KEY (ridenumber);


--
-- Name: travelplaces_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY travelplaces
    ADD CONSTRAINT travelplaces_pkey PRIMARY KEY (id);


--
-- Name: public; Type: ACL; Schema: -; Owner: -
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM jwelch;
GRANT ALL ON SCHEMA public TO jwelch;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

