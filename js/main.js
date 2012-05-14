(function($, window){

var ulwayApiUrl = 'http://ulway.net/api';

var fetchTemplate = function(template_name, data){
	var result = $(template_name).html();
	
	for(var i in data) {
		var name = new RegExp('{' + i + '}','g');
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
		view += fetchTemplate('#dashboard_list_item', {
			text: post.text,
		   	created_at: post.created_at
		})
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

	return fetchTemplate ('#post_template', {
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

	$.getJSON(url + '?callback=?', function(json) {
			if (json.length && json.length > 0) {
				$('#streets_list').html(renderStreets(json));
				$('#streets_list').trigger( "create" );
			} else {
				$('#streets_list').html(fetchTemplate('#streets_not_found'));
			}

			$.mobile.hidePageLoadingMsg();

			window.clearTimeout(timeoutId);
		}
	);
};

var renderStreets = function (streetsList) {
	var view = '';

	streetsList.forEach(function(street){
		view += fetchTemplate ('#street_list_item', {
			id: street.street_id,
			name: street.name,
		});
	});
		
	return fetchTemplate ('#street_list', {items:view});
}

var showMessage = function (text) {
	var dialog = fetchTemplate('#dialog_box', {message: text});
	$(dialog)
		.css({ "display":"block", "opacity":0.8, "top": $(window).scrollTop() + 100 })
		.appendTo( $("body") )
		.delay( 1500 )
		.fadeOut( 300, function(){
			$(this).remove();
		});
}

var init = function () {
	if (init.called) {
		return;
	}

	init.called = true;

	$('#add-street').delegate('a', 'click', function () {
		var id = $(this).attr('data-id');
		
		$('#post-where').prepend(fetchTemplate('#street_input', {
			id: id,
			text: $(this).text()
		}));

		$('#input_street_' + id).textinput();
		$('#delete_street_' + id).button();

		checkWidth();

		$.mobile.changePage('#add-post');

		return false;
	});
	
	$('#add-street').delegate('#select_street', 'keyup', function () {
		loadStreets($(this).val());
	});

	$('#post-where').delegate('a', 'click', function () {
		if ($(this).attr('data-id') > 0) {
			var id = "street_" + $(this).attr('data-id');

			$('#input_' + id).parent().remove();
			checkWidth();

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
	checkWidth();
};
	
init.called = false;

document.addEventListener("deviceready", init, true);
	
// Оставляем для отладки в обычном браузере
$(init);

}(jQuery, window));
