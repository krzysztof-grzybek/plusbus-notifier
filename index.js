const CronJob = require('cron').CronJob;
const axios = require('axios');
const argv = require('yargs').argv;
const nodemailer = require('nodemailer');

const FROM = argv.from;
const DATE = argv.date;
const TO = argv.to;
const PASS = argv.pass;

let MessageSent = false;

new CronJob('* * * * *', onTick, null, true);

async function onTick() {
    const isAvailable = await isSaleAvailable(DATE);
    if (isAvailable && !MessageSent) {
        notify();
        MessageSent = true;
    }
}

// format YYYY-MM-DD
async function isSaleAvailable(dateString) {
    const response = await axios({
        method: 'post',
        url: 'https://api.plusbus.pl/routes/search/',
        data: {
            "initial_stop":43,
            "final_stop":7,
            "promotions": [{"id":0,"code":null}],
            "from_date": new Date(dateString).toISOString(),
            "allow_full":true
        },
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return response.data.departure_courses.length > 0;
}

async function notify() {
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: 'poczta.o2.pl',
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: FROM, // generated ethereal user
            pass: PASS // generated ethereal password
        }
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: `"Plusbus notifier" <${FROM}>`, // sender address
        to: TO, // list of receivers
        subject: `Sale for ${DATE} is available!`, // Subject line
        html: `<a href="https://plusbus.pl/search?promotions=0&initial_stop=43&final_stop=7&from_date=${DATE}&to_date=0">Buy here</a>`, // plain text body
        text: 'https://plusbus.pl/search?promotions=0&initial_stop=43&final_stop=7&from_date=${date}&to_date=0' // html body
    });

    console.log('Message sent: %s', info.messageId);
}
