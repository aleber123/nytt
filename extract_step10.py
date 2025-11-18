#!/usr/bin/env python3
"""
Extract renderQuestion10 from bestall.tsx and create Step10ReviewSubmit component
"""

import re

def extract_render_question10():
    file_path = 'src/pages/bestall.tsx'
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find renderQuestion10
    start_marker = '  const renderQuestion10 = () => ('
    
    if start_marker not in content:
        print("⚠️  renderQuestion10 not found")
        return None
    
    start_idx = content.find(start_marker)
    
    # Find the end - look for ");\n\n" after counting parentheses
    paren_count = 0
    i = start_idx + len(start_marker) - 1  # Start at the opening (
    
    while i < len(content):
        if content[i] == '(':
            paren_count += 1
        elif content[i] == ')':
            paren_count -= 1
            if paren_count == 0:
                # Found the matching closing paren
                end_idx = i + 1
                if content[end_idx:end_idx+3] == ';\n\n':
                    end_idx += 3
                elif content[end_idx:end_idx+2] == ';\n':
                    end_idx += 2
                
                # Extract the function body (without the function declaration)
                function_start = content.find('(', start_idx) + 1
                function_body = content[function_start:i].strip()
                
                print(f"✅ Found renderQuestion10 ({len(function_body)} chars, ~{function_body.count(chr(10))} lines)")
                return function_body, start_idx, end_idx
        i += 1
    
    print("⚠️  Could not find end of renderQuestion10")
    return None

def create_step10_component(function_body):
    """Create Step10ReviewSubmit component from extracted function body"""
    
    component_code = '''/**
 * Step 10: Review & Submit
 * Final review of order with customer information, file uploads, and payment
 * This is a complex component that handles the entire order submission process
 */

import React, { useState, useRef } from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import ReCAPTCHA from 'react-google-recaptcha';
import { StepProps } from '../types';

interface Step10Props extends Omit<StepProps, 'currentLocale'> {
  allCountries: any[];
  returnServices: any[];
  loadingReturnServices: boolean;
  pricingBreakdown: any[];
  loadingPricing: boolean;
  totalPrice: number;
  recaptchaRef: React.RefObject<ReCAPTCHA>;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  currentLocale?: string;
}

export const Step10ReviewSubmit: React.FC<Step10Props> = ({
  answers,
  setAnswers,
  onBack,
  allCountries,
  returnServices,
  loadingReturnServices,
  pricingBreakdown,
  loadingPricing,
  totalPrice,
  recaptchaRef,
  isSubmitting,
  onSubmit
}) => {
  const { t } = useTranslation('common');
  const router = useRouter();

  return (
''' + function_body + '''
  );
};

export default Step10ReviewSubmit;
'''
    
    return component_code

def main():
    print("Extracting renderQuestion10...")
    result = extract_render_question10()
    
    if not result:
        print("❌ Failed to extract renderQuestion10")
        return
    
    function_body, start_idx, end_idx = result
    
    print("\nCreating Step10ReviewSubmit component...")
    component_code = create_step10_component(function_body)
    
    # Write component file
    component_path = 'src/components/order/steps/Step10ReviewSubmit.tsx'
    with open(component_path, 'w', encoding='utf-8') as f:
        f.write(component_code)
    
    print(f"✅ Created {component_path}")
    
    # Remove from bestall.tsx
    print("\nRemoving renderQuestion10 from bestall.tsx...")
    with open('src/pages/bestall.tsx', 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content[:start_idx] + content[end_idx:]
    
    with open('src/pages/bestall.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    # Check new file size
    import subprocess
    result = subprocess.run(['wc', '-l', 'src/pages/bestall.tsx'], capture_output=True, text=True)
    print(f"📊 New bestall.tsx size: {result.stdout.strip()}")
    
    result = subprocess.run(['wc', '-l', component_path], capture_output=True, text=True)
    print(f"📊 Step10 component size: {result.stdout.strip()}")
    
    print("\n✅ Extraction complete!")

if __name__ == '__main__':
    main()
