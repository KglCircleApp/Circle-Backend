var express = require ('express');
var bodyParser = require ('body-parser');
const cors = require('cors');
var path = require ('path');
var fs = require('fs');
var slug = require ('mongoose-slug-generator');
var mongoose = require('mongoose');
const passport = require('passport');
const bcrypt = require('bcryptjs');
var config = require('./db/database');
const users = require('./routes/users'); 


// Requires multiparty 
multiparty = require('connect-multiparty'),
multipartyMiddleware = multiparty(), 

// Requires controller
FileUploadController = require('./db/FileUploadController');

mongoose.Promise = require('bluebird');

mongoose.connect(config.database,{
  useMongoClient: true,
});

mongoose.connection.on('connected',function(){
  console.log('connected on '+ config.database);
});
mongoose.connection.on('error',(err)=>{
  console.log('database error '+err);
});


mongoose.plugin(slug);





var Post = mongoose.model('Post',mongoose.Schema({
  title: String,
  featured: String,
  body: String,
  created_at: {type:Date,default:Date},
  posted_by: String,
  upvotes: {type:Number, default:0},
  materials:[],
  comments: [{
    user: String,
    content: String,
    date: {type:Date,default:Date}
  }]
}));





var app = express();
var port = process.env.PORT || 3000;

//cors middleware
app.use(cors());

//body parser middleware
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(express.static(path.join(__dirname,'public')));



//passport middleware ( to provide jwt authentication protected routes)
app.use(passport.initialize());
app.use(passport.session());

require('./db/passport')(passport);

//users route group (from const users = require('./routes/users');)
app.use('/api/users',users);


app.post('/api/post',function(req,res){
  if(req.body.featured == ''){
    res.json({'error':'no featured image bro'});
  }
  else{
    Post.create(req.body,function(err,posts){
      res.json({'success': 'Article created successifuly'});
  });
  }  


});




app.post('/api/upload', multipartyMiddleware, function(req,res){
  fs.readFile(req.files.file.path, function (err,data) {

    // set the correct path for the file not the temporary one from the API:
    var newpath = "public/uploads/featured/" + req.files.file.name;
 // copy the data from the req.files.file.path and paste it to file.path
    fs.writeFile(newpath, data,function (err) {
      if (err) {
        return console.warn(err);
      }
      console.log("The file: " + req.files.file.name + " was saved to " + newpath);
       res.json(newpath);
    });
    
    
  });
});

app.post('/api/uploads', multipartyMiddleware, function(req,res){
  fs.readFile(req.files.file.path, function (err,data) {

    // set the correct path for the file not the temporary one from the API:
    var newpath = "public/uploads/profiles/" + req.files.file.name;
 // copy the data from the req.files.file.path and paste it to file.path
    fs.writeFile(newpath, data,function (err) {
      if (err) {
        return console.warn(err);
      }
      console.log("The file: " + req.files.file.name + " was saved to " + newpath);
    });
    
    
  });
});




app.listen(port,function(){
console.log('NodeJS Server Started on '+port+' ...')
});

