from PIL import Image

def remove_white_background(input_path, output_path, tolerance=30):
    img = Image.open(input_path).convert("RGBA")
    data = img.get_flattened_data() if hasattr(img, 'get_flattened_data') else img.getdata()

    new_data = []
    for item in data:
        # Check if the pixel is white (with tolerance)
        if item[0] > 255 - tolerance and item[1] > 255 - tolerance and item[2] > 255 - tolerance:
            # Change white (also shades of white) pixels to transparent
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)

    img.putdata(new_data)
    img.save(output_path, "PNG")

remove_white_background('c:/Users/Lenovo/Desktop/gamejam_yar-m-master/masa2.jpeg', 'c:/Users/Lenovo/Desktop/gamejam_yar-m-master/iftar-vakti-web/masa2_transparent.png')
print("Image processing complete.")
