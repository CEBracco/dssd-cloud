// Your Client ID can be retrieved from your project in the Google
// Developer Console, https://console.developers.google.com
var CLIENT_ID = '758406434236-rv0ete34p36njs4n207lfqs5mkd2s0co.apps.googleusercontent.com';

var SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];

var pageToken = null;
var firstPageToken = null;

/**
 * Check if current user has authorized this application.
 */
function checkAuth() {
	gapi.auth.authorize(
	  {
		'client_id': CLIENT_ID,
		'scope': SCOPES.join(' '),
		'immediate': true
	  }, handleAuthResult);
}

  /**
   * Handle response from authorization server.
   *
   * @param {Object} authResult Authorization result.
   */
function handleAuthResult(authResult) {
	var authorizeDiv = $('.authPanel');
	if (authResult && !authResult.error) {
		// Hide auth UI, then load client library.
		authorizeDiv.fadeOut(400, function(){
			Materialize.showStaggeredList('#tableList');
		});
		loadDriveApi();
	} else {
		// Show auth UI, allowing the user to initiate authorization by
		// clicking authorize button.
		authorizeDiv.fadeIn();
	}
}

/**
 * Initiate auth flow in response to user clicking authorize button.
 *
 * @param {Event} event Button click event.
 */
function handleAuthClick(event) {
	gapi.auth.authorize(
	  {client_id: CLIENT_ID, scope: SCOPES, immediate: false},
	  handleAuthResult);
	return false;
}

/**
 * Load Drive API client library.
 */
function loadDriveApi() {
	gapi.client.load('drive', 'v3', listFiles);
}

/**
 * Print files.
 */
function listFiles() {
	var request = gapi.client.drive.files.list({
		'pageSize': 40,
		'orderBy': 'name',
		'pageToken': pageToken,
		'fields': "nextPageToken, files(id, name)"
	});

	request.execute(handleResponse);

}

function handleResponse(resp) {
	// appendPre('Files:');
	var files = resp.files;
	if (files && files.length > 0) {
		for (var i = 0; i < files.length; i++) {
			var file = files[i];
			// appendPre(file.name + ' (' + file.id + ')');
			appendRow(file.name);
		}
	}
	else {
		appendPre('No files found.');
	}
	pageToken=resp.nextPageToken;

	// if(firstPageToken == null){
	// 	firstPageToken=pageToken;
	// }
	// else {
	// 	if(firstPageToken == pageToken){
	// 		alert('fin');
	// 	}
	// }
}

/**
 * Append a pre element to the body containing the given message
 * as its text node.
 *
 * @param {string} message Text to be placed in pre element.
 */
function appendPre(message) {
	var pre = document.getElementById('output');
	var textContent = document.createTextNode(message + '\n');
	pre.appendChild(textContent);
}

function appendRow(message){
	$('#filesTable > tbody:last-child').append('<tr><td>'+ message +'</td></tr>');
}

$(document).ready(function(){
	$('.signInButton').click(function(event){
		handleAuthClick(event);
	});

	$('#nextPageButton').click(function(event){
		listFiles();
	});
});