var express = require('express');
var cookieSession = require('cookie-session');
var uuid = require('uuid/v4');
var liquid = new (require('liquidjs').Liquid)();
var fs = require('fs');
var bodyParser = require('body-parser');


var app = express();


var cap = [];
var counter = 0;


app.use(cookieSession({
    name: 'session',
    keys: ['alright', 'aloha']
}));


app.use(express.static('public'));


// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());


app.post('/register', (req, res) => {
    const pos = cap.indexOf(req.session.token);
    if (pos < 0) {
        res.json({
            result: 'queue up please.'
        });
    } else {
        fs.readFile(`./ids/${(req.body || {}).id}.txt`, (readErr, index) => {
            if (readErr) {
                Promise.all([
                    new Promise((resolve, reject) => {
                        fs.writeFile(
                            `./tickets/${++counter}.json`,
                            JSON.stringify({
                                token: req.session.token,
                                contact: req.body
                            }),
                            writeErr => writeErr ? reject() : resolve(counter)
                        );
                    }),
                    new Promise((resolve, reject) => {
                        fs.writeFile(
                            `./ids/${(req.body || {}).id}.txt`,
                            counter,
                            writeErr => writeErr ? reject() : resolve(counter)
                        );
                    })
                ])
                .then(result => {
                    cap.splice(pos, 1);
                    res.json({
                        result: result[0]
                    });
                })
                .catch(() => {
                    cap.splice(pos, 1);
                    res.json({
                        result: 'a min.'
                    })
                });
            } else {
                cap.splice(pos, 1);
                res.json({
                    result: parseInt(index.toString('utf-8'))
                });
            }
        });
    }
});
app.get('/', (req, res) => {
    req.session.token = req.session.token || uuid();
    const status = (cap[9] == undefined);
    if (status) cap.push(req.session.token);
    liquid.parseAndRender(fs.readFileSync('./views/index.html', 'utf-8'), {
        token: req.session.token,
        status
    }).then(context => res.end(context));
});


app.listen(3000);