#!/usr/bin/env python3
"""
Script to remove old unused render functions from bestall.tsx
Keeps renderQuestion7 and renderQuestion10 which are still used inline
"""

import re

def remove_old_functions():
    file_path = 'src/pages/bestall.tsx'
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Define functions to remove with their approximate patterns
    # We'll remove from "const renderQuestionX = () =>" to the closing ");"
    
    functions_to_remove = [
        'renderQuestion1',
        'renderQuestion2', 
        'renderQuestion3',
        'renderQuestion4',
        'renderQuestion5',
        'renderQuestion6',
        'renderQuestion8',
        'renderQuestion9'
    ]
    
    # Remove the comment block first
    content = re.sub(
        r'  // ========================================\n'
        r'  // OLD RENDER FUNCTIONS - NOT USED ANYMORE\n'
        r'  // These can be safely deleted - kept for reference only\n'
        r'  // Steps 1-6, 8-9 now use extracted components\n'
        r'  // ========================================\n\n',
        '',
        content
    )
    
    # For each function, find and remove it
    for func_name in functions_to_remove:
        # Pattern: const renderQuestionX = () => ( ... );
        # We need to match balanced parentheses
        pattern = rf'  const {func_name} = \(\) => \([^;]*?\n  \);\n\n'
        
        # This is complex, so let's use a different approach
        # Find the start of the function
        start_marker = f'  const {func_name} = () => ('
        
        if start_marker in content:
            start_idx = content.find(start_marker)
            
            # Find the matching closing ");\n\n"
            # We need to count parentheses
            paren_count = 0
            i = start_idx + len(start_marker) - 1  # Start at the opening (
            
            while i < len(content):
                if content[i] == '(':
                    paren_count += 1
                elif content[i] == ')':
                    paren_count -= 1
                    if paren_count == 0:
                        # Found the matching closing paren
                        # Now find the ");\n\n" after it
                        end_idx = i + 1
                        if content[end_idx:end_idx+3] == ';\n\n':
                            end_idx += 3
                        elif content[end_idx:end_idx+2] == ';\n':
                            end_idx += 2
                        
                        # Remove the function
                        content = content[:start_idx] + content[end_idx:]
                        print(f"✅ Removed {func_name}")
                        break
                i += 1
    
    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("\n✅ Cleanup complete!")
    print(f"File saved to: {file_path}")

if __name__ == '__main__':
    remove_old_functions()
