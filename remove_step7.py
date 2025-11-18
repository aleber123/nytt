#!/usr/bin/env python3
"""Remove renderQuestion7 function from bestall.tsx"""

def remove_render_question7():
    file_path = 'src/pages/bestall.tsx'
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find renderQuestion7
    start_marker = '  const renderQuestion7 = () => {'
    
    if start_marker not in content:
        print("⚠️  renderQuestion7 not found")
        return
    
    start_idx = content.find(start_marker)
    
    # Find the end - look for "};\n\n" after counting braces
    brace_count = 0
    in_function = False
    i = start_idx
    
    while i < len(content):
        char = content[i]
        
        if char == '{':
            brace_count += 1
            in_function = True
        elif char == '}':
            brace_count -= 1
        
        # Check if we've closed all braces
        if in_function and brace_count == 0:
            # Look for ";\n\n" after this point
            if content[i:i+4] == '};\n\n':
                end_idx = i + 4
                removed_text = content[start_idx:end_idx]
                content = content[:start_idx] + content[end_idx:]
                print(f"✅ Removed renderQuestion7 ({len(removed_text)} chars, ~{removed_text.count(chr(10))} lines)")
                
                # Write back
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                # Check new file size
                import subprocess
                result = subprocess.run(['wc', '-l', file_path], capture_output=True, text=True)
                print(f"📊 New file size: {result.stdout.strip()}")
                return
        
        i += 1
    
    print("⚠️  Could not find end of renderQuestion7")

if __name__ == '__main__':
    remove_render_question7()
