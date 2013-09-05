// Browser detection for when you get desparate. A measure of last resort.
// http://rog.ie/post/9089341529/html5boilerplatejs

// var b = document.documentElement;
// b.setAttribute('data-useragent',  navigator.userAgent);
// b.setAttribute('data-platform', navigator.platform);

// sample CSS: html[data-useragent*='Chrome/13.0'] { ... }


// remap jQuery to $
(function ($) {

    /* trigger when page is ready */
    $(document).ready(function () {
        var i,
            url = 'http://api.flickr.com/services/rest/?jsoncallback=?&' + $.param({
                format: 'json',
                method: 'flickr.photos.search',
                api_key: 'e3e4265e5a99e86902b8c5c80fcd1587',
                user_id: '36903802@N03',
                per_page: '25'
            });

        $.getJSON(url,
            function(data) {
                $.each(data.photos.photo, function(i, rPhoto) {
                    var basePhotoURL = 'http://farm' + rPhoto.farm + '.static.flickr.com/' + rPhoto.server + '/' + rPhoto.id + '_' + rPhoto.secret; 
                    $('.wrapper').append('<a class="block" href="' + basePhotoURL + '.jpg"><img src="' + basePhotoURL + '.jpg"</a>');
                });
            }
        );
    });


    /* optional triggers

    $(window).load(function() {
        
    });

    $(window).resize(function() {
        
    });

    */


})(window.jQuery);
