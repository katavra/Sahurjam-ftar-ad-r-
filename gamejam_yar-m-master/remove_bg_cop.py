from PIL import Image

def remove_white_background(input_path, output_path, tolerance=30):
    img = Image.open(input_path).convert("RGBA")
    data = img.get_flattened_data() if hasattr(img, 'get_flattened_data') else img.getdata()

    new_data = []
    for item in data:
        # Check if pixel is close to white
        if item[0] > 255 - tolerance and item[1] > 255 - tolerance and item[2] > 255 - tolerance:
            new_data.append((255, 255, 255, 0)) # transparent
        else:
            new_data.append(item)

    img.putdata(new_data)
    img.save(output_path, "PNG")

remove_white_background("iftar-vakti-web/cop.jpeg", "iftar-vakti-web/cop_transparent.png", tolerance=60)
print("Saved transparent image to cop_transparent.png")
