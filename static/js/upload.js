$(function() {
    function getRotationDegrees(obj) {
        var matrix = obj.css("-webkit-transform") ||
            obj.css("-moz-transform")    ||
            obj.css("-ms-transform")     ||
            obj.css("-o-transform")      ||
            obj.css("transform");
        if(matrix !== 'none') {
            var values = matrix.split('(')[1].split(')')[0].split(',');
            var a = values[0];
            var b = values[1];
            var angle = Math.round(Math.atan2(b, a) * (180/Math.PI));
        } else { var angle = 0; }
        return angle;
    }

    $("#upload_field").html5_upload({
        url: function(number) {
            return "/upload";
        },
        sendBoundary: window.FormData || $.browser.mozilla,
        onStart: function(event, total) {
            return true;
        },
        onProgress: function(event, progress, name, number, total) {

        },
        setName: function(text) {
            $("#progress_report_name").text(text);
        },
        setStatus: function(text) {
            $("#progress_report_status").text(text);
        },
        setProgress: function(val) {
            $("#progress_report_bar").css('width', Math.ceil(val*100)+"%");
        },
        onFinishOne: function(event, response, name, number, total) {
            var responseObj = JSON.parse(response);

            $('<img src="' + responseObj['file'] + '">').load(function() {

                var $div = $('<div>');
                $div
                   .addClass('photo')
                   .css('top', '0px')
                   .appendTo('#container');
                $div.css('top', '0px');
                $div.css('left', '0px');
                $(this).addClass('photo_img').appendTo($div)
                var width = $(this).width();
                var height = $(this).height();

                if(width/2 > 600) {
                    $(this).width(600);
                    $(this).height(height * 600.0/width);

                } else {
                    $(this).width(width/2);
                    $(this).height(height/2);
                }


                $(this).resizable({ aspectRatio: true,
                                    handles: "n, ne, nw, e, s, se, sw, w",
                                    maxHeight: height/2,
                                    maxWidth: width/2});
                $div.draggable();

                var date = new Date();
                var freeRotateClass = date.getTime() + 'A';
                var snapRotateClass = date.getTime() + 'B';

                var $handleFreeRotate = $('<div>');
                $handleFreeRotate.addClass(freeRotateClass).insertAfter($(this)).css({
                    'position': 'absolute',
                    'bottom': 5,
                    'left': 5,
                    'height': 16,
                    'width': 16,
                    'background': "url('/static/img/rotate.png')"
                });

                $('.'+freeRotateClass).draggable({
                    opacity: 0.01,
                    helper: 'clone',
                    start: function(event, ui) {
                    },
                    drag: function(event, ui){
                        var rotateCSS = 'rotate(' + ui.position.left + 'deg)';

                        $(this).parent().parent().css({
                            '-moz-transform': rotateCSS,
                            '-webkit-transform': rotateCSS
                        });
                    }
                });

                var $handleSnapRotate = $('<div>');
                $handleSnapRotate.addClass(snapRotateClass).insertAfter($(this)).css({
                    'position': 'absolute',
                    'top': 5,
                    'left': 5,
                    'height': 16,
                    'width': 16,
                    'background-color': 'red',
                    'background-image': "url('/static/img/rotate.png')"
                });

                $('.'+snapRotateClass).click( function() {
                    var degrees = getRotationDegrees($(this).parent().parent());
                    degrees += 90;
                    degrees = degrees % 360;

                    var rotateCSS = 'rotate(' + degrees + 'deg)';

                    $(this).parent().parent().css({
                        '-moz-transform': rotateCSS,
                        '-webkit-transform': rotateCSS
                    });

                });

            });
        },
        onError: function(event, name, error) {
            alert('error while uploading file ' + name);
        }
    });



    $('#print').click(function() {
        var data_arr = [];
        $('.photo_img').each(function() {
            var position = $(this).parent().parent().position();
            var internal = {};
            internal['src'] = $(this).attr('src');
            internal['height'] = $(this).height();
            internal['width'] = $(this).width();
            internal['top'] = Math.floor(position.top);
            internal['left'] = Math.floor(position.left);
            console.log(getRotationDegrees($(this).parent().parent()));
            internal['rotation'] = getRotationDegrees($(this).parent().parent());
            data_arr.push(internal);
        });
        console.log(data_arr);
        $.ajax({
            type: 'POST',
            // Provide correct Content-Type, so that Flask will know how to process it.
            contentType: 'application/json',
            // Encode your data as JSON.
            data: JSON.stringify(data_arr),
            // This is the type of data you're expecting back from the server.
            dataType: 'json',
            url: '/printer',
            success: function (e) {
                console.log(e);
            }
        });

        $(this).attr('disabled', true);
        $(this).html('...printing...');
        var $button = $(this);

        setTimeout(function(){
            $button.attr('disabled', false);
            $button.html('Print');
            $('.photo').each(function() {
                $( this).hide( "puff", {}, "slow", function() {
                    $(this).remove();
                });
            });
        }, 30000)

    });

});