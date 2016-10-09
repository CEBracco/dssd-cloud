// Your Client ID can be retrieved from your project in the Google
// Developer Console, https://console.developers.google.com
var CLIENT_ID = '758406434236-rv0ete34p36njs4n207lfqs5mkd2s0co.apps.googleusercontent.com';

var SCOPES =['https://www.googleapis.com/auth/drive.metadata.readonly',
			'https://www.googleapis.com/auth/drive',
			'https://www.googleapis.com/auth/drive.file',
			'https://www.googleapis.com/auth/drive.appdata',
			'https://www.googleapis.com/auth/documents'];

var accessToken;

var pageToken = null;
var path = ['root'];

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
	accessToken=authResult.access_token;
	gapi.load('drive-share', shareFile);
	var authorizeDiv = $('.authPanel');
	if (authResult && !authResult.error) {
		// Hide auth UI, then load client library.
		authorizeDiv.fadeOut(400, function(){
			Materialize.showStaggeredList('#tableList');
		});
		loadDriveApi(listFiles);
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
function loadDriveApi(action) {
	gapi.client.load('drive', 'v3', action);
}

/**
 * Print files.
 */
function listFiles() {
	$('#nextPageButton').hide();
	var request = gapi.client.drive.files.list({
		'pageSize': 40,
		'orderBy': 'folder,name',
		'pageToken': pageToken,
		'fields': "nextPageToken, files(id, name, mimeType)",
		'q': "'"+ path[path.length - 1] +"' in parents"
	});

	request.execute(handleResponse);
}

function handleResponse(resp) {
	var files = resp.files;
	if (files && files.length > 0) {
		for (var i = 0; i < files.length; i++) {
			var file = files[i];
			appendRow(file.id, file.name, file.mimeType);
		}
	}
	else {
		$('#emptyFolder').show();
	}
	pageToken=resp.nextPageToken;

	updateButtons();
}

/**
 * Append a pre element to the body containing the given message
 * as its text node.
 *
 * @param {string} message Text to be placed in pre element.
 */
function appendRow(id, name, mimeType = null){
	var icon='description';
	if(mimeType == 'application/vnd.google-apps.folder'){
		icon='folder';
	}
	$('#filesTable > tbody:last-child').append("<tr id='"+id+"''><td id='"+ id +"' class='"+ icon +" inspectionable'><i class='material-icons left'>"
		+ icon +'</i>'+ name +"<i class='material-icons right waves-effect shareButton' title='Compartir'>share</i></td></tr>");
}

function updateButtons(){
	if(pageToken != null){
		$('#nextPageButton').fadeIn();
	}

	if(path.length > 1){
		$('#upButton').fadeIn();
	}
	else{
		$('#upButton').fadeOut();	
	}
}


function initialize(){
	$('#emptyFolder').hide();
	$('#filesTable tbody tr').remove();
	pageToken=null;
}

$(document).ready(function(){
	$('.modal-trigger').leanModal();

	$('.signInButton').click(function(event){
		handleAuthClick(event);
	});

	$('#nextPageButton').click(function(){
		listFiles();
	});

	$("#filesTable").on("click", ".inspectionable", function() {
		initialize();
		path.push($(this).closest('tr').attr('id'));
		listFiles();
	});

	$('#upButton').click(function(){
		initialize();
		if(path.length > 1){
			path.splice(path.length - 1, 1);
		}
		listFiles();
	});

	$('#newFileButton').click(function(){
		loadDriveApi(createFile);
	});

	$("#filesTable").on("click", ".shareButton", function(e) {
		e.stopPropagation();
		var fileId= $(this).closest('tr').attr('id');
		s.setItemIds([fileId]);
		s.showSettingsDialog();
	});
});

function createFile(){
	var request= gapi.client.drive.files.create({
		'name': $('#fileName').val(),
		'mimeType': 'application/vnd.google-apps.document',
		'parents': [ path[path.length - 1] ],
	});

	request.execute(function(resp) {
		initialize();
		listFiles();
		putDocumentContent(resp.id,$('#fileText').val());
	});
}

function shareFile(){
	s = new gapi.drive.share.ShareClient();
	s.setOAuthToken(accessToken);
}

function clearModal(){
	$('#fileName').val('');
	$('#fileText').val('');
}

function putDocumentContent(id,text){
	var scriptId = "MIFTozboe_uHXyIf2hSHNnTXcweTaZvFx";

	// Create an execution request object.
	var request = {
		'function': 'getDoc',
		'parameters': [ id, text ]
	};

	// Make the API request.
	var op = gapi.client.request({
		'root': 'https://script.googleapis.com',
		'path': 'v1/scripts/' + scriptId + ':run',
		'method': 'POST',
		'body': request
	});

	op.execute(function(resp){
		clearModal();
		Materialize.updateTextFields();
	});
}

$(window).on('beforeunload', function(){
	return "¿Desea salir de la página?";
});