var crypto = require('crypto'),
    User,
    LoginToken;



function extractKeywords(text) {
  if (!text) return [];

  return text.
    split(/\s+/).
    filter(function(v) { return v.length > 2; }).
    filter(function(v, i, a) { return a.lastIndexOf(v) === i; });
}

function defineModels(mongoose, fn) {
  var Schema = mongoose.Schema,
      ObjectId = Schema.ObjectId;

/**
* Model: Document
**/
 Application = new Schema({
    'title': { type: String, index: true },
    'data': String,
    'tags': [String],
    'keywords': [String],
    'user_id': ObjectId,
	'firstname': String,
	'lastname': String,
	'username': String,
	'phone': String,
	'read': {type: Boolean, default: false},
	'accept': {type: Boolean, default: false},
	'reject': {type: Boolean, default: false},
	'maybe': {type: Boolean, default: false},
	'date':{type: Date, default: Date.now},
	'comments': [String]
  });

  Application.virtual('id')
    .get(function() {
      return this._id.toHexString();
    });

Application.pre('save', function(next) {
    this.keywords = extractKeywords(this.data);
    next();
  });


  /**
    * Model: User
    */
//nested application model for user

UserApp = new Schema ({
		'title':String,
		'id': String,
		'read': {type: Boolean, default: false}
	});

UserApp.virtual('data').get(function(){
		return this.title + '\n' + this.id + '\n' + this.read;
	});


  function validatePresenceOf(value) {
    return value && value.length;
  }

  User = new Schema({
    'email': { type: String, validate: [validatePresenceOf, 'an email is required'], index: { unique: true } },
    'hashed_password': String,
	'firstname': String,
	'lastname': String,
	'username': String,
    'salt': String,
    'appcollection':[UserApp]
  });

  User.virtual('id')
    .get(function() {
      return this._id.toHexString();
    });

  User.virtual('password')
    .set(function(password) {
      this._password = password;
      this.salt = this.makeSalt();
      this.hashed_password = this.encryptPassword(password);
    })
    .get(function() { return this._password; });

  User.method('authenticate', function(plainText) {
    return this.encryptPassword(plainText) === this.hashed_password;
  });
  
  User.method('makeSalt', function() {
    return Math.round((new Date().valueOf() * Math.random())) + '';
  });

  User.method('encryptPassword', function(password) {
    return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
  });

  User.pre('save', function(next) {
    if (!validatePresenceOf(this.password)) {
      next(new Error('Invalid password'));
    } else {
      next();
    }
  });

  /**
    * Model: LoginToken
    *
    * Used for session persistence.
    */
  LoginToken = new Schema({
    email: { type: String, index: true },
    series: { type: String, index: true },
    token: { type: String, index: true }
  });

  LoginToken.method('randomToken', function() {
    return Math.round((new Date().valueOf() * Math.random())) + '';
  });

  LoginToken.pre('save', function(next) {
    // Automatically create the tokens
    this.token = this.randomToken();

    if (this.isNew)
      this.series = this.randomToken();

    next();
  });

  LoginToken.virtual('id')
    .get(function() {
      return this._id.toHexString();
    });

  LoginToken.virtual('cookieValue')
    .get(function() {
      return JSON.stringify({ email: this.email, token: this.token, series: this.series });
    });

  
  mongoose.model('User', User);
  mongoose.model('LoginToken', LoginToken);
	mongoose.model('Application', Application);

  fn();
}

exports.defineModels = defineModels; 
