import re
import base64
import os
import hashlib

def extract_base64(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find all base64 data URLs
    pattern = r'url\((["\'])data:(image|font|application)/([a-zA-Z0-9\-]+);(charset=[^;]+;)?base64,([^"\']+)\1\)'
    
    matches = re.finditer(pattern, content)
    
    os.makedirs('public/assets/extracted', exist_ok=True)
    
    new_content = content
    count = 0
    for match in matches:
        quote = match.group(1)
        mime_type = match.group(2)
        ext = match.group(3)
        base64_data = match.group(5)
        
        if ext == 'x-font-woff':
            ext = 'woff'
        
        # Decode
        try:
            data = base64.b64decode(base64_data)
            # Create a short hash for filename
            h = hashlib.md5(data).hexdigest()[:8]
            filename = f"extracted_{count}_{h}.{ext}"
            out_path = f"public/assets/extracted/{filename}"
            
            with open(out_path, 'wb') as out_f:
                out_f.write(data)
                
            # Replace in content
            old_str = f'url({quote}data:{mime_type}/{match.group(3)};{match.group(4) or ""}base64,{base64_data}{quote})'
            new_str = f'url({quote}/assets/extracted/{filename}{quote})'
            new_content = new_content.replace(old_str, new_str)
            
            count += 1
        except Exception as e:
            print(f"Failed to decode: {e}")
            
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
        
    print(f"Extracted {count} assets. New filesize: {len(new_content)} bytes")

if __name__ == '__main__':
    extract_base64('src/index.css')
