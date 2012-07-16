(function() {
  // Easily get an item's database ID based on an id attribute
  $.fn.itemID = function() {
    try {
      var items = $(this).attr('id').split('-');
      return items[items.length - 1];
    } catch (exception) {
      return null;
    }
  };

  $.put = function(url, data, success) {
    data._method = 'PUT';
    $.post(url, data, success, 'json');
  };

//logout of appmngr
	$('.destroy').live('click', function(e) {
		e.preventDefault();
		
		if(confirm('Are you sure?')) {
		  var f = document.createElement('form');
		 	$(this).after($(f).attr({
		    method: 'post',
		    action: $(this).attr('href')
		  }).append('<input type="hidden" name="_method" value="DELETE" />'));
		  $(f).submit();
		}
		return false;
	 
});


//delete application
  $('#delete').live('click', function(e) {
	
    e.preventDefault();
   
		var id = $('#application-list .selected').itemID,
		params = {id:id};      

	var element = $('#application-list .selected');

    if(confirm('Are you sure?')) {
		
      var f = document.createElement('form');
     	element.after($(f).attr({
        method: 'post',
        action: element.attr('href')
      }).append('<input type="hidden" name="_method" value="DELETE" />'));
      $(f).submit();
      element.hide();
    }
    return false;
 
  
});

  // Correct widths and heights based on window size
  function resize() {
    var height = $(window).height() - $('#header').height() - 3,
        width = $('.display').width(),
		leftwidth = $('.left').width(),
        ov = $('.left'),
        ed = $('#editor'),
        toolbar = $('#toolbar'),
        divider = $('.divider'),
        dividerright = $('.divider-right'),
        content = $('.display'),
		footer = $('#footer'),
		comments = $('.right-console');
	var	commentbox= $('#display-comments');

    $('.titles').css({ height: height - footer.height() + 'px' });
    ov.css({height: height - footer.height() + 'px' });

   toolbar.css({ margin: 0 + 'px' + " " + (leftwidth - 113) + 'px'});
	
    content.css({
      height: height - footer.height() + 'px',
      width: $('body').width() - ov.width() - divider.width() - 250 + 'px'
    });

	footer.css({ margin: $('#header').height() + content.height() - 35 + 'px' + ' ' + 0 + 'px'});

    divider.css({ height: height -footer.height() + 'px' });
    dividerright.css({height: height -footer.height() + 'px'}); 
    

    ed.css({
      width: content.width() - 18 + 'px',
      height: content.height() - 67 + 'px'
    });

	comments.css({ 
			height: content.height() + 'px',
			width: $(window).width() - content.width() - ov.width() - 3 + 'px'					
			});

   commentbox.css({
			height: content.height() - $('#comments').height() + 'px',
			width: comments.width() - 10 + 'px'
	});

	
  }

//save comment
	$('#save-comment').click(function(e) {
		e.preventDefault();		
		
		
		var id = $('#application-list .selected').itemID();
		var user = $('#welcome a').itemID();
        
		//var prev-comment = $('#display-comments').val();
		
		//alert($('#display-comments').val());
		var comment = '\n'+ user + ' says:' + $('.info-comments').val();

		if (comment != "") {		
			//display comment on screen.
			$('#display-comments').val($('#display-comments').val() + '\n' + comment);
			//clear comment textarea		
			$('.info-comments').val('');		
			params = { comments: $('#display-comments').val(), id: id };
		
			//save comment to database
			$.put('/documents/comments/' + id + '.json', params, function(data) {
			  // Saved, will return JSON
			});
		}

		else {}
	});

//filter into different folders
	$('#filter').click(function(e) {
		
		e.preventDefault();
	
		var id = $('#application-list .selected').itemID();

		var checked = $('input[type=radio]:checked').val();

		

		if (checked=="d.accept"){
			params = { accept: true, reject: false, maybe: false, id: id};
		}
		else if (checked =="d.reject"){
			params = { accept: false, reject: true, maybe: false, id: id};
		}
		else { 
			params = { accept: false, reject: false, maybe: true, id: id};
		}

		$.put('/documents/filter/' + id + '.json', params, function(data) {});
		
});

$('#accept').live('click', function(e) {
	e.preventDefault();
	var id = $('#application-list .selected').itemID();
	

	$('#application-list .selected').parent().hide();		
	
	$('#accepted-list').append($('#application-list .selected'));
	$('#accepted-list').show();
	
	params = { accept: true, reject: false, maybe: false, id: id};
	$.put('/documents/filter/' + id + '.json', params, function(data) {});
		
});

$('#reject').live('click', function(e) {
	e.preventDefault();
	var id = $('#application-list .selected').itemID();
	
	$('#application-list .selected').parent().hide();		
	
	$('#rejected-list').append($('#application-list .selected'));
	$('#rejected-list').show();

	params = { accept: false, reject: true, maybe: false, id: id};
	$.put('/documents/filter/' + id + '.json', params, function(data) {});
});

$('#maybe-button').live('click', function(e) {
	e.preventDefault();
	var id = $('#application-list .selected').itemID();

	$('#application-list .selected').parent().hide();		
	
	$('#maybe-list').append($('#application-list .selected'));
	$('#maybe-list').show();

	params = { accept: false, reject: false, maybe: true, id: id};
	$.put('/documents/filter/' + id + '.json', params, function(data) {});
});
	
	

					

//Highlight title of seleced 
  $('#application-list li a').live('click', function(e) {
    
    if (!$(this).hasClass('folder-title')){ 
    var li = $(this);
	
    $.get(this.href + '.json', function(data) {
      $('#application-list .selected').removeClass('selected');
		
     	 li.addClass('selected');

	
		li.parent().removeClass('unread');		
		//alert(data);
		
		//change value from false to true
		if (data.read==false) {
			var id = $('#application-list .selected').itemID(),
			//$('#application-list .selected').parent().css({background-color: red});
    	    params = { read:'true', id: id};			
			$.put('/documents/' + id + '.json', params, function(data) {
      		// Saved, will return JSON
   			 });
		}
		
		$('input.info-title').val('PROJECT TITLE:\t' + data.title);
		$('input.info-name').val('PROJECT MEMBERS:\t' + data.firstname + ' ' + data.lastname);
		$('input.info-date').val('SUBMITTED:\t' + data.date);
		$('#display-comments').val(data.comments);  		

      $('#editor').val('DESCRIPTION:\n\n' + data.data);
      //$('#editor').focus();
    });
	}

    e.preventDefault();
  });


if ($('#application-list .selected').length == 0) {
  $('#application-list li a').first().click();
}


//show/hide contents of folders
$(document).on('click', '#accepted .folder-title', function(e) {
	
	if (e.target==this){
		$(this).parent().find('ul').slideToggle('slow');
	}
});

$('.folder-title li a').click(function(event) {
	event.stopPropagation();
});


$(document).on('click','#rejected .folder-title', function(e) {
	if (e.target == this)
		$(this).parent().find('ul').slideToggle('slow');
});

$(document).on('click', '#maybe .folder-title', function(e) {
 	if (e.target == this)
		$(this).parent().find('ul').slideToggle('slow');
});
		
//get a reference to the nav <ul>
$nav = $("#application-list");

 
//hide all but the first sub list
$nav.find("ul").hide();

  $(window).resize(resize);
  $(window).focus(resize);
  resize();
})();

