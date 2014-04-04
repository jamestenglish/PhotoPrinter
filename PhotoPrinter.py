from flask import Flask, render_template, jsonify, request, send_from_directory
import os
import time
from werkzeug.utils import secure_filename
from PIL import Image
from subprocess import call

app = Flask(__name__)
app.config.from_object(__name__)
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'photos')
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


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


@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'],
                               filename)


@app.route('/printer', methods=['POST'])
def printer():

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

    for photo in objects:
        os.remove(os.path.join(UPLOAD_FOLDER, os.path.basename(photo['src'])))

    call(["i_view32.exe", final_location, "/print"])

    return jsonify({"success": True})


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1] in ALLOWED_EXTENSIONS

if __name__ == '__main__':
    app.run(host='0.0.0.0')
