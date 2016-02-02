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

DROP TABLE travelchecking;

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

DROP TABLE travelers;
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

DROP TABLE travelplaces;
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


--
-- Name: travelchecking_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jwelch
--

SELECT pg_catalog.setval('travelchecking_id_seq', 505, true);


--
-- Data for Name: travelers; Type: TABLE DATA; Schema: public; Owner: jwelch
--

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

