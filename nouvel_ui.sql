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
495	INITIAL	AF7527	16-01-16		CDG	A	2016-01-16 17:00:00	2016-01-16 17:00:00	\N	\N
496	INITIAL	SWU646	16-01-16		CDG	A	2016-01-16 17:05:00	2016-01-16 17:05:00	\N	\N
497	INITIAL	PS129	16-01-16		CDG	A	2016-01-16 17:00:00	2016-01-16 17:00:00	\N	\N
499	INITIAL	LO333	16-01-16		CDG	A	2016-01-16 17:15:00	2016-01-16 17:15:00	\N	\N
498	INITIAL	U23738	16-01-16		CDG	A	2016-01-16 17:55:00	2016-01-16 17:55:00	\N	\N
501	INITIAL	AZ332	16-01-16		CDG	A	2016-01-16 17:20:00	2016-01-16 17:20:00	\N	\N
502	INITIAL	TK1829	16-01-16		CDG	A	2016-01-16 17:00:00	2016-01-16 17:00:00	\N	\N
503	INITIAL	AF1181	16-01-16		CDG	A	2016-01-16 17:20:00	2016-01-16 17:20:00	\N	\N
504	INITIAL	AF1169	16-01-16		CDG	A	2016-01-16 17:10:00	2016-01-16 17:10:00	\N	\N
505	INITIAL	SU2460	16-01-16		CDG	A	2016-01-16 17:25:00	2016-01-16 17:25:00	\N	\N
500	ACTIVE	BJ318	16-01-16	Djerba, Tunisia 	CDG	A	2016-01-16 22:15:00	2016-01-16 22:15:00	2016-01-22 14:01:32	\N
\.


--
-- Name: travelchecking_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jwelch
--

SELECT pg_catalog.setval('travelchecking_id_seq', 505, true);


--
-- Data for Name: travelers; Type: TABLE DATA; Schema: public; Owner: jwelch
--

COPY travelers (ridenumber, travelid, pickupday, subscriptioncode, requestedby, refclient, g7pickupzone, fromplace, typeofplace, initialdueridetimestamp, lastdueridetimestamp, ridestatus) FROM stdin;
1054050	BJ318	16-01-16	2593	MR UFDLDQBAZCYY	MR UFDLDQBAZCYY	TERMINAL ROISSY 3	Djerba, Tunisia 	A	1452982500	1452982500	CREATED
579444	U23738	16-01-16	3137	MR TEVTYULVERXR	MR TEVTYULVERXR	TERMINAL ROISSY 3	Tel Aviv, Israel 	A	1452984900	1452984900	CREATED
1724722	TK1829	16-01-16	2207	MR MSSBVQXJQRYD	MR MSSBVQXJQRYD	TERMINAL ROISSY 3	Istanbul, Turkey 	A	1452981600	1452981600	CREATED
112449	PS129	16-01-16	2922	MR KMFUYAHXQXRY	MR KMFUYAHXQXRY	TERMINAL ROISSY 3	Kiev, Ukraine - Borispol 	A	1452981600	1452981600	CREATED
976681	AF1169	16-01-16	4317	MR NFHWVVFPSJIV	MR NFHWVVFPSJIV	TERMINAL ROISSY 3	Manchester, United Kingdom 	A	1452982200	1452982200	CREATED
495506	LO333	16-01-16	4429	MR QNGZVWKRDECV	MR QNGZVWKRDECV	TERMINAL ROISSY 3	Warsaw, Poland 	A	1452982500	1452982500	CREATED
775691	AZ332	16-01-16	3727	MR TTHUTRGDHEZX	MR TTHUTRGDHEZX	TERMINAL ROISSY 3	Rome, Italy - Leonardo Da Vinc	A	1452982800	1452982800	CREATED
1908334	AF1181	16-01-16	3202	MR OPVLDJCOHQRN	MR OPVLDJCOHQRN	TERMINAL ROISSY 3	London, United Kingdom - Heath	A	1452982800	1452982800	CREATED
2093610	SU2460	16-01-16	3284	MR SPLHMBXSZRQJ	MR SPLHMBXSZRQJ	TERMINAL ROISSY 3	Moscow, Russia - Sheremetyevo 	A	1452983100	1452983100	CREATED
1566903	AF7527	16-01-16	2266	MR FGENNYFTRTEZ	MR FGENNYFTRTEZ	TERMINAL ROISSY 3	Toulouse, France 	A	1452981600	1452981600	CREATED
3056172	SWU646	16-01-16	3628	MR XIFQZZEMJKKT	MR XIFQZZEMJKKT	TERMINAL ROISSY 3	Zurich, Switzerland 	A	1452981900	1452981900	CREATED
\.


--
-- Data for Name: travelplaces; Type: TABLE DATA; Schema: public; Owner: jwelch
--

COPY travelplaces (id, g7pickupzone, fromplace, internationalname, internationalcode, typeofplace) FROM stdin;
8	TERMINAL ORLY SUD	 	Paris Orly Airport	ORY	A
9	TERMINAL ORLY OUEST	 	Paris Orly Airport	ORY	A
10	TERMINAL ROISSY 3	 	Charles de Gaulle Airport	CDG	A
11	GARE NORD EXTERIEUR	 	Paris Gare du Nord		G
\.


--
-- Name: travelplaces_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jwelch
--

SELECT pg_catalog.setval('travelplaces_id_seq', 11, true);


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

