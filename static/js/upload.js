$(function() {
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
                console.log(width);
                console.log(height);
                if(width/2 > 600) {
                    $(this).width(600);
                    $(this).height(height * 600.0/width);
                    console.log(width/600.0);
                    console.log($(this).height());
                    console.log($(this).height() * 600.0/width);
                } else {
                    $(this).width(width/2);
                    $(this).height(height/2);
                }
                $(this).resizable({ aspectRatio: true,
                                    handles: "n, ne, nw, e, s, se, sw, w",
                                    maxHeight: height/2,
                                    maxWidth: width/2});
                $div.draggable();
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
        $('.photo').each(function() {
            $( this).hide( "puff", {}, "slow").remove();
        });
        setTimeout(function(){
            $button.attr('disabled', false);
            $button.html('Print');
        }, 30000)

    });

});