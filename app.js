
/**
 * Module dependencies.
 */

var express = require('express');
var mongoose = require('mongoose');
var mongoStore = require('connect-mongodb');
var models = require('./models');

var app = module.exports = express.createServer();

app.configure('development', function(){
	app.set('db-uri', 'mongodb://localhost/appmngr-dev');
	app.use(express.errorHandler({ dumpExceptions: true }));
	app.set('view options', {
    pretty: true
  });  

});

app.configure('production', function(){
	app.set('db-uri', 'mongodb://localhost/appmngr-prod');  
});

// Configuration

app.configure(function(){
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.session({ store: mongoStore(app.set('db-uri')), secret: 'topsecret' }));
	app.use(express.methodOverride());
	app.use(require('stylus').middleware({ src: __dirname + '/public' }));
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
});

models.defineModels(mongoose, function() {
  app.Application = Application = mongoose.model('Application');
  app.User = User = mongoose.model('User');
  app.LoginToken = LoginToken = mongoose.model('LoginToken');
  db = mongoose.connect(app.set('db-uri'));
})


//when called, checks to see if User is logged in
function loadUser(req, res, next) {
	if (req.session.user_id) {
		User.findById(req.session.user_id, function(err, user) {
	
			if (user) {
				console.log('User Found ' + user);
				req.currentUser = user;
				next();
			} else {
				res.redirect('/sessions/new');
			}
		});
  } else if (req.cookies.logintoken) {
		authenticateFromLoginToken(req, res, next);
  } else {
		res.redirect('/sessions/new');
  }
}




// Users
app.get('/users/new', function(req, res) {
  res.render('users/new.jade', {
    locals: { 
		title: 'New User',		
		user: new User() 
	}
  });
});



app.post('/users.:format?', function(req, res) {
  var user = new User(req.body.user);
	
  function userSaveFailed(err) {
    req.flash('error', 'Account creation failed');
    res.render('users/new.jade', {
      locals: { 
		title: err,		
		user: user }
    });
  }

  user.save(function(err) {
    if (err) return userSaveFailed(err);

    switch (req.params.format) {
      case 'json':
        res.send(user.toObject());
      break;

      default:
        req.session.user_id = user.id;
        res.redirect('/documents');
    }
  });
});

//update user
app.get('/users/update',  loadUser, function (req, res) {
	User.findById(req.currentUser.id, function(err, user) {
		
		res.render('users/userupdate.jade', {
				locals: {
						title: 'Update User',
						user:user
						
					}
		});
	});
});

//updates user account info
app.put('/users/update.:format?', loadUser, function (req, res) {
		User.findById(req.currentUser.id, function(err, user) {
				
				console.log(req.params.format);
				console.log(user.username);
				user.firstname = req.body.firstname;
				user.lastname = req.body.lastname;
				user.username = req.body.username;
				user.email = req.body.email;
				user.password = req.body.password;
				
				console.log(req.body.username);
				console.log(user.username);
				
				user.save(function(err){
					if (err){
						console.log(err);
					}else{
						res.send(user.toObject());
					}
				});				
		});
});	
		
		


// Sessions
app.get('/sessions/new', function(req, res) {
  res.render('sessions/new.jade', {
    locals: { 
		title: 'New Session',
		user: new User() 
	}
  });
});

app.post('/sessions', function(req, res) {
  User.findOne({ email: req.body.user.email }, function(err, user) {
    if (user && user.authenticate(req.body.user.password)) {
      req.session.user_id = user.id;
      // Remember me
      if (req.body.remember_me) {
        var loginToken = new LoginToken({ email: user.email });
        loginToken.save(function() {
          res.cookie('logintoken', loginToken.cookieValue, { expires: new Date(Date.now() + 2 * 604800000), path: '/' });
          res.redirect('/documents');
        });
      } else {
        res.redirect('/documents');
      }
    } else {
      //req.flash('error', 'Incorrect credentials');
      res.redirect('/sessions/new');
    }
  }); 
});

app.del('/sessions', loadUser, function(req, res) {
  if (req.session) {
    LoginToken.remove({ email: req.currentUser.email }, function() {});
    res.clearCookie('logintoken');
    req.session.destroy(function() {});
  }
  res.redirect('/sessions/new');
});

//applications
 
app.get('/documents', loadUser, function(req, res){
	console.log('GET /documents');
	Application.find({}, [], { sort: ['date', '-1'] }, function(err, applications){
		applications = applications.map(function(d) {
			console.log('title: ' + d.title + '\nid: ' + d.id + 
				'\ndata: ' + d.data + '\nread:' + d.read + '\nuser: ' + req.currentUser.username);
				
			return {title: d.title, id: d.id, data: d.data, read: d.read, date:d.date, comments: d.comments,
				accept: d.accept, reject: d.reject, maybe: d.maybe, user: req.currentUser.username, firstname: d.firstname, lastname: d.lastname};		
		});

		var username = req.currentUser.username;

		res.render('app-console.jade', {
			locals: {
					title: 'Home',
					applications: applications,
					currentUser: username,
					}
			});
	});
});


app.get('/documents.:format?', function(req, res) {
  Application.find(function(err, applications) {
	console.log('GET /documents.:format?');
	console.log(req.params.format);    
	switch (req.params.format) {
      case 'json':
        res.send(applications.map(function(d) {
          return d.__doc;
        }));
      break;

      default:
        res.render('app-console.jade', {
          locals: {title: 'GOOGOO', applications: applications }
        });
    }
  });
});



app.get('/documents/:id.:format?/edit', function(req, res) {
 	
	Application.findById(req.params.id, function(d) {
	console.log(req.params.id);
    res.render('documents/edit.jade', {
      locals: { 
			title: 'Edit',			
			d: req.params.id }
    });
  });
});

app.get('/documents/:id.:format?', function(req, res) {
    
console.log('GET /documents/:id');

Application.findById(req.params.id, function(err, d) {
	console.log(req.params.id);	
	console.log(d.title);
    switch (req.params.format) {
      case 'json':
			console.log('send d.data ' + d.data);	
        res.send(d.toObject());
      break;

      default:
		res.send(req.params.id);	
        res.render('documents/show.jade', {
          locals: {title: 'View', d: d}
        });
    }
  });
});

//save an application
app.get('/documents/docs/new', function(req, res) {
  res.render('documents/new.jade', {
    locals: { 
		title: 'New Application',		
		d: new Application() }
  });
});


app.post('/documents.:format?', function(req, res) {
  var d = new Application(req.body);
 
  d.save(function() {
    switch (req.params.format) {
      case 'json':
        var data = d.toObject();
        // TODO: Backbone requires 'id', but can I alias it?
        data.id = data._id;
        res.send(data);
      break;

      default:
        res.redirect('/documents');
    }
  });
});

//Mark as read
app.put('/documents/:id.:format?', function(req, res, next) {
  Application.findById(req.params.id, function(err, d) {
    if (!d) return next(new NotFound('Document not found'));
	console.log('PUT was called');    
	d.read = true;
	 

   
    d.save(function(err) {
      switch (req.params.format) {
        case 'json':
          res.send(d.toObject());
        break;

        default:
          req.flash('info', 'Document updated');
          res.redirect('/documents');
      }
    });
  });
});

//Save a comment
app.put('/documents/comments/:id.:format?', function(req, res) {
	Application.findById(req.params.id, function(err, d) {
		console.log('PUT for Comments was called');

		console.log(req.body.comments);
	
		d.comments = req.body.comments;

		d.save (function (err) {
		res.send(d.toObject());
		});
	});
});
	

//filter application
app.put('/documents/filter/:id.:format?', function(req, res) {
		Application.findById(req.params.id, function(err, d) {
			console.log(req.body.accept  + " " + req.body.reject + " " + req.body.maybe);			

			//is there a DRYer way to do this?			
			if (req.body.accept=="true"){
				d.accept=true;
				d.reject=false;
				d.maybe=false;
			}	
			else if (req.body.reject=="true"){
				d.accept=false;
				d.reject=true;
				d.maybe=false;
			}	
			else {
				d.accept=false;
				d.reject=false;
				d.maybe=true;
			}	

			d.save( function(err) {
				switch (req.params.format) {
				case 'json':					
					res.send(d.toObject());					
				break;
			
				default:
					res.redirect('/documents');
				}
			});
		
		
			

		});
	});

// Delete document
app.del('/documents/:id.:format?', function(req, res) {
console.log('DELETE ' + req.params.id);
  Application.findById(req.params.id, function(err, d) {
	

    if (!d){
		console.log('Document not found');
		res.redirect('/documents');
	}
	
	else{
		d.remove(function() {
		  switch (req.params.format) {
			case 'json':
			  res.send('true');
			break;

			default:
			  res.redirect('/documents');
		  } 
		});
	}
  });
});


app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);


