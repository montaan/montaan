const sendmail = require('sendmail')();

async function sendActivationEmail(email, activationToken) {
    return sendmail({
        from: 'no-reply@montaan.com',
        to: email,
        subject: 'Activate Montaan account',
        text:
            `Hi, it's Ilmari from Montaan!

Activate your Montaan account at the URL below:
https://montaan.com/activate/${activationToken}

Welcome aboard, I hope you enjoy Montaan as much as I do.

We're here to make everyone's life better, including yours.

Join us in doing that, it doesn't take much time and you'll be super proud of the result.

Go to this page: https://mine.montaan.com
Pick one task to do.
And do it.

You'll get Montaan Gems for each task that you accomplish.
You can use the Montaan Gems to create new tasks.

Have a great one,
Ilmari
`
    });
}

async function sendRecoveryEmail(email, activationToken) {
    return sendmail({
        from: 'no-reply@montaan.com',
        to: email,
        subject: 'Recover Montaan account',
        text:
            `Hi from Montaan!

Recover your Montaan account at the URL below:
https://montaan.com/recover/${activationToken}

If you didn't request account recovery, please ignore this email.

Have a great one,
Montaan Account Recovery Bot
`
    });
}


async function sendAuthenticationEmail(email, activationToken) {
    return sendmail({
        from: 'no-reply@montaan.com',
        to: email,
        subject: 'Log in to Montaan',
        text:
            `Hi from Montaan!

Log in to your Montaan account at the URL below:
https://montaan.com/login/${activationToken}

If you didn't request to log in, please ignore this email.

Best,
Montaan
`
    });
}

module.exports = {
    sendMail: sendmail,
    sendActivationEmail,
    sendRecoveryEmail,
    sendAuthenticationEmail
};
