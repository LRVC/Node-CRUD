var fs = require("fs"),
    http = require("http"),
    mongoose = require("mongoose"),
    jade = require('jade');
    url = require('url');


var carAttrs = require("./car.js"),
    carSchema = mongoose.Schema(carAttrs);


var Car = mongoose.model('Car', carSchema);
mongoose.connect('mongodb://localhost/crud_sans_frameworks');


var handleRequest = function(req, res) {
  var path, objId, carId;

  if (req.url == '/favicon.ico') {
    res.end();
    return;
  }

  function findId(urlPath) {
    var urlArr = urlPath.split('/');
    objId = urlArr[urlArr.length - 2];
    return objId
  }

  function parseUrlPath(urlPath) {
    var urlArr = urlPath.split('/');
    path = urlArr[urlArr.length - 1];
    return path;  
  }
  var firstChar = parseUrlPath(req.url).charAt(0);
  
  if (req.url == '/') {
    res.writeHead(301, {Location: 'http://localhost:1337/cars'})
    res.end();
  }

  if (req.url == '/cars' && req.method == 'GET') {
    var index = fs.readFileSync('index.jade', 'utf8');
    var compiledIndex = jade.compile(index, { pretty: true, filename: 'index.jade' });

    Car.find({}, function(err, cars) {
      var rendered = compiledIndex({cars: cars});
      res.end(rendered);
    })

  } else if( req.url == '/cars/new') {
    
    var newCar = fs.readFileSync('new.jade', 'utf8');
    var compiledNew = jade.compile(newCar, { pretty: true, filename: 'new.jade' });


    res.end(compiledNew());
  } else if(req.url == '/cars' && req.method == 'POST') {
    var postParams = {};
    req.on('data', function(data) {
      var dataArray = data.toString().split("&");
      for (var i = 0; i < dataArray.length; i++) {
        var newArray = dataArray[i].split("=");
        postParams[newArray[0]] = newArray[1];
      }
      
      
    var car = new Car(postParams);
    car.save(function (err) {
      if (err) {
        console.log(err)
      }
    });

    res.writeHead(301, {Location: 'http://localhost:1337/cars'});
    res.end();
    });
  } else if(parseUrlPath(req.url) == 'show') {
    
    var show = fs.readFileSync('show.jade', 'utf8');
    var compiledShow = jade.compile(show, { pretty: true, filename: 'show.jade' });
    carId = findId(req.url);
    Car.find({_id: carId}, function(err, car) {
      var rendered = compiledShow({cars: car});
      res.end(rendered);    
    });
  } else if(parseUrlPath(req.url) == 'edit') {

    var editCar = fs.readFileSync('edit.jade', 'utf8');
    var compiledEdit = jade.compile(editCar, { pretty: true, filename: 'edit.jade' });
    carId = findId(req.url);

    Car.findOne({'_id': carId}, function(err, car) {
      var rendered = compiledEdit({car: car});
      res.end(rendered);    
    });


    
  } else if(parseUrlPath(req.url) == 'patch' && req.method == 'POST') { 
    var updateParams = {};
    req.on('data', function(data) {
      var dataArray = data.toString().split("&");
      console.log(dataArray)
      for (var i = 0; i < dataArray.length; i++) {
        var newArray = dataArray[i].split("=");
        updateParams[newArray[0]] = newArray[1];
      }
      console.log(updateParams);
      var carId = findId(req.url)
        Car.findOne({ _id: carId }, function (err, car){
          if (updateParams.driver !== '') {
            car.driver = updateParams.driver;
          } 
          if (updateParams.make !== '') {
            car.make = updateParams.make;
          }
          if (updateParams.model !== '') {
            car.model = updateParams.model;  
          }  
          if (updateParams.year !== '') {
            car.year = updateParams.year;  
          }
          car.save();
      });
        res.writeHead(301, {Location: 'http://localhost:1337/cars'})
        res.end();
    });
  } else if(!isNaN(firstChar)) {
    carId = parseUrlPath(req.url);

    Car.remove({_id: carId}, function(err, car) {
      if (err) throw err;

    })
      
    res.writeHead(301, {Location: 'http://localhost:1337/cars'})
    res.end();
  } else {
    res.writeHead(200);
    res.end('A new programming journey awaits');
  }
};

var server = http.createServer(handleRequest);
server.listen(1337);
