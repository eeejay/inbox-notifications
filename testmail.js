/* mail.json should look something like this:
 * {
 *   "user":     "user@gmail.com",
 *   "password": "password",
 *   "host":     "smtp.gmail.com",
 *   "port":     587,
 *   "tls":     true
 * }
*/

var email   = require("emailjs");
var server  = email.server.connect(require('./mail'));
var argv = require('minimist')(process.argv.slice(2));

var message = {
   text:    "i hope this works, here is a fraction: " + Math.random(),
   from:    "you <eeejay1981@gmail.com>",
   to:      argv.to,
   subject: argv.subject || "Test mail #" + Date.now()
};

// send the message and get a callback with an error or details of the message that was sent
server.send(message, function(err, message) { console.log(err || message); });
