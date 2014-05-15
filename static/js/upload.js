$(function() {

    $( "#tabs" ).tabs();

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
            $('#upload_field').hide();
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
                   .appendTo('#img_container');
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

                $(this).parent().css('position', 'static');

                var date = new Date();
                var moveUpClass = date.getTime() + 'A';
                var snapRotateClass = date.getTime() + 'B';

                var $handleMoveUp = $('<div>');
                $handleMoveUp.addClass(moveUpClass).insertAfter($(this)).css({
                    'position': 'absolute',
                    'bottom': 5,
                    'left': 5,
                    'height': 16,
                    'width': 16,
                    'background': "blue"
                });

                $('.'+moveUpClass).click(function() {

                    var $img = $(this).parent().parent();
                    console.log($($img));
                    var $sibling = $img.prev();
                    console.log($sibling);
                    if(!$sibling.hasClass('row')) {
                        $img.prependTo($sibling.parent());
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
        },
        onFinish: function(event, total) {
            setTimeout(function(){
                $('#upload_field').show();
            }, total * 1000);
        }
    });


    function displayPreviewBox(ajax) {
        console.log(ajax);
        $('#preview_img').attr('src', ajax.final_location);
        $('#preview_container').show();

    }

    $('#preview').click(function() {
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

        var promise = $.ajax({
            type: 'POST',
            // Provide correct Content-Type, so that Flask will know how to process it.
            contentType: 'application/json',
            // Encode your data as JSON.
            data: JSON.stringify(data_arr),
            // This is the type of data you're expecting back from the server.
            dataType: 'json',
            url: '/preview'
        });
        $('#preview').hide();
        $('#preview_img').attr('src', '');

        promise.done(displayPreviewBox);

    });

    $('#print').click(function() {

        var data = {'data': $('#preview_img').attr('src')};
        console.log(data);

        var promise = $.ajax({
            type: 'POST',
            // Provide correct Content-Type, so that Flask will know how to process it.
            contentType: 'application/json',
            // Encode your data as JSON.
            data: JSON.stringify(data),
            // This is the type of data you're expecting back from the server.
            dataType: 'json',
            url: '/print'
        });

        promise.done(function() {
            $('#preview_container').hide()
        }).fail(function() {
            console.log("failure");
        });

        $('#preview').attr('disabled', true);
        $('#preview').html('...Printing...');
        var $button = $('#preview');

        setTimeout(function(){
            $('#preview').show();
            $button.attr('disabled', false);
            $button.html('Preview');
            $('.photo').each(function() {
                $( this).hide( "puff", {}, "slow", function() {
                    $(this).remove();
                });
            });
        }, 30000);

    });

    $('#cancel').click(function() {
        $('#preview').show();
        $('#preview_img').attr('src', '');
        $('#preview_container').hide();
    });


    $("#upload_whole_field").html5_upload({
        url: function(number) {
            return "/upload_whole";
        },
        sendBoundary: window.FormData || $.browser.mozilla,
        onStart: function(event, total) {
            $('#print-whole-wait').show();
            $('#upload_whole_field').hide();
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


        },
        onFinish: function(event, total) {
            setTimeout(function(){
                $('#print-whole-wait').hide();
                $('#upload_whole_field').show();
            }, total * 30000);
        },
        onError: function(event, name, error) {
            alert('error while uploading file ' + name);
        }
    });

    $('.previous-refresh').click(function() {
        $('#old-pics').empty();
        $('#old-pics').append("<li>Loading...</li>");

        var promise = $.ajax({
            type: 'GET',
            // Provide correct Content-Type, so that Flask will know how to process it.
            contentType: 'application/json',
            // This is the type of data you're expecting back from the server.
            dataType: 'json',
            url: '/previous'
        });

        promise.done(function(result) {
            $('#old-pics').empty();
            console.log(result);
            $.each(result['data'], function(index, value) {
                console.log(value);
                console.log(index);
                $('#old-pics').append('<li class="img_list"><img id="img_' + index + '" src="' + value[1] + '" class="thumbnail" /> <button img="' + value[0] + '" class="btn print-previous" id="btn_' + index + '" type="button" class="btn">Print</button> </li>');
            });
        });
    });

    $('#old-pics').on('click', '.print-previous', function() {
        var location = $(this).attr('img')
        console.log(location);

        var data = {'data': location};
        console.log(data);

        var promise = $.ajax({
            type: 'POST',
            // Provide correct Content-Type, so that Flask will know how to process it.
            contentType: 'application/json',
            // Encode your data as JSON.
            data: JSON.stringify(data),
            // This is the type of data you're expecting back from the server.
            dataType: 'json',
            url: '/print'
        });

        $('.print-previous').attr('disabled', true);
        $('.print-previous').html('...Printing...');

        setTimeout(function(){
            $('.print-previous').attr('disabled', false);
            $('.print-previous').html('Printing');
        }, 30000);
    });


});