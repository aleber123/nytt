#!/usr/bin/env python3
"""
Remove remaining old render functions: renderQuestion6, 8, 9
Keep renderQuestion7 and renderQuestion10
"""

def remove_function_by_name(content, func_name):
    """Remove a function from content by finding its start and end"""
    start_marker = f'  const {func_name} = '
    
    if start_marker not in content:
        print(f"⚠️  {func_name} not found")
        return content
    
    start_idx = content.find(start_marker)
    
    # Find the end of the function
    # Look for "};\n\n" or ");\n\n" after the start
    search_start = start_idx
    
    # Count braces and parens to find the end
    brace_count = 0
    paren_count = 0
    in_function = False
    i = start_idx
    
    while i < len(content):
        char = content[i]
        
        if char == '{':
            brace_count += 1
            in_function = True
        elif char == '}':
            brace_count -= 1
        elif char == '(':
            paren_count += 1
        elif char == ')':
            paren_count -= 1
        
        # Check if we've closed all braces/parens
        if in_function and brace_count == 0 and paren_count == 0:
            # Look for ";\n\n" after this point
            if content[i:i+4] == '};\n\n':
                end_idx = i + 4
                # Remove the function
                removed_text = content[start_idx:end_idx]
                content = content[:start_idx] + content[end_idx:]
                print(f"✅ Removed {func_name} ({len(removed_text)} chars)")
                return content
            elif content[i:i+3] == ');\n\n':
                end_idx = i + 4
                removed_text = content[start_idx:end_idx]
                content = content[:start_idx] + content[end_idx:]
                print(f"✅ Removed {func_name} ({len(removed_text)} chars)")
                return content
        
        i += 1
    
    print(f"⚠️  Could not find end of {func_name}")
    return content

def main():
    file_path = 'src/pages/bestall.tsx'
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print("Removing old render functions...")
    print()
    
    # Remove in order
    content = remove_function_by_name(content, 'renderQuestion6')
    content = remove_function_by_name(content, 'renderQuestion8')
    content = remove_function_by_name(content, 'renderQuestion9')
    
    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print()
    print("✅ Cleanup complete!")
    
    # Check file size
    import subprocess
    result = subprocess.run(['wc', '-l', file_path], capture_output=True, text=True)
    print(f"📊 New file size: {result.stdout.strip()}")

if __name__ == '__main__':
    main()
