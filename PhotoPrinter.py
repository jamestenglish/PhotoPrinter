from flask import Flask, render_template, jsonify, request, send_from_directory
import os
import time
from werkzeug.utils import secure_filename
from PIL import Image
from subprocess import call
import glob

app = Flask(__name__)
app.config.from_object(__name__)
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'photos')
PRINTER_FOLDER = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'printer')
PREVIEW_FOLDER = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'preview')
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['PRINTER_FOLDER'] = PRINTER_FOLDER
app.config['PREVIEW_FOLDER'] = PREVIEW_FOLDER

USE_PRINTER = False


@app.route('/')
def hello_world():
    return render_template("index.html")


@app.route('/upload', methods=['POST'])
def upload():
    if request.method == 'POST':
        photo = request.files['user_file[]']
        if photo and allowed_file(photo.filename):
            filename = secure_filename(photo.filename)
            time_string = str(int(time.time() * 1000))
            filename = time_string + "_" + filename
            photo.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            return jsonify({"file": "/uploads/" + filename})


@app.route('/upload_whole', methods=['POST'])
def upload_whole():
    if request.method == 'POST':
        photo = request.files['user_file[]']
        if photo and allowed_file(photo.filename):
            filename = secure_filename(photo.filename)
            time_string = str(int(time.time() * 1000))
            filename = time_string + "_" + filename
            uploaded_location = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            photo.save(uploaded_location)

            template = Image.open(os.path.join(os.path.dirname(os.path.realpath(__file__)), 'static', 'img', 'template_full.jpg'))
            template = template.convert('RGBA')

            image = Image.open(uploaded_location)
            image = image.convert('RGBA')

            image_size = image.size
            template_size = template.size

            if image_size[0] > image_size[1]:
                image = image.rotate(90, expand=1)

            image.thumbnail(template_size, Image.ANTIALIAS)
            template.paste(image, (0, 0))
            time_string = str(int(time.time() * 1000))
            final_location = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'printer', time_string+'print.png')
            template.save(final_location)

            preview_location = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'preview', time_string+'print.png')
            template.thumbnail((200, 133), Image.ANTIALIAS)
            template.save(preview_location)

            print(final_location)
            if USE_PRINTER:
                call(["i_view32.exe", final_location, "/print"])

            return jsonify({"file": "/uploads/" + filename})


@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'],
                               filename)

@app.route('/printer/<filename>')
def final_file(filename):
    return send_from_directory(app.config['PRINTER_FOLDER'],
                               filename)


@app.route('/preview/<filename>')
def preview_file(filename):
    return send_from_directory(app.config['PREVIEW_FOLDER'],
                               filename)

@app.route('/preview', methods=['POST'])
def preview():

    objects = request.get_json()
    template = Image.open(os.path.join(os.path.dirname(os.path.realpath(__file__)), 'static', 'img', 'template_full.jpg'))
    template = template.convert('RGBA')
    for photo in objects:
        image = Image.open(os.path.join(UPLOAD_FOLDER, os.path.basename(photo['src'])))
        image = image.convert('RGBA')

        rotation = int(photo['rotation'])
        image = image.rotate(-rotation, expand=1)

        height = int(photo['height']) * 2
        width = int(photo['width']) * 2
        size = (width, height)

        mod_rotation = rotation % 360

        if mod_rotation == 90 or mod_rotation == 270:
            size = (height, width)

        image.thumbnail(size, Image.ANTIALIAS)

        top = int(photo['top']) * 2
        left = int(photo['left']) * 2
        template.paste(image, (left, top))

    time_string = str(int(time.time() * 1000))
    final_location = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'printer', time_string+'print.png')
    template.save(final_location)

    preview_location = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'preview', 'a_' + time_string+'print.png')
    template.thumbnail((600, 400), Image.ANTIALIAS)
    template.save(preview_location)

    old_files_location = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'preview', time_string+'print.png')
    template.thumbnail((200, 133), Image.ANTIALIAS)
    template.save(old_files_location)

    server_location = "/preview/" + os.path.basename(preview_location)

    print(server_location)

    return jsonify({"final_location": server_location})

@app.route('/print', methods=['POST'])
def printer():

    json = request.get_json()

    basename = os.path.basename(json['data'])

    if basename.startswith('a_'):
        basename = basename[2:]

    final_location = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'printer', basename)

    print(final_location)

    if USE_PRINTER:
        call(["i_view32.exe", final_location, "/print"])

    return jsonify({"success": True})

@app.route('/previous', methods=['GET'])
def previous():
    file_names = []
    glob_search = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'preview', '*.png')

    for f in glob.glob(glob_search):
        print(f)
        touple = ("/printer/" + os.path.basename(f), "/preview/" + os.path.basename(f));
        file_names.append(touple)

    file_names.reverse();

    return jsonify({'data': file_names})


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1] in ALLOWED_EXTENSIONS

if __name__ == '__main__':

    glob_search = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'printer', '*.png')

    for f in glob.glob(glob_search):
        print(f)
        template = Image.open(f)
        preview_location = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'preview', os.path.basename(f))
        print(preview_location)
        template.thumbnail((200, 133), Image.ANTIALIAS)
        template.save(preview_location)

    app.run(host='0.0.0.0')
