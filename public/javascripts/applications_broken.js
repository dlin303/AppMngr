(function() {
  var Application, Applications, ApplicationRow, ApplicationList,
      ApplicationControls, ListToolBar, AppView,
      SearchView;

  _.templateSettings = {
    interpolate: /\{\{(.+?)\}\}/g
  };

  Application = Backbone.Model.extend({
    Collection: Applications,

    url: function() {
      return this.urlWithFormat('json');
    },

    urlWithFormat: function(format) {
      return this.get('id') ? '/documents/' + this.get('id') + '.' + format : '/aplications.json';
    },

    display: function() {
      this.fetch({
        success: function(model, response) {
          $('.display input.title').val(model.get('title'));
          $('.display-content').val(model.get('data'));
        }
      });
    }
  });

  Applications = new Backbone.Collection();
  Applications.url = '/documents/titles.json';
  Applications.model = Applcation;
  Applications.comparator = function(d) {
    return d.get('title') && d.get('title').toLowerCase();
  };

  ApplicationRow = Backbone.View.extend({
    tagName: 'li',

    events: {
      'click a': 'open'
    },

    template: _.template($('#application-row-template').html()),

    initialize: function() {
      _.bindAll(this, 'render');
    },

    open: function() {
      $('#application-list .selected').removeClass('selected');
      $(this.el).addClass('selected');
      this.model.display();
      appView.applicationList.selectedApplication = this.model;
    },

    remove: function() {
      $(this.el).remove();
    },

    render: function() {
      $(this.el).html(this.template({
        id: this.model.id,
        title: this.model.get('title')
      }));
      return this;
    }
  });

  ApplicationList = Backbone.View.extend({
    el: $('#application-list'),
    Collection: Applications,

    events: {
      'click #show-all': 'showAll',
    },

    initialize: function() {
      _.bindAll(this, 'render', 'addDocument', 'showAll', 'create');
      this.Collection.bind('reset', this.render);
    },

    addDocument: function(d) {
      var index = Applications.indexOf(d) + 1;
      d.rowView = new ApplicationRow({ model: d });
      var el = this.el.find('li:nth-child(' + index + ')');
      if (el.length) {
        el.after(d.rowView.render().el);
      } else {
        this.el.append(d.rowView.render().el);
      }
    },

    resort: function() {
      Applications.sort({ silent: true });
    },

    create: function(title, data) {
      this.selectedApplication.set({
        title: title,
        data: data
      });
      
      this.selectedApplication.save();
      this.selectedApplication.rowView.render();
      this.resort();
    },

    render: function(applications) {
      var applicationList = this;
      applications.each(function(d) {
        applicationList.addApplication(d);
      });

      // Open the first document by default
      if (!this.selectedApplication) {
        this.openFirst();
      }
    },

    openFirst: function() {
      if (Applications.length) {
        Applications.first().rowView.open();
      }
    },

    showAll: function(e) {
      e.preventDefault();
      this.el.html('');
      Applications.fetch({ success: this.openFirst });
      appView.searchView.reset();
    }
  });

  ApplicationControls = Backbone.View.extend({
    el: $('#controls'),

    events: {
      'click #save-button': 'save',
      'click #html-button': 'showHTML'
    },

    initialize: function(model) {
      _.bindAll(this, 'save', 'showHTML');
    },

    save: function(e) {
      e.preventDefault();

      var title = $('input.title').val(),
          data = $('.display-content').val();

      if (!appView.applicationList.selectedApplication) {
        Appliations.create({ title: title, data: data }, {
          success: function(model) {
            Applications.fetch();
          }
        });
      } else {
        appView.applicationList.create(title, data);
      }
    },

    showHTML: function(e) {
      e.preventDefault();

      var model = appView.applicationList.selectedApplication,
        html = model.urlWithFormat('html');

      $.get(html, function(data) {
        $('#html-container').html(data);
        $('#html-container').dialog({
          title: model.get('title'),
          autoOpen: true,
          modal: true,
          width: $(window).width() * 0.95,
          height: $(window).height() * 0.90
        });
      });
    }
  });

  ListToolBar = Backbone.View.extend({
    el: $('#left .toolbar'),

    events: {
      'click #create-document': 'add',
      'click #delete-document': 'remove'
    },

    initialize: function(model) {
      _.bindAll(this, 'add', 'remove');
    },

    add: function(e) {
      e.preventDefault();
      var d = new Document({ title: 'Untitled Document', data: '' });
      d.save();
      Documents.add(d);
      appView.applicationList.addDocument(d);
      d.rowView.open();
      $('#editor-container input.title').focus();
    },

    remove: function(e) {
      e.preventDefault();
      var model = appView.applicationList.selectedApplication;

      if (!model) return;
      if (confirm('Are you sure you want to delete that document?')) {
        model.rowView.remove();
        model.destroy();
        Documents.remove(model);
        appView.applicationList.selectedApplication = null;
        $('.display input.title').val('');
        $('.display-content').val('');
        $('#application-list li:visible:first a').click();
      }
    }
  });

  SearchView = Backbone.View.extend({
    el: $('#header .search'),

    events: {
      'focus input[name="s"]': 'focus',
      'blur input[name="s"]': 'blur',
      'submit': 'submit'
    },

    initialize: function(model) {
      _.bindAll(this, 'search', 'reset');
    },

    focus: function(e) {
      var element = $(e.currentTarget);
      if (element.val() === 'Search')
        element.val('');
    },

    blur: function(e) {
      var element = $(e.currentTarget);
      if (element.val().length === 0)
        element.val('Search');
    },

    submit: function(e) {
      e.preventDefault();
      this.search($('input[name="s"]').val());
    },

    reset: function() {
      this.el.find("input[name='s']").val('Search');
    },

    search: function(value) {
      $.post('/search.json', { s: value }, function(results) {
        appView.applicationList.el.html('<li><a id="show-all" href="#">Show All</a></li>');

        if (results.length === 0) {
          alert('No results found');
        } else {
          for (var i = 0; i < results.length; i++) {
            var d = new Document(results[i]);
            appView.applicationList.addDocument(d);
          }
        }
      }, 'json');
    }
  });

  AppView = Backbone.View.extend({
    initialize: function() {
      this.applicationList = new ApplicationList();
      this.searchView = new SearchView();
      this.toolbar = new ListToolBar();
      this.documentControls = new DocumentControls();
    }
  });

  var appView = new AppView();
  window.Applications = Applications;
  window.appView = appView;

  $('#logout').click(function(e) {
    e.preventDefault();
    if (confirm('Are you sure you want to log out?')) {
      var element = $(this),
          form = $('<form></form>');
      form
        .attr({
          method: 'POST',
          action: '/sessions'
        })
        .hide()
        .append('<input type="hidden" />')
        .find('input')
        .attr({
          'name': '_method',
          'value': 'delete'
        })
        .end()
        .appendTo('body')
        .submit();
    }
  });
})();
