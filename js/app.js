if(!Array.prototype.indexOf){Array.prototype.indexOf=function(obj,fromIndex){if(fromIndex==null)fromIndex = 0;else if (fromIndex<0)fromIndex = Math.max(0, this.length + fromIndex);for(var i=fromIndex, j=this.length; i<j; i++)if(this[i]===obj) return i;return -1;};};
function findIndexByKeyValue(arr,v){for(var i=0, j=arr.length; i<j; i+=1){if(arr[i] == v)return i;}return null;}
function randId(){return Math.random().toString(36).substr(2,10);}
String.prototype.escapeDiacritics = function(){
    return this.replace(/ą/g, 'a').replace(/Ą/g, 'A')
        .replace(/ć/g, 'c').replace(/Ć/g, 'C')
        .replace(/ę/g, 'e').replace(/Ę/g, 'E')
        .replace(/ł/g, 'l').replace(/Ł/g, 'L')
        .replace(/ń/g, 'n').replace(/Ń/g, 'N')
        .replace(/ó/g, 'o').replace(/Ó/g, 'O')
        .replace(/ś/g, 's').replace(/Ś/g, 'S')
        .replace(/ż/g, 'z').replace(/Ż/g, 'Z')
        .replace(/ź/g, 'z').replace(/Ź/g, 'Z');
}
function videourlToHTML(videourl){
	var regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
	var match = videourl.match(regExp);
	if(match && match[2].length == 11) {
		return '<div class="embed-responsive embed-responsive-16by9"><div class="embed-responsive-item youtube-mobile" data-embed="'+match[2]+'"><div class="play-button"></div></div></div>';
	} else {
		return '<a href="'+videourl+'" class="external button button-fill button-raised color-blue">'+videourl+'</a>';
	}
}

var	$$ = Dom7, myApp, mainView,
	initilize_complete = false, index_articles_loaded = false, categories = [], map_loaded = false,
	articles_limit = 10, articles_offset = articles_limit,
	calculator_query = {},
	myMessages, totalMessages = 0, chat_interval,
	baseurl = 'https://www.beta.dpsdruk.pl/',
	session_id = randId(),
	ENVIRONMENT = 'development'; //production
var app = {
	initialize: function(){
		this.bindEvents();
	},
	bindEvents: function(){
		switch(ENVIRONMENT){
			case 'development': app.init(); break;
			case 'production': document.addEventListener('deviceready', this.onDeviceReady, false); break;
		}
	},
	onDeviceReady: function(){
		app.init();
		document.addEventListener('offline', app.offline, false);
	},
	checkConnection: function(){
		if(typeof navigator.connection == 'undefined' || typeof navigator.connection.type == 'undefined') return 'fail';
		var networkState = navigator.connection.type;
		var states = {};
		states[Connection.UNKNOWN] = 'Unknown connection'; states[Connection.ETHERNET] = 'Ethernet connection'; states[Connection.WIFI] = 'WiFi connection'; states[Connection.CELL_2G] = 'Cell 2G connection'; states[Connection.CELL_3G] = 'Cell 3G connection'; states[Connection.CELL_4G] = 'Cell 4G connection'; states[Connection.CELL] = 'Cell generic connection'; states[Connection.NONE] = 'fail';
		return states[networkState];
	},
	gotConnection: function(){
		if(ENVIRONMENT == 'development')
			return true;
		if(app.checkConnection() == 'fail')return false;
		return true;
	},
	init: function(){
		myApp = new Framework7({
			uniqueHistory: true,
			swipePanelOnlyClose: true,
			swipeout: false,
			sortable: false,
			tapHold: true,
			pushState: true,
			material: true,
			notificationCloseButtonText: 'Zamknij',
			modalPreloaderTitle: '',
			modalTitle: '',
			modalButtonCancel: 'Zamknij',
			smartSelectBackText: 'Powrót',
			smartSelectPopupCloseText: 'Zamknij',
			smartSelectPickerCloseText: 'Zrobione',
			smartSelectBackOnSelect: true,
			showBarsOnPageScrollEnd: false,
			onAjaxStart: function(xhr) {
				myApp.showIndicator();
			},
			onAjaxComplete: function(xhr) {
				myApp.hideIndicator();
			}
		});
		mainView = myApp.addView('.view-main', {
			domCache: true,
		});
		app.handle_init_requests();
		app.listeners();
	},
	handle_init_requests: function(){
		if(app.gotConnection()){
			myApp.showPreloader('Ładuję aplikację...');
			var chatid = localStorage.chatid;
			
			$$.ajax({
				url: baseurl+'api/init/'+articles_limit,
				crossDomain: true,
				dataType: 'json',
				data: {
					key: 'e547a2036c6faffc2859e132e7eee66f',
					chatid: chatid,
					session_id: session_id
				},
				success: function(response, status, xhr){
					$$('.splash_articles').html('<div class="list-block media-list"><ul></ul></div>');
					$$.each(response.articles, function(i, article){
						var article_date = moment(article.date).format('LL');
						var article_image;
						if(typeof article.image != 'undefined'){
							article_image = baseurl+'assets/articles/s1_'+article.image;
						} else {
							article_image = 'img/noimage200x104.jpg';
						}
						var li = '<li><a href="single_article.html?article_id='+article.id+'" class="item-link item-content"><div class="item-media"><img data-src="'+article_image+'" class="lazy" width="80" height="42" /></div><div class="item-inner"><div class="item-title-row"><div class="item-title">'+article.title+'</div></div><div class="item-text"><small>'+article_date+'</small></div></div></a></li>';
						$$('.splash_articles ul').append(li);
						$$('.articles-list ul').append(li);
					});
					$$('.splash_articles').append('<a href="#index_articles" class="button">POKAŻ WSZYSTKIE</a>');
					myApp.initImagesLazyLoad($$('.page[data-page="index"]'));
					
					$$('#categories-list').html('<div class="list-block"></div>');
					$$.each(response.categories,function(i, category){
						if(typeof category.children != 'undefined'){
							var html = '<div class="list-group"><ul><li class="list-group-title">'+category.title+'</li>';
							$$.each(category.children,function(i, subcategory){
								html += '<li><a href="single_category.html?category_id='+category.id+'&subcategory_id='+subcategory.id+'" class="item-link item-content close-panel" data-id="'+subcategory.id+'"><div class="item-inner"><div class="item-title">'+subcategory.title+'</div></div></a></li>';
							});
							html += '</ul></div>';
							$$('#categories-list .list-block').append(html);
						}
					});
					
					$$('.page[data-page="about"] .page-content').append('<div class="content-block"><article>'+response.about.content+'</article></div>');
					if(typeof response.about.sections != 'undefined'){
						$$.each(response.about.sections,function(i,section){
							$$('.page[data-page="about"] .page-content').append('<div class="content-block-title">'+section.title+'</div><div class="content-block"><article>'+section.content.replace(/<a(\s[^>]*)?>/ig, '').replace(/<\/a>/ig, '')+'</article></div>');
							
							if(typeof section.galleries != 'undefined'){
								var sectionPhotoBrowsers = [];
								$$.each(section.galleries, function(i,gallery){
									var _photos = [];
									var id = randId();
									$$.each(gallery.photos, function(j,photo){
										if(j == 0){
											$$('.page[data-page="about"] .page-content').append('<div class="content-block"><a class="card pb" data-id="'+id+'"><div style="background-image:url('+baseurl+'assets/media/s4_'+photo+')" valign="bottom" class="card-header color-white no-border"><div class="chip"><div class="chip-media"><i class="material-icons">&#xe413;</i></div><div class="card-label">'+gallery.photos.length+'</div></div></div><div class="card-content"><div class="card-content-inner">'+gallery.title+'</div></div></a></div>');
										}
										_photos.push(baseurl+'assets/media/s4_'+photo);
									});
									var myPhotoBrowser = myApp.photoBrowser({
										photos: _photos,
										ofText: 'z',
										backLinkText: 'Powrót',
										theme: 'dark',
										lazyLoading: true,
										lazyLoadingInPrevNext: true
									});
									sectionPhotoBrowsers.push({
										id: id,
										pb: myPhotoBrowser
									});
								});
								$$('.pb').on('click', function(){
									var id = $$(this).data('id');
									$$.each(sectionPhotoBrowsers, function(i, _pb){
										if(id == _pb.id){
											_pb.pb.open();
										}
									});
								});
							}
							if(typeof section.videos != 'undefined'){
								$$.each(section.videos, function(i,video){
									var id = randId();
									$$('.page[data-page="about"] .page-content').append('<div class="content-block"><video id="'+id+'" class="video-js vjs-16-9 vjs-big-play-centered" controls preload="auto"><source src="'+baseurl+'assets/video/'+video+'" type="video/mp4"></video></div>');
									videojs(id);
								});
							}
							if(typeof section.videourls != 'undefined'){
								$$.each(section.videourls, function(i,videourl){
									var videourlHTML = videourlToHTML(videourl);
									$$('.page[data-page="about"] .page-content').append('<div class="content-block">'+videourlHTML+'</div>');
								});
								app.youtube_listeners();
							}
							if(typeof section.files != 'undefined'){
								var html = '<div class="list-block media-list"><ul>';
								$$.each(section.files, function(i,_file){
									html += '<li><a href="'+baseurl+'assets/files/'+_file.filename+'" class="external item-link item-content"><div class="item-media"><img src="img/filetypes/'+_file.type+'.png" width="30" height="30"></div><div class="item-inner"><div class="item-title">'+_file.title+'</div></div></a></li>';
								});
								html += '</ul></div>';
								$$('.page[data-page="about"] .page-content').append('<div class="content-block">'+html+'</div>');
							}
						});
					}
					$$('.page[data-page="about"] .page-content .content-block a').addClass('external');
					$$('.page[data-page="about"] article img').each(function(){
						$$(this).attr('src', baseurl.substring(0, baseurl.length-1) + $$(this).attr('src').replace(baseurl,"/"));
					});
					
					app.init_calculator(response);
					app.chat_preinit(response);
					categories = response.categories;
					initilize_complete = true;
				},
				error: function(xhr, status){
					app.offline('#index');
				},
				complete: function(){
					myApp.hidePreloader();
				}
			});
		} else {
			app.offline('#index');
		}
	},
	offline: function(page){
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
							if(typeof page == 'undefined')
								page = '#index';
							app.connected(page);
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
						mainView.router.load({
							url: 'offline.html',
							pushState: false,
							animatePages: false
						});
					}
				}
			]
		});
	},
	refreshConnection: function(button, page){
		$$(button).html('<i class="material-icons fa-spin">&#xe5d5;</i> Sprawdzam...');
		setTimeout(function(){
			$$(button).html('<i class="material-icons">&#xe5d5;</i> Odśwież');
			if(app.gotConnection()){
				app.connected(page);
			}
		}, 1000);
	},
	connected: function(page){
		if(mainView.activePage.name == page){
			mainView.router.refreshPage();
		} else {
			mainView.router.loadPage(page);
		}
	},
	listeners: function(){
		$$(document).on('page:init', function(e){
			if(!app.gotConnection() && mainView.activePage.name != 'offline' && mainView.activePage.name != 'offline_contact'){
				app.offline();
			}
		});
		$$(document).on('page:afteranimation', function(e){
			if(mainView.activePage.name == 'chat'){
				app.chat_init();
			} else {
				clearInterval(chat_interval);
			}
		});
		myApp.onPageAfterAnimation('offline', function(page){
			if(app.gotConnection()){
				mainView.router.loadPage('#index');
			}
		});
		myApp.onPageAfterAnimation('offline_contact', function(page){
			if(app.gotConnection()){
				mainView.router.loadPage('#index');
			}
		});
		myApp.onPageReinit('index', function(page){
			if(!initilize_complete){
				app.handle_init_requests();
			}
		});
		myApp.onPageInit('contact', function(page){
			if(!map_loaded){
				app.initMap();
			}
		});
		myApp.onPageInit('index_articles', function(page){
			$$('.articles-list').append('<div class="infinite-scroll-preloader"><div class="preloader"><span class="preloader-inner"><span class="preloader-inner-gap"></span><span class="preloader-inner-left"><span class="preloader-inner-half-circle"></span></span><span class="preloader-inner-right"><span class="preloader-inner-half-circle"></span></span></span></div></div>');
			var loading = false;
			var lastIndex = $$('.articles-list .list-block li').length;
			$$('.articles-infinite-scroll.infinite-scroll').on('infinite', function () {
				if(loading) return;
				loading = true;
				setTimeout(function(){
					if(app.gotConnection()){
						$$.ajax({
							url: baseurl+'api/index_articles/' + articles_limit + '/' + articles_offset,
							crossDomain: true,
							dataType: 'json',
							data: {
								key: 'e547a2036c6faffc2859e132e7eee66f',
								session_id: session_id
							},
							success: function(response, status, xhr){
								loading = false;
								if(response.length <= 0){
									myApp.detachInfiniteScroll($$('.infinite-scroll'));
									$$('.infinite-scroll-preloader').remove();
									return;
								}
								var html = '';
								$$.each(response, function(i, article){
									var article_date = moment(article.date).format('LL');
									var article_image;
									if(typeof article.image != 'undefined')
										article_image = baseurl+'assets/articles/s1_'+article.image;
									else
										article_image = 'img/noimage200x104.jpg';
									html += '<li><a href="single_article.html?article_id='+article.id+'" class="item-link item-content"><div class="item-media"><img data-src="'+article_image+'" class="lazy" width="80" height="42" /></div><div class="item-inner"><div class="item-title-row"><div class="item-title">'+article.article_translation_title+'</div></div><div class="item-text"><small>'+article_date+'</small></div></div></a></li>';
								});
								$$('.articles-list .list-block ul').append(html);
								lastIndex = $$('.articles-list .list-block li').length;
								articles_offset = articles_offset + articles_limit;
								myApp.initImagesLazyLoad($$('.page[data-page="index_articles"]'));
							},
							error: function(xhr, status){
								myApp.alert('<div class="text-center"><img src="img/logo.png" class="img-responsive" /><br />Przepraszamy ale nie udało się pobrać aktualności ze strony <a href="'+baseurl+'" class="external">www.dpsdruk.pl</a></div>', '', function(){
									mainView.router.loadPage('offline_contact.html');
								});
							}
						});
					} else {
						app.offline();
					}
				}, 1000);
			});
			myApp.initImagesLazyLoad($$('.page[data-page="index_articles"]'));
		});
		myApp.onPageInit('single_article', function(page){
			if(app.gotConnection()){
				myApp.showPreloader('Ładuję aktualność...');
				$$.ajax({
					url: baseurl+'api/get_article/' + page.query.article_id,
					crossDomain: true,
					dataType: 'json',
					data: {
						key: 'e547a2036c6faffc2859e132e7eee66f',
						session_id: session_id
					},
					success: function(response, status, xhr){
						var article = response;
						var article_date = moment(article.date).format('LLLL');
						var article_image = '';
						if(typeof article.image != 'undefined')
							article_image = '<img src="'+baseurl+'assets/articles/s3_'+article.image+'" class="img-responsive" />';
						$$('#single_article_contents').html('<div class="content-block"><p class="text-muted"><small><i>'+article_date+'</i></small></p><h2>'+article.title+'</h2>'+article_image+'<article>'+article.content+'</article></div>');
						$$('#single_article_contents article img').each(function(){
							$$(this).attr('src', baseurl.substring(0, baseurl.length-1) + $$(this).attr('src').replace(baseurl,"/"));
						});
						if(typeof article.galleries != 'undefined'){
							var photoBrowsers = [];
							$$.each(article.galleries, function(i,gallery){
								var _photos = [];
								var id = randId();
								$$.each(gallery.photos, function(j,photo){
									if(j == 0){
										$$('#single_article_contents .content-block').append('<a class="card pb" data-id="'+id+'"><div style="background-image:url('+baseurl+'assets/media/s4_'+photo+')" valign="bottom" class="card-header color-white no-border"><div class="chip"><div class="chip-media"><i class="material-icons">&#xe413;</i></div><div class="card-label">'+gallery.photos.length+'</div></div></div><div class="card-content"><div class="card-content-inner">'+gallery.title+'</div></div></a>');
									}
									_photos.push(baseurl+'assets/media/s4_'+photo);
								});
								var myPhotoBrowser = myApp.photoBrowser({
									photos: _photos,
									ofText: 'z',
									backLinkText: 'Powrót',
									theme: 'dark',
									lazyLoading: true,
									lazyLoadingInPrevNext: true
								});
								photoBrowsers.push({
									id: id,
									pb: myPhotoBrowser
								});
							});
							$$('.pb').on('click', function(){
								var id = $$(this).data('id');
								$$.each(photoBrowsers, function(i, _pb){
									if(id == _pb.id){
										_pb.pb.open();
									}
								});
							});
						}
						if(typeof article.videos != 'undefined'){
							$$.each(article.videos, function(i,video){
								var id = randId();
								$$('#single_article_contents .content-block').append('<video id="'+id+'" class="video-js vjs-16-9 vjs-big-play-centered" controls preload="auto"><source src="'+baseurl+'assets/video/'+video+'" type="video/mp4"></video>');
								videojs(id);
							});
						}
						if(typeof article.videourls != 'undefined'){
							$$.each(article.videourls, function(i,videourl){
								var videourlHTML = videourlToHTML(videourl);
								$$('#single_article_contents .content-block').append(videourlHTML);
							});
							app.youtube_listeners();
						}
						if(typeof article.files != 'undefined'){
							var html = '<div class="list-block media-list"><ul>';
							$$.each(article.files, function(i,_file){
								html += '<li><a href="'+baseurl+'assets/files/'+_file.filename+'" class="external item-link item-content"><div class="item-media"><img src="img/filetypes/'+_file.type+'.png" width="30" height="30"></div><div class="item-inner"><div class="item-title">'+_file.title+'</div></div></a></li>';
							});
							html += '</ul></div>';
							$$('#single_article_contents .content-block').append(html);
						}
					},
					error: function(xhr, status){
						myApp.alert('<div class="text-center"><img src="img/logo.png" class="img-responsive" /><br />Przepraszamy ale nie udało się pobrać aktualności ze strony <a href="'+baseurl+'" class="external">www.dpsdruk.pl</a></div>', '', function(){
							mainView.router.loadPage('offline_contact.html');
						});
					},
					complete: function(){
						myApp.hidePreloader();
					}
				});
			} else {
				app.offline();
			}
		});
		myApp.onPageInit('single_category', function(page){
			if(app.gotConnection()){
				myApp.showPreloader('Ładuję produkty...');
				$$.ajax({
					url: baseurl+'api/index_products/' + page.query.subcategory_id,
					crossDomain: true,
					dataType: 'json',
					data: {
						key: 'e547a2036c6faffc2859e132e7eee66f',
						session_id: session_id
					},
					success: function(response, status, xhr){
						$$.each(categories, function(i, category){
							if(category.id == page.query.category_id){
								$$.each(category.children,function(i, subcategory){
									if(subcategory.id == page.query.subcategory_id){
										$$('.single_category_contents').html('<div class="content-block"><h2>'+subcategory.title+'</h2><article>'+subcategory.content+'</article></div>');
									}
								});
							}
						});
						var html = '<div class="row">';
						$$.each(response, function(i, product){
							var product_image = String(product.image) != 'null' ? baseurl+'assets/producers/s6_'+product.image : 'img/noimage100x100.png';
							html += '<div class="col-100 tablet-50"><a href="single_product.html?product_id='+product.id+'" class="card text-center"><div class="card-header no-border"><img src="'+product_image+'" alt="" class="img-responsive" /></div><div class="card-content"><div class="card-content-inner"><p>'+product.symbol+'</p><div class="chip"><div class="chip-label">'+product.price_m2+'</div></div></div></div><div class="card-footer">POKAŻ PRODUKT</div></a></div>';
						});
						html += '</div>';
						$$('.single_category_contents').append(html);
						$$('.single_category_contents article img').each(function(){
							$$(this).attr('src', baseurl.substring(0, baseurl.length-1) + $$(this).attr('src').replace(baseurl,"/"));
						});
						
						$$('.page[data-page="single_category"] .navbar .left a').on('click',function(){
							mainView.router.loadPage('#index');
						});
					},
					error: function(xhr, status){
						myApp.alert('<div class="text-center"><img src="img/logo.png" class="img-responsive" /><br />Przepraszamy ale nie udało się pobrać produktów ze strony <a href="'+baseurl+'" class="external">www.dpsdruk.pl</a></div>', '', function(){
							mainView.router.loadPage('offline_contact.html');
						});
					},
					complete: function(){
						myApp.hidePreloader();
					}
				});
			} else {
				app.offline();
			}
		});
		myApp.onPageInit('single_product', function(page){
			if(app.gotConnection()){
				myApp.showPreloader('Ładuję produkt...');
				$$.ajax({
					url: baseurl+'api/get_product/' + page.query.product_id,
					crossDomain: true,
					dataType: 'json',
					data: {
						key: 'e547a2036c6faffc2859e132e7eee66f',
						session_id: session_id
					},
					success: function(response, status, xhr){
						var product = response;
						
						var back_url = '#index';
						if(product.category_id && product.subcategory_id){
							back_url = 'single_category.html?category_id='+product.category_id+'&subcategory_id='+product.subcategory_id;
						}
						$$('.page[data-page="single_product"] .navbar .left a').attr('href', back_url);
						
						var html = '<div class="content-block">'+
						'<h2 class="text-center">'+product.title+'</h2>'+
						'<div class="text-center">';
						if(product.can_calculate){
							html += '<div class="chip"><div class="chip-label">'+product.price_m2+'</div></div><p><a href="#calculator?product_id='+product.id+'&machine_id='+product.machine_id+'&category_id='+product.category_id+'&subcategory_id='+product.subcategory_id+'" class="button button-fill button-raised button-big text-center"><i class="material-icons">&#xE5C3;</i> Wykonaj kalkulację</a></p>';
						} else {
							html += '<div class="chip"><div class="chip-label">Produkt dostępny na zamówienie.</div></div>';
						}
						html += '</div>';
						html += '<article>'+product.content.replace(/<a(\s[^>]*)?>/ig, '').replace(/<\/a>/ig, '')+'</article>';
						html += '<div class="clearfix"></div>';
						if(typeof product.producer_url != 'undefined')
							html += '<p><small class="text-muted">STRONA PRODUCENTA:</small><a href="'+product.producer_url+'" class="button button-fill button-raised color-blue text-left external"><i class="material-icons">&#xe157;</i> '+product.producer_url+'</a></p>';
						html += '</div>';
						$$('.single_product_contents').html(html);
						$$('.single_product_contents article img').each(function(){
							$$(this).attr('src', baseurl.substring(0, baseurl.length-1) + $$(this).attr('src').replace(baseurl,"/"));
						});
						if(typeof product.galleries != 'undefined'){
							var photoBrowsers = [];
							$$.each(product.galleries, function(i,gallery){
								var _photos = [];
								var id = randId();
								$$.each(gallery.photos, function(j,photo){
									if(j == 0){
										$$('.single_product_contents .content-block').append('<a class="card pb" data-id="'+id+'"><div style="background-image:url('+baseurl+'assets/media/s4_'+photo+')" valign="bottom" class="card-header color-white no-border"><div class="chip"><div class="chip-media"><i class="material-icons">&#xe413;</i></div><div class="card-label">'+gallery.photos.length+'</div></div></div><div class="card-content"><div class="card-content-inner">'+gallery.title+'</div></div></a>');
									}
									_photos.push(baseurl+'assets/media/s4_'+photo);
								});
								var myPhotoBrowser = myApp.photoBrowser({
									photos: _photos,
									ofText: 'z',
									backLinkText: 'Powrót',
									theme: 'dark',
									lazyLoading: true,
									lazyLoadingInPrevNext: true
								});
								photoBrowsers.push({
									id: id,
									pb: myPhotoBrowser
								});
							});
							$$('.pb[data-id]').on('click', function(){
								var id = $$(this).data('id');
								$$.each(photoBrowsers, function(i, _pb){
									if(id == _pb.id){
										_pb.pb.open();
									}
								});
							});
						}
						if(typeof product.photos != 'undefined'){
							var _photos = [];
							$$.each(product.photos, function(i,photo){
								if(i == 0){
									$$('.single_product_contents .content-block').append('<a class="card pb medias"><div style="background-image:url('+baseurl+'assets/media/s4_'+photo+')" valign="bottom" class="card-header color-white no-border"><div class="chip"><div class="chip-media"><i class="material-icons">&#xe413;</i></div><div class="card-label">'+product.photos.length+'</div></div></div></a>');
								}
								_photos.push(baseurl+'assets/media/s4_'+photo);
							});
							var myPhotoBrowser = myApp.photoBrowser({
								photos: _photos,
								ofText: 'z',
								backLinkText: 'Powrót',
								theme: 'dark',
								lazyLoading: true,
								lazyLoadingInPrevNext: true
							});
							$$('.pb.medias').on('click', function(){
								myPhotoBrowser.open();
							});
						}
						if(typeof product.videos != 'undefined'){
							$$.each(product.videos, function(i,video){
								var id = randId();
								$$('.single_product_contents .content-block').append('<video id="'+id+'" class="video-js vjs-16-9 vjs-big-play-centered" controls preload="auto"><source src="'+baseurl+'assets/video/'+video+'" type="video/mp4"></video>');
								videojs(id);
							});
						}
						if(typeof product.videourls != 'undefined'){
							$$.each(product.videourls, function(i,videourl){
								var videourlHTML = videourlToHTML(videourl);
								$$('.single_product_contents .content-block').append(videourlHTML);
							});
							app.youtube_listeners();
						}
						if(typeof product.files != 'undefined'){
							var html = '<div class="list-block media-list"><ul>';
							$$.each(product.files, function(i,_file){
								html += '<li><a href="'+baseurl+'assets/files/'+_file.filename+'" class="external item-link item-content"><div class="item-media"><img src="img/filetypes/'+_file.type+'.png" width="30" height="30"></div><div class="item-inner"><div class="item-title">'+_file.title+'</div></div></a></li>';
							});
							html += '</ul></div>';
							$$('.single_product_contents').append(html);
						}
						if(typeof response.products != 'undefined'){
							var html = '<div class="card"><div class="card-header card-header-red">Pozostałe z kategorii<br />'+product.category.title+'</div><div class="card-content"><div class="list-block"><ul>';
							$$.each(response.products, function(i,_product){
								html += '<li><a href="single_product.html?product_id='+_product.id+'" class="item-link item-content"><div class="item-inner"><div class="item-title">'+_product.title+'</div></div></a></li>';
							});
							html += '</ul></div></div></div>';
							$$('.single_product_contents').append(html);
						}
					},
					error: function(xhr, status){
						myApp.alert('<div class="text-center"><img src="img/logo.png" class="img-responsive" /><br />Przepraszamy ale nie udało się pobrać produktu ze strony <a href="'+baseurl+'" class="external">www.dpsdruk.pl</a></div>', '', function(){
							mainView.router.loadPage('offline_contact.html');
						});
					},
					complete: function(){
						myApp.hidePreloader();
					}
				});
			} else {
				app.offline();
			}
		});
		$$('#contact-form').attr('action', baseurl+'api/contact_form?key=e547a2036c6faffc2859e132e7eee66f&session_id='+session_id); //baseurl definiowany jest w app.js
		$$('#contact-form').on('form:beforesend', function(e){
			myApp.showPreloader();
		});
		$$('#contact-form').on('form:success', function(e){
			myApp.hidePreloader();
			var xhr = e.detail.xhr;
			var response = JSON.parse(xhr.response);
			myApp.alert('<div class="text-center"><img src="img/logo.png" class="img-responsive" /><br />'+response.message+'</div>','');
			if(response.type == 'success'){
				$$('#contact-form')[0].reset();
			}
		});
		$$('#contact-form').on('form:error', function(e){
			myApp.hidePreloader();
			myApp.alert('Przepraszamy ale wystąpił błąd podczas wysyłania formularza.','');
		});
		$$('#calculator-form').on('form:beforesend', function(e){
			myApp.showPreloader();
		});
		$$('#calculator-form').on('form:success', function(e){
			myApp.hidePreloader();
			var xhr = e.detail.xhr;
			var response = JSON.parse(xhr.response);
			myApp.alert('<div class="text-center"><img src="img/logo.png" class="img-responsive" /><br />'+response.message+'</div>','');
			if(response.type == 'success'){
				window.open(baseurl+response.file_path, '_system');
			}
		});
		$$('#calculator-form').on('form:error', function(e){
			myApp.hidePreloader();
			myApp.alert('Przepraszamy ale wystąpił błąd podczas komunikacji ze stroną www.dpsdruk.pl.','');
		});
		$$('#calculator-send').on('form:beforesend', function(e){
			myApp.showPreloader();
		});
		$$('#calculator-send').on('form:success', function(e){
			myApp.hidePreloader();
			var xhr = e.detail.xhr;
			var response = JSON.parse(xhr.response);
			myApp.alert('<div class="text-center"><img src="img/logo.png" class="img-responsive" /><br />'+response.message+'</div>','');
			if(response.type == 'success'){
				myApp.closePanel();
			}
		});
		$$('#calculator-send').on('form:error', function(e){
			myApp.hidePreloader();
			myApp.alert('Przepraszamy ale wystąpił błąd podczas wysyłania formularza.','');
		});
		myApp.onPageInit('calculator', function(page){
			app.calculator_fill(page.query);
		});
		myApp.onPageReinit('calculator', function(page){
			app.calculator_fill(page.query);
		});
		$$('#calculator-fab').on('click',function(){
			var offset = $$('#calculator-response').offset().top + $$('.page[data-page="calculator"] .page-content').scrollTop();
			$$('.page[data-page="calculator"] .page-content').scrollTop(offset,300);
		});
		app.index_grid();
		$$(window).on('resize',function(){
			app.index_grid();
		});
	},
	init_calculator: function(response){
		$$('#calculator-form').attr('action', baseurl+'api/calculator_form?key=e547a2036c6faffc2859e132e7eee66f&session_id='+session_id); //baseurl definiowany jest w app.js więc tutaj trzeba ustawić atrybut `action`
		$$('#calculator-send').attr('action', baseurl+'api/calculator_send?key=e547a2036c6faffc2859e132e7eee66f&session_id='+session_id); //baseurl definiowany jest w app.js więc tutaj trzeba ustawić atrybut `action`
		$$.each(response.calculator_machines,function(id,title){
			$$('#machine_id').append('<option value="'+id+'" '+(id=='1' ? 'selected="selected"' : '')+'>'+title+'</option>');
		});
		$$('#machine_id').addClass('has-success');
		$$('#category_id').append('<option value="0" selected="selected">wybierz</option>');
		$$.each(response.calculator_categories,function(id,title){
			$$('#category_id').append('<option value="'+id+'">'+title+'</option>');
		});
		$$('#width').val('');
		$$('#height').val('');
		$$('#quantity').val('');
		app.calculator_events();
	},
	calculator_fill: function(query){
		calculator_query = query;
		if(typeof query.machine_id != 'undefined'){
			$$('#machine_id').val(query.machine_id).trigger('change');
		}
	},
	calculator_events: function(){
		$$('#machine_id').on('change',function(e){
			app.calculator_reset();
			if(parseInt($$(this).val()) > 0){
				myApp.showPreloader();
				$$.ajax({
					url: baseurl+'api/api_calculator',
					crossDomain: true,
					dataType: 'json',
					data: {
						key: 'e547a2036c6faffc2859e132e7eee66f',
						session_id: session_id,
						action: 'machine_change',
						machine_id: $$(this).val()
					},
					success: function(response, status, xhr){
						switch(response.type){
							case 'success':
								if(response.categories != 'undefined'){
									var categories = [];
									categories.push('<option value="">wybierz</option>');
									$$.each(response.categories, function(key,value){
										categories.push('<option value="' + key + '">'+value+'</option>');
									});
									$$('#category_id').html(categories.join(''));
									$$('#machine_id').addClass('has-success').removeClass('has-error');
									$$('#category_id, #subcategory_id, #product_id').removeClass('has-success has-error');
									
									if(typeof calculator_query.category_id != 'undefined'){
										$$('#category_id').val(calculator_query.category_id).trigger('change');
									}
								} else {
									app.calculator_reset();
								}
							break;
							case 'error':
								myApp.alert(response.message, '');
								app.calculator_reset();
							break;
						}
					},
					error: function(xhr, status){
						myApp.alert('<div class="text-center"><img src="img/logo.png" class="img-responsive" /><br />Przepraszamy ale wystąpił błąd komunikacji ze stroną<br /><a href="'+baseurl+'" class="external">www.dpsdruk.pl</a></div>', '');
					},
					complete: function(){
						myApp.hidePreloader();
						app.calculator_validate();
					}
				});
			} else {
				app.calculator_validate();
			}
		});
		$$('#category_id').on('change',function(e){
			$$('#subcategory_id').empty();
			$$('#product_id').empty();
			$$('#product_info').empty();
			$$('#laminates').empty();
			$$('#services').empty();
			if(parseInt($$(this).val()) > 0){
				myApp.showPreloader();
				$$.ajax({
					url: baseurl+'api/api_calculator',
					crossDomain: true,
					dataType: 'json',
					data: {
						key: 'e547a2036c6faffc2859e132e7eee66f',
						session_id: session_id,
						action: 'category_change',
						category_id: $$(this).val()
					},
					success: function(response, status, xhr){
						switch(response.type){
							case 'success':
								if(response.subcategories != 'undefined'){
									var subcategories = [];
									subcategories.push('<option value="">wybierz</option>');
									$$.each(response.subcategories, function(key,value){
										subcategories.push('<option value="' + key + '">'+value+'</option>');
									});
									$$('#subcategory_id').html(subcategories.join(''));
									$$('#category_id').addClass('has-success').removeClass('has-error');
									$$('#subcategory_id, #product_id').removeClass('has-success has-error');
									
									if(typeof calculator_query.subcategory_id != 'undefined'){
										$$('#subcategory_id').val(calculator_query.subcategory_id).trigger('change');
									}
								} else {
									app.calculator_reset();
								}
							break;
							case 'error':
								myApp.alert(response.message, '');
								app.calculator_reset();
							break;
						}
					},
					error: function(xhr, status){
						myApp.alert('<div class="text-center"><img src="img/logo.png" class="img-responsive" /><br />Przepraszamy ale wystąpił błąd komunikacji ze stroną<br /><a href="'+baseurl+'" class="external">www.dpsdruk.pl</a></div>', '');
					},
					complete: function(){
						myApp.hidePreloader();
						app.calculator_validate();
					}
				});
			} else {
				$$('#category_id').removeClass('has-success').addClass('has-error');
				$$('#subcategory_id, #product_id').removeClass('has-success has-error');
				$$('#product_id').prop('selectedIndex',0).empty();
				app.calculator_validate();
			}
		});
		$$('#subcategory_id').on('change',function(e){
			$$('#product_id').empty();
			$$('#product_info').empty();
			$$('#laminates').empty();
			$$('#services').empty();
			if(parseInt($$(this).val()) > 0){
				myApp.showPreloader();
				$$.ajax({
					url: baseurl+'api/api_calculator',
					crossDomain: true,
					dataType: 'json',
					data: {
						key: 'e547a2036c6faffc2859e132e7eee66f',
						session_id: session_id,
						action: 'subcategory_change',
						subcategory_id: $$(this).val()
					},
					success: function(response, status, xhr){
						switch(response.type){
							case 'success':
								var products = [];
								products.push('<option value="">wybierz</option>');
								$$.each(response.products, function(key,value){
									products.push('<option value="'+value.id+'">'+value.product_translation_title+'</option>');
								});
								$$('#product_id').html(products.join(''));
								$$('#subcategory_id').addClass('has-success').removeClass('has-error');
								$$('#product_id').removeClass('has-success has-error');
								
								if(typeof calculator_query.product_id != 'undefined'){
									$$('#product_id').val(calculator_query.product_id).trigger('change');
								}
							break;
							case 'error':
								myApp.alert(response.message, '');
								app.calculator_reset();
							break;
						}
					},
					error: function(xhr, status){
						myApp.alert('<div class="text-center"><img src="img/logo.png" class="img-responsive" /><br />Przepraszamy ale wystąpił błąd komunikacji ze stroną<br /><a href="'+baseurl+'" class="external">www.dpsdruk.pl</a></div>', '');
					},
					complete: function(){
						myApp.hidePreloader();
						app.calculator_validate();
					}
				});
			} else {
				$$('#subcategory_id').removeClass('has-success').addClass('has-error');
				$$('#product_id').removeClass('has-success has-error');
				$$('#product_id').prop('selectedIndex',0).empty();
				app.calculator_validate();
			}
		});
		$$('#product_id').on('change',function(e){
			$$('#product_info').empty();
			$$('#laminates').empty();
			$$('#services').empty();
			if(parseInt($$(this).val()) > 0){
				myApp.showPreloader();
				$$.ajax({
					url: baseurl+'api/api_calculator',
					crossDomain: true,
					dataType: 'json',
					data: {
						key: 'e547a2036c6faffc2859e132e7eee66f',
						session_id: session_id,
						action: 'product_change',
						product_id: $$(this).val()
					},
					success: function(response, status, xhr){
						switch(response.type){
							case 'success':
								$$('#product_info').html(response.view);
								$$('#types-append').html(response.product_types);
								$$('#express-append').html(response.product_express);
								$$('#product_id').addClass('has-success').removeClass('has-error');
								if($$('#product_info input[name="type_id"]').length){
									$$('input[name="type_id"]').on('change',function(){
										app.calculator_validate();
									});
								}
								var laminates = [];
								var services = [];
								if(typeof response.services != 'undefined' && response.services.length){
									$$.each(response.services, function(key,service){
										if(service.radio && service.radio == 'laminowanie'){
											laminates.push(service);
										} else {
											services.push(service);
										}
									});
									if(laminates.length){
										$$('#laminates').append('<li class="item-divider">* Laminat</li>');
										$$('#laminates').append('<li><label class="label-radio item-content"><input type="radio" name="laminate" value="0" checked="checked" /><div class="item-media"><i class="icon icon-form-radio"></i></div><div class="item-inner"><div class="item-title">Bez laminatu</div></div></label></li>');
										$$.each(laminates, function(key,laminate){
											$$('#laminates').append('<li><label class="label-radio item-content"><input type="radio" name="laminate" value="'+laminate.id+'" /><div class="item-media"><i class="icon icon-form-radio"></i></div><div class="item-inner"><div class="item-title">'+laminate.service_translation_title+'</div></div></label></li>');
										});
										$$('#laminates input').on('click',function(){
											app.calculator_validate();
										});
									}
									if(services.length){
										$$('#services').append('<li class="item-divider">Dodatkowe usługi</li>');
										var checkboxes = [];
										var radios = [];
										$$.each(services, function(key,service){
											if(service.radio){
												radios.push(service);
											} else {
												checkboxes.push(service);
											}
										});
										if(checkboxes.length){
											$$.each(checkboxes, function(key,service){
												$$('#services').append('<li class="behavior-append"><label class="label-checkbox item-content"><input type="checkbox" name="service_checkbox[]" value="'+service.id+'" '+(service.behavior ? 'data-behavior="'+service.behavior+'"' : '')+' /><div class="item-media"><i class="icon icon-form-checkbox"></i></div><div class="item-inner"><div class="item-title">'+service.service_translation_title+'</div></div></label></li>');
											});
											$$('#services input[type="checkbox"]').on('change',function(){
												var input = $$(this);
												input.toggleClass('imChecked');
												var behavior = input.data('behavior');
												if(typeof behavior != 'undefined'){
													app.calculator_handle_behavior(input, behavior);
												}
												app.calculator_validate();
											});
										}
										if(radios.length){
											$$.each(radios, function(key,service){
												$$('#services').append('<li class="behavior-append" data-radio="'+service.radio.escapeDiacritics()+'"><label class="label-radio item-content"><input type="radio" name="service_radio['+service.radio.escapeDiacritics()+']" value="'+service.id+'" '+(service.behavior ? 'data-behavior="'+service.behavior+'"' : '')+' /><div class="item-media"><i class="icon icon-form-radio"></i></div><div class="item-inner"><div class="item-title">'+service.service_translation_title+'</div></div></label></li>');
											});
											$$('#services .behavior-append[data-radio]').each(function(){
												if(!$$('#services .behavior-append[data-radio="'+$$(this).data('radio')+'"]').hasClass('grouped-behavior')){
													$$('#services .behavior-append[data-radio="'+$$(this).data('radio')+'"]').addClass('grouped-behavior');
												}
												$$('#services .behavior-append[data-radio="'+$$(this).data('radio')+'"]').eq(0).addClass('first');
												$$('#services .behavior-append[data-radio="'+$$(this).data('radio')+'"]').eq($$('#services .behavior-append[data-radio="'+$$(this).data('radio')+'"]').length - 1).addClass('last');
											});
											$$('#services input[type="radio"]').on('change',function(){
												var input = $$(this);
												var restRadios = $$('#services .behavior-append[data-radio="'+input.closest('.behavior-append').data('radio')+'"] input[type="radio"]').filter(function(i,el) {
													return !$$(this).is(input);
												});
												$$.each(restRadios,function(i,r){
													$$(r).removeClass('imChecked');
													var behavior = $$(r).data('behavior');
													if(typeof behavior != 'undefined'){
														app.calculator_handle_behavior($$(r), behavior);
													}
												});
												if(input.hasClass("imChecked")) {
													input.removeClass("imChecked");
													input.prop('checked', false);
												} else { 
													input.prop('checked', true);
													input.addClass("imChecked");
												};
												var behavior = input.data('behavior');
												if(typeof behavior != 'undefined'){
													app.calculator_handle_behavior(input, behavior);
												}
												app.calculator_validate();
											});
											$$('#services .behavior-append[data-radio]').on('click',function(e){
												e.stopPropagation();
												e.preventDefault();
												if(!$$(e.target).hasClass('prevent-click')){
													var input = $$(this).find('input[type="radio"]');
													var state = input.prop('checked');
													if(state){
														input.prop('checked',false).removeClass('imChecked');
														var behavior = input.data('behavior');
														if(typeof behavior != 'undefined'){
															app.calculator_handle_behavior(input, behavior);
														}
														app.calculator_validate();
													} else {
														input.trigger('change');
													}
												}
											});
										}
									}
								}
								if($$('#express').length){
									$$('#express').on('change',function(){
										app.calculator_validate();
									});
								}
							break;
							case 'error':
								myApp.alert(response.message, '');
								app.calculator_reset();
							break;
						}
					},
					error: function(xhr, status){
						myApp.alert('<div class="text-center"><img src="img/logo.png" class="img-responsive" /><br />Przepraszamy ale wystąpił błąd komunikacji ze stroną<br /><a href="'+baseurl+'" class="external">www.dpsdruk.pl</a></div>', '');
					},
					complete: function(){
						myApp.hidePreloader();
						app.calculator_validate();
					}
				});
			} else {
				$$('#product_id').removeClass('has-success').addClass('has-error');
				app.calculator_validate();
			}
		});
		$$('#width').on('change',function(e){
			var width = parseInt($$(this).val());
			if(width > 0){
				$$('#width').removeClass('has-error').addClass('has-success');
			} else {
				$$('#width').removeClass('has-success').addClass('has-error');
			}
			app.calculator_validate();
		});
		$$('#height').on('change',function(e){
			var height = parseInt($$(this).val());
			if(height > 0){
				$$('#height').removeClass('has-error').addClass('has-success');
			} else {
				$$('#height').removeClass('has-success').addClass('has-error');
			}
			app.calculator_validate();
		});
		$$('#quantity').on('change',function(e){
			var quantity = parseInt($$(this).val());
			if(quantity > 0){
				$$('#quantity').removeClass('has-error').addClass('has-success');
			} else {
				$$('#quantity').removeClass('has-success').addClass('has-error');
			}
			app.calculator_validate();
		});
	},
	calculator_validate: function(){
		var fields = ['machine_id','category_id','subcategory_id','product_id','width','height','quantity'];
		var valid = true;
		$$.each(fields,function(key,field){
			if(!$$('#'+field).hasClass('has-success'))
				valid = false;
		});
		if($$('.behavior').length){
			$$('.behavior').each(function(){
				if($$(this).css('display') != 'none' && !$$(this).hasClass('has-success')){
					valid = false;
				}
			});
		}
		if(valid){
			app.calculator_calculate();
		} else {
			$$('#calculator-response').html('<p><small>Wypełnij poprawnie wszystkie pola aby dokonać kalkulacji. Pola oznaczone * są wymagane.</small></p>');
			$$('#calculator-fab').removeClass('in').addClass('out');
		}
		
		//ukryj tabbar jeżeli dokonano już kalkulacji
		$$('.page[data-page="calculator"]').addClass('no-toolbar');
	},
	calculator_calculate: function(){
		var services_checkboxes_array = [];
		var services_radios_array = [];
		var _behavior_array = [];
		
		$$('input[name="service_checkbox[]"]:checked').each(function(i,el){
			services_checkboxes_array.push($$(this).val());
		});
		$$('input[name*="service_radio"]:checked').each(function(i,el){
			services_radios_array.push($$(this).val());
		});
		$$('.behavior input').each(function(i,el){
			if($$(this).closest('.behavior').css('display') != 'none' && $$(this).closest('.behavior').hasClass('has-success')){
				_behavior_array.push({
					service_id: $$(this).attr('name').match(/[^[\]]+(?=])/g)[0],
					value: $$(this).val()
				});
			}
		});
		var behavior_array = _behavior_array.reduce(function(total,current){
			total[current.service_id] = current.value;
			return total;
		},{});
		
		myApp.showPreloader();
		$$.ajax({
			url: baseurl+'api/api_calculator',
			crossDomain: true,
			dataType: 'json',
			data: {
				key: 'e547a2036c6faffc2859e132e7eee66f',
				session_id: session_id,
				action: 'calculate',
				machine_id: $$('#machine_id').val(),
				product_id: $$('#product_id').val(),
				width: $$('#width').val(),
				height: $$('#height').val(),
				width_measure: 'mm',
				height_measure: 'mm',
				quantity: $$('#quantity').val(),
				laminate: ($$('input[name="laminate"]:checked').length ? $$('input[name="laminate"]:checked').val() : null),
				services_checkboxes: services_checkboxes_array,
				services_radios: services_radios_array,
				type_id: $$('input[name="type_id"]').length ? $$('input[name="type_id"]:checked').val() : null,
				express: ($$('#express').length && $$('#express').prop('checked') ? 1 : null),
				behavior: behavior_array
			},
			success: function(response, status, xhr){
				switch(response.type){
					case 'success':
						$$('#calculator-response').html(response.view);
						$$('[data-toggle="alert"]').on('click',function(e){
							e.preventDefault();
							var target = this;
							var buttons = [
								{
									text: '<i class="material-icons">&#xE5CD;</i> Zamknij',
									color: 'red'
								},
								{
									text: $$(this).data('text'),
									label: true
								},
							];
							myApp.actions(target, buttons);
						});
						$$('#calculator-fab').removeClass('out').addClass('in').html('<i class="material-icons">&#xE5DB;</i>&nbsp;<strong>'+response.price_brutto+'</strong>&nbsp;zł');
						var offset = $$('#calculator-response').offset().top + $$('.page[data-page="calculator"] .page-content').scrollTop();
						$$('.page[data-page="calculator"] .page-content').off('scroll').on('scroll',function(){
							var topWindow = $$(this).scrollTop() + $$(window).height();
							if(topWindow >= offset){
								$$('#calculator-fab').removeClass('in').addClass('out');
							} else {
								$$('#calculator-fab').removeClass('out').addClass('in');
							}
						});
						$$('.page[data-page="calculator"] .page-content').trigger('scroll');
						
						var url_params = {
							machine_id: $$('#machine_id').val(),
							product_id: $$('#product_id').val(),
							width: $$('#width').val(),
							height: $$('#height').val(),
							width_measure: 'mm',
							height_measure: 'mm',
							quantity: $$('#quantity').val(),
							services_checkboxes: services_checkboxes_array,
							services_radios: services_radios_array,
							behavior: behavior_array
						};
						$$('input[name="laminate"]:checked').length && $$('input[name="laminate"]:checked').val()!='0' ? url_params.laminate = $$('input[name="laminate"]:checked').val() : null;
						$$('input[name="type_id"]').length ? url_params.type_id = $$('input[name="type_id"]:checked').val() : null;
						$$('#express').length && $$('#express').prop('checked') ? url_params.express = '1' : null;
						var _url = baseurl+'kalkulator?'+$$.serializeObject(url_params);
						$$('#calculator-button-url').attr('href', _url);
						
						var serialized_data = url_params;
						serialized_data.price_netto = response.price_netto;
						serialized_data.price_brutto = response.price_brutto;
						$$('#calculator-send-info').html('<strong>'+response.title+'</strong><br /><strong>'+response.width+'</strong> x <strong>'+response.height+'</strong> mm<br /><strong>'+response.quantity+'</strong> szt.<br /><strong>'+response.price_brutto+'</strong> PLN brutto');
						$$('#calculator-send-serialized-data').val(JSON.stringify(serialized_data));
					break;
					case 'error':
						myApp.alert(response.message, '');
						$$('#calculator-response').html('<p><small>Wypełnij poprawnie wszystkie pola aby dokonać kalkulacji. Pola oznaczone * są wymagane.</small></p>');
						$$('#calculator-fab').removeClass('in').addClass('out');
					break;
				}
			},
			error: function(xhr, status){
				myApp.alert('<div class="text-center"><img src="img/logo.png" class="img-responsive" /><br />Przepraszamy ale wystąpił błąd komunikacji ze stroną<br /><a href="'+baseurl+'" class="external">www.dpsdruk.pl</a></div>', '');
			},
			complete: function(){
				myApp.hidePreloader();
			}
		});
	},
	calculator_reset: function(){
		$$('#category_id').prop('selectedIndex',0).empty().append('<option value="">wybierz</option>');
		$$('#subcategory_id').empty();
		$$('#product_id').empty();
		
		$$('#machine_id').removeClass('has-success');
		$$('#category_id').removeClass('has-success');
		$$('#subcategory_id').removeClass('has-success');
		$$('#product_id').removeClass('has-success');
		
		$$('#product_info').empty();
		$$('#laminates').empty();
		$$('#services').empty();
	},
	calculator_handle_behavior: function(input,behavior){
		switch(behavior){
			case 'linia_ciecia':{
				var behavior_outer = $$('.behavior[data-id="'+input.val()+'"]');
				if(behavior_outer.length <= 0){
					var behavior_outer = '<li class="behavior prevent-click" data-id="'+input.val()+'"><div class="item-content prevent-click"><div class="item-inner prevent-click"><div class="item-title label prevent-click">* Długość linii cięcia w mm</div><div class="item-input item-input-field prevent-click"><input type="number" name="behavior['+input.val()+']" min="1" required class="prevent-click" /></div></div></div></li>';
					input.closest('.behavior-append').append(behavior_outer);
					input.closest('.behavior-append').find('.behavior input').on('change',function(){
						if(parseInt($$(this).val()) > 0){
							$$('.behavior[data-id="'+input.val()+'"]').removeClass('has-error').addClass('has-success');
						} else {
							$$('.behavior[data-id="'+input.val()+'"]').removeClass('has-success').addClass('has-error');
						}
						app.calculator_validate();
					});
				}
				if(input.hasClass('imChecked')){
					$$('.behavior[data-id="'+input.val()+'"]').show();
				} else {
					$$('.behavior[data-id="'+input.val()+'"]').hide();
				}
				break;
			}
			case 'cena_za_obwod': {
				var behavior_outer = $$('.behavior[data-id="'+input.val()+'"]');
				if(behavior_outer.length <= 0){
					var behavior_outer = '<div class="behavior has-success" data-id="'+input.val()+'"><input type="hidden" name="behavior['+input.val()+']" value="1" /></div>';
					input.closest('.behavior-append').append(behavior_outer);
				}
				if(input.hasClass('imChecked')){
					$$('.behavior[data-id="'+input.val()+'"]').show();
				} else {
					$$('.behavior[data-id="'+input.val()+'"]').hide();
				}
				break;
			}
		}
	},
	
	chat_preinit: function(response){
		var messages = [];
		if(typeof response.messages != 'undefined' && response.messages.length > 0){
			$$.each(response.messages, function(i,message){
				var msg = {
					text: message.content,
					date: moment(message.date_create).format('LLL'),
					name: message.nickname,
					type: (message.admin ? 'received' : 'sent'),
					avatar: (message.admin ? 'img/avatar.png' : false),
				};
				messages.push(msg);
			});
		}
		myMessages = myApp.messages('.page[data-page="chat"] .messages', {
			autoLayout: true,
			messages: messages
		});
	},
	chat_init: function(){
		var nickname = localStorage.nickname;
		if(typeof nickname == 'undefined'){
			myApp.prompt('Podaj imię i nazwisko', 
				function(value){
					localStorage.nickname = value;
					localStorage.chatid = randId();
					app.chat_listeners();
				},
				function(){
					mainView.router.loadPage('#index');
				}
			);
		} else {
			app.chat_listeners();
		}
	},
	chat_listeners: function(){
		$$('.init-message-text').html('Witaj '+localStorage.nickname+',<br />w czym możemy pomóc?');
		myMessages.scrollMessages();
		var myMessagebar = myApp.messagebar('.messagebar');
		$$('.messagebar .link').on('click', function () {
			var messageText = myMessagebar.value().replace(/(?:\r\n|\r|\n)/g, '<br />').trim();
			if(messageText.length === 0) return;
			myMessagebar.clear();
			
			$$.ajax({
				url: baseurl+'api/add_message',
				crossDomain: true,
				dataType: 'json',
				data: {
					key: 'e547a2036c6faffc2859e132e7eee66f',
					session_id: session_id,
					chatid: localStorage.chatid,
					content: messageText,
					nickname: localStorage.nickname
				},
				success: function(response){
					switch(response.type){
						case "success":
							myMessages.addMessage({
								text: messageText,
								type: 'sent',
								name: localStorage.nickname,
								day: 'Dzisiaj',
								time: (new Date()).getHours() + ':' + (new Date()).getMinutes()
							});
							clearInterval(chat_interval);
							app.chat_init_interval();
						break;
						case "error":
							myApp.alert(response.message);
						break;
					}
				},
				error: function(){
					myApp.alert('Przepraszamy ale wystąpił błąd podczas wysyłania wiadomości.');
				},
			});
		});
		
		//sprawdzanie czy nie odpisano...
		totalMessages = $$('.page[data-page="chat"] .messages > .message').length - 1;
		if(totalMessages > 0){
			app.chat_init_interval();
		}
	},
	chat_init_interval: function(){
		chat_interval = setInterval(function(){
			app.chat_check_new_messages();
		}, 30000);
	},
	chat_check_new_messages: function(){
		totalMessages = $$('.page[data-page="chat"] .messages > .message').length - 1;
		$$.ajax({
			url: baseurl+'api/check_messages',
			crossDomain: true,
			dataType: 'json',
			data: {
				key: 'e547a2036c6faffc2859e132e7eee66f',
				session_id: session_id,
				chatid: localStorage.chatid,
				totalMessages: totalMessages
			},
			success: function(response){
				switch(response.type){
					case "success":
						var messages = [];
						$$.each(response.messages,function(i,message){
							if(i >= totalMessages){
								var msg = {
									text: message.content,
									date: moment(message.date_create).format('LLL'),
									name: message.nickname,
									type: (message.admin ? 'received' : 'sent'),
									avatar: (message.admin ? 'img/avatar.png' : false),
								};
								messages.push(msg);
							}
						});
						myMessages.addMessages(messages);
					break;
				}
			},
			complete: function(){
				clearInterval(chat_interval);
				app.chat_init_interval();
			}
		});
	},
	
	youtube_listeners: function(){
		if($$('.youtube-mobile[data-embed]').length){
			$$(".youtube-mobile[data-embed]").each(function(){
				var t = $$(this), id = t.data('embed');
				var image = new Image();
				image.src = "https://img.youtube.com/vi/"+ id +"/sddefault.jpg";
				image.addEventListener("load",function(){
					t.append(image);
				});
				t.on('click',function(){
					t.html('<div class="embed-responsive embed-responsive-16by9"><iframe class="embed-responsive-item" src="https://www.youtube.com/embed/'+id+'?rel=0&autoplay=1" frameborder="0" allowfullscreen></iframe></div>');
				});
			});
		}
	},
	index_grid: function(){
		var ww = $$(window).width();
		var rw = ww/2;
		if(ww > 500){
			rw=140;
		}
		$$('.index-grid a').css({
			'height': rw+'px',
			'line-height': rw+'px',
		});
	},
	
	initMap: function(){
		var myLatLng = {lat: 54.148255, lng: 19.440690};
        var map = new google.maps.Map(document.getElementById('gmap'), {
			zoom: 13,
			center: myLatLng,
			styles: [{"featureType":"administrative","elementType":"labels.text.fill","stylers":[{"color":"#444444"}]},{"featureType":"landscape","elementType":"all","stylers":[{"color":"#f2f2f2"}]},{"featureType":"poi","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"all","stylers":[{"saturation":-100},{"lightness":45}]},{"featureType":"road.highway","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"road.arterial","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"all","stylers":[{"color":"#e74c3c"},{"visibility":"on"}]}]
		});
        var marker = new google.maps.Marker({
			position: myLatLng,
			map: map,
			title: 'DPSDRUK.PL',
			icon: 'img/marker.png'
        });
		var infowindow = new google.maps.InfoWindow({
			content: '<strong>Agencja Reklamowa CONTACT</strong><br />ul. Mikołaja Firleja 27<br />82-300 Elbląg'
		});
		marker.addListener('click', function() {
			infowindow.open(map, marker);
		});
		map_loaded = true;
	}
};