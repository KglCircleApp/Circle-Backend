var express = require ('express');
var bodyParser = require ('body-parser');
const cors = require('cors');
var path = require ('path');
var fs = require('fs');
var slug = require ('mongoose-slug-generator');
var mongoose = require('mongoose');
const passport = require('passport');
const bcrypt = require('bcryptjs');
var config = require('./config/database');
const users = require('./routes/users'); 


// Requires multiparty 
multiparty = require('connect-multiparty'),
multipartyMiddleware = multiparty(), 

// Requires controller
FileUploadController = require('./config/FileUploadController');

mongoose.Promise = require('bluebird');
mongoose.connect(config.database);
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

require('./config/passport')(passport);

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

app.post('/api/draft',function(req,res){
  Draft.create(req.body,function(err,drafts){
      if(err)
        res.send(err);
      res.json(drafts);
  });
});

app.post('/api/authoring',function(req,res){
  Edit.create(req.body,function(err,edits){
      if(err)
        res.send(err);
      res.json(edits);
  });
});

app.get('/api/authoring/admin',(req,res)=>{
  Edit.find().sort({"created_at":-1}).exec(function(err,edits){
      if(err)
        res.send(err);
      res.json(edits);
  });
});

app.get('/api/drafts/:user',(req,res)=>{
  Draft.find({posted_by:req.params.user}).sort({"created_at":-1}).exec(function(err,drafts){
      if(err)
        res.send(err);
      res.json(drafts);
  });
});

app.post('/api/messages',function(req,res){
  Message.create(req.body,function(err,messages){
      if(err)
        res.send(err);
      res.json(messages);
  });
});

app.get('/api/messages',function(req,res){
  Message.find().sort({"created_at":-1}).exec(function(err,messages){
      if(err)
        res.send(err);
      res.json(messages);
  });
});

app.put('/api/comment/:id',function(req,res){
  
   var query={$push: {comments:{user:req.body.user,content:req.body.content} }};
   var condition={slug:req.params.id};
  Post.findOneAndUpdate(condition,query,function(err,post){
     if(err)
       res.send(err);
     res.json(post);
  });
})

app.put('/api/update/:id',function(req,res){
  
   var query={$set: {title:req.body.title,body:req.body.body,category:req.body.category,featured:req.body.featured}};

   var condition={_id:req.params.id};
  Post.findOneAndUpdate(condition,query,function(err,post){
     if(err)
       res.send(err);
     res.json(post);
  });
})

app.put('/api/update/draft/:id',function(req,res){
  
   var query={$set: {title:req.body.title,body:req.body.body,category:req.body.category,featured:req.body.featured}};

   var condition={_id:req.params.id};
  Draft.findOneAndUpdate(condition,query,function(err,draft){
     if(err)
       res.send(err);
     res.json(draft);
  });
})

app.put('/api/update/edit/authoring/:id',function(req,res){
  
   var query={$set: {title:req.body.title,body:req.body.body,category:req.body.category}};

   var condition={_id:req.params.id};
  Edit.findOneAndUpdate(condition,query,function(err,edit){
     if(err)
       res.send(err);
     res.json(edit);
  });
})

app.get('/api/preview/:id',function(req,res){
   var condition={_id:req.params.id};
  Draft.findOne(condition,function(err,draft){
     if(err)
       res.send(err);
     res.json(draft);
  });
})

app.get('/api/preview/authoring/:id',function(req,res){
  var condition={_id:req.params.id};
 Edit.findOne(condition,function(err,edit){
    if(err)
      res.send(err);
    res.json(edit);
 });
})

app.get('/api/posts/popular',function(req,res){

  Post.find({created_at:{'$lt':new Date(),'$gte': new Date(new Date().setDate(new Date().getDate()-7)) }},{'title':true,'slug':true,'featured':true,'created_at':true,'posted_by':true,'views':true}).limit(3).sort({"views":-1}).exec(function(err,posts){
      if(err)
        res.send(err);
      res.json(posts);
  });
});

app.get('/api/posts/mobile/popular/:count',function(req,res){
  var limit = parseInt(req.params.count);
  Post.find({},{'title':true,'slug':true,'featured':true,'created_at':true,'posted_by':true,'views':true}).limit(limit).sort({"views":-1}).exec(function(err,posts){
      if(err)
        res.send(err);
      res.json(posts);
  });
});

app.get('/api/posts/mobile/latest/:count',function(req,res){
  var limit = parseInt(req.params.count);
  Post.find({},{'title':true,'slug':true,'featured':true,'created_at':true,'posted_by':true}).limit(limit).sort({"created_at":-1}).exec(function(err,posts){
      if(err)
        res.send(err);
      res.json(posts);
  });
});

app.get('/api/cats/mobile/:name/:count',function(req,res){
  var limit = parseInt(req.params.count);
  Post.find({category:req.params.name},{'title':true,'slug':true,'featured':true,'created_at':true,'posted_by':true}).limit(limit).sort({"created_at":1}).exec(function(err,posts){
      if(err)
        res.send(err);
      res.json(posts);
  });
});

app.get('/api/posts/latest',function(req,res){

  Post.find({},{'title':true,'slug':true,'featured':true,'created_at':true}).limit(3).sort({"created_at":-1}).exec(function(err,posts){
      if(err)
        res.send(err);
      res.json(posts);
  });
});

app.get('/api/posts/slider',function(req,res){
  Post.find({},{'title':true,'slug':true,'featured':true}).limit(5).sort({"created_at":-1,"views":1}).exec(function(err,posts){
      if(err)
        res.send(err);
      res.json(posts);
  });
});

app.get('/api/posts',function(req,res){
  Post.find().limit(10).sort({"created_at":-1}).exec(function(err,posts){
      if(err)
        res.send(err);
      res.json(posts);
  });
});

app.get('/api/tests',function(req,res){
  Post.find({body: { $substr: [ "$body", 0, 100 ] }}).limit(10).sort({"created_at":-1}).exec(function(err,posts){
      if(err)
        res.send(err);
      res.json(posts);
  });
});


app.get('/api/posts/dashboard',function(req,res){
  Post.find().sort({"created_at":-1}).exec(function(err,posts){
      if(err)
        res.send(err);
      res.json(posts);
  });
});

app.get('/api/users/:user',(req,res)=>{
  Post.find({posted_by:req.params.user}).sort({"created_at":-1}).exec(function(err,posts){
      if(err)
        res.send(err);
      res.json(posts);
  });
});

//related articles
app.get('/api/posts/related/:cat',(req,res)=>{
  Post.find({category:{"$in":[req.params.cat]},created_at:{'$lt':new Date(),'$gte': new Date(new Date().setDate(new Date().getDate()-5)) }}).limit(3).exec(function(err,posts){
      if(err)
        res.send(err);
      res.json(posts);
  });
});

app.get('/api/publish/:id',(req,res)=>{
  Draft.findOne({_id:req.params.id},function(err,post){
      if(err)
        res.send(err);
       res.json(post);  
    
  });
});

app.get('/api/publish/edit/:id',(req,res)=>{
  Edit.findOne({_id:req.params.id},function(err,edit){
      if(err)
        res.send(err);
       res.json(edit);  
    
  });
});

app.delete('/api/posts/:id',(req,res)=>{
  Post.findOneAndRemove({_id:req.params.id},function(err,post){
      if(err)
        res.send(err);
      res.json(post);
  });
});

app.delete('/api/drafts/:id',(req,res)=>{
  Draft.findOneAndRemove({_id:req.params.id},function(err,draft){
      if(err)
        res.send(err);
      res.json(draft);
  });
});

app.delete('/api/drafts/edit/:id',(req,res)=>{
  Edit.findOneAndRemove({_id:req.params.id},function(err,edit){
      if(err)
        res.send(err);
      res.json(edit);
  });
});


app.get('/api/posts/page/:page',function(req,res){
  var page = parseInt(req.params.page);
  Post.find().skip(page > 0 ?  ((page-1)*10) : 0).limit(10).sort({"created_at":-1}).exec(function(err,posts){
      if(err)
        res.send(err);
      res.json(posts);
  });
})



app.get('/api/edit/:id',function(req,res){ 
   
   var condition={_id:req.params.id};
  Post.findOne(condition,function(err,post){
     if(err)
       res.send(err);
     res.json(post);
  });
});

app.get('/api/count/edit',function(req,res){
  Edit.count(function(err,edit){
     if(err)
       res.send(err);
     res.json(edit);
  });
})

app.get('/api/edit/draft/:id',function(req,res){ 
   
   var condition={_id:req.params.id};
  Draft.findOne(condition,function(err,draft){
     if(err)
       res.send(err);
     res.json(draft);
  });
});

app.get('/api/edit/authoring/:id',function(req,res){ 
  
  var condition={_id:req.params.id};
 Edit.findOne(condition,function(err,edit){
    if(err)
      res.send(err);
    res.json(edit);
 });
});

app.get('/api/cats/:name',function(req,res){
  Post.find({category:req.params.name}).limit(10).sort({"created_at":-1}).exec(function(err,posts){
      if(err)
        res.send(err);
      res.json(posts);
  });
});

app.get('/api/cats/:name/:page',function(req,res){
  var page = parseInt(req.params.page);
  Post.find({category:req.params.name}).skip(page > 0 ?  ((page-1)*10) : 0).limit(10).sort({"created_at":-1}).exec(function(err,posts){
      if(err)
        res.send(err);
      res.json(posts);
  });
})


app.get('/api/posts/:id',function(req,res){
   var query={$inc: {views:1}};
   var condition={slug:req.params.id};
  Post.findOneAndUpdate(condition,query,function(err,post){
     if(err)
       res.send(err);
     res.json(post);
  });

})

// this method after updating angular bcz: breaking change!
/*app.put('/api/posts/:id',function(req,res){
   var query={$inc: {views:1}};
   var condition={slug:req.params.id};
  Post.findOneAndUpdate(condition,query,function(err,post){
     if(err)
       res.send(err);
     res.json(post);
  });

})*/

app.get('/api/postscount',function(req,res){
  Post.count(function(err,user){
     if(err)
       res.send(err);
     res.json(user);
  });
})

app.get('/api/postscountcat/:name',function(req,res){
  Post.count({category:req.params.name},function(err,user){
     if(err)
       res.send(err);
     res.json(user);
  });
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
    var newpath = "public/uploads/images/" + req.files.file.name;
 // copy the data from the req.files.file.path and paste it to file.path
    fs.writeFile(newpath, data,function (err) {
      if (err) {
        return console.warn(err);
      }
      console.log("The file: " + req.files.file.name + " was saved to " + newpath);
    });
    
    
  });
});


/*
app.put('/users/:id',function(req,res){
   var query={
      first_name:req.body.fname,
      last_name:req.body.lname,
      email:req.body.email,
      username:req.body.username,
      password:req.body.pwd,
      avatar:req.body.avatar,
      description:req.body.description
   };
  User.findOneAndUpdate({_id:req.params.id},query,function(err,user){
     if(err)
       res.send(err);
     res.json(user);
  });
})*/

/*app.get('/*',function(req,res){
res.sendFile(__dirname +'/public/index.html');
});*/

app.listen(port,function(){
console.log('NodeJS Server Started on '+port+' ...')
});

