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
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['PRINTER_FOLDER'] = PRINTER_FOLDER

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

            print(final_location)
            if USE_PRINTER:
                call(["i_view32.exe", final_location, "/print"])

            return jsonify({"file": "/uploads/" + filename})


@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'],
                               filename)

@app.route('/printer/<filename>')
def preview_file(filename):
    return send_from_directory(app.config['PRINTER_FOLDER'],
                               filename)

@app.route('/preview', methods=['POST'])
def preview():

    objects = request.get_json()
    template = Image.open(os.path.join(os.path.dirname(os.path.realpath(__file__)), 'static', 'img', 'template_full.jpg'))
    template = template.convert('RGBA')
    for photo in objects:
        image = Image.open(os.path.join(UPLOAD_FOLDER, os.path.basename(photo['src'])))
        image = image.convert('RGBA')

        height = int(photo['height']) * 2
        width = int(photo['width']) * 2
        size = width, height

        image.thumbnail(size, Image.ANTIALIAS)
        image = image.rotate(-int(photo['rotation']), expand=1)
        top = int(photo['top']) * 2
        left = int(photo['left']) * 2
        template.paste(image, (left, top))

    time_string = str(int(time.time() * 1000))
    final_location = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'printer', time_string+'print.png')
    template.save(final_location)

    server_location = "/printer/" + os.path.basename(final_location)

    print(server_location)

    return jsonify({"final_location": server_location})

@app.route('/print', methods=['POST'])
def printer():

    json = request.get_json()
    final_location = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'printer', os.path.basename(json['data']))

    print(final_location)

    if USE_PRINTER:
        call(["i_view32.exe", final_location, "/print"])

    return jsonify({"success": True})

@app.route('/previous', methods=['GET'])
def previous():
    file_names = []
    glob_search = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'printer', '*.png')

    for f in glob.glob(glob_search):
        print(f)
        file_names.append("/printer/" + os.path.basename(f))

    file_names.reverse();

    return jsonify({'data': file_names})


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1] in ALLOWED_EXTENSIONS

if __name__ == '__main__':
    app.run(host='0.0.0.0')
