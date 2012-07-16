//update user
$('#update').click(function(e){

	e.preventDefault();		

		var firstname = $('#update-firstname').val(),
			lastname = $('#update-lastname').val(),
			username = $('#update-username').val(),
			email = $('#update-email').val(),
			password = $('#update-password').val();
			
		params = { firstname: firstname, lastname: lastname, username: username, email: email, password: password};
		
		$.put('/users/update', params, function (data) {});

});
	
