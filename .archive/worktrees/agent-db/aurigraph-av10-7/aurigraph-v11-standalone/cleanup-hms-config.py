#!/usr/bin/env python3
"""
HMS Configuration Cleanup Script
Removes all HMS/healthcare-related configuration from application.properties
"""

import re

# Read the application.properties file
input_file = 'src/main/resources/application.properties'
output_file = 'src/main/resources/application.properties'

# Patterns to remove (HMS/healthcare related)
remove_patterns = [
    r'^# HMS',
    r'^hms\.',
    r'^%dev\.hms\.',
    r'^%test\.hms\.',
    r'^%prod\.hms\.',
    r'^# Healthcare',
    r'^healthcare\.',
    r'^%dev\.healthcare\.',
    r'^%test\.healthcare\.',
    r'^%prod\.healthcare\.',
    r'^# HL7',
    r'^fhir\.',
    r'^# Clinical',
    r'^terminology\.',
    r'^patient\.consent\.',
    r'^cds\.',
    r'^quality\.reporting\.clinical',
    r'^quality\.reporting\.patient',
    r'^telemedicine\.',
    r'^research\.data\.',
    r'^regulatory\.hipaa',
    r'^# Medical',
    r'^medical\.',
    r'^%dev\.medical\.',
    r'^%test\.medical\.',
    r'^%prod\.medical\.',
    r'^# Insurance',
    r'^insurance\.',
    r'^# Patient',
    r'^# Telemedicine',
    r'^# Medical Research',
   r'^# Quality Reporting and Analytics',
    r'^quality\.reporting\.period\.',
    r'^quality\.reporting\.population\.',
]

# Additional standalone comment lines to remove
remove_comments = [
    '# Development HMS settings',
    '# Test HMS settings',
    '# Production HMS settings (optimized for 100K+ TPS)',
]

# Read the file
with open(input_file, 'r') as f:
    lines = f.readlines()

# Filter out HMS/healthcare lines
cleaned_lines = []
for line in lines:
    stripped_line = line.rstrip()

    # Check if line matches any removal pattern
    should_remove = False

    # Check patterns
    for pattern in remove_patterns:
        if re.match(pattern, stripped_line):
            should_remove = True
            break

    # Check exact comment matches
    if stripped_line in remove_comments:
        should_remove = True

    if not should_remove:
        cleaned_lines.append(line)

# Remove consecutive empty lines (more than 2)
final_lines = []
empty_count = 0
for line in cleaned_lines:
    if line.strip() == '':
        empty_count += 1
        if empty_count <= 2:
            final_lines.append(line)
    else:
        empty_count = 0
        final_lines.append(line)

# Write back to file
with open(output_file, 'w') as f:
    f.writelines(final_lines)

print(f"✅ Cleaned {len(lines) - len(final_lines)} HMS/healthcare configuration lines")
print(f"   Original lines: {len(lines)}")
print(f"   Cleaned lines: {len(final_lines)}")
print(f"   Removed: {len(lines) - len(final_lines)}")
