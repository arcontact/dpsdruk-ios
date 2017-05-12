if(!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (obj, fromIndex) {
		if (fromIndex == null) 
			fromIndex = 0;
		else if (fromIndex < 0)
			fromIndex = Math.max(0, this.length + fromIndex);
		for (var i = fromIndex, j = this.length; i < j; i++)
			if (this[i] === obj) return i;
        return -1;
    };
};
function findIndexByKeyValue(arr, v) {
	for(var i = 0, j = arr.length; i < j; i += 1){
		if(arr[i] == v)
			return i;
	}
	return null;
}

var	api_splash_methods = ['index_categories','index_articles'],
	loaded_api_splash_methods = [],
	splash_articles = [],
	splash_categories = [],
	current_category_id,
	current_subcategory_id,
	$$ = Dom7,
	myApp,
	mainView,
	articles_limit = 5,
	articles_offset = articles_limit;

var app = {
	settings: {
		eval_callbacks: ['api_init_check','api_init_end','single_article','single_category'],
		key: 'e547a2036c6faffc2859e132e7eee66f',
	},
	initialize: function() {
		this.bindEvents();
	},
	bindEvents: function() {
		//document.addEventListener('deviceready', this.onDeviceReady, false);
		app.api_init_start();
	},
	onDeviceReady: function() {
		app.api_init_start();
	},
	checkConnection: function() {
		if(typeof navigator.connection == 'undefined' || typeof navigator.connection.type == 'undefined') {
			return 'fail';
		}
		var networkState = navigator.connection.type;
		var states = {};
		states[Connection.UNKNOWN]  = 'Unknown connection';
		states[Connection.ETHERNET] = 'Ethernet connection';
		states[Connection.WIFI]     = 'WiFi connection';
		states[Connection.CELL_2G]  = 'Cell 2G connection';
		states[Connection.CELL_3G]  = 'Cell 3G connection';
		states[Connection.CELL_4G]  = 'Cell 4G connection';
		states[Connection.CELL]     = 'Cell generic connection';
		states[Connection.NONE]     = 'fail';
		return states[networkState];
	},
	gotConnection: function(){
		//var a = app.checkConnection();
		//if(a == 'fail'){return false;}
		//return true;
		return $$('#conn').prop('checked');
	},
	refreshConnection: function(button){
		$$(button).html('<i class="material-icons fa-spin">&#xe5d5;</i> Sprawdzam...');
		setTimeout(function(){
			$$(button).html('<i class="material-icons">&#xe5d5;</i> Odśwież');
			if(app.gotConnection()){
				app.api_init_connected();
			}
		}, 1000);
	},
	api_offline: function(){
		mainView.router.load({
			url: 'offline.html',
			animatePages: false
		});
	},
	api_init_start: function(){
		myApp = new Framework7({
			pushState: true,
			swipePanel: 'left',
			material: true,
			notificationCloseButtonText: 'Zamknij',
			modalPreloaderTitle: '',
			modalTitle: 'DPSdruk.pl',
			smartSelectBackText: 'Powrót',
			smartSelectPopupCloseText: 'Zamknij',
			smartSelectPickerCloseText: 'Zrobione',
			onAjaxStart: function (xhr) {
				myApp.showIndicator();
			},
			onAjaxComplete: function (xhr) {
				myApp.hideIndicator();
			}
		});
		mainView = myApp.addView('.view-main', {
			domCache: true
		});
		if(app.gotConnection()){
			app.api_init_connected();
		} else {
			var api_init_start_modal = myApp.modal({
				title: '<div class="text-center"><img src="img/logo.png" class="img-responsive" /><br />Brak połączenia z internetem</div>',
				text: '<div class="text-center">Aplikacja wymaga połączenia z internetem do poprawnego funkcjonowania.</div>',
				buttons: [
					{
						text: '<i class="material-icons">&#xe5d5;</i> Odśwież',
						close: false,
						bold: true,
						onClick: function(){
							$$(api_init_start_modal).find('.modal-button-bold').html('<i class="material-icons fa-spin">&#xe5d5;</i> Sprawdzam...');
							if(app.gotConnection()){
								app.api_init_connected();
							} else {
								setTimeout(function(){
									$$(api_init_start_modal).find('.modal-text').html('<div class="text-center"><span class="text-danger">Nie udało się nawiązać połączenia.</span></div>');
									$$(api_init_start_modal).find('.modal-button-bold').html('<i class="material-icons">&#xe5d5;</i> Odśwież');
								}, 1000);
							}
						}
					},
					{
						text: 'Zamknij',
						onClick: function(){
							app.api_offline();
						}
					}
				]
			});
		}
	},
	api_init_connected: function(){
		myApp.closeModal();
		myApp.showPreloader('Ładuję aplikację...');
		
		loaded_api_splash_methods = [];
		splash_articles = [];
		splash_categories = [];
		
		$$.each(api_splash_methods, function(i,method){
			app.api_call(method, {key: app.settings.key}, 'api_init_check');
		});
	},
	api_init_check: function(response){
		var method = response[0];
		response.shift();
		switch(method){
			case "index_categories":
				splash_categories = response;
			break;
			case "index_articles":
				splash_articles = response;
			break;
		}
		loaded_api_splash_methods.push(method);
		if(api_splash_methods.length == loaded_api_splash_methods.length){
			app.api_init_end();
		}
	},
	api_init_end: function(){
		$$('#categories-list').html('<div class="list-block"></div>');
		$$.each(splash_categories,function(i, category){
			if(typeof category.children != 'undefined'){
				var html = '<div class="list-group"><ul><li class="list-group-title">'+category.title+'</li>';
				$$.each(category.children,function(i, subcategory){
					html += '<li><a href="single_category.html?category_id='+category.id+'&subcategory_id='+subcategory.id+'" class="item-link item-content close-panel" data-id="'+subcategory.id+'" data-ignore-cache="true" data-animate-pages="false"><div class="item-inner"><div class="item-title">'+subcategory.title+'</div></div></a></li>';
				});
				html += '</ul></div>';
				$$('#categories-list .list-block').append(html);
			}
		});
		$$('#splash_articles').html('<div class="content-block-title">Aktualności</div><div class="list-block media-list"><ul></ul></div>');
		$$.each(splash_articles,function(i, article){
			var article_date = moment(article.date).format('DD.MM.YYYY');
			var article_image;
			if(typeof article.image != 'undefined'){
				article_image = 'https://www.beta.dpsdruk.pl/assets/articles/s1_'+article.image;
			} else {
				article_image = 'img/noimage200x104.jpg';
			}
			var li = '<li><a href="single_article.html?article_id='+article.id+'" class="item-link item-content"><div class="item-media"><img src="'+article_image+'" width="80" /></div><div class="item-inner"><div class="item-title-row"><div class="item-title">'+article.article_translation_title+'</div></div><div class="item-subtitle">'+article_date+'</div></div></a></li>';
			$$('#splash_articles ul').append(li);
		});
		$$('#splash_articles').append('<div class="infinite-scroll-preloader"><div class="preloader"><span class="preloader-inner"><span class="preloader-inner-gap"></span><span class="preloader-inner-left"><span class="preloader-inner-half-circle"></span></span><span class="preloader-inner-right"><span class="preloader-inner-half-circle"></span></span></span></div></div>');
		myApp.hidePreloader();
		mainView.router.loadPage('#index');
		app.listeners();
	},
	api_call: function(method, params, callback){
		$$.ajax({
			url: 'https://www.beta.dpsdruk.pl/api/' + method,
			crossDomain: true,
			data: params,
			dataType: 'json',
			success: function(response, status, xhr){
				response.unshift(method);
				app.myEval(callback, response);
			},
			error: function(xhr, status){
				//handle ajax error
			}
		});
	},
	myEval: function(fn_name, params){
		var key = findIndexByKeyValue(app.settings.eval_callbacks, fn_name);
		if(key !== null){
			var fn = app.settings.eval_callbacks[key];
			if(params != null){
				app[fn](params);
			} else {
				app[fn]();
			}
		}
	},
	listeners: function(){
		$$(document).on('page:beforeinit', '.page[data-page="single_article"]', function(e){
			$$('#single_article_contents').html('<div class="content-block" style="text-align:center"><span class="preloader"></span></div>');
			var page = e.detail.page;
			app.api_call('get_article/'+page.query.article_id, {key: app.settings.key}, 'single_article');
		});
		$$(document).on('page:afteranimation', '.page[data-page="single_category"]', function(e){
			$$('.page[data-page="single_category"].page-on-center .single_category_contents').html('<div class="content-block" style="text-align:center"><span class="preloader"></span></div>');
			var page = e.detail.page;
			current_category_id = page.query.category_id;
			current_subcategory_id = page.query.subcategory_id;
			app.api_call('index_products/'+page.query.subcategory_id, {key: app.settings.key}, 'single_category');
		});
		$$('#contact-form').on('form:beforesend', function(e){
			myApp.showPreloader();
		});
		$$('#contact-form').on('form:success', function(e){
			myApp.hidePreloader();
			var xhr = e.detail.xhr;
			var response = JSON.parse(xhr.response);
			myApp.alert(response.message);
			switch(response.type){
				case "success":
					$$('#contact-form')[0].reset();
				break;
				case "error":
					
				break;
			}
		});
		$$('#contact-form').on('form:error', function(e){
			myApp.hidePreloader();
			myApp.alert('Przepraszamy ale wystąpił błąd podczas wysyłania formularza.');
		});
		
		//infinitescroll articles
		var loading = false;
		var lastIndex = $$('.articles-list .list-block li').length;
		$$('.articles-infinite-scroll.infinite-scroll').on('infinite', function () {
			if(loading) return;
			loading = true;
			setTimeout(function(){
				if(app.gotConnection()){
					$$.ajax({
						url: 'https://www.beta.dpsdruk.pl/api/index_articles/' + articles_limit + '/' + articles_offset,
						crossDomain: true,
						dataType: 'json',
						data: {key: app.settings.key},
						success: function(response, status, xhr){
							loading = false;
							if(response.length <= 0){
								myApp.detachInfiniteScroll($$('.infinite-scroll'));
								$$('.infinite-scroll-preloader').remove();
								return;
							}
							var html = '';
							$$.each(response,function(i, article){
								var article_date = moment(article.date).format('DD.MM.YYYY');
								var article_image;
								if(typeof article.image != 'undefined'){
									article_image = 'https://www.beta.dpsdruk.pl/assets/articles/s1_'+article.image;
								} else {
									article_image = 'img/noimage200x104.jpg';
								}
								html += '<li><a href="single_article.html?article_id='+article.id+'" class="item-link item-content"><div class="item-media"><img src="'+article_image+'" width="80" /></div><div class="item-inner"><div class="item-title-row"><div class="item-title">'+article.article_translation_title+'</div></div><div class="item-subtitle">'+article_date+'</div></div></a></li>';
							});
							$$('.articles-list .list-block ul').append(html);
							lastIndex = $$('.articles-list .list-block li').length;
							articles_offset = articles_offset + articles_limit;
						},
						error: function(xhr, status){
							//handle ajax error
						}
					});
				} else {
					app.api_offline();
				}
			}, 1000);
		});
	},
	single_article: function(response){
		response.shift();
		var article = response[0];
		var article_date = moment(article.date).format('DD.MM.YYYY');
		var article_image;
		if(typeof article.image != 'undefined'){
			article_image = 'https://www.beta.dpsdruk.pl/assets/articles/s3_'+article.image;
		} else {
			article_image = 'img/noimage653x356.jpg';
		}
		$$('#single_article_contents').html('<div class="content-block"><h2>'+article.article_translation_title+'</h2><p>'+article_date+'</p><img src="'+article_image+'" class="img-responsive" />'+article.article_translation_content+'</div>');
	},
	single_category: function(response){
		response.shift();
		console.log(response);
		$$.each(splash_categories, function(i, category){
			if(category.id == current_category_id){
				$$.each(category.children,function(i, subcategory){
					if(subcategory.id == current_subcategory_id){
						$$('.page[data-page="single_category"].page-on-center .single_category_contents').html('<div class="content-block"><h2>'+subcategory.title+'</h2>'+subcategory.content+'</div>');
					}
				});
			}
		});
		$$.each(response, function(i, product){
			var product_image;
			if(typeof product.producer_tile_image != 'undefined'){
				product_image = 'https://www.beta.dpsdruk.pl/assets/producers/s6_'+product.producer_tile_image;
			} else {
				product_image = 'img/noimage100x100.png';
			}
			var html = '<a class="card text-center"><div class="card-content"><div class="card-content-inner"><img src="'+product_image+'" alt="" class="img-responsive" />'+product.product_translation_title+'</div></div></a>';
			$$('.page[data-page="single_category"].page-on-center .single_category_contents').append(html);
		});
	}
};