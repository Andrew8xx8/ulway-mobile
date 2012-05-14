(function($, window){

var $dashboard,
	$dashboardList;

var post_template = '[{timestamp}] {type}{location}{comment}#ulway';
var streetList = '<ul data-role="listview">{items}</ul>'
var streetListItem = '<li><a href="#" data-id="{id}">{name}</a></li>';
var streetsNoFound = '<h3>Такой улицы нет, но всегда можно добавить =)</h3>'
var ulwayApiUrl = 'http://8xx8.ru/ulway';

var fetchTemplate = function(template, data){
	var result = template;
	
	for(var i in data) {
		name = '{' + i + '}';
		result = result.replace(name, data[i]);
	}

	return result;
};

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
var load = function (username) {
	var url = 'http://search.twitter.com/search.json?callback=?&rpp=10&q=from:' + username + '';
	var show = new Array(); 

	$.mobile.showPageLoadingMsg();

	var timeoutId = window.setTimeout(function () {
		 $.mobile.hidePageLoadingMsg();
	}, 3000);
	
	$.getJSON(url, function(json) {
		$('#dashboard-list').html(render(json.results));

		$.mobile.hidePageLoadingMsg();

		window.clearTimeout(timeoutId);
	});
};

var addSpace = function (val) {
	if (val !== '') {
		val += ' ';
	}

	return val;
}

var generateLocation = function () {
	var location = ''
	var count = 0;

	$('#post-where input').each( function(index, street) {
		if (count > 0) {
			location += ' x ';	
		}
		var street_name = $(street).val();
		location += street_name.charAt(0).toUpperCase() + street_name.substr(1);

		count++;
	});

	return location;
}

var generateLocationIds = function () {
	var location = [];

	$('#post-where input').each( function(index, street) {
		location.push($(street).attr('data-id'));
	});

	return location;
}

var getTime = function () {
	var currentTime = new Date();
	var hours = currentTime.getHours();
	var minutes = currentTime.getMinutes();

	return hours + ':' + minutes;
}

var fetchPost = function () {
	var currentTime = new Date();
	var hours = currentTime.getHours();
	var minutes = currentTime.getMinutes();

	return fetchTemplate (post_template, {
		type: addSpace($('input:radio[name=post_type]:checked').val()),
		timestamp: getTime(),
		location: addSpace(generateLocation()),
		comment: addSpace($('#post_comment').val()),
	});
}

var setChars = function (number) {
	$('#chars').html(number);

	if (number > 0) {
		$('#chars').removeClass('red');
		$('#chars').addClass('green');
	} else {
		$('#chars').removeClass('green');
		$('#chars').addClass('red');
	}
}

var checkWidth = function () {
	var post = fetchPost();

	$('#preview').html(post);

	setChars(140 - post.length);
};

var loadStreets = function (streetName) {
	var url = ulwayApiUrl + '/streets';

	if (streetName != '') {
		url += '/' + streetName;
	}

	$.mobile.showPageLoadingMsg();

	var timeoutId = window.setTimeout(function () {
		 $.mobile.hidePageLoadingMsg();
	}, 3000);

	$.getJSON(url + '?callback=?', function(json, msg) {
			if (json.length != 'undefined') {
				$('#streets_list').html(renderStreets(json));
				$('#streets_list').trigger( "create" );
			} else {
				$('#streets_list').html(fetchTemplate(streetsNoFound));
			}

			$.mobile.hidePageLoadingMsg();

			window.clearTimeout(timeoutId);
		}
	);
};

var renderStreets = function (streetsList) {
	var view = '';

	streetsList.forEach(function(street){
		view += fetchTemplate (streetListItem, {
			id: street.street_id,
			name: street.name,
		});
	});
		
	return fetchTemplate (streetList, {items:view});
}

var init = function () {
	if (init.called) {
		return;
	}

	init.called = true;

	$dashboard = $('#dashboard');
	$streetSelect = $('#add-street');

	// Клик на любой тумбнайл
	$streetSelect.delegate('a', 'click', function () {
		var id = "street_" + $(this).attr('data-id');

		$('#post-where').prepend(
			'<div><input type="text" name="post_where[]" id="input_' + id  + '" value="' + $(this).text() + '"  />' +
			'<a data-id="' + $(this).attr('data-id') + '" id="delete_' + id  + '" data-role="button" data-icon="delete" data-iconpos="notext" data-mini="true" data-inline="true" data-corners="true" data-shadow="true" data-iconshadow="true" data-wrapperels="span" data-theme="c" title="Delete"> </a></div>'
		);

		$('#input_' + id).textinput();
		$('#delete_' + id).button();

		checkWidth();

		$.mobile.changePage('#add-post');

		return false;
	});
	
	$streetSelect.delegate('#select_street', 'keyup', function () {
		loadStreets($(this).val());
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
		} else if (post.length < 10) {
			alert('Мала букав');
		} else {
			$.mobile.showPageLoadingMsg();

			$.ajax({
				type: 'POST',
				url: ulwayApiUrl + '/post',
				data: {
					post: fetchPost(),
					time: getTime(),
					locations: generateLocationIds()
				},
				complite: function(data) {
					$.mobile.hidePageLoadingMsg();
				}
			});
		}
	});

	$('#add-post').delegate('input', 'change', checkWidth);
	$('#add-post').delegate('textarea', 'keyup', checkWidth);

	load('ulway');
	loadStreets('А');
	checkWidth();
};
	
init.called = false;

document.addEventListener("deviceready", init, true);
	
// Оставляем для отладки в обычном браузере
$(init);

}(jQuery, window));
