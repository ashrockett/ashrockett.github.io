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
        api_key: 'fbb7446eb79b0edeb93fbed3ba0adab6',
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

initPhotoset = null;


// remap jQuery to $
(function ($) {

    /* trigger when page is ready */
    $(function () {

        var $window = $(window),
            $photos = $('#photos'),
            $canvas = $('#canvas'),
            $header = $('#header'),
            $prev = $('#prev'),
            $next = $('#next'),
            $body = $('body'),
            headerSmallHeight = 40,
            headerMaxHeight = 50,
            headerAnimateMargin = 200,
            currentMousePos = {x: -1, y: -1},
            beautiful = false,
            beautifyTimeout = null,
            resizeTimeout = null,
            presentation = null;

        $prev.click(function(e) {
            $photos.trigger('shift-left');
            e.preventDefault();
        });

        $next.click(function(e) {
            $photos.trigger('shift-right');
            e.preventDefault();
        });

        function adjustNavPos() {
            $('.arrow').css('line-height', $window.height() + 'px');
        }
        adjustNavPos();

        $window.resize(function() {
            adjustNavPos();

            // Always resize the active photo to keep things looking nice
            resizePhoto.call($('.photo.active')[0]);

            // For everything else wait until the user is done resizing
            if (resizeTimeout !== null) clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(function() {
                $window.trigger('done-resizing');
            }, 500);
        });

        function resizePhoto() {
            var $photo = $(this),
                $img = $photo.find('img');

            if ($img.data('aspect-ratio') === undefined) return;

            if (($window.width() / $window.height()) < $img.data('aspect-ratio')) {
                $img.removeClass('width').addClass('height');
            } else {
                $img.removeClass('height').addClass('width');
            }
            $photo.css('width', $window.width());
            $img.css('left', - ($img.width() - $photo.width()) / 2);
            $img.css('top', - ($img.height() - $photo.height()) / 2);

            // Reposition spinner
            $photo.find('.spinner').css({
                left: '50%',
                top: '50%',
            });
        }

        $window.on('done-resizing', function() {
            $('#photos .photo').each(function() {
                resizePhoto.call(this);
            })
            ensureCorrectShift();
        });

        $window.click(resetBeautifyTimeout);


        // Cover presentation style methods and events

        function checkIdleMouse(e) {
            // Don't do anything if the position hasn't really changed
            if (e.pageX === undefined || e.pageY === undefined) return;
            if (e.pageX == currentMousePos.x && e.pageY == currentMousePos.y) return;

            if (beautiful) $window.trigger('debeautify');
            resetBeautifyTimeout();
        }

        function updateMousePos(e) {
            if (e.pageX === undefined || e.pageY === undefined) {
                currentMousePos.x = Math.min(currentMousePos.x, $window.width());
                currentMousePos.y = Math.min(currentMousePos.y, $window.height());
            } else {
                currentMousePos.x = e.pageX;
                currentMousePos.y = e.pageY;
            }
        }

        function calcImagePos(e) {
            var $activePhoto = $('#photos .photo.active'),
                $activeImg = $activePhoto.find('img'),
                excessY = $activeImg.height() - $activePhoto.height(),
                excessX = $activeImg.width() - $activePhoto.width(),
                offsetY = - (currentMousePos.y / $window.height()) * excessY,
                offsetX = - (currentMousePos.x / $window.width()) * excessX;
            $activeImg.css('top', offsetY);
            $activeImg.css('left', offsetX);
        }

        function calcMenuSize(e) {
            if (beautiful) return;
            if (currentMousePos.y < 0) return;

            if (currentMousePos.y < headerMaxHeight + headerAnimateMargin) {
                var percentage = 1 - (currentMousePos.y - headerMaxHeight) / headerAnimateMargin,
                    height = headerSmallHeight + percentage * (headerMaxHeight - headerSmallHeight),
                    opacity = Math.max(Math.min(percentage, 1) * 0.6 + 0.2, 0.2);
                $header.css({
                    // height: height,
                    opacity: opacity,
                });
            } else {
                $header.css({
                    height: headerSmallHeight,
                    opacity: 0.2
                });
            }
        }

        function resetBeautifyTimeout() {
            if (beautifyTimeout !== null) clearTimeout(beautifyTimeout);
            beautifyTimeout = setTimeout(function() {
                beautifyTimeout = null;
                if (currentMousePos.y > headerMaxHeight) {
                    $window.trigger('beautify');
                }
            }, 1500);
        }

        $window.on('beautify', function() {
            $body.addClass('beautiful');
            beautiful = true;
            $header.animate({
                top: -40,
            }, 600, 'easeOutQuad');
        });
        $window.on('debeautify', function() {
            beautiful = false;
            $header.stop().animate({
                top: 0,
            }, 200, 'easeInQuad');
            $body.removeClass('beautiful');
        });

        // -----

        function setUpContainEvents() {
            $window.mousemove(checkIdleMouse);
            $window.mousemove(updateMousePos);
            $window.mousemove(calcMenuSize);
        }

        function tearDownContainEvents() {
            $window.unbind('mousemove', checkIdleMouse);
            $window.unbind('mousemove', updateMousePos);
            $window.unbind('mousemove', calcMenuSize);
        }

        function setUpCoverEvents() {
            $window.mousemove(checkIdleMouse);
            $window.mousemove(updateMousePos);
            $window.mousemove(calcImagePos);
            $window.mousemove(calcMenuSize);

        }
        function tearDownCoverEvents() {
            $window.unbind('mousemove', checkIdleMouse);
            $window.unbind('mousemove', updateMousePos);
            $window.unbind('mousemove', calcImagePos);
            $window.unbind('mousemove', calcMenuSize);
        }

        // Determine current presentation style and bind event handlers
        if ($photos.hasClass('cover')) {
            presentation = 'cover';
            setUpCoverEvents();
        } else if ($photos.hasClass('contain')) {
            presentation = 'contain';
            setUpContainEvents();
        }

        $(document).keydown(function(e) {
            if (e.keyCode == 37) { // left arrow
                if (! $canvas.is(':animated'))
                    $photos.trigger('shift-left');
                return false;
            } else if (e.keyCode == 39) { // right arrow
                if (! $canvas.is(':animated'))
                    $photos.trigger('shift-right');
                return false;
            } else if (e.keyCode == 40) { // down arrow
                // $window.trigger('presentation-toggle');
                return false;
            }
        });

        function animateShift() {
            // Fake a mouse movement to get the image to ajust itself to the
            // appropriate position ahead of time
            $window.mousemove();

            // Animate canvas to view correct photo
            $canvas.animate({
                left: - $photos.data('current') * $window.width(),
            }, 300);
        }
        function ensureCorrectShift() {
            $canvas.css({
                left: - $photos.data('current') * $window.width(),
            })
        }

        $window.on('presentation-toggle', function() {
            presentation = (presentation == 'cover') ? 'contain' : 'cover';
            console.log(presentation);
            if (presentation == 'cover') {
                $photos
                    .removeClass('contain')
                    .addClass('cover');
                tearDownContainEvents();
                setUpCoverEvents();
            } else if (presentation == 'contain') {
                $photos
                    .removeClass('cover')
                    .addClass('contain');
                tearDownCoverEvents();
                setUpContainEvents();
            }
        });

        $photos.on('shift-right', function() {
            var current = $photos.data('current');
            if (current + 1 < $photos.data('count')) {
                $photos.data('current', current + 1);
                $photos.trigger('shift');
            } else {
                if (! $canvas.is(':animated')) {
                    $canvas.animate({
                        left: '-=50px',
                    }, 100, 'jswing', function() {
                        $canvas.animate({
                            left: '+=50px',
                        }, 800, 'easeOutBounce');
                    });
                }
            }
        });
        $photos.on('shift-left', function() {
            var current = $photos.data('current');
            if (current > 0) {
                $photos.data('current', current - 1);
                $photos.trigger('shift');
            } else {
                if (! $canvas.is(':animated')) {
                    $canvas.animate({
                        left: '+=50px',
                    }, 100, 'jswing', function() {
                        $canvas.animate({
                            left: '-=50px',
                        }, 800, 'easeOutBounce');
                    });
                }
            }
        });

        $photos.on('shift', function() {
            // Give the new visible photo the "active" class and remove
            var current = $photos.data('current'),
                $newActivePhoto = $photos.find('.photo').eq(current),
                $newActiveImage = $newActivePhoto.find('img');
                $newActivePhoto
                    .addClass('active')
                    .siblings().removeClass('active');

            // Load image
            if ($newActiveImage.attr('src') === undefined) {
                $newActiveImage.attr('src', $newActiveImage.data('src'));
                animateShift();
            } else {
                animateShift();
            }

            if (current == 0) {
                $photos.addClass('no-prev');
            } else {
                $photos.removeClass('no-prev');
            }

            if (current == $photos.data('count') - 1) {
                $photos.addClass('no-next');
            } else {
                $photos.removeClass('no-next');
            }
        });

        initPhotoset = function(id) {
             new PhotoSet(id).query(function() {
                var photoSet = this;
                for (var i = 0; i < photoSet.photos.length; i++) {
                    var photo = photoSet.photos[i],
                        $photo = $('<div class="photo"></div>');
                        $img = $('<img>');
                    $photo.append($img);
                    $img.load(function() {
                        var $this = $(this),
                            $parentPhoto = $this.parent('.photo');
                        $parentPhoto.addClass('loaded');
                        $this.hide().fadeIn(500);
                        // imgClass = (this.width / this.height > 1) ? 'wide' : 'tall';
                        // $this.addClass(imgClass);
                        $this.data('aspect-ratio', this.width / $this.height());
                        // $window.resize();
                        // resizePhoto.call($photo[0]);
                        resizePhoto.call($parentPhoto[0]);
                    });

                    $photo.css('width', $window.width());

                    new Spinner({
                        lines: 17, // The number of lines to draw
                        length: 0, // The length of each line
                        width: 8, // The line thickness
                        radius: 41, // The radius of the inner circle
                        corners: 1, // Corner roundness (0..1)
                        rotate: 0, // The rotation offset
                        direction: 1, // 1: clockwise, -1: counterclockwise
                        color: '#000', // #rgb or #rrggbb or array of colors
                        speed: 0.9, // Rounds per second
                        trail: 78, // Afterglow percentage
                        shadow: false, // Whether to render a shadow
                        hwaccel: true, // Whether to use hardware acceleration
                        className: 'spinner', // The CSS class to assign to the spinner
                        zIndex: 2e9, // The z-index (defaults to 2000000000)
                        top: '50%', // Top position relative to parent in px
                        left: '50%' // Left position relative to parent in px
                    }).spin($photo[0]);
                    $photo.find('.spinner').css({
                        left: '50%',
                        top: '50%',
                    });

                    $img.data('src', photo.urls.large1024)
                    $('#photos #canvas').append($photo);

                    if (i == 0) {
                        $photo.addClass('active');
                        $img.attr('src', photo.urls.large1024);
                    }
                }
                $photos
                    .data('count', photoSet.photos.length)
                    .data('current', 0)
                    .find('.photo').each(function() {
                        $(this).css('width', $window.width());
                    });
                $photos.trigger('shift');
            });
        }
    });

})(window.jQuery);
