// Browser detection for when you get desparate. A measure of last resort.
// http://rog.ie/post/9089341529/html5boilerplatejs

// var b = document.documentElement;
// b.setAttribute('data-useragent',  navigator.userAgent);
// b.setAttribute('data-platform', navigator.platform);

// sample CSS: html[data-useragent*='Chrome/13.0'] { ... }

Photo = function(id, farm, secret, server, title) {
    this.id = id;
    this.farm = farm;
    this.secret = secret;
    this.server = server;
    this.title = title;

    var baseUrl = 'http://farm' + farm + '.static.flickr.com/' + server + '/' + id + '_' + secret;
    this.urls = {
        square75: baseUrl + '_s.jpg',
        square150: baseUrl + '_q.jpg',
        thumbnail: baseUrl + '_t.jpg',
        small240: baseUrl + '_m.jpg',
        small320: baseUrl + '_n.jpg',
        medium500: baseUrl + '.jpg',
        medium640: baseUrl + '_z.jpg',
        medium800: baseUrl + '_c.jpg',
        large1024: baseUrl + '_b.jpg',
        large1600: baseUrl + '_h.jpg',
        large2048: baseUrl + '_k.jpg'
    }
}

PhotoSet = function(photosetId) {
    this.photosetId = photosetId;
    this.url = 'http://api.flickr.com/services/rest/?jsoncallback=?&' + $.param({
        format: 'json',
        method: 'flickr.photosets.getPhotos',
        api_key: 'e3e4265e5a99e86902b8c5c80fcd1587',
        // user_id: '101306928@N04',
        photoset_id: this.photosetId,
        per_page: '25'
    });
}
PhotoSet.prototype = {
    query: function(callback) {
        var photoSet = this;
        $.getJSON(this.url,
            function(data) {
                photoSet.json = data;
                var photoset = data.photoset;
                photoSet.ownerId = photoset.owner;
                photoSet.ownerName = photoset.ownername;
                photoSet.total = photoset.total;

                photoSet.photos = [];
                for (var i = 0; i < photoset.photo.length; i++) {
                    var photoData = photoset.photo[i],
                        photo = new Photo(photoData.id, photoData.farm, photoData.secret, photoData.server, photoData.title);
                    photoSet.photos.push(photo);
                    if (photoData.isprimary == 1) {
                        photoSet.primaryPhoto = photo;
                    }
                }
                callback.call(photoSet);
            }
        );
    }
};




// remap jQuery to $
(function ($) {

    /* trigger when page is ready */
    $(function () {
        var people = new PhotoSet('72157635402073153');
        people.query(function() {
            var photoSet = this;
            $('.wrapper').append('<a class="block photoset closed" href=""><img src="' + photoSet.primaryPhoto.urls.medium500 + '"><span class="title">People</span></a>');
            $('.wrapper').delegate('a.photoset.closed, a.photoset.open', 'click', function() {
                var $this = $(this);
                if ($this.is('.closed')) {
                    for (var i = 0; i < photoSet.photos.length; i++) {
                        var photo = photoSet.photos[i];
                        $('.wrapper').append('<a class="block photo unanimated"><img src="' + photo.urls.medium500 + '"><span class="title>' + photo.title + '</title></a>');
                    }
                    $('.block.photo img').each(function() {
                        var $this = $(this);
                        imgClass = (this.width / this.height > 1) ? 'wide' : 'tall';
                        $this.addClass(imgClass);
                    });
                } else {
                    $('.photo').remove();
                }

                $this.toggleClass('closed').toggleClass('open');

                return false;
            });
        });
    });

})(window.jQuery);
