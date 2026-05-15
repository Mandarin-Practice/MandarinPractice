def remove_duplicates_from_file(input_file_path, output_file_path=None):
    """
    Remove duplicate lines from a file while preserving the order of first occurrence.
    
    Args:
        input_file_path (str): Path to the input file
        output_file_path (str): Path to the output file (optional, defaults to input file with _cleaned suffix)
    """
    if output_file_path is None:
        # Create output filename by adding _cleaned before the extension
        if '.' in input_file_path:
            name, ext = input_file_path.rsplit('.', 1)
            output_file_path = f"{name}_cleaned.{ext}"
        else:
            output_file_path = f"{input_file_path}_cleaned"
    
    seen_lines = set()
    unique_lines = []
    duplicates_count = 0
    
    try:
        # Read the file and identify unique lines
        with open(input_file_path, 'r', encoding='utf-8') as file:
            for line_num, line in enumerate(file, 1):
                # Keep the original line with newline character for exact comparison
                if line not in seen_lines:
                    seen_lines.add(line)
                    unique_lines.append(line)
                else:
                    duplicates_count += 1
                    print(f"Duplicate found at line {line_num}: {line.strip()}")
        
        # Write unique lines to output file
        with open(output_file_path, 'w', encoding='utf-8') as file:
            file.writelines(unique_lines)
        
        print(f"\nProcessing complete!")
        print(f"Original file: {input_file_path}")
        print(f"Cleaned file: {output_file_path}")
        print(f"Total lines processed: {len(seen_lines) + duplicates_count}")
        print(f"Unique lines kept: {len(unique_lines)}")
        print(f"Duplicate lines removed: {duplicates_count}")
        
    except FileNotFoundError:
        print(f"Error: File '{input_file_path}' not found.")
    except Exception as e:
        print(f"Error processing file: {e}")

if __name__ == "__main__":
    # Path to your HSK file
    input_file = "/Users/yasen/Documents/MandarinPractice/scripts/HSK1from2021.txt"
    
    # Remove duplicates
    remove_duplicates_from_file(input_file)