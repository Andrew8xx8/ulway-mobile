(function($, window){

var $dashboard,
	$dashboardList;

/**
 * Отрисоывывает твиты
 *
 * @param {Object} posts
 *
 * @returns {String}
 */
var render = function (posts) {
	var view = '';

	posts.forEach(function(post){
		console.log(post);
		view +=
		'<div data-role="collapsible" data-mini="true" data-iconpos="right">' +
		   '<h3>' + post.text + '</h3>' +
		   '<p>' + post.created_at +'</p>' +
		'</div>';
	});
	
	return view;
};

/**
 * Загружает и отрисовывает контент
 *
 * @param {String} [user='tumblr']
 */
var load = function (user) {
	var username = 'ulway'; 
	var url = 'http://search.twitter.com/search.json?callback=?&rpp=10&q=from:' + username + '';
	var show = new Array(); 

	$.mobile.pageLoading();

	var timeoutId = window.setTimeout(function () {
		 $.mobile.pageLoading(true);
	}, 3000);
	
	$.getJSON(url,function(json) {
		$('#dashboard-list').html(render(json.results)).page();

		$.mobile.pageLoading(true);

		window.clearTimeout(timeoutId);
	});
};

var init = function () {
	if (init.called) {
		return;
	}
	init.called = true;

	$dashboard = $('#dashboard');
	$streetSelect = $('#street-select');

	// Клик на любой тумбнайл
	$streetSelect.delegate('a', 'click', function () {
		var id = "street_" + $(this).attr('data-id');

		$('#post-where').prepend(
			'<div><input type="text" name="post_where[]" id="input_' + id  + '" value="' + $(this).attr('text') + '"  />' +
			'<a data-id="' + $(this).attr('data-id') + '" id="delete_' + id  + '" data-role="button" data-icon="delete" data-iconpos="notext" data-mini="true" data-inline="true" data-corners="true" data-shadow="true" data-iconshadow="true" data-wrapperels="span" data-theme="c" title="Delete"> </a></div>'
		);

		$('#input_' + id).textinput();
		$('#delete_' + id).button();

		$.mobile.changePage('#add-post');

		return false;
	});

	$('#post-where').delegate('a', 'click', function () {
		if ($(this).attr('data-id') > 0) {
			var id = "street_" + $(this).attr('data-id');
			$('#input_' + id).parent().remove();
			return false;
		}
	});

	$('#add-post').delegate('#submit', 'click', function () {
		var post = fetchPost();
		if (post.length > 140) {
			alert('Многа букав');
			return false;
		}
	});

	$('#add-post').delegate('input', 'change', checkWidth);
	$('#add-post').delegate('textarea', 'keyup', checkWidth);

	load('ulway');
};
	
init.called = false;

document.addEventListener("deviceready", init, true);
	
// Оставляем для отладки в обычном браузере
$(init);

}(jQuery, window));
