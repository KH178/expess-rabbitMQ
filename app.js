var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var amqp = require('amqplib/callback_api');
const fs = require('fs');
var app = express();
const dotenv = require('dotenv');
dotenv.config();
const CONN_UR = process.env.DM_RABBIT_URL;
const filePath = 'numRequests.txt'

amqp.connect(CONN_UR, function (error0, connection) {
  if (error0) {
    throw error0;
  }
  connection.createChannel(function (error1, channel) {
    if (error1) {
      throw error1;
    }

    var queue = 'fromProducer';

    channel.assertQueue(queue, {
      durable: false
    });

    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);

    channel.consume(queue, function (msg) {
      console.log(`Received ${msg.content}`);
      try {
        if (fs.existsSync(filePath)) {
          //File exits
          fs.readFile(filePath, "utf-8", (err, data) => {
            if (err) console.log(err)
            fs.writeFile(filePath, ++data, (err) => {
              if (err) console.log(err);
              console.log("Successfully Written to File.");
            });
          });
        } else {
          fs.writeFile(filePath, 1, function (err, result) {
            if (err) console.log('error', err);
          });
        }
      } catch (err) {
        console.error(err);
      }


    }, {
      noAck: true
    });
  });
});



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));




// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
