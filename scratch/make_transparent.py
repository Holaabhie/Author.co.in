import os
from PIL import Image

def process_logo():
    input_path = r"C:\Users\HP\.gemini\antigravity-ide\brain\8399aa23-aaf6-4fe7-b539-72f9042bc511\media__1781247741352.png"
    output_dir = r"c:\Users\HP\OneDrive\Desktop\Author.co.in\public\brand"
    os.makedirs(output_dir, exist_ok=True)

    img = Image.open(input_path).convert("RGBA")
    width, height = img.size

    # Create dark version (black logo, transparent background)
    dark_img = Image.new("RGBA", (width, height))
    dark_data = []

    # Create light version (white logo, transparent background)
    light_img = Image.new("RGBA", (width, height))
    light_data = []

    for y in range(height):
        for x in range(width):
            r, g, b, a = img.getpixel((x, y))
            # Calculate grayscale value (brightness)
            gray = int(0.299 * r + 0.587 * g + 0.114 * b)
            # Alpha is inverted brightness
            alpha = 255 - gray
            
            # Clamp alpha to ensure no stray pixels in pure white areas
            if gray > 240:
                alpha = 0
            elif gray < 15:
                alpha = 255

            # Dark version: RGB is (0, 0, 0)
            dark_data.append((0, 0, 0, alpha))
            
            # Light version: RGB is (255, 255, 255)
            light_data.append((255, 255, 255, alpha))

    dark_img.putdata(dark_data)
    light_img.putdata(light_data)

    # Autocrop to trim empty transparent margins
    bbox = dark_img.getbbox()
    if bbox:
        dark_cropped = dark_img.crop(bbox)
        light_cropped = light_img.crop(bbox)
        
        dark_cropped.save(os.path.join(output_dir, "author-logo-dark.png"), "PNG")
        light_cropped.save(os.path.join(output_dir, "author-logo-light.png"), "PNG")
        print(f"Successfully processed logo. Size: {dark_cropped.size}")
    else:
        dark_img.save(os.path.join(output_dir, "author-logo-dark.png"), "PNG")
        light_img.save(os.path.join(output_dir, "author-logo-light.png"), "PNG")
        print(f"Successfully processed logo (no crop). Size: {dark_img.size}")

if __name__ == "__main__":
    process_logo()
