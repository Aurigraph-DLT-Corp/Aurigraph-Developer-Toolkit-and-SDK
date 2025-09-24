#!/usr/bin/env python3
"""
Generate favicon.ico from SVG for Aurex Platform
"""

import os
import sys
from pathlib import Path

def create_simple_ico():
    """Create a simple favicon.ico file with Aurex branding"""
    
    # Simple ICO file header and data for a 16x16 green "A" favicon
    # This is a minimal ICO file with a green circle and white "A"
    ico_data = bytes([
        # ICO Header
        0x00, 0x00,  # Reserved
        0x01, 0x00,  # Type (1 = ICO)
        0x01, 0x00,  # Number of images
        
        # Image Directory Entry
        0x10,        # Width (16)
        0x10,        # Height (16)
        0x00,        # Color count (0 = >256 colors)
        0x00,        # Reserved
        0x01, 0x00,  # Color planes
        0x20, 0x00,  # Bits per pixel (32)
        0x00, 0x04, 0x00, 0x00,  # Image size (1024 bytes)
        0x16, 0x00, 0x00, 0x00,  # Image offset (22 bytes)
        
        # Bitmap Info Header
        0x28, 0x00, 0x00, 0x00,  # Header size (40)
        0x10, 0x00, 0x00, 0x00,  # Width (16)
        0x20, 0x00, 0x00, 0x00,  # Height (32 = 16*2 for mask)
        0x01, 0x00,              # Planes
        0x20, 0x00,              # Bits per pixel
        0x00, 0x00, 0x00, 0x00,  # Compression
        0x00, 0x04, 0x00, 0x00,  # Image size
        0x00, 0x00, 0x00, 0x00,  # X pixels per meter
        0x00, 0x00, 0x00, 0x00,  # Y pixels per meter
        0x00, 0x00, 0x00, 0x00,  # Colors used
        0x00, 0x00, 0x00, 0x00,  # Important colors
    ])
    
    # Create a simple 16x16 pixel image data
    # Each pixel is 4 bytes (BGRA)
    pixels = []
    
    for y in range(16):
        for x in range(16):
            # Calculate distance from center
            dx = x - 8
            dy = y - 8
            dist = (dx*dx + dy*dy) ** 0.5
            
            if dist <= 7:  # Inside circle
                # Green background
                if (
                    # Draw "A" shape
                    (y >= 4 and y <= 12) and (
                        # Left leg of A
                        (x >= 4 and x <= 5 and abs(x - (4 + (y-4) * 0.5)) <= 0.5) or
                        # Right leg of A
                        (x >= 10 and x <= 11 and abs(x - (11 - (y-4) * 0.5)) <= 0.5) or
                        # Horizontal bar
                        (y >= 8 and y <= 9 and x >= 6 and x <= 9)
                    )
                ):
                    # White "A"
                    pixels.extend([0xFF, 0xFF, 0xFF, 0xFF])  # BGRA
                else:
                    # Green background
                    pixels.extend([0x81, 0xB9, 0x10, 0xFF])  # BGRA
            else:
                # Transparent outside
                pixels.extend([0x00, 0x00, 0x00, 0x00])  # BGRA
    
    # Add mask (all zeros for 32-bit images)
    mask = [0x00] * (16 * 16 // 8)
    
    return ico_data + bytes(pixels) + bytes(mask)

def main():
    """Generate the favicon.ico file"""
    try:
        # Get the public directory path
        script_dir = Path(__file__).parent
        public_dir = script_dir.parent / "public"
        favicon_path = public_dir / "favicon.ico"
        
        print(f"🎨 Generating Aurex favicon at: {favicon_path}")
        
        # Create the ICO data
        ico_data = create_simple_ico()
        
        # Write the ICO file
        with open(favicon_path, 'wb') as f:
            f.write(ico_data)
        
        print(f"✅ Successfully generated favicon.ico ({len(ico_data)} bytes)")
        print(f"📁 Location: {favicon_path}")
        
    except Exception as e:
        print(f"❌ Error generating favicon: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
