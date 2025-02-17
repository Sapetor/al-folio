from PIL import Image

def crop_and_scale_portrait(input_path, output_path, target_width=800, target_height=1000):
    """
    Crop to upper body and scale a portrait photo to match target dimensions while preserving aspect ratio.
    
    Args:
        input_path (str): Path to input image
        output_path (str): Path to save the processed image
        target_width (int): Desired width in pixels
        target_height (int): Desired height in pixels
    """
    with Image.open(input_path) as img:
        # Convert image to RGB if it's not
        if img.mode != 'RGB':
            img = img.convert('RGB')
            
        width = img.width
        height = img.height
        target_aspect = target_width / target_height
        
        # Calculate crop dimensions to focus on bust
        # Using more height to ensure head isn't cut off
        crop_width = width * 0.75  # Use 75% of original width
        crop_height = crop_width / target_aspect  # Maintain target aspect ratio
        
        # Calculate crop coordinates
        left = (width - crop_width) // 2
        # Start higher up to include more head room
        top = (height - crop_height) * 0.35  # Adjust this value to move crop area up or down
        right = left + crop_width
        bottom = top + crop_height
        
        # Perform crop
        img_cropped = img.crop((int(left), int(top), int(right), int(bottom)))
        
        # Scale to target dimensions using Lanczos resampling
        img_final = img_cropped.resize((target_width, target_height), Image.Resampling.LANCZOS)
        
        # Save the result with high quality
        img_final.save(output_path, 'JPEG', quality=95)
        
        print(f"Original size: {img.size}")
        print(f"After cropping: {img_cropped.size}")
        print(f"Final size: {img_final.size}")

# Example usage
if __name__ == "__main__":
    input_path = "prof_pic4.jpg"  # Replace with your input image path
    output_path = "tets4.jpg"  # Replace with your desired output path
    
    crop_and_scale_portrait(input_path, output_path)