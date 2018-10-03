const express = require('express');
const pg = require('pg');
const log4js = require('log4js');

const app = express();
const port = 8080;
const logger = log4js.getLogger();

log4js.configure({
    appenders: {
        out: {
            type: 'stdout'
        }
    },
    categories: {
        default: {
            appenders: ['out'],
            level: 'info'
        }
    }
});

const db = new pg.Client({
    host: '127.0.0.1',
    port: 5432,
    user: 'postgres',
    password: '123',
    database: 'profit'
});

db.connect()
    .then(() => {
        logger.info('Connecting to database: ok');
    })
    .catch(err => {
        logger.error(err.message || err);
    });

app.use(express.json());

app.use(function (req, res, next) {
    logger.info('request', req.method, req.url, JSON.stringify(req.body));

    next();
});

app.get('/', function (req, res) {
    res.send('It works!');
});

app.post('/operation/find', function (req, res) {
    let pool = req.body['pool'];

    let limit = pool['limit'] || 10;
    let offset = pool['offset'] || 0;

    let query = "select" +
        "  o.id," +
        "  o.senderid    as sender_id,\n" +
        "  s.name        as sender_name,\n" +
        "  sc.code       as sender_code,\n" +
        "  o.consigneeid as consignee_id,\n" +
        "  c.name        as consignee_name,\n" +
        "  cc.code       as consignee_code,\n" +
        "  o.clientid    as client_id,\n" +
        "  client.name   as client_name\n" +
        "from operation o\n" +
        "  left join dealerlocation s on (s.id = o.senderid)\n" +
        "  left join dealerlocationcode sc on (sc.dealerlocationid = s.id and sc.contractor = o.clientid)\n" +
        "  left join dealerlocation c on (c.id = o.consigneeid)\n" +
        "  left join dealerlocationcode cc on (cc.dealerlocationid = c.id and cc.contractor = o.clientid)\n" +
        "  left join contractor client on (o.clientid = client.id)\n" +
        "where " + makeConditions(pool['searchQuery']) +
        "order by o.id asc\n" +
        "limit $1\n" +
        "offset $2";

    db.query(query, [
        limit,
        offset
    ])
        .then(data => {
            let rows = data.rows.map(function (item) {
                return {
                    id: item['id'],
                    senderId: item['sender_id'],
                    senderName: item['sender_name'],
                    senderCode: item['sender_code'],
                    consigneeId: item['consignee_id'],
                    consigneeName: item['consignee_name'],
                    consigneeCode: item['consignee_code'],
                    clientId: item['client_id'],
                    clientName: item['client_name']
                };
            });

            res.send({
                error: false,
                result: rows,
                pool: pool
            });
        })
        .catch(e => {
            let msg = e.message || 'unknown error';

            res.send({
                error: msg
            });
        });
});

app.listen(port, function () {
    logger.info('Web app port: ' + port);
});

let makeConditions = function (searchQuery) {
    let conds = "o.deletedat is null\n";

    if (searchQuery['operationId']) {
        conds += " and o.id in (" + searchQuery['operationId'].join(',') + ")\n";
    }
    //sender
    if (searchQuery['senderId']) {
        conds += " and o.senderid in (" + searchQuery['senderId'].join(',') + ")\n";
    }
    if (searchQuery['senderName']) {
        conds += " and lower(s.name) like lower('" + searchQuery['senderName'] + "')\n";
    }
    if (searchQuery['senderCode']) {
        conds += " and sc.code = '" + searchQuery['senderCode'] + "')\n";
    }
    //consignee
    if (searchQuery['consigneeId']) {
        conds += " and o.consigneeid in (" + searchQuery['consigneeId'].join(',') + ")\n";
    }
    if (searchQuery['consigneeName']) {
        conds += " and lower(c.name) like lower('" + searchQuery['consigneeName'] + "')\n";
    }
    if (searchQuery['consigneeCode']) {
        conds += " and cc.code = '" + searchQuery['consigneeCode'] + "')\n";
    }
    //client
    if (searchQuery['clientId']) {
        conds += " and o.clientid in (" + searchQuery['clientId'].join(',') + ")\n";
    }
    if (searchQuery['clientName']) {
        conds += " and lower(client.name) like lower('" + searchQuery['clientName'] + "')\n";
    }

    return conds;
};
