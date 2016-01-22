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
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: travelchecking; Type: TABLE; Schema: public; Owner: jwelch; Tablespace: 
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


ALTER TABLE travelchecking OWNER TO jwelch;

--
-- Name: travelchecking_id_seq; Type: SEQUENCE; Schema: public; Owner: jwelch
--

CREATE SEQUENCE travelchecking_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE travelchecking_id_seq OWNER TO jwelch;

--
-- Name: travelchecking_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jwelch
--

ALTER SEQUENCE travelchecking_id_seq OWNED BY travelchecking.id;


--
-- Name: travelers; Type: TABLE; Schema: public; Owner: jwelch; Tablespace: 
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


ALTER TABLE travelers OWNER TO jwelch;

--
-- Name: travelplaces; Type: TABLE; Schema: public; Owner: jwelch; Tablespace: 
--

CREATE TABLE travelplaces (
    id integer NOT NULL,
    g7pickupzone character varying(30),
    fromplace character(1),
    internationalname character varying(30),
    internationalcode character varying(10),
    typeofplace character(1)
);


ALTER TABLE travelplaces OWNER TO jwelch;

--
-- Name: travelplaces_id_seq; Type: SEQUENCE; Schema: public; Owner: jwelch
--

CREATE SEQUENCE travelplaces_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE travelplaces_id_seq OWNER TO jwelch;

--
-- Name: travelplaces_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jwelch
--

ALTER SEQUENCE travelplaces_id_seq OWNED BY travelplaces.id;


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: jwelch
--

ALTER TABLE ONLY travelchecking ALTER COLUMN id SET DEFAULT nextval('travelchecking_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: jwelch
--

ALTER TABLE ONLY travelplaces ALTER COLUMN id SET DEFAULT nextval('travelplaces_id_seq'::regclass);


--
-- Data for Name: travelchecking; Type: TABLE DATA; Schema: public; Owner: jwelch
--

COPY travelchecking (id, status, travelid, pickupday, internationalname, internationalcode, typeofplace, initialtravelarrival, currentestimatetravelarrival, nexttravelcheckdate, checkiteration) FROM stdin;
1	checked	KE901	02-11-15	SEOUL	ICN	A	2015-11-02 18:20:00	2015-11-02 18:48:00	\N	0
4	checked	AF333	02-11-15	BOSTON	BOS	A	2015-11-02 08:40:00	2015-11-02 08:50:00	\N	0
5	checked	AF1281	02-11-15	LONDRES	LHR	A	2015-11-02 20:00:00	2015-11-02 20:25:00	\N	0
2	checked	AF1885	02-11-15	AMSTERDAM	AMS	A	2015-11-02 18:55:00	2015-11-02 19:02:00	\N	0
3	checked	AF1062	02-11-15	STOCKHOLM	ARN	A	2015-11-02 18:45:00	2015-11-02 18:50:00	\N	0
\.


--
-- Name: travelchecking_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jwelch
--

SELECT pg_catalog.setval('travelchecking_id_seq', 5, true);


--
-- Data for Name: travelers; Type: TABLE DATA; Schema: public; Owner: jwelch
--

COPY travelers (ridenumber, travelid, pickupday, subscriptioncode, requestedby, refclient, g7pickupzone, fromplace, typeofplace, initialdueridetimestamp, lastdueridetimestamp, ridestatus) FROM stdin;
137827463	AF1885	02-11-15	CLUB	DONALD DUCK	DONALD DUCK	CDG	AMSTERDAM	A	1446149000	1446149000	CREATED
137827446	AF1281	02-11-15	A1241	WELCH MR	WELCH MR	CDG	LONDRES	A	1446149000	1446149000	CREATED
137827452	AF1281	02-11-15	A1234	JONES MR	JONES MR	CDG	LONDRES	A	1446149000	1446149000	CREATED
137827469	AF333	02-11-15	A3394	GOOFY	GOOFY	CDG	BOSTON	A	1446149000	1446149000	CREATED
137827461	AF1885	02-11-15	C3214	MICKEY MOUSE	MICKEY MOUSE	CDG	AMSTERDAM	A	1446149000	1446149000	CREATED
137827471	AF1062	02-11-15	AN5214	DAISY DUCK	DAISY DUCK	CDG	STOCKHOLM	A	1446149000	1446149000	CREATED
\.


--
-- Data for Name: travelplaces; Type: TABLE DATA; Schema: public; Owner: jwelch
--

COPY travelplaces (id, g7pickupzone, fromplace, internationalname, internationalcode, typeofplace) FROM stdin;
3	ORLY	O	STOCKHOLM	ARN	A
1	CDG	O	CHICAGO	ORD	A
2	CDG	O	LONDRES	LHR	A
4	CDG	O	SAN FRANCISCO	SFO	A
5	CDG	O	AMSTERDAM	AMS	A
6	CDG	O	BOSTON	BOS	A
7	CDG	O	STOCKHOLM	ARN	A
\.


--
-- Name: travelplaces_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jwelch
--

SELECT pg_catalog.setval('travelplaces_id_seq', 7, true);


--
-- Name: travelchecking_pkey; Type: CONSTRAINT; Schema: public; Owner: jwelch; Tablespace: 
--

ALTER TABLE ONLY travelchecking
    ADD CONSTRAINT travelchecking_pkey PRIMARY KEY (id);


--
-- Name: travelers_pkey; Type: CONSTRAINT; Schema: public; Owner: jwelch; Tablespace: 
--

ALTER TABLE ONLY travelers
    ADD CONSTRAINT travelers_pkey PRIMARY KEY (ridenumber);


--
-- Name: travelplaces_pkey; Type: CONSTRAINT; Schema: public; Owner: jwelch; Tablespace: 
--

ALTER TABLE ONLY travelplaces
    ADD CONSTRAINT travelplaces_pkey PRIMARY KEY (id);


--
-- Name: public; Type: ACL; Schema: -; Owner: jwelch
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM jwelch;
GRANT ALL ON SCHEMA public TO jwelch;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

