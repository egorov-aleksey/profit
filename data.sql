CREATE TABLE contractor (
  id SERIAL PRIMARY KEY NOT NULL,
  name CHARACTER VARYING(300),
  deletedat DATE
);

insert into contractor (id, name, deletedat)
select id, 'contractor_' || id, date('2018-01-01'::timestamp + random()*(now() - '2018-01-01'))
from generate_series(1, 3000) as id;

update contractor set deletedat = null where random() < 0.5;

/**/

CREATE TABLE dealerlocation (
  id SERIAL PRIMARY KEY NOT NULL,
  name CHARACTER VARYING(300),
  deletedat DATE
);

insert into dealerlocation (id, name, deletedat)
select id, 'dealerlocation_' || id, date('2018-01-01'::timestamp + random()*(now() - '2018-01-01'))
from generate_series(1, 3000) as id;

update dealerlocation set deletedat = null where random() < 0.5;

/**/

CREATE TABLE dealerlocationcode (
  id SERIAL PRIMARY KEY NOT NULL,
  dealerlocationid INTEGER REFERENCES dealerlocation (id),
  contractor INTEGER REFERENCES contractor (id),
  code VARCHAR(25)
);

insert into dealerlocationcode (id, dealerlocationid, contractor, code)
select r.id, (select id+r.id*0 from dealerlocation order by random() limit 1),
(select id+r.id*0 from contractor order by random() limit 1), (100 + random()*900)::int
from generate_series(1, 15000) as r(id);
-- 15 s

/**/

CREATE TABLE operation (
  id SERIAL PRIMARY KEY NOT NULL,
  senderid INTEGER REFERENCES dealerlocation (id),
  consigneeid INTEGER REFERENCES dealerlocation (id),
  clientid INTEGER REFERENCES contractor (id),
  deletedat DATE
);

insert into operation (id, senderid, consigneeid, clientid, deletedat)
select r.id,
(select id+r.id*0 from dealerlocation order by random() limit 1),
(select id+r.id*0 from dealerlocation order by random() limit 1),
(select id+r.id*0 from contractor order by random() limit 1),
date('2018-01-01'::timestamp + random()*(now() - '2018-01-01'))
from generate_series(1, 1000000) as r(id);
-- 25 m

update operation set deletedat = null where random() < 0.5;
